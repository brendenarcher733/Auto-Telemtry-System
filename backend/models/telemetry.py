# models/telemetry.py — Telemetry ORM + schemas

from datetime import datetime
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String, Boolean
from core.database import Base
from pydantic import BaseModel
from typing import Optional


class TelemetryRecord(Base):
    __tablename__ = "telemetry"

    id                = Column(Integer, primary_key=True, index=True)
    vehicle_id        = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)
    timestamp         = Column(DateTime, default=datetime.utcnow, index=True)

    # Powertrain
    speed_mph         = Column(Float, default=0.0)
    rpm               = Column(Float, default=0.0)
    throttle_pct      = Column(Float, default=0.0)
    engine_load_pct   = Column(Float, default=0.0)
    gear              = Column(Integer, default=1)

    # Thermal
    coolant_temp_f    = Column(Float, default=180.0)
    oil_temp_f        = Column(Float, default=200.0)
    intake_temp_f     = Column(Float, default=70.0)
    brake_temp_f      = Column(Float, default=80.0)
    transmission_temp = Column(Float, default=170.0)

    # Electrical
    battery_voltage   = Column(Float, default=14.2)
    alternator_output = Column(Float, default=13.8)
    fuel_pct          = Column(Float, default=80.0)   # or battery% for EV

    # Chassis
    tire_fl_psi       = Column(Float, default=32.0)
    tire_fr_psi       = Column(Float, default=32.0)
    tire_rl_psi       = Column(Float, default=32.0)
    tire_rr_psi       = Column(Float, default=32.0)
    g_force_lat       = Column(Float, default=0.0)
    g_force_long      = Column(Float, default=0.0)

    # GPS
    latitude          = Column(Float, default=33.749)
    longitude         = Column(Float, default=-84.388)
    altitude_ft       = Column(Float, default=1050.0)

    # Flags
    check_engine      = Column(Boolean, default=False)
    abs_active        = Column(Boolean, default=False)
    traction_active   = Column(Boolean, default=False)


class TelemetrySnapshot(BaseModel):
    """What the frontend receives in real-time."""
    vehicle_id:        int
    timestamp:         datetime
    speed_mph:         float
    rpm:               float
    throttle_pct:      float
    engine_load_pct:   float
    gear:              int
    coolant_temp_f:    float
    oil_temp_f:        float
    intake_temp_f:     float
    brake_temp_f:      float
    transmission_temp: float
    battery_voltage:   float
    alternator_output: float
    fuel_pct:          float
    tire_fl_psi:       float
    tire_fr_psi:       float
    tire_rl_psi:       float
    tire_rr_psi:       float
    g_force_lat:       float
    g_force_long:      float
    latitude:          float
    longitude:         float
    altitude_ft:       float
    check_engine:      bool
    abs_active:        bool
    traction_active:   bool

    class Config:
        from_attributes = True
