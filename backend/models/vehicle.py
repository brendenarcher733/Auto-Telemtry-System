# models/vehicle.py — Vehicle ORM + Pydantic schemas

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON
from core.database import Base
from pydantic import BaseModel, Field
from typing import Optional


class Vehicle(Base):
    __tablename__ = "vehicles"

    id           = Column(Integer, primary_key=True, index=True)
    vin          = Column(String(17), unique=True, nullable=False, index=True)
    name         = Column(String(200), nullable=False)
    make         = Column(String(100), nullable=False)
    model        = Column(String(100), nullable=False)
    year         = Column(Integer, nullable=False)
    vehicle_type = Column(String(50), default="sedan")   # sedan|suv|truck|sports|ev|formula
    status       = Column(String(20), default="online")  # online|offline|maintenance|error
    driver       = Column(String(100), default="Unassigned")
    location_lat = Column(Float, default=33.749)
    location_lng = Column(Float, default=-84.388)
    location_name= Column(String(200), default="Atlanta, GA")
    health_score = Column(Integer, default=100)          # 0–100
    odometer     = Column(Float, default=0.0)            # miles
    metadata_    = Column("metadata", JSON, default=dict)
    created_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class VehicleCreate(BaseModel):
    vin:          str   = Field(..., min_length=17, max_length=17)
    name:         str   = Field(..., min_length=1)
    make:         str
    model:        str
    year:         int   = Field(..., ge=1980, le=2030)
    vehicle_type: str   = "sedan"
    driver:       str   = "Unassigned"


class VehicleResponse(BaseModel):
    id:            int
    vin:           str
    name:          str
    make:          str
    model:         str
    year:          int
    vehicle_type:  str
    status:        str
    driver:        str
    location_lat:  float
    location_lng:  float
    location_name: str
    health_score:  int
    odometer:      float
    created_at:    datetime
    updated_at:    datetime

    class Config:
        from_attributes = True
