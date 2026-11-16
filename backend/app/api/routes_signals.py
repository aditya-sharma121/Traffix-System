from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.app.signal_optimizer.optimizer import AdaptiveSignalOptimizer
from backend.app.traffic_analysis.density_analyzer import DensityAnalyzer
from backend.app.emergency_detection.emergency_handler import EmergencyHandler
from backend.app.database.db import get_db
from backend.app.database.models import SignalOptimizationRecord

router = APIRouter(prefix="/api/signals", tags=["signals"])
optimizer = AdaptiveSignalOptimizer()
analyzer = DensityAnalyzer()
emergency_handler = EmergencyHandler()


class ManualDensityInput(BaseModel):
    north_vehicles: int = 15
    south_vehicles: int = 12
    east_vehicles: int = 6
    west_vehicles: int = 4
    emergency_direction: Optional[str] = None


@router.post("/optimize")
def optimize_signals(data: ManualDensityInput, db: Session = Depends(get_db)):
    # Build simulated vehicle list for analyzer
    vehicles = []
    for _ in range(data.north_vehicles):
        vehicles.append({"direction": "NORTH", "class_name": "car", "is_emergency": data.emergency_direction == "NORTH"})
    for _ in range(data.south_vehicles):
        vehicles.append({"direction": "SOUTH", "class_name": "car", "is_emergency": data.emergency_direction == "SOUTH"})
    for _ in range(data.east_vehicles):
        vehicles.append({"direction": "EAST", "class_name": "car", "is_emergency": data.emergency_direction == "EAST"})
    for _ in range(data.west_vehicles):
        vehicles.append({"direction": "WEST", "class_name": "car", "is_emergency": data.emergency_direction == "WEST"})

    density_data = analyzer.analyze(vehicles)
    decision = optimizer.compute_optimal_schedule(density_data, emergency_override=data.emergency_direction)

    # Persist record
    record = SignalOptimizationRecord(
        phase_selected=decision["phase"],
        green_n=decision["green_duration"] if "NORTH" in decision.get("active_directions", []) or decision.get("active_direction") == "NORTH" else 0,
        green_s=decision["green_duration"] if "SOUTH" in decision.get("active_directions", []) or decision.get("active_direction") == "SOUTH" else 0,
        green_e=decision["green_duration"] if "EAST" in decision.get("active_directions", []) or decision.get("active_direction") == "EAST" else 0,
        green_w=decision["green_duration"] if "WEST" in decision.get("active_directions", []) or decision.get("active_direction") == "WEST" else 0,
        emergency_active=decision["is_emergency_preemption"],
        emergency_direction=data.emergency_direction,
        reason=decision["explanation"]["primary_reason"]
    )
    db.add(record)
    db.commit()

    return {
        "density_analysis": density_data,
        "optimization_decision": decision
    }


@router.post("/emergency-override")
def trigger_emergency(direction: str = Body(..., embed=True), vehicle_type: str = Body("ambulance", embed=True)):
    event = emergency_handler.trigger_emergency(direction=direction, source="manual_dispatch_trigger", vehicle_type=vehicle_type)
    return event


@router.post("/emergency-clear")
def clear_emergency():
    return emergency_handler.resolve_emergency()


@router.get("/emergency-status")
def get_emergency_status():
    return emergency_handler.get_status()
