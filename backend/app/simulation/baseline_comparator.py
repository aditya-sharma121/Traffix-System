import random
from typing import Dict, Any, List
from backend.app.simulation.virtual_intersection import VirtualIntersection


class BaselineComparator:
    def __init__(self):
        pass

    def run_benchmark(self, duration_steps: int = 180, traffic_intensity: str = "medium") -> Dict[str, Any]:
        """
        Runs an identical repeatable traffic arrival schedule across two parallel intersections:
        1. Fixed-Time Signal (30s NS green, 4s yellow, 2s red, 30s EW green, 4s yellow, 2s red)
        2. TRAFFIQ Adaptive Signal (Dynamic Webster density optimization with starvation prevention)
        """
        # Set spawn rates according to scenario intensity
        if traffic_intensity == "high":
            rates = {"NORTH": 0.50, "SOUTH": 0.45, "EAST": 0.30, "WEST": 0.25}
        elif traffic_intensity == "asymmetric":
            # Highly asymmetric: NS heavy, EW light
            rates = {"NORTH": 0.65, "SOUTH": 0.55, "EAST": 0.15, "WEST": 0.10}
        else:  # medium
            rates = {"NORTH": 0.35, "SOUTH": 0.30, "EAST": 0.25, "WEST": 0.20}

        # Pre-generate deterministic arrival events so both runs receive IDENTICAL traffic
        rng = random.Random(42)  # Fixed seed for fair reproducibility
        arrival_events = []
        for step in range(duration_steps):
            step_events = []
            for d, rate in rates.items():
                if rng.random() < (rate * 0.5):
                    v_type_rand = rng.random()
                    vtype = "car"
                    if v_type_rand > 0.88:
                        vtype = "bus"
                    elif v_type_rand > 0.75:
                        vtype = "truck"
                    elif v_type_rand > 0.60:
                        vtype = "motorcycle"
                    step_events.append((d, vtype))
            arrival_events.append(step_events)

        # 1. RUN FIXED TIME INTERSECTION
        sim_fixed = VirtualIntersection(junction_id="Benchmark_Fixed")
        sim_fixed.set_mode("fixed")
        # Disable internal stochastic spawning; feed deterministic arrivals
        sim_fixed.spawn_rates = {d: 0.0 for d in rates}

        fixed_queue_samples = []
        fixed_wait_history = []

        for step in range(duration_steps):
            for d, vtype in arrival_events[step]:
                sim_fixed.spawn_vehicle(d, vtype=vtype)
            sim_fixed.tick(dt=0.5)

            # Record sample
            q_sum = sum(
                sum(1 for v in sim_fixed.vehicles[d] if v.position < sim_fixed.stop_line and v.speed < 1.0)
                for d in sim_fixed.vehicles
            )
            fixed_queue_samples.append(q_sum)
            fixed_wait_history.append(round(sim_fixed.total_wait_time / max(1, sim_fixed.total_spawned), 1))

        # 2. RUN TRAFFIQ ADAPTIVE INTERSECTION
        sim_adaptive = VirtualIntersection(junction_id="Benchmark_Adaptive")
        sim_adaptive.set_mode("adaptive")
        sim_adaptive.spawn_rates = {d: 0.0 for d in rates}

        adaptive_queue_samples = []
        adaptive_wait_history = []

        for step in range(duration_steps):
            for d, vtype in arrival_events[step]:
                sim_adaptive.spawn_vehicle(d, vtype=vtype)
            sim_adaptive.tick(dt=0.5)

            # Record sample
            q_sum = sum(
                sum(1 for v in sim_adaptive.vehicles[d] if v.position < sim_adaptive.stop_line and v.speed < 1.0)
                for d in sim_adaptive.vehicles
            )
            adaptive_queue_samples.append(q_sum)
            adaptive_wait_history.append(round(sim_adaptive.total_wait_time / max(1, sim_adaptive.total_spawned), 1))

        # 3. COMPUTE MEASURED COMPARATIVE METRICS
        fixed_avg_wait = round(sim_fixed.total_wait_time / max(1, sim_fixed.total_spawned), 2)
        adaptive_avg_wait = round(sim_adaptive.total_wait_time / max(1, sim_adaptive.total_spawned), 2)

        fixed_avg_queue = round(sum(fixed_queue_samples) / max(1, len(fixed_queue_samples)), 2)
        adaptive_avg_queue = round(sum(adaptive_queue_samples) / max(1, len(adaptive_queue_samples)), 2)

        fixed_throughput = sim_fixed.total_cleared
        adaptive_throughput = sim_adaptive.total_cleared

        wait_reduction_pct = round(((fixed_avg_wait - adaptive_avg_wait) / max(0.01, fixed_avg_wait)) * 100, 1)
        queue_reduction_pct = round(((fixed_avg_queue - adaptive_avg_queue) / max(0.01, fixed_avg_queue)) * 100, 1)
        throughput_increase_pct = round(((adaptive_throughput - fixed_throughput) / max(1, fixed_throughput)) * 100, 1)

        # Estimated CO2 reduction based on idling time savings (approx 2.4g CO2 per minute of vehicle idling)
        delay_saved_seconds = max(0.0, sim_fixed.total_wait_time - sim_adaptive.total_wait_time)
        co2_saved_kg = round((delay_saved_seconds / 60.0) * 0.0024 * max(1, adaptive_throughput), 3)

        return {
            "scenario": traffic_intensity,
            "duration_seconds": int(duration_steps * 0.5),
            "total_vehicles_tested": sim_fixed.total_spawned,
            "fixed_time_results": {
                "avg_waiting_time_sec": fixed_avg_wait,
                "avg_queue_length": fixed_avg_queue,
                "total_delay_sec": round(sim_fixed.total_wait_time, 1),
                "vehicles_cleared": fixed_throughput,
                "throughput_vpm": round((fixed_throughput / (duration_steps * 0.5)) * 60, 1)
            },
            "traffiq_adaptive_results": {
                "avg_waiting_time_sec": adaptive_avg_wait,
                "avg_queue_length": adaptive_avg_queue,
                "total_delay_sec": round(sim_adaptive.total_wait_time, 1),
                "vehicles_cleared": adaptive_throughput,
                "throughput_vpm": round((adaptive_throughput / (duration_steps * 0.5)) * 60, 1)
            },
            "improvements": {
                "waiting_time_reduction_percent": wait_reduction_pct,
                "queue_reduction_percent": queue_reduction_pct,
                "throughput_increase_percent": throughput_increase_pct,
                "co2_emissions_saved_kg": co2_saved_kg
            },
            "timeline": {
                "steps": list(range(0, duration_steps, 5)),
                "fixed_queue": fixed_queue_samples[0::5],
                "adaptive_queue": adaptive_queue_samples[0::5],
                "fixed_wait": fixed_wait_history[0::5],
                "adaptive_wait": adaptive_wait_history[0::5]
            }
        }
