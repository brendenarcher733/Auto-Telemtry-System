# routers/alerts.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from core.database import get_db
from models.alert import AlertResponse
from services.diagnostics_service import get_active_alerts, resolve_alert

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("/", response_model=list[AlertResponse])
def list_alerts(
    vehicle_id: int = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Active alerts — fleet-wide or filtered by vehicle."""
    return get_active_alerts(db, vehicle_id=vehicle_id, limit=limit)


@router.put("/{alert_id}/resolve", response_model=dict)
def mark_alert_resolved(alert_id: int, db: Session = Depends(get_db)):
    """Resolve an active alert."""
    success = resolve_alert(alert_id, db)
    return {"success": success, "alert_id": alert_id}
