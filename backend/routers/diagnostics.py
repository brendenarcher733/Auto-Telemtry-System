# routers/diagnostics.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from models.alert import DiagnosticsRequest, DiagnosticsResponse
from generators.telemetry_engine import telemetry_engine
from services.vehicle_service import get_vehicle, ensure_engine_registered
from services.diagnostics_service import get_active_alerts
from services.ai_service import run_ai_diagnostics
from models.alert import DiagnosticsReport
from datetime import datetime

router = APIRouter(prefix="/api/diagnostics", tags=["Diagnostics"])


@router.post("/analyze", response_model=DiagnosticsResponse)
def analyze_vehicle(request: DiagnosticsRequest, db: Session = Depends(get_db)):
    """
    Run AI diagnostic analysis on a vehicle.
    Returns health score, summary, deep analysis, and recommendations.
    """
    get_vehicle(db, request.vehicle_id)
    ensure_engine_registered(db)

    # Get current snapshot
    snapshot = telemetry_engine.step(request.vehicle_id)

    # Get active alerts as dicts
    alerts = [
        {"severity": a.severity, "code": a.code, "metric": a.metric,
         "value": a.value, "title": a.title}
        for a in get_active_alerts(db, vehicle_id=request.vehicle_id)
    ]

    # Run AI analysis
    result = run_ai_diagnostics(request.vehicle_id, snapshot or {}, alerts)

    # Persist the report
    report = DiagnosticsReport(
        vehicle_id=request.vehicle_id,
        health_score=result["health_score"],
        summary=result["summary"],
        analysis=result["analysis"],
        recommendations=result["recommendations"],
    )
    db.add(report)
    db.commit()

    return DiagnosticsResponse(
        vehicle_id=request.vehicle_id,
        health_score=result["health_score"],
        summary=result["summary"],
        analysis=result["analysis"],
        recommendations=result["recommendations"],
        active_alerts=result["active_alerts"],
        created_at=datetime.utcnow(),
    )
