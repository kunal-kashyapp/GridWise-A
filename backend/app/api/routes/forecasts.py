from fastapi import APIRouter
from app.simulator.engine import latest_readings, ZONES
from app.services.forecast import get_forecast
from app.core.config import get_settings
from app.core.database import get_db
from datetime import datetime

router = APIRouter(prefix="/api/forecasts", tags=["forecasts"])

@router.get("/latest")
async def latest_forecasts():
    """Get latest forecast for each zone."""
    settings = get_settings()
    results = []
    for zone in ZONES:
        zid = zone["id"]
        reading = latest_readings.get(zid, {})
        history = [latest_readings.get(zid, {"power_kw": zone["base_power"]})]
        forecast = await get_forecast(zid, datetime.now().isoformat(), history, settings.DB_PATH)
        results.append(forecast)
    return results

@router.get("/history")
async def forecast_history(zone_id: str = None, limit: int = 100):
    settings = get_settings()
    async with get_db(settings.DB_PATH) as db:
        if zone_id:
            cursor = await db.execute("SELECT * FROM forecasts WHERE zone_id = ? ORDER BY timestamp DESC LIMIT ?", (zone_id, limit))
        else:
            cursor = await db.execute("SELECT * FROM forecasts ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = await cursor.fetchall()
        columns = [d[0] for d in cursor.description]
        return [dict(zip(columns, row)) for row in rows]
