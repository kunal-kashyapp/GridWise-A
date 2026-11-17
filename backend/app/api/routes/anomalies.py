from fastapi import APIRouter
from app.services.anomaly import get_active_anomalies
from app.core.database import get_db
from app.core.config import get_settings

router = APIRouter(prefix="/api/anomalies", tags=["anomalies"])

@router.get("/active")
async def active_anomalies():
    return get_active_anomalies()

@router.get("/history")
async def anomaly_history(zone_id: str = None, limit: int = 100):
    settings = get_settings()
    async with get_db(settings.DB_PATH) as db:
        if zone_id:
            cursor = await db.execute("SELECT * FROM anomalies WHERE zone_id = ? ORDER BY timestamp DESC LIMIT ?", (zone_id, limit))
        else:
            cursor = await db.execute("SELECT * FROM anomalies ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = await cursor.fetchall()
        columns = [d[0] for d in cursor.description]
        return [dict(zip(columns, row)) for row in rows]
