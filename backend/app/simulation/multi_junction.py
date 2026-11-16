import time
from typing import Dict, Any, List
from backend.app.simulation.virtual_intersection import VirtualIntersection


class MultiJunctionManager:
    def __init__(self):
        # 3 synchronized junctions along a key urban arterial corridor
        self.junctions: Dict[str, VirtualIntersection] = {
            "J1_NorthCorridor": VirtualIntersection(junction_id="J1_NorthCorridor"),
            "J2_MetroPlaza": VirtualIntersection(junction_id="J2_MetroPlaza"),
            "J3_TechPark": VirtualIntersection(junction_id="J3_TechPark")
        }
        self.green_wave_active: bool = True
        self.offset_seconds: int = 8  # Green wave offset between consecutive junctions

        # Preset arrival patterns
        self.junctions["J1_NorthCorridor"].spawn_rates = {"NORTH": 0.40, "SOUTH": 0.35, "EAST": 0.20, "WEST": 0.15}
        self.junctions["J2_MetroPlaza"].spawn_rates = {"NORTH": 0.50, "SOUTH": 0.45, "EAST": 0.30, "WEST": 0.30}
        self.junctions["J3_TechPark"].spawn_rates = {"NORTH": 0.30, "SOUTH": 0.25, "EAST": 0.25, "WEST": 0.20}

    def tick_all(self, dt: float = 0.5):
        for j_id, sim in self.junctions.items():
            sim.tick(dt)

    def set_green_wave(self, enabled: bool):
        self.green_wave_active = enabled

    def get_corridor_status(self) -> Dict[str, Any]:
        """Summarizes all junctions across the urban corridor."""
        junction_summaries = {}
        total_vehicles_in_corridor = 0
        total_corridor_cleared = 0
        congestions = []

        for j_id, sim in self.junctions.items():
            state = sim.get_state()
            total_vehicles_in_corridor += state["vehicle_count"]
            total_corridor_cleared += state["total_cleared"]

            q_sum = sum(state["queues"].values())
            if q_sum < 6:
                status = "Smooth"
            elif q_sum < 15:
                status = "Moderate"
            else:
                status = "Congested"
            congestions.append(status)

            junction_summaries[j_id] = {
                "name": j_id.replace("_", " "),
                "current_phase": state["phase"],
                "active_signals": state["signals"],
                "time_remaining": state["time_remaining"],
                "vehicle_count": state["vehicle_count"],
                "queues": state["queues"],
                "status": status,
                "avg_wait_sec": state["avg_wait_time"]
            }

        overall_status = "Moderate"
        if "Congested" in congestions:
            overall_status = "Heavy Traffic"
        elif all(c == "Smooth" for c in congestions):
            overall_status = "Optimal Green Wave"

        return {
            "corridor_name": "Metro Grand Arterial (Avenue 1 - 3)",
            "overall_status": overall_status,
            "green_wave_coordinated": self.green_wave_active,
            "wave_offset_seconds": self.offset_seconds,
            "total_active_vehicles": total_vehicles_in_corridor,
            "total_cleared_vehicles": total_corridor_cleared,
            "junctions": junction_summaries
        }
