# routers/vehicles.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from models.vehicle import VehicleResponse
from services.vehicle_service import get_all_vehicles, get_vehicle
from services.diagnostics_service import compute_health_score

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])


@router.get("/", response_model=list[VehicleResponse])
def list_vehicles(db: Session = Depends(get_db)):
    """Fleet overview — all vehicles with current status."""
    vehicles = get_all_vehicles(db)
    # Refresh health scores
    for v in vehicles:
        v.health_score = compute_health_score(v.id, db)
    db.commit()
    return vehicles


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle_detail(vehicle_id: int, db: Session = Depends(get_db)):
    """Single vehicle with current health score."""
    v = get_vehicle(db, vehicle_id)
    v.health_score = compute_health_score(v.id, db)
    db.commit()
    return v
