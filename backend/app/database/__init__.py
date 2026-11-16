from backend.app.database.db import Base, engine, get_db, SessionLocal
from backend.app.database.models import TrafficSession, SignalOptimizationRecord, EmergencyEvent, SimulationRun

# Automatically create tables on import
Base.metadata.create_all(bind=engine)
