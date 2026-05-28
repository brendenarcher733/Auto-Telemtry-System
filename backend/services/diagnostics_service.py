# services/diagnostics_service.py
# Diagnostic engine: evaluates telemetry snapshots against thresholds,
# generates alerts, computes health scores, and triggers AI analysis.

from datetime import datetime
from sqlalchemy.orm import Session
from models.alert import Alert, AlertResponse, DiagnosticsReport, DiagnosticsResponse
from models.vehicle import Vehicle
import random

# ── Threshold definitions ─────────────────────────────────────────────────────

THRESHOLDS = {
    "coolant_temp_f":    {"warning": 220,   "critical": 235,  "unit": "°F", "label": "Coolant Temperature"},
    "oil_temp_f":        {"warning": 245,   "critical": 265,  "unit": "°F", "label": "Oil Temperature"},
    "brake_temp_f":      {"warning": 300,   "critical": 400,  "unit": "°F", "label": "Brake Temperature"},
    "battery_voltage":   {"warning": 12.2,  "critical": 11.8, "unit": "V",  "label": "Battery Voltage", "low": True},
    "tire_fl_psi":       {"warning": 26.0,  "critical": 22.0, "unit": "PSI","label": "Tire FL Pressure","low": True},
    "tire_fr_psi":       {"warning": 26.0,  "critical": 22.0, "unit": "PSI","label": "Tire FR Pressure","low": True},
    "tire_rl_psi":       {"warning": 26.0,  "critical": 22.0, "unit": "PSI","label": "Tire RL Pressure","low": True},
    "tire_rr_psi":       {"warning": 26.0,  "critical": 22.0, "unit": "PSI","label": "Tire RR Pressure","low": True},
    "fuel_pct":          {"warning": 15.0,  "critical": 8.0,  "unit": "%",  "label": "Fuel Level",     "low": True},
    "rpm":               {"warning": 6500,  "critical": 7200, "unit": "RPM","label": "Engine RPM"},
    "transmission_temp": {"warning": 220,   "critical": 250,  "unit": "°F", "label": "Transmission Temp"},
}

ALERT_CODES = {
    "coolant_temp_f":    ("OVERTEMP_COOLANT", "Engine coolant temperature elevated"),
    "oil_temp_f":        ("OVERTEMP_OIL",     "Oil temperature above normal range"),
    "brake_temp_f":      ("OVERTEMP_BRAKE",   "Brake system overheating detected"),
    "battery_voltage":   ("LOW_VOLTAGE",      "Battery voltage below safe threshold"),
    "tire_fl_psi":       ("LOW_TIRE_PRESSURE_FL", "Front-left tire pressure critically low"),
    "tire_fr_psi":       ("LOW_TIRE_PRESSURE_FR", "Front-right tire pressure critically low"),
    "tire_rl_psi":       ("LOW_TIRE_PRESSURE_RL", "Rear-left tire pressure critically low"),
    "tire_rr_psi":       ("LOW_TIRE_PRESSURE_RR", "Rear-right tire pressure critically low"),
    "fuel_pct":          ("LOW_FUEL",         "Fuel level requires attention"),
    "rpm":               ("RPM_SPIKE",        "Engine RPM approaching redline"),
    "transmission_temp": ("OVERTEMP_TRANS",   "Transmission operating above safe temperature"),
}


def evaluate_telemetry(vehicle_id: int, snapshot: dict, db: Session) -> list[Alert]:
    """
    Evaluate a telemetry snapshot against all defined thresholds.
    Creates Alert records for any violations found.
    Returns list of new alerts created.
    """
    new_alerts = []

    for metric, thresholds in THRESHOLDS.items():
        value = snapshot.get(metric)
        if value is None:
            continue

        is_low_alert = thresholds.get("low", False)

        # Determine severity
        severity = None
        if is_low_alert:
            if value <= thresholds["critical"]:
                severity = "CRITICAL"
            elif value <= thresholds["warning"]:
                severity = "WARNING"
        else:
            if value >= thresholds["critical"]:
                severity = "CRITICAL"
            elif value >= thresholds["warning"]:
                severity = "WARNING"

        if not severity:
            continue

        # Avoid duplicate active alerts for the same metric
        existing = db.query(Alert).filter(
            Alert.vehicle_id == vehicle_id,
            Alert.metric == metric,
            Alert.resolved == False,
        ).first()
        if existing:
            continue

        code, title = ALERT_CODES.get(metric, ("UNKNOWN", "Unknown alert"))
        threshold_val = thresholds[severity.lower()]

        alert = Alert(
            vehicle_id=vehicle_id,
            severity=severity,
            code=code,
            title=title,
            description=_build_description(metric, value, threshold_val, severity, thresholds),
            metric=metric,
            value=value,
            threshold=threshold_val,
        )
        db.add(alert)
        new_alerts.append(alert)

    if new_alerts:
        db.commit()

    return new_alerts


def _build_description(metric: str, value: float, threshold: float,
                        severity: str, thresholds: dict) -> str:
    label = thresholds.get("label", metric)
    unit  = thresholds.get("unit", "")
    is_low = thresholds.get("low", False)
    direction = "below" if is_low else "above"
    action = {
        "coolant_temp_f":    "Reduce speed and monitor. Check coolant level and radiator.",
        "oil_temp_f":        "Check oil level. Allow engine to cool before continuing.",
        "brake_temp_f":      "Allow brakes to cool. Avoid aggressive braking.",
        "battery_voltage":   "Check alternator and battery connections immediately.",
        "tire_fl_psi":       "Inspect front-left tire for puncture or valve damage.",
        "tire_fr_psi":       "Inspect front-right tire for puncture or valve damage.",
        "tire_rl_psi":       "Inspect rear-left tire for puncture or valve damage.",
        "tire_rr_psi":       "Inspect rear-right tire for puncture or valve damage.",
        "fuel_pct":          "Refuel at the nearest available station.",
        "rpm":               "Reduce throttle input. Check for transmission issues.",
        "transmission_temp": "Reduce load. Check transmission fluid level.",
    }.get(metric, "Inspect vehicle and consult maintenance team.")

    return (
        f"{label} is {direction} safe operating threshold: "
        f"current {value:.1f}{unit}, threshold {threshold:.1f}{unit}. "
        f"[{severity}] {action}"
    )


def compute_health_score(vehicle_id: int, db: Session) -> int:
    """
    Compute a 0–100 vehicle health score from active alerts.
    CRITICAL alerts heavily penalize the score.
    """
    alerts = db.query(Alert).filter(
        Alert.vehicle_id == vehicle_id,
        Alert.resolved == False,
    ).all()

    score = 100
    for alert in alerts:
        if alert.severity == "CRITICAL":
            score -= 20
        elif alert.severity == "WARNING":
            score -= 8
        elif alert.severity == "INFO":
            score -= 2

    return max(0, min(100, score))


def get_active_alerts(db: Session, vehicle_id: int = None, limit: int = 100) -> list:
    q = db.query(Alert).filter(Alert.resolved == False)
    if vehicle_id:
        q = q.filter(Alert.vehicle_id == vehicle_id)
    return q.order_by(Alert.created_at.desc()).limit(limit).all()


def resolve_alert(alert_id: int, db: Session) -> bool:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return False
    alert.resolved = True
    alert.resolved_at = datetime.utcnow()
    db.commit()
    return True
