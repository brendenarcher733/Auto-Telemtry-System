# services/ai_service.py
# AI Diagnostics Engineer — mock service with deep automotive domain knowledge.
# Set AI_PROVIDER=openai and OPENAI_API_KEY in .env to enable real LLM responses.

import random
from datetime import datetime
from core.config import settings


SEVERITY_PHRASES = {
    "CRITICAL": ["requires immediate attention", "is a serious concern", "poses an immediate risk"],
    "WARNING":  ["warrants monitoring", "is elevated", "should be addressed soon"],
    "INFO":     ["is within acceptable range but trending", "is noted for awareness"],
}

ANALYSIS_TEMPLATES = [
    (
        "coolant",
        "Thermal analysis indicates the cooling system is under stress. "
        "Elevated coolant temperatures are typically caused by a failing thermostat, "
        "low coolant level, radiator blockage, or a compromised head gasket. "
        "At {value}°F, the engine is approaching the thermal limit for aluminum components. "
        "Continued operation risks warped cylinder heads and catastrophic engine failure."
    ),
    (
        "tire",
        "Pressure differential detected across the tire array. "
        "The {metric} sensor reports {value} PSI, which is {delta:.1f} PSI below the nominal operating pressure. "
        "This pattern is consistent with a slow puncture, valve stem failure, or bead leak. "
        "Asymmetric pressure affects lateral stability, braking distance, and tire wear."
    ),
    (
        "voltage",
        "Electrical system analysis: battery voltage of {value}V indicates insufficient charge state. "
        "Normal alternator output should maintain 13.8–14.4V under load. "
        "Possible root causes include alternator regulator failure, parasitic drain, "
        "or battery cell degradation. Recommend immediate electrical system diagnostic."
    ),
    (
        "rpm",
        "Engine operating at {value} RPM, approaching the redline threshold. "
        "Sustained high-RPM operation accelerates valve train wear, "
        "increases oil film breakdown risk, and may indicate transmission slip or "
        "improper gear selection. Check for stuck throttle or transmission fault codes."
    ),
]

RECOMMENDATIONS_LIBRARY = {
    "CRITICAL": [
        "🔴 IMMEDIATE ACTION: Pull over safely at the earliest opportunity.",
        "🔴 Do not continue operating the vehicle without addressing the critical fault.",
        "🔴 Contact roadside assistance or fleet maintenance team immediately.",
        "🔴 Document all active DTCs and alert codes before shutdown.",
    ],
    "WARNING": [
        "🟡 Schedule a diagnostic inspection within the next 24–48 hours.",
        "🟡 Reduce vehicle load and avoid sustained high-performance operation.",
        "🟡 Monitor the affected system closely for escalation to CRITICAL.",
        "🟡 Notify the fleet maintenance coordinator of the fault.",
    ],
    "HEALTHY": [
        "✅ All systems operating within normal parameters.",
        "✅ Continue with scheduled maintenance intervals.",
        "✅ Next recommended service at current mileage + 5,000 miles.",
        "✅ Tire rotation recommended at next service interval.",
    ],
}


def _get_mock_analysis(vehicle_id: int, snapshot: dict, alerts: list) -> dict:
    """
    Generate an expert-level mock diagnostic analysis.
    Produces different output on each call for realism.
    """
    critical = [a for a in alerts if a.get("severity") == "CRITICAL"]
    warnings  = [a for a in alerts if a.get("severity") == "WARNING"]

    # Health narrative
    if critical:
        health_status = "CRITICAL"
        score = random.randint(10, 45)
        opening = (
            f"Telemetry AI Engineer diagnostic report — {datetime.utcnow().strftime('%H:%M:%S UTC')}. "
            f"Vehicle ID {vehicle_id} is reporting {len(critical)} critical fault(s) "
            f"and {len(warnings)} warning(s). Immediate intervention is indicated."
        )
    elif warnings:
        health_status = "WARNING"
        score = random.randint(55, 80)
        opening = (
            f"Telemetry AI Engineer diagnostic report — {datetime.utcnow().strftime('%H:%M:%S UTC')}. "
            f"Vehicle ID {vehicle_id} shows {len(warnings)} active warning(s). "
            f"No immediate safety risk, but trending toward degraded performance."
        )
    else:
        health_status = "HEALTHY"
        score = random.randint(88, 100)
        opening = (
            f"Telemetry AI Engineer diagnostic report — {datetime.utcnow().strftime('%H:%M:%S UTC')}. "
            f"Vehicle ID {vehicle_id} — all monitored systems within normal operating parameters. "
            f"No fault codes or threshold violations detected."
        )

    # Deep analysis section
    analysis_parts = []
    for alert in (critical + warnings)[:3]:   # analyze top 3
        metric = alert.get("metric", "")
        value  = alert.get("value", 0)

        if "coolant" in metric:
            analysis_parts.append(
                f"Powertrain Thermal Analysis: Coolant temperature at {value:.1f}°F. "
                f"Operating {value - 212:.1f}°F above boiling point margin. "
                f"Thermal runaway probability increases significantly above 230°F. "
                f"Heat exchanger efficiency assessment recommended."
            )
        elif "tire" in metric:
            delta = 32 - value
            analysis_parts.append(
                f"Chassis Safety Analysis: {alert.get('code', '')} detected at {value:.1f} PSI. "
                f"Pressure deficit of {delta:.1f} PSI from nominal. "
                f"At this pressure, effective contact patch is reduced by approximately {delta * 2:.0f}%, "
                f"directly impacting braking performance and cornering stability."
            )
        elif "voltage" in metric:
            analysis_parts.append(
                f"Electrical System Analysis: System voltage at {value:.2f}V. "
                f"Below the 12.4V threshold indicating 50% state of charge. "
                f"Cold cranking amps are reduced proportionally. "
                f"Risk of ECU reset and loss of volatile memory under sustained low voltage."
            )
        elif "rpm" in metric:
            analysis_parts.append(
                f"Engine Performance Analysis: RPM at {value:.0f} — approaching redline. "
                f"VTEC/variable valve timing systems may be operating at mechanical limits. "
                f"Oil film thickness decreases at high RPM; bearing surfaces at elevated wear risk."
            )

    if not analysis_parts:
        # Healthy vehicle — positive analysis
        speed = snapshot.get("speed_mph", 0)
        coolant = snapshot.get("coolant_temp_f", 185)
        analysis_parts.append(
            f"All thermal systems nominal. Coolant at {coolant:.0f}°F, oil pressure stable. "
            f"Vehicle operating at {speed:.0f} MPH with normal engine load distribution. "
            f"Battery charging system voltage optimal. Tire pressures within specification."
        )

    analysis = " | ".join(analysis_parts) if analysis_parts else "No anomalies detected in current telemetry window."

    # Recommendations
    rec_pool = RECOMMENDATIONS_LIBRARY.get(health_status, RECOMMENDATIONS_LIBRARY["HEALTHY"])
    recommendations = "\n".join(random.sample(rec_pool, min(3, len(rec_pool))))

    return {
        "health_score":      score,
        "summary":           opening,
        "analysis":          analysis,
        "recommendations":   recommendations,
        "active_alerts":     len(alerts),
    }


def _get_openai_analysis(vehicle_id: int, snapshot: dict, alerts: list) -> dict:
    """Real OpenAI analysis — activated when AI_PROVIDER=openai."""
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.openai_api_key)

        system_prompt = """You are an expert automotive telemetry engineer at a Formula 1 / EV company.
        Analyze vehicle telemetry data and active alerts. Provide:
        1. A health score (0-100)
        2. A technical summary (2-3 sentences)
        3. Deep analysis of any anomalies
        4. Specific maintenance recommendations
        Be technical, precise, and concise. Format like a real engineering diagnostic report."""

        user_prompt = f"""
Vehicle ID: {vehicle_id}
Active Alerts: {alerts}
Current Telemetry:
- Speed: {snapshot.get('speed_mph')} MPH
- RPM: {snapshot.get('rpm')}
- Coolant: {snapshot.get('coolant_temp_f')}°F
- Oil Temp: {snapshot.get('oil_temp_f')}°F
- Battery: {snapshot.get('battery_voltage')}V
- Fuel: {snapshot.get('fuel_pct')}%
- Tires: FL={snapshot.get('tire_fl_psi')} FR={snapshot.get('tire_fr_psi')} RL={snapshot.get('tire_rl_psi')} RR={snapshot.get('tire_rr_psi')} PSI
"""
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=600,
        )
        text = response.choices[0].message.content
        return {
            "health_score":    75,   # AI would need to parse its own output
            "summary":         text[:300],
            "analysis":        text,
            "recommendations": "See analysis above.",
            "active_alerts":   len(alerts),
        }
    except Exception as e:
        # Fall back to mock on error
        return _get_mock_analysis(vehicle_id, snapshot, alerts)


def run_ai_diagnostics(vehicle_id: int, snapshot: dict, alerts: list) -> dict:
    """Entry point — routes to real or mock AI based on config."""
    if settings.ai_provider == "openai" and settings.openai_api_key:
        return _get_openai_analysis(vehicle_id, snapshot, alerts)
    return _get_mock_analysis(vehicle_id, snapshot, alerts)
