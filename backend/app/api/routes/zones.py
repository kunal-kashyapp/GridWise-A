from fastapi import APIRouter
from app.simulator.engine import latest_readings, simulator_instance, ZONES
from app.core.config import get_settings

router = APIRouter(prefix="/api/zones", tags=["zones"])

@router.get("/")
async def list_zones():
    """List all zones with current state."""
    result = []
    for zone in ZONES:
        zid = zone["id"]
        reading = latest_readings.get(zid, {})
        settings = get_settings()
        comfort_ok = True
        temp = reading.get("temperature", 0)
        if temp < settings.COMFORT_TEMP_MIN or temp > settings.COMFORT_TEMP_MAX:
            comfort_ok = False
        result.append({
            "id": zid,
            "name": zone["name"],
            "temperature": round(reading.get("temperature", 0), 1),
            "humidity": round(reading.get("humidity", 0), 1),
            "occupancy": reading.get("occupancy", 0),
            "hvac_status": reading.get("hvac_status", "unknown"),
            "power_kw": round(reading.get("power_kw", 0), 1),
            "comfort_ok": comfort_ok,
            "setpoint": reading.get("setpoint", zone.get("base_temp", 22)),
        })
    return result

@router.get("/{zone_id}")
async def get_zone(zone_id: str):
    """Get single zone detail."""
    reading = latest_readings.get(zone_id, {})
    zone_config = next((z for z in ZONES if z["id"] == zone_id), None)
    if not zone_config:
        from fastapi import HTTPException
        raise HTTPException(404, f"Zone {zone_id} not found")
    settings = get_settings()
    temp = reading.get("temperature", 0)
    return {
        "id": zone_id,
        "name": zone_config["name"],
        "max_occupancy": zone_config["max_occupancy"],
        "base_power": zone_config["base_power"],
        **reading,
        "comfort_ok": settings.COMFORT_TEMP_MIN <= temp <= settings.COMFORT_TEMP_MAX,
    }
