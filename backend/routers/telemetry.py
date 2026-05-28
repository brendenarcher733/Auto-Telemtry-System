# routers/telemetry.py
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from core.database import get_db
from generators.telemetry_engine import telemetry_engine
from services.vehicle_service import get_vehicle, ensure_engine_registered
from services.diagnostics_service import evaluate_telemetry
from models.telemetry import TelemetryRecord, TelemetrySnapshot
import asyncio
import json
import time

router = APIRouter(prefix="/api/telemetry", tags=["Telemetry"])


@router.get("/{vehicle_id}")
def get_latest_telemetry(vehicle_id: int, db: Session = Depends(get_db)):
    """Get the latest telemetry snapshot for a vehicle."""
    get_vehicle(db, vehicle_id)
    ensure_engine_registered(db)
    snapshot = telemetry_engine.step(vehicle_id)
    if snapshot:
        evaluate_telemetry(vehicle_id, snapshot, db)
    return snapshot


@router.get("/{vehicle_id}/history")
def get_telemetry_history(vehicle_id: int, limit: int = 60, db: Session = Depends(get_db)):
    """Historical telemetry records (last N readings)."""
    get_vehicle(db, vehicle_id)
    records = (
        db.query(TelemetryRecord)
        .filter(TelemetryRecord.vehicle_id == vehicle_id)
        .order_by(TelemetryRecord.timestamp.desc())
        .limit(limit)
        .all()
    )
    return list(reversed(records))


@router.websocket("/ws/{vehicle_id}")
async def telemetry_websocket(websocket: WebSocket, vehicle_id: int, db: Session = Depends(get_db)):
    """
    WebSocket endpoint — streams real-time telemetry at ~2s intervals.
    Each tick evaluates diagnostics and sends updated snapshot + alerts.
    """
    await websocket.accept()
    ensure_engine_registered(db)
    try:
        while True:
            snapshot = telemetry_engine.step(vehicle_id)
            if snapshot:
                # Run diagnostics and save to DB
                record = TelemetryRecord(vehicle_id=vehicle_id, **{
                    k: v for k, v in snapshot.items()
                    if k not in ("vehicle_id", "timestamp")
                })
                db.add(record)
                new_alerts = evaluate_telemetry(vehicle_id, snapshot, db)
                db.commit()

                await websocket.send_text(json.dumps({
                    "type": "telemetry",
                    "data": snapshot,
                    "new_alerts": len(new_alerts),
                }))
            await asyncio.sleep(2.0)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.close()
