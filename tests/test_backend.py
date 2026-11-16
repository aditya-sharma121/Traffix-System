import unittest
import numpy as np
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.detection.detector import VehicleDetector
from backend.app.detection.tracker import VehicleTracker
from backend.app.traffic_analysis.density_analyzer import DensityAnalyzer
from backend.app.signal_optimizer.optimizer import AdaptiveSignalOptimizer
from backend.app.simulation.virtual_intersection import VirtualIntersection
from backend.app.simulation.baseline_comparator import BaselineComparator
from backend.app.prediction.congestion_predictor import CongestionPredictor
from backend.app.emergency_detection.emergency_handler import EmergencyHandler


class TestTraffiqSystem(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_01_root_health(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["project"], "TRAFFIQ")
        self.assertEqual(data["status"], "Online")

    def test_02_density_analyzer(self):
        analyzer = DensityAnalyzer()
        vehicles = [
            {"direction": "NORTH", "class_name": "car"},
            {"direction": "NORTH", "class_name": "bus"},
            {"direction": "SOUTH", "class_name": "car"},
            {"direction": "EAST", "class_name": "truck"},
            {"direction": "WEST", "class_name": "motorcycle"},
        ]
        result = analyzer.analyze(vehicles)
        self.assertEqual(result["total_vehicles"], 5)
        # North PCU: car (1.0) + bus (2.5) = 3.5
        self.assertEqual(result["directions"]["NORTH"]["pcu"], 3.5)
        self.assertIn("congestion_level", result["directions"]["NORTH"])
        self.assertGreater(result["directions"]["NORTH"]["estimated_wait_time_sec"], 0)

    def test_03_signal_optimizer_bounds_and_safety(self):
        optimizer = AdaptiveSignalOptimizer(min_green=10, max_green=60)
        analyzer = DensityAnalyzer()

        # Heavy North-South load
        vehicles = [{"direction": "NORTH", "class_name": "car"} for _ in range(25)]
        vehicles += [{"direction": "SOUTH", "class_name": "car"} for _ in range(20)]
        vehicles += [{"direction": "EAST", "class_name": "car"} for _ in range(3)]
        vehicles += [{"direction": "WEST", "class_name": "car"} for _ in range(2)]

        density_data = analyzer.analyze(vehicles)
        decision = optimizer.compute_optimal_schedule(density_data)

        self.assertEqual(decision["phase"], "NS")
        self.assertGreaterEqual(decision["green_duration"], 10)
        self.assertLessEqual(decision["green_duration"], 60)
        self.assertEqual(decision["signals"]["NORTH"], "GREEN")
        self.assertEqual(decision["signals"]["SOUTH"], "GREEN")
        self.assertEqual(decision["signals"]["EAST"], "RED")
        self.assertEqual(decision["signals"]["WEST"], "RED")
        self.assertIn("primary_reason", decision["explanation"])

    def test_04_emergency_preemption(self):
        optimizer = AdaptiveSignalOptimizer()
        analyzer = DensityAnalyzer()

        # Emergency vehicle approaching from WEST
        vehicles = [
            {"direction": "NORTH", "class_name": "car"},
            {"direction": "WEST", "class_name": "emergency", "is_emergency": True}
        ]
        density_data = analyzer.analyze(vehicles)
        decision = optimizer.compute_optimal_schedule(density_data, emergency_override="WEST")

        self.assertTrue(decision["is_emergency_preemption"])
        self.assertEqual(decision["active_direction"], "WEST")
        self.assertEqual(decision["signals"]["WEST"], "GREEN")
        self.assertEqual(decision["signals"]["NORTH"], "RED")
        self.assertEqual(decision["signals"]["SOUTH"], "RED")
        self.assertEqual(decision["signals"]["EAST"], "RED")

    def test_05_virtual_intersection_physics(self):
        sim = VirtualIntersection(junction_id="Test_Junction")
        sim.reset()
        sim.spawn_vehicle("NORTH", vtype="car")
        self.assertEqual(len(sim.vehicles["NORTH"]), 1)

        # Advance physics ticks
        initial_pos = sim.vehicles["NORTH"][0].position
        for _ in range(10):
            sim.tick(dt=0.5)

        new_pos = sim.vehicles["NORTH"][0].position
        self.assertGreater(new_pos, initial_pos)
        state = sim.get_state()
        self.assertIn("phase", state)
        self.assertIn("signals", state)

    def test_06_congestion_predictor(self):
        predictor = CongestionPredictor()
        self.assertTrue(predictor.is_trained)
        pred = predictor.predict_congestion(hour_of_day=18, is_weekend=False, vehicle_count=60)
        self.assertIn(pred["predicted_congestion_level"], ["Low", "Medium", "High", "Severe"])
        self.assertGreater(pred["confidence_percent"], 0)
        self.assertEqual(len(pred["hourly_forecast_6h"]), 6)

    def test_07_baseline_comparator(self):
        comparator = BaselineComparator()
        # Fast 40-step benchmark
        res = comparator.run_benchmark(duration_steps=40, traffic_intensity="medium")
        self.assertIn("fixed_time_results", res)
        self.assertIn("traffiq_adaptive_results", res)
        self.assertIn("improvements", res)
        self.assertIn("waiting_time_reduction_percent", res["improvements"])

    def test_08_api_endpoints(self):
        # Test signals optimize endpoint
        res = self.client.post("/api/signals/optimize", json={
            "north_vehicles": 12,
            "south_vehicles": 10,
            "east_vehicles": 5,
            "west_vehicles": 3
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("optimization_decision", data)

        # Test simulation state endpoint
        res = self.client.get("/api/simulation/state")
        self.assertEqual(res.status_code, 200)

        # Test prediction endpoint
        res = self.client.post("/api/prediction/predict", json={
            "hour_of_day": 8,
            "is_weekend": False,
            "vehicle_count": 45,
            "current_density_pct": 55.0,
            "weather": "clear",
            "prev_cycle_wait": 20.0,
            "incident": False
        })
        self.assertEqual(res.status_code, 200)


if __name__ == "__main__":
    unittest.main()
