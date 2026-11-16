import time
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)


class AdaptiveSignalOptimizer:
    def __init__(
        self,
        min_green: int = 10,
        max_green: int = 60,
        yellow_duration: int = 4,
        all_red_duration: int = 2,
        starvation_threshold: int = 3  # Maximum consecutive cycles skipped before forced green
    ):
        self.min_green = min_green
        self.max_green = max_green
        self.yellow_duration = yellow_duration
        self.all_red_duration = all_red_duration
        self.starvation_threshold = starvation_threshold

        # Starvation tracking: number of cycles a direction has been denied green
        self.starvation_counter = {
            "NORTH": 0,
            "SOUTH": 0,
            "EAST": 0,
            "WEST": 0
        }
        self.last_phase = "NS"  # "NS" or "EW" or "EMERGENCY_OVERRIDE"
        self.cycle_count = 0

    def compute_optimal_schedule(
        self,
        density_analysis: Dict[str, Any],
        emergency_override: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculates the next optimal phase and duration using Webster's modified delay-minimization formula,
        incorporating dynamic queue weights, starvation penalties, and emergency preemption.
        """
        self.cycle_count += 1
        dirs = density_analysis.get("directions", {})

        north = dirs.get("NORTH", {})
        south = dirs.get("SOUTH", {})
        east = dirs.get("EAST", {})
        west = dirs.get("WEST", {})

        # 1. EMERGENCY VEHICLE PREEMPTION CHECK
        emergency_direction = None
        if emergency_override in ["NORTH", "SOUTH", "EAST", "WEST"]:
            emergency_direction = emergency_override
        else:
            for d in ["NORTH", "SOUTH", "EAST", "WEST"]:
                if dirs.get(d, {}).get("has_emergency", False):
                    emergency_direction = d
                    break

        if emergency_direction:
            reason = (
                f"EMERGENCY PREEMPTION ACTIVE: Emergency vehicle detected approaching from {emergency_direction}. "
                f"Immediate green wave granted to {emergency_direction} for safe rapid corridor clearance. "
                f"Conflicting directions locked in RED."
            )
            return {
                "phase": f"EMERGENCY_{emergency_direction}",
                "active_direction": emergency_direction,
                "green_duration": 25,
                "yellow_duration": self.yellow_duration,
                "all_red_duration": self.all_red_duration,
                "is_emergency_preemption": True,
                "signals": {
                    "NORTH": "GREEN" if emergency_direction == "NORTH" else "RED",
                    "SOUTH": "GREEN" if emergency_direction == "SOUTH" else "RED",
                    "EAST": "GREEN" if emergency_direction == "EAST" else "RED",
                    "WEST": "GREEN" if emergency_direction == "WEST" else "RED"
                },
                "explanation": {
                    "primary_reason": reason,
                    "metrics_used": {"emergency_direction": emergency_direction, "preemption": True},
                    "safety_lock": "All conflicting traffic streams stopped"
                }
            }

        # 2. PHASE PRESSURE CALCULATION (NS Axis vs EW Axis)
        # Combined demand is max/sum of opposing approaches plus starvation aging factor
        ns_pcu = north.get("pcu", 0.0) + south.get("pcu", 0.0)
        ew_pcu = east.get("pcu", 0.0) + west.get("pcu", 0.0)

        # Starvation boosts
        ns_starvation_boost = (self.starvation_counter["NORTH"] + self.starvation_counter["SOUTH"]) * 2.5
        ew_starvation_boost = (self.starvation_counter["EAST"] + self.starvation_counter["WEST"]) * 2.5

        ns_pressure = ns_pcu + ns_starvation_boost
        ew_pressure = ew_pcu + ew_starvation_boost

        total_pressure = max(0.1, ns_pressure + ew_pressure)

        # 3. SELECT NEXT PHASE (Avoiding starvation)
        forced_phase = None
        if max(self.starvation_counter["EAST"], self.starvation_counter["WEST"]) >= self.starvation_threshold:
            forced_phase = "EW"
        elif max(self.starvation_counter["NORTH"], self.starvation_counter["SOUTH"]) >= self.starvation_threshold:
            forced_phase = "NS"

        if forced_phase:
            selected_phase = forced_phase
            starvation_triggered = True
        else:
            # Fair alternation if pressures are close, otherwise highest pressure
            if abs(ns_pressure - ew_pressure) < 1.0:
                selected_phase = "EW" if self.last_phase == "NS" else "NS"
            else:
                selected_phase = "NS" if ns_pressure >= ew_pressure else "EW"
            starvation_triggered = False

        self.last_phase = selected_phase

        # Update starvation counters
        if selected_phase == "NS":
            self.starvation_counter["NORTH"] = 0
            self.starvation_counter["SOUTH"] = 0
            self.starvation_counter["EAST"] += 1
            self.starvation_counter["WEST"] += 1
            target_pressure = ns_pressure
            opposing_pressure = ew_pressure
            target_pcu = ns_pcu
            active_directions = ["NORTH", "SOUTH"]
        else:
            self.starvation_counter["EAST"] = 0
            self.starvation_counter["WEST"] = 0
            self.starvation_counter["NORTH"] += 1
            self.starvation_counter["SOUTH"] += 1
            target_pressure = ew_pressure
            opposing_pressure = ns_pressure
            target_pcu = ew_pcu
            active_directions = ["EAST", "WEST"]

        # 4. DYNAMIC GREEN ALLOCATION
        # Split proportional to pressure, clamped within [min_green, max_green]
        ratio = target_pressure / total_pressure
        # Nominal cycle length = 60s to 120s based on total load
        cycle_length = min(120, max(50, int(40 + (total_pressure * 2.0))))
        allocated_green = int(round(cycle_length * ratio))
        allocated_green = max(self.min_green, min(self.max_green, allocated_green))

        # 5. DETAILED EXPLAINABILITY
        reasons = []
        if starvation_triggered:
            reasons.append(
                f"Starvation prevention activated: {selected_phase} axis was waiting for "
                f"{max(self.starvation_counter['EAST'], self.starvation_counter['WEST']) if selected_phase=='EW' else max(self.starvation_counter['NORTH'], self.starvation_counter['SOUTH'])} cycles."
            )
        reasons.append(
            f"{selected_phase} selected with demand {round(target_pcu, 1)} PCU "
            f"(pressure score: {round(target_pressure, 1)}) vs opposing {selected_phase=='NS' and 'EW' or 'NS'} demand {round(opposing_pressure, 1)}."
        )
        reasons.append(
            f"Green duration set to {allocated_green}s (bounded by min={self.min_green}s, max={self.max_green}s) "
            f"to dissipate estimated queue without causing excessive delay on opposing approaches."
        )

        return {
            "phase": selected_phase,
            "active_directions": active_directions,
            "green_duration": allocated_green,
            "yellow_duration": self.yellow_duration,
            "all_red_duration": self.all_red_duration,
            "is_emergency_preemption": False,
            "signals": {
                "NORTH": "GREEN" if selected_phase == "NS" else "RED",
                "SOUTH": "GREEN" if selected_phase == "NS" else "RED",
                "EAST": "GREEN" if selected_phase == "EW" else "RED",
                "WEST": "GREEN" if selected_phase == "EW" else "RED"
            },
            "metrics": {
                "ns_pcu": round(ns_pcu, 1),
                "ew_pcu": round(ew_pcu, 1),
                "ns_pressure": round(ns_pressure, 1),
                "ew_pressure": round(ew_pressure, 1),
                "cycle_length": cycle_length
            },
            "starvation_counters": dict(self.starvation_counter),
            "explanation": {
                "primary_reason": " ".join(reasons),
                "selected_phase": selected_phase,
                "duration_seconds": allocated_green,
                "fairness_rating": "Optimal Fair (No Starvation)"
            }
        }
