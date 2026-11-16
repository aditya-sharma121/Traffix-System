import time
from typing import Dict, Any, Optional


class EmergencyHandler:
    def __init__(self):
        self.active_emergency: bool = False
        self.active_direction: Optional[str] = None
        self.trigger_source: str = "none"  # "ai_vision_detection" or "manual_dispatch_trigger"
        self.vehicle_type: str = "ambulance"
        self.triggered_at: float = 0.0
        self.duration_seconds: int = 25
        self.history: list = []

    def trigger_emergency(self, direction: str, source: str = "manual_dispatch_trigger", vehicle_type: str = "ambulance") -> Dict[str, Any]:
        """Activates emergency preemption mode for a specific direction."""
        direction = direction.upper()
        if direction not in ["NORTH", "SOUTH", "EAST", "WEST"]:
            direction = "NORTH"

        self.active_emergency = True
        self.active_direction = direction
        self.trigger_source = source
        self.vehicle_type = vehicle_type
        self.triggered_at = time.time()

        event = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "direction": direction,
            "vehicle_type": vehicle_type,
            "trigger_source": source,
            "status": "ACTIVE_PREEMPTION",
            "message": f"EMERGENCY PROTOCOL ENGAGED: Priority clearance corridor granted to {direction} for incoming {vehicle_type}."
        }
        self.history.append(event)
        if len(self.history) > 20:
            self.history.pop(0)

        return event

    def resolve_emergency(self) -> Dict[str, Any]:
        """Clears emergency mode safely."""
        prev_dir = self.active_direction
        self.active_emergency = False
        self.active_direction = None
        self.trigger_source = "none"

        event = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "status": "RESOLVED",
            "message": f"Emergency corridor for {prev_dir} cleared. Resuming adaptive signal cycle safely."
        }
        self.history.append(event)
        return event

    def get_status(self) -> Dict[str, Any]:
        elapsed = time.time() - self.triggered_at if self.active_emergency else 0
        remaining = max(0, int(self.duration_seconds - elapsed)) if self.active_emergency else 0

        if self.active_emergency and remaining == 0:
            self.resolve_emergency()

        return {
            "active_emergency": self.active_emergency,
            "direction": self.active_direction,
            "trigger_source": self.trigger_source,
            "vehicle_type": self.vehicle_type,
            "remaining_preemption_seconds": remaining,
            "transparency_note": (
                "AI emergency detection uses color strobe / livery signature heuristics. "
                "Manual trigger provided for 100% deterministic hackathon demonstration."
            ),
            "recent_events": self.history[-6:]
        }
