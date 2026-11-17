from fastapi import APIRouter
from app.simulator.engine import latest_readings, ZONES
from app.core.database import get_db
from app.core.config import get_settings

router = APIRouter(prefix="/api/energy", tags=["energy"])

@router.get("/summary")
async def energy_summary():
    """Total power, avg temp, baseline comparison, alert count."""
    readings = latest_readings
    if not readings:
        return {"total_power_kw": 0, "avg_temperature": 0, "baseline_diff_pct": 0, "active_alerts": 0}
    total = sum(r.get("power_kw", 0) for r in readings.values())
    avg_temp = sum(r.get("temperature", 0) for r in readings.values()) / max(len(readings), 1)
    # Baseline is sum of base_power for all zones
    baseline = sum(z["base_power"] for z in ZONES)
    diff_pct = round(((total - baseline) / baseline) * 100, 1) if baseline > 0 else 0
    from app.services.anomaly import get_active_anomalies
    alerts = len(get_active_anomalies())
    return {"total_power_kw": round(total, 1), "avg_temperature": round(avg_temp, 1), "baseline_diff_pct": diff_pct, "active_alerts": alerts}

@router.get("/history")
async def energy_history(zone_id: str = None, hours: int = 1):
    """Return historical readings from DB."""
    settings = get_settings()
    from datetime import datetime, timedelta
    cutoff = (datetime.now() - timedelta(hours=hours)).isoformat()
    async with get_db(settings.DB_PATH) as db:
        if zone_id:
            cursor = await db.execute("SELECT * FROM sensor_readings WHERE zone_id = ? AND timestamp > ? ORDER BY timestamp", (zone_id, cutoff))
        else:
            cursor = await db.execute("SELECT * FROM sensor_readings WHERE timestamp > ? ORDER BY timestamp", (cutoff,))
        rows = await cursor.fetchall()
        columns = [d[0] for d in cursor.description]
        return [dict(zip(columns, row)) for row in rows]
