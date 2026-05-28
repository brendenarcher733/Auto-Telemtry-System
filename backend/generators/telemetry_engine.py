# generators/telemetry_engine.py
# Real-time telemetry simulation engine.
# Produces realistic vehicle data with physics-informed fluctuations,
# correlated sensor readings, and probabilistic anomaly injection.

import math
import random
import time
from datetime import datetime
from dataclasses import dataclass, field
from typing import Optional
from core.config import settings


@dataclass
class VehicleState:
    """Mutable internal state for one simulated vehicle."""
    vehicle_id: int
    vehicle_type: str = "sports"

    # Driving dynamics
    speed_mph: float = 0.0
    rpm: float = 800.0
    throttle_pct: float = 0.0
    gear: int = 1
    target_speed: float = 45.0    # driver "intent"

    # Thermal state (has inertia — changes slowly)
    coolant_temp_f: float = 180.0
    oil_temp_f: float = 200.0
    intake_temp_f: float = 72.0
    brake_temp_f: float = 85.0
    transmission_temp: float = 170.0

    # Electrical
    battery_voltage: float = 14.2
    alternator_output: float = 13.8
    fuel_pct: float = field(default_factory=lambda: random.uniform(40, 95))

    # Chassis
    tire_fl_psi: float = 32.0
    tire_fr_psi: float = 32.0
    tire_rl_psi: float = 32.0
    tire_rr_psi: float = 32.0

    # GPS
    latitude: float = 33.749
    longitude: float = -84.388
    altitude_ft: float = 1050.0

    # Status flags
    check_engine: bool = False
    abs_active: bool = False
    traction_active: bool = False

    # Anomaly state
    anomaly_coolant: bool = False
    anomaly_tire: Optional[str] = None     # "fl"|"fr"|"rl"|"rr"
    anomaly_voltage: bool = False
    anomaly_rpm: bool = False
    anomaly_tick: int = 0

    # Tick counter
    tick: int = 0


# Gear ratios — speed ranges per gear
GEAR_SPEED_RANGES = {1: (0, 20), 2: (15, 35), 3: (30, 55),
                     4: (45, 75), 5: (65, 95), 6: (85, 130)}

VEHICLE_TYPE_PROFILES = {
    "sports":  {"max_rpm": 8500, "max_speed": 155, "idle_rpm": 900,  "redline": 7500},
    "sedan":   {"max_rpm": 6500, "max_speed": 130, "idle_rpm": 750,  "redline": 6000},
    "suv":     {"max_rpm": 6000, "max_speed": 120, "idle_rpm": 700,  "redline": 5500},
    "truck":   {"max_rpm": 5500, "max_speed": 110, "idle_rpm": 700,  "redline": 5000},
    "ev":      {"max_rpm": 18000,"max_speed": 155, "idle_rpm": 0,    "redline": 16000},
    "formula": {"max_rpm": 18000,"max_speed": 220, "idle_rpm": 6000, "redline": 17500},
}


class TelemetryEngine:
    """
    Physics-informed telemetry simulation engine.
    Each call to step() advances simulation by one tick and returns a snapshot dict.
    """

    def __init__(self):
        self._states: dict[int, VehicleState] = {}

    def register_vehicle(self, vehicle_id: int, vehicle_type: str = "sedan",
                         initial_lat: float = 33.749, initial_lng: float = -84.388) -> None:
        state = VehicleState(
            vehicle_id=vehicle_id,
            vehicle_type=vehicle_type,
            latitude=initial_lat,
            longitude=initial_lng,
        )
        # Stagger starting conditions across fleet
        state.speed_mph = random.uniform(0, 75)
        state.fuel_pct = random.uniform(30, 95)
        state.coolant_temp_f = random.uniform(165, 210)
        self._states[vehicle_id] = state

    def _select_gear(self, speed: float) -> int:
        for gear in range(6, 0, -1):
            lo, _ = GEAR_SPEED_RANGES[gear]
            if speed >= lo:
                return gear
        return 1

    def _calc_rpm(self, state: VehicleState, profile: dict) -> float:
        if state.vehicle_type == "ev":
            return min(state.speed_mph * 120, profile["max_rpm"])
        base = profile["idle_rpm"]
        speed_component = state.speed_mph * (3500 / max(state.speed_mph + 1, 1)) * 0.3
        throttle_component = state.throttle_pct * 35
        return max(base, min(base + speed_component + throttle_component + random.gauss(0, 80), profile["max_rpm"]))

    def _advance_thermal(self, state: VehicleState) -> None:
        """Thermal systems change slowly — exponential approach to equilibrium."""
        load = state.engine_load_pct if hasattr(state, 'engine_load_pct') else 50
        target_coolant = 185 + (state.rpm / 1000) * 4 + load * 0.3
        if state.anomaly_coolant:
            target_coolant = 240 + random.uniform(0, 20)   # overheating

        state.coolant_temp_f += (target_coolant - state.coolant_temp_f) * 0.04 + random.gauss(0, 0.5)

        target_oil = state.coolant_temp_f + 20 + (state.rpm / 1000) * 2
        state.oil_temp_f += (target_oil - state.oil_temp_f) * 0.03 + random.gauss(0, 0.4)

        target_brake = 80 + state.speed_mph * 0.8 + (state.throttle_pct < 5) * 60
        state.brake_temp_f += (target_brake - state.brake_temp_f) * 0.08 + random.gauss(0, 1)

        state.intake_temp_f = 68 + (state.rpm / 1000) * 2.5 + random.gauss(0, 0.8)
        state.transmission_temp = 165 + (state.gear * 3) + (state.speed_mph * 0.2) + random.gauss(0, 0.5)

    def _advance_electrical(self, state: VehicleState) -> None:
        if state.anomaly_voltage:
            state.battery_voltage = random.uniform(11.2, 12.1)
            state.alternator_output = random.uniform(11.0, 12.5)
        else:
            state.battery_voltage = random.gauss(14.2, 0.08)
            state.alternator_output = random.gauss(13.8, 0.1)

    def _advance_tires(self, state: VehicleState) -> None:
        base = 32.0
        # Tire pressure rises slightly with heat
        heat_factor = (state.coolant_temp_f - 180) * 0.01
        noise = lambda: random.gauss(0, 0.05)

        state.tire_fl_psi = base + heat_factor + noise()
        state.tire_fr_psi = base + heat_factor + noise()
        state.tire_rl_psi = base + heat_factor + noise()
        state.tire_rr_psi = base + heat_factor + noise()

        if state.anomaly_tire:
            setattr(state, f"tire_{state.anomaly_tire}_psi", random.uniform(18, 24))

    def _maybe_inject_anomaly(self, state: VehicleState) -> None:
        p = settings.anomaly_probability
        if state.anomaly_tick > 0:
            state.anomaly_tick -= 1
            if state.anomaly_tick == 0:
                state.anomaly_coolant = False
                state.anomaly_tire = None
                state.anomaly_voltage = False
                state.anomaly_rpm = False
            return

        r = random.random()
        if r < p * 0.3:
            state.anomaly_coolant = True
            state.anomaly_tick = random.randint(10, 30)
        elif r < p * 0.5:
            state.anomaly_tire = random.choice(["fl", "fr", "rl", "rr"])
            state.anomaly_tick = random.randint(20, 60)
        elif r < p * 0.65:
            state.anomaly_voltage = True
            state.anomaly_tick = random.randint(8, 20)
        elif r < p * 0.75:
            state.anomaly_rpm = True
            state.anomaly_tick = random.randint(5, 15)

    def _update_gps(self, state: VehicleState) -> None:
        """Simulate route movement."""
        if state.speed_mph > 5:
            bearing = (state.tick * 2) % 360
            rad = math.radians(bearing)
            speed_deg = state.speed_mph * 0.000004
            state.latitude  += speed_deg * math.cos(rad)
            state.longitude += speed_deg * math.sin(rad)
        state.altitude_ft = 1050 + math.sin(state.tick * 0.05) * 120

    def step(self, vehicle_id: int) -> dict:
        state = self._states.get(vehicle_id)
        if not state:
            return {}

        profile = VEHICLE_TYPE_PROFILES.get(state.vehicle_type, VEHICLE_TYPE_PROFILES["sedan"])
        state.tick += 1

        # Driving dynamics
        accel = random.gauss(0, 5)
        state.target_speed = max(0, min(
            state.target_speed + random.gauss(0, 2),
            profile["max_speed"] * 0.85
        ))
        if state.tick % 30 == 0:   # occasional full stops / accelerations
            state.target_speed = random.choice([0, 25, 45, 65, 75])

        state.speed_mph += (state.target_speed - state.speed_mph) * 0.08 + accel * 0.1
        state.speed_mph = max(0, min(state.speed_mph, profile["max_speed"]))

        state.throttle_pct = max(0, min(100,
            (state.target_speed - state.speed_mph) * 2 + random.gauss(0, 3)
        ))
        state.gear = self._select_gear(state.speed_mph)

        rpm = self._calc_rpm(state, profile)
        if state.anomaly_rpm:
            rpm = random.uniform(profile["redline"] * 0.95, profile["max_rpm"])
        state.rpm = rpm

        engine_load = min(100, state.throttle_pct * 0.7 + (state.rpm / profile["max_rpm"]) * 40)

        # Subsystems
        self._maybe_inject_anomaly(state)
        self._advance_thermal(state)
        self._advance_electrical(state)
        self._advance_tires(state)
        self._update_gps(state)

        # Fuel consumption
        if state.vehicle_type != "ev":
            state.fuel_pct = max(0, state.fuel_pct - (engine_load * 0.00008 + 0.0001))
        else:
            state.fuel_pct = max(0, state.fuel_pct - (state.speed_mph * 0.00005))

        # Status flags
        state.abs_active = state.speed_mph > 30 and random.random() < 0.005
        state.traction_active = state.throttle_pct > 80 and random.random() < 0.01
        state.check_engine = state.anomaly_coolant or state.anomaly_voltage or state.anomaly_rpm

        g_lat = (state.throttle_pct / 100) * math.sin(math.radians(state.tick * 3)) * 0.8
        g_long = (state.speed_mph / profile["max_speed"]) * 0.3

        return {
            "vehicle_id":        vehicle_id,
            "timestamp":         datetime.utcnow().isoformat(),
            "speed_mph":         round(state.speed_mph, 1),
            "rpm":               round(state.rpm, 0),
            "throttle_pct":      round(state.throttle_pct, 1),
            "engine_load_pct":   round(engine_load, 1),
            "gear":              state.gear,
            "coolant_temp_f":    round(state.coolant_temp_f, 1),
            "oil_temp_f":        round(state.oil_temp_f, 1),
            "intake_temp_f":     round(state.intake_temp_f, 1),
            "brake_temp_f":      round(state.brake_temp_f, 1),
            "transmission_temp": round(state.transmission_temp, 1),
            "battery_voltage":   round(state.battery_voltage, 2),
            "alternator_output": round(state.alternator_output, 2),
            "fuel_pct":          round(state.fuel_pct, 1),
            "tire_fl_psi":       round(state.tire_fl_psi, 1),
            "tire_fr_psi":       round(state.tire_fr_psi, 1),
            "tire_rl_psi":       round(state.tire_rl_psi, 1),
            "tire_rr_psi":       round(state.tire_rr_psi, 1),
            "g_force_lat":       round(g_lat, 3),
            "g_force_long":      round(g_long, 3),
            "latitude":          round(state.latitude, 6),
            "longitude":         round(state.longitude, 6),
            "altitude_ft":       round(state.altitude_ft, 1),
            "check_engine":      state.check_engine,
            "abs_active":        state.abs_active,
            "traction_active":   state.traction_active,
        }


# Singleton engine instance shared across the app
telemetry_engine = TelemetryEngine()
