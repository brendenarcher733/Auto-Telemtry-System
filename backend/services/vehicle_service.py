# services/vehicle_service.py

from sqlalchemy.orm import Session
from models.vehicle import Vehicle, VehicleCreate
from generators.telemetry_engine import telemetry_engine
from fastapi import HTTPException
import random

DEMO_VEHICLES = [
    {"vin": "1HGBH41JXMN109186", "name": "Alpha-01", "make": "Honda",    "model": "NSX-R",    "year": 2023, "vehicle_type": "sports",  "driver": "M. Verstappen", "lat": 33.749,  "lng": -84.388,  "loc": "Atlanta Motor Speedway"},
    {"vin": "JH4KA7650MC000000", "name": "Bravo-02", "make": "Acura",    "model": "TLX Type S","year": 2024, "vehicle_type": "sedan",   "driver": "L. Hamilton",   "lat": 33.771,  "lng": -84.402,  "loc": "Midtown Atlanta, GA"},
    {"vin": "5YJSA1E26MF000001", "name": "Charlie-03","make": "Tesla",    "model": "Model S P100D","year":2024,"vehicle_type":"ev",     "driver": "S. Leclerc",    "lat": 33.8120, "lng": -84.3760, "loc": "Buckhead, GA"},
    {"vin": "WP0CB2A99NS200001", "name": "Delta-04",  "make": "Porsche",  "model": "GT3 RS",   "year": 2024, "vehicle_type": "sports",  "driver": "C. Sainz",      "lat": 33.6916, "lng": -84.4500, "loc": "Hartsfield, GA"},
    {"vin": "1FT8W3BT3NEC00001", "name": "Echo-05",   "make": "Ford",     "model": "F-150 Lightning","year":2024,"vehicle_type":"truck","driver": "G. Russell",    "lat": 33.9031, "lng": -84.2150, "loc": "Marietta, GA"},
    {"vin": "ZFFSA20B000000001", "name": "Foxtrot-06","make": "Ferrari",  "model": "SF-23",    "year": 2023, "vehicle_type": "formula", "driver": "C. Leclerc",    "lat": 33.7200, "lng": -84.3910, "loc": "Road Atlanta"},
]


def seed_demo_vehicles(db: Session) -> None:
    """Populate the fleet with demo vehicles if the DB is empty."""
    if db.query(Vehicle).count() > 0:
        return

    for v in DEMO_VEHICLES:
        vehicle = Vehicle(
            vin=v["vin"], name=v["name"], make=v["make"], model=v["model"],
            year=v["year"], vehicle_type=v["vehicle_type"], driver=v["driver"],
            location_lat=v["lat"], location_lng=v["lng"], location_name=v["loc"],
            health_score=random.randint(72, 100),
            odometer=random.uniform(1200, 85000),
            status=random.choice(["online", "online", "online", "maintenance", "offline"]),
        )
        db.add(vehicle)
        db.flush()
        telemetry_engine.register_vehicle(vehicle.id, v["vehicle_type"], v["lat"], v["lng"])

    db.commit()


def get_all_vehicles(db: Session) -> list[Vehicle]:
    return db.query(Vehicle).order_by(Vehicle.id).all()


def get_vehicle(db: Session, vehicle_id: int) -> Vehicle:
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail=f"Vehicle {vehicle_id} not found")
    return v


def ensure_engine_registered(db: Session) -> None:
    """Re-register all vehicles with the engine after restart."""
    vehicles = db.query(Vehicle).all()
    for v in vehicles:
        if v.id not in telemetry_engine._states:
            telemetry_engine.register_vehicle(v.id, v.vehicle_type, v.location_lat, v.location_lng)
