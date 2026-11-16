import asyncio
import json
import logging
import backend.app.config  # Automatically load .env before anything else
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.routes_detection import router as detection_router
from backend.app.api.routes_signals import router as signals_router
from backend.app.api.routes_simulation import router as simulation_router, sim, multi_manager
from backend.app.api.routes_prediction import router as prediction_router
from backend.app.api.routes_analytics import router as analytics_router
from backend.app.database import Base, engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TRAFFIQ")

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TRAFFIQ Backend API",
    description="AI-Powered Intelligent Traffic Management System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(detection_router)
app.include_router(signals_router)
app.include_router(simulation_router)
app.include_router(prediction_router)
app.include_router(analytics_router)


# WebSocket Connection Manager for Real-Time Simulation
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.append(connection)
        for dc in dead_connections:
            self.disconnect(dc)


manager = ConnectionManager()


@app.websocket("/ws/simulation")
async def websocket_simulation_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Client can send commands like {"action": "start"} or {"action": "spawn", "direction": "NORTH"}
            data = await websocket.receive_text()
            try:
                cmd = json.loads(data)
                action = cmd.get("action")
                if action == "start":
                    sim.active_simulation = True
                elif action == "pause":
                    sim.active_simulation = False
                elif action == "reset":
                    sim.reset()
                elif action == "spawn":
                    sim.spawn_vehicle(cmd.get("direction", "NORTH"), cmd.get("type", "car"))
                elif action == "emergency":
                    sim.trigger_emergency(cmd.get("direction", "NORTH"))
                elif action == "set_mode":
                    sim.set_mode(cmd.get("mode", "adaptive"))
            except Exception as e:
                logger.error(f"WS command error: {e}")

            # Send immediate updated state
            await websocket.send_json({"type": "STATE_UPDATE", "data": sim.get_state()})
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# Background simulation ticker task
@app.on_event("startup")
async def startup_simulation_loop():
    async def simulation_background_worker():
        while True:
            await asyncio.sleep(0.3)
            if sim.active_simulation:
                sim.tick(dt=0.3)
                multi_manager.tick_all(dt=0.3)
                if manager.active_connections:
                    await manager.broadcast({
                        "type": "TICK",
                        "data": sim.get_state()
                    })

    asyncio.create_task(simulation_background_worker())


@app.get("/")
def read_root():
    return {
        "project": "TRAFFIQ",
        "tagline": "Detect. Analyze. Predict. Optimize.",
        "status": "Online",
        "modules": [
            "AI Vehicle Detection",
            "Traffic Density Analysis",
            "Adaptive Signal Optimization",
            "Virtual Intersection Simulation",
            "Emergency Vehicle Preemption",
            "Congestion Prediction",
            "Multi-Junction Management",
            "Performance Analytics"
        ]
    }
