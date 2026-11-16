from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, JSON
from backend.app.database.db import Base


class TrafficSession(Base):
    __tablename__ = "traffic_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), unique=True, index=True)
    video_filename = Column(String(255), nullable=True)
    total_vehicles = Column(Integer, default=0)
    density_north = Column(Float, default=0.0)
    density_south = Column(Float, default=0.0)
    density_east = Column(Float, default=0.0)
    density_west = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(32), default="completed")
    summary = Column(JSON, nullable=True)


class SignalOptimizationRecord(Base):
    __tablename__ = "signal_optimization_records"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    junction_id = Column(String(32), default="J1")
    phase_selected = Column(String(16))  # NS or EW or SPECIFIC
    green_n = Column(Integer, default=15)
    green_s = Column(Integer, default=15)
    green_e = Column(Integer, default=15)
    green_w = Column(Integer, default=15)
    emergency_active = Column(Boolean, default=False)
    emergency_direction = Column(String(16), nullable=True)
    reason = Column(Text, nullable=True)


class EmergencyEvent(Base):
    __tablename__ = "emergency_events"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    direction = Column(String(16))
    vehicle_type = Column(String(32), default="ambulance")
    detection_source = Column(String(32), default="manual_trigger")
    resolved = Column(Boolean, default=False)
    duration_sec = Column(Integer, default=20)


class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    mode = Column(String(32))  # "fixed_time" or "traffiq_adaptive"
    junction_id = Column(String(32), default="J1")
    duration_seconds = Column(Integer, default=120)
    total_vehicles = Column(Integer, default=0)
    avg_waiting_time = Column(Float, default=0.0)
    avg_queue_length = Column(Float, default=0.0)
    throughput_vpm = Column(Float, default=0.0)
    total_delay_seconds = Column(Float, default=0.0)
    co2_saved_kg = Column(Float, default=0.0)
