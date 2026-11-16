from typing import Dict, List, Any
import numpy as np

# Passenger Car Unit equivalents for urban traffic capacity
PCU_WEIGHTS = {
    "car": 1.0,
    "motorcycle": 0.5,
    "bus": 2.5,
    "truck": 3.0,
    "emergency": 2.0
}

# Standard lane saturation capacity (e.g. 25 PCU per direction queue buffer)
MAX_DIRECTION_CAPACITY_PCU = 25.0


class DensityAnalyzer:
    def __init__(self, capacity_pcu: float = MAX_DIRECTION_CAPACITY_PCU):
        self.capacity_pcu = capacity_pcu

    def assign_direction_by_position(self, bbox: tuple, frame_w: int, frame_h: int) -> str:
        """
        Assigns vehicle to North, South, East, or West based on geometric quadrant in intersection view.
        """
        cx = (bbox[0] + bbox[2]) / 2.0
        cy = (bbox[1] + bbox[3]) / 2.0

        # Normalized coordinates [-1, 1] relative to intersection center
        nx = (cx - (frame_w / 2.0)) / (frame_w / 2.0)
        ny = (cy - (frame_h / 2.0)) / (frame_h / 2.0)

        # Diagonal quadrant boundaries
        if ny < 0 and abs(nx) <= abs(ny):
            return "NORTH"
        elif ny > 0 and abs(nx) <= abs(ny):
            return "SOUTH"
        elif nx < 0 and abs(ny) < abs(nx):
            return "WEST"
        else:
            return "EAST"

    def analyze(self, vehicles: List[Dict[str, Any]], frame_w: int = 1280, frame_h: int = 720) -> Dict[str, Any]:
        """
        vehicles: list of dicts with 'bbox', 'class_name', 'confidence', 'is_emergency', optional 'direction'
        """
        directions = {
            "NORTH": {"count": 0, "pcu": 0.0, "classes": {}, "has_emergency": False, "speeds": []},
            "SOUTH": {"count": 0, "pcu": 0.0, "classes": {}, "has_emergency": False, "speeds": []},
            "EAST": {"count": 0, "pcu": 0.0, "classes": {}, "has_emergency": False, "speeds": []},
            "WEST": {"count": 0, "pcu": 0.0, "classes": {}, "has_emergency": False, "speeds": []},
        }

        for v in vehicles:
            dir_name = v.get("direction")
            if not dir_name or dir_name not in directions:
                dir_name = self.assign_direction_by_position(v["bbox"], frame_w, frame_h)

            cls = v.get("class_name", "car")
            pcu_val = PCU_WEIGHTS.get(cls, 1.0)

            directions[dir_name]["count"] += 1
            directions[dir_name]["pcu"] += pcu_val
            directions[dir_name]["classes"][cls] = directions[dir_name]["classes"].get(cls, 0) + 1
            
            if v.get("is_emergency", False) or cls == "emergency":
                directions[dir_name]["has_emergency"] = True

            if "speed" in v:
                directions[dir_name]["speeds"].append(v["speed"])

        total_vehicles = len(vehicles)
        total_pcu = sum(d["pcu"] for d in directions.values())

        direction_analysis = {}
        for d_name, d_data in directions.items():
            pcu = d_data["pcu"]
            density_ratio = min(1.0, pcu / self.capacity_pcu)
            density_percent = round(density_ratio * 100, 1)

            # Queue length estimation (avg vehicle length + headway approx 6.5 meters per PCU)
            estimated_queue_meters = round(pcu * 6.5, 1)
            estimated_queue_vehicles = d_data["count"]

            # Congestion Level categorization
            if density_percent < 25:
                congestion = "Low"
                base_wait = 8
            elif density_percent < 55:
                congestion = "Medium"
                base_wait = 20
            elif density_percent < 80:
                congestion = "High"
                base_wait = 42
            else:
                congestion = "Severe"
                base_wait = 65

            # Waiting time estimate: function of queue and congestion
            wait_time_sec = round(base_wait + (pcu * 2.2), 1)

            direction_analysis[d_name] = {
                "vehicle_count": d_data["count"],
                "pcu": round(pcu, 1),
                "density_percent": density_percent,
                "congestion_level": congestion,
                "estimated_queue_length_m": estimated_queue_meters,
                "estimated_queue_count": estimated_queue_vehicles,
                "estimated_wait_time_sec": wait_time_sec,
                "has_emergency": d_data["has_emergency"],
                "class_breakdown": d_data["classes"]
            }

        overall_density = round((total_pcu / (self.capacity_pcu * 4)) * 100, 1)
        if overall_density < 30:
            overall_congestion = "Low"
        elif overall_density < 60:
            overall_congestion = "Medium"
        elif overall_density < 85:
            overall_congestion = "High"
        else:
            overall_congestion = "Severe"

        return {
            "total_vehicles": total_vehicles,
            "total_pcu": round(total_pcu, 1),
            "overall_density_percent": overall_density,
            "overall_congestion": overall_congestion,
            "directions": direction_analysis
        }
