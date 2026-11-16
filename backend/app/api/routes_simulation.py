from fastapi import APIRouter, Body
from backend.app.simulation.virtual_intersection import VirtualIntersection
from backend.app.simulation.multi_junction import MultiJunctionManager
from backend.app.simulation.sumo_connector import SumoConnector

router = APIRouter(prefix="/api/simulation", tags=["simulation"])

sim = VirtualIntersection(junction_id="J1_Main")
multi_manager = MultiJunctionManager()
sumo = SumoConnector()


@router.get("/state")
def get_simulation_state():
    return sim.get_state()


@router.post("/start")
def start_simulation():
    sim.active_simulation = True
    return {"status": "started", "active": True}


@router.post("/pause")
def pause_simulation():
    sim.active_simulation = False
    return {"status": "paused", "active": False}


@router.post("/reset")
def reset_simulation():
    sim.reset()
    return {"status": "reset", "state": sim.get_state()}


@router.post("/mode")
def set_simulation_mode(mode: str = Body(..., embed=True)):
    sim.set_mode(mode)
    return {"status": "updated", "mode": sim.mode}


@router.post("/tick")
def tick_simulation(dt: float = Body(0.5, embed=True)):
    sim.tick(dt)
    multi_manager.tick_all(dt)
    return sim.get_state()


@router.post("/emergency")
def trigger_sim_emergency(direction: str = Body("NORTH", embed=True)):
    sim.trigger_emergency(direction)
    return {"status": "emergency_triggered", "direction": direction, "state": sim.get_state()}


@router.post("/spawn")
def spawn_vehicle(
    direction: str = Body("NORTH", embed=True),
    vtype: str = Body("car", embed=True),
    turn: str = Body(None, embed=True)
):
    sim.spawn_vehicle(direction, vtype=vtype, turn=turn)
    return {"status": "spawned", "direction": direction, "type": vtype, "turn": turn}


@router.get("/corridor")
def get_corridor():
    return multi_manager.get_corridor_status()


@router.get("/sumo-status")
def get_sumo_status():
    return sumo.get_status()


@router.post("/sumo-generate")
def generate_sumo():
    return sumo.generate_sumo_scenario()
