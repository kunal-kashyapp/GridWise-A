"""
GridWise Building Energy Management System — Multi-Zone Building Simulator.

Simulates realistic energy consumption, temperature dynamics, occupancy
patterns, and HVAC behaviour across multiple building zones.
"""

import asyncio
import math
import random
from datetime import datetime, timedelta

import aiosqlite
import numpy as np

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SIMULATION_INTERVAL: float = 5.0  # seconds per simulation step

ZONES: list[dict] = [
    {"id": "lecture_hall", "name": "Lecture Hall", "base_power": 85, "max_occupancy": 120, "base_temp": 22.0},
    {"id": "computer_lab", "name": "Computer Lab", "base_power": 110, "max_occupancy": 60, "base_temp": 21.5},
    {"id": "library", "name": "Library", "base_power": 55, "max_occupancy": 80, "base_temp": 23.0},
    {"id": "common_area", "name": "Common Area", "base_power": 45, "max_occupancy": 40, "base_temp": 22.5},
]

# ---------------------------------------------------------------------------
# Module-level state (accessible by API routes)
# ---------------------------------------------------------------------------

simulator_instance: "BuildingSimulator | None" = None
latest_readings: dict = {}


# ---------------------------------------------------------------------------
# Simulator
# ---------------------------------------------------------------------------

class BuildingSimulator:
    """Realistic multi-zone building energy simulator."""

    def __init__(self) -> None:
        self.simulation_time: datetime = datetime.now()
        self.zone_states: dict[str, dict] = {}

        for zone in ZONES:
            self.zone_states[zone["id"]] = {
                "temperature": zone["base_temp"],
                "humidity": random.uniform(40.0, 55.0),
                "occupancy": 0,
                "hvac_status": "idle",
                "power_kw": zone["base_power"],
                "setpoint": zone["base_temp"],
            }

    # ----- helpers --------------------------------------------------------

    def _get_outdoor_temp(self) -> float:
        """Sinusoidal day/night outdoor temperature.

        Mean 20 °C, amplitude 5 °C.  Peak at 14:00 (2 pm).
        """
        hour = self.simulation_time.hour + self.simulation_time.minute / 60.0
        # sin peaks at π/2 → shift so peak is at hour 14
        # sin(2π*(hour - 8)/24) peaks when hour=14 (since 14-8=6 → 6/24*2π=π/2)
        temp = 20.0 + 5.0 * math.sin(2.0 * math.pi * (hour - 8.0) / 24.0)
        return temp

    def _get_occupancy(self, zone_config: dict, hour: float) -> int:
        """Occupancy based on time-of-day / day-of-week schedule + noise."""
        max_occ = zone_config["max_occupancy"]

        # Base occupancy fraction for a weekday
        if hour < 7.0:
            frac = 0.02
        elif hour < 8.0:
            # ramp up 7-8
            frac = 0.02 + 0.18 * (hour - 7.0)
        elif hour < 9.0:
            # ramp up 8-9
            frac = 0.20 + 0.50 * (hour - 8.0)
        elif hour < 10.0:
            # approach peak
            frac = 0.70 + 0.20 * (hour - 9.0)
        elif hour < 15.0:
            # peak period 10-15
            frac = 0.90
        elif hour < 17.0:
            # taper 15-17
            frac = 0.90 - 0.40 * (hour - 15.0) / 2.0
        elif hour < 18.0:
            frac = 0.50 - 0.35 * (hour - 17.0)
        else:
            frac = 0.03

        # Weekend scaling
        weekday = self.simulation_time.weekday()
        if weekday >= 5:  # Saturday / Sunday
            frac *= 0.10

        # Expected count
        expected = frac * max_occ

        # Poisson noise (avoid λ = 0)
        noisy = int(np.random.poisson(max(expected, 0.5)))

        return int(np.clip(noisy, 0, max_occ))

    @staticmethod
    def _compute_power(
        zone_config: dict,
        occupancy: int,
        hvac_status: str,
        temp_delta: float,
    ) -> float:
        """Compute instantaneous power draw (kW) for a zone."""
        base = zone_config["base_power"]

        # Equipment / lighting per occupant
        occupancy_component = 0.5 * occupancy

        # HVAC component — only when actively cooling or heating
        if hvac_status in ("cooling", "heating"):
            hvac_component = 3.5 * abs(temp_delta)
        else:
            hvac_component = 0.0

        return round(base + occupancy_component + hvac_component, 2)

    def _update_temperature(
        self,
        zone_state: dict,
        outdoor_temp: float,
        occupancy: int,
    ) -> float:
        """Update zone temperature for one simulation step."""
        current = zone_state["temperature"]
        setpoint = zone_state["setpoint"]
        hvac = zone_state["hvac_status"]

        # Drift toward outdoor temperature
        drift = 0.02 * (outdoor_temp - current)

        # Occupant heat gain
        body_heat = 0.01 * occupancy

        # HVAC effect
        if hvac == "cooling":
            hvac_effect = -0.15 if current > setpoint else 0.0
        elif hvac == "heating":
            hvac_effect = 0.15 if current < setpoint else 0.0
        else:
            hvac_effect = 0.0

        # Gaussian noise
        noise = random.gauss(0.0, 0.1)

        new_temp = current + drift + body_heat + hvac_effect + noise
        return round(new_temp, 2)

    # ----- main step ------------------------------------------------------

    def step(self) -> list[dict]:
        """Advance the simulation by one interval and return sensor readings."""
        self.simulation_time += timedelta(seconds=SIMULATION_INTERVAL)
        hour = self.simulation_time.hour + self.simulation_time.minute / 60.0
        outdoor_temp = self._get_outdoor_temp()

        readings: list[dict] = []

        for zone_cfg in ZONES:
            zid = zone_cfg["id"]
            state = self.zone_states[zid]

            # 1. Occupancy
            occupancy = self._get_occupancy(zone_cfg, hour)
            state["occupancy"] = occupancy

            # 2. Temperature
            new_temp = self._update_temperature(state, outdoor_temp, occupancy)
            state["temperature"] = new_temp

            # 3. HVAC auto-control
            setpoint = state["setpoint"]
            if new_temp > setpoint + 1.0:
                state["hvac_status"] = "cooling"
            elif new_temp < setpoint - 1.0:
                state["hvac_status"] = "heating"
            else:
                state["hvac_status"] = "idle"

            # 4. Power
            temp_delta = new_temp - setpoint
            power = self._compute_power(zone_cfg, occupancy, state["hvac_status"], temp_delta)
            state["power_kw"] = power

            # 5. Humidity — loosely correlated with occupancy & temperature
            base_humidity = 45.0
            humidity = base_humidity + 0.1 * occupancy + 0.5 * (new_temp - 22.0) + random.gauss(0, 1.5)
            state["humidity"] = round(np.clip(humidity, 20.0, 85.0), 1)

            readings.append({
                "zone_id": zid,
                "timestamp": self.simulation_time.isoformat(),
                "temperature": state["temperature"],
                "humidity": state["humidity"],
                "occupancy": state["occupancy"],
                "hvac_status": state["hvac_status"],
                "power_kw": state["power_kw"],
            })

        return readings

    def get_zone_states(self) -> dict:
        """Return a snapshot of every zone's current state."""
        return {zid: dict(state) for zid, state in self.zone_states.items()}


# ---------------------------------------------------------------------------
# Async simulation loop
# ---------------------------------------------------------------------------

async def run_simulation_loop(db_path: str, interval: float) -> None:
    """Run the building simulator forever, persisting readings to SQLite."""
    global simulator_instance, latest_readings

    sim = BuildingSimulator()
    simulator_instance = sim

    while True:
        readings = sim.step()

        # Persist to database
        async with aiosqlite.connect(db_path) as db:
            for r in readings:
                await db.execute(
                    """
                    INSERT INTO sensor_readings
                        (zone_id, timestamp, temperature, humidity,
                         occupancy, hvac_status, power_kw)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        r["zone_id"],
                        r["timestamp"],
                        r["temperature"],
                        r["humidity"],
                        r["occupancy"],
                        r["hvac_status"],
                        r["power_kw"],
                    ),
                )
            await db.commit()

        # Update fast-access cache
        for r in readings:
            latest_readings[r["zone_id"]] = r

        await asyncio.sleep(interval)
