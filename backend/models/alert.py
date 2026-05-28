# models/alert.py — Alert + DiagnosticsReport ORM

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Float
from core.database import Base
from pydantic import BaseModel
from typing import Optional


class Alert(Base):
    __tablename__ = "alerts"

    id          = Column(Integer, primary_key=True, index=True)
    vehicle_id  = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)
    severity    = Column(String(20), nullable=False)   # INFO|WARNING|CRITICAL
    code        = Column(String(50), nullable=False)   # e.g. OVERTEMP_COOLANT
    title       = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    metric      = Column(String(100), default="")      # which telemetry field
    value       = Column(Float, default=0.0)           # the offending value
    threshold   = Column(Float, default=0.0)           # threshold that was exceeded
    resolved    = Column(Boolean, default=False)
    created_at  = Column(DateTime, default=datetime.utcnow, index=True)
    resolved_at = Column(DateTime, nullable=True)


class DiagnosticsReport(Base):
    __tablename__ = "diagnostics_reports"

    id          = Column(Integer, primary_key=True, index=True)
    vehicle_id  = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    health_score= Column(Integer, default=100)
    summary     = Column(Text, nullable=False)
    analysis    = Column(Text, nullable=False)
    recommendations = Column(Text, nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow)


class AlertResponse(BaseModel):
    id:          int
    vehicle_id:  int
    severity:    str
    code:        str
    title:       str
    description: str
    metric:      str
    value:       float
    threshold:   float
    resolved:    bool
    created_at:  datetime

    class Config:
        from_attributes = True


class DiagnosticsRequest(BaseModel):
    vehicle_id: int


class DiagnosticsResponse(BaseModel):
    vehicle_id:      int
    health_score:    int
    summary:         str
    analysis:        str
    recommendations: str
    active_alerts:   int
    created_at:      datetime
