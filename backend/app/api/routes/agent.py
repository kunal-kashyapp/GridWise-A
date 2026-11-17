from fastapi import APIRouter, HTTPException
from app.services.agent import get_agent
from app.services.validator import ActionValidator
from app.simulator.engine import latest_readings, simulator_instance, ZONES
from app.services.forecast import get_forecast
from app.services.anomaly import get_active_anomalies
from app.core.config import get_settings
from app.core.database import get_db
from datetime import datetime
import json

router = APIRouter(prefix="/api/agent", tags=["agent"])

@router.post("/recommend")
async def get_recommendation():
    """Ask the AI agent for an HVAC recommendation."""
    settings = get_settings()
    agent = get_agent(settings.OLLAMA_URL, settings.OLLAMA_MODEL)
    
    zone_states = {}
    for zone in ZONES:
        zid = zone["id"]
        reading = latest_readings.get(zid, {})
        zone_states[zid] = {"name": zone["name"], **reading}
    
    forecasts = []
    for zone in ZONES:
        zid = zone["id"]
        history = [latest_readings.get(zid, {"power_kw": zone["base_power"]})]
        f = await get_forecast(zid, datetime.now().isoformat(), history, settings.DB_PATH)
        forecasts.append(f)
    
    anomalies = get_active_anomalies()
    action = await agent.get_recommendation(zone_states, forecasts, anomalies)
    
    # Validate
    validator = ActionValidator(settings.COMFORT_TEMP_MIN, settings.COMFORT_TEMP_MAX, settings.PEAK_DEMAND_THRESHOLD)
    zone_id = action.get("zone_id")
    zone_state = latest_readings.get(zone_id, {}) if zone_id else {}
    validation = validator.validate(action, zone_state)
    
    # Store in DB
    async with get_db(settings.DB_PATH) as db:
        await db.execute(
            "INSERT INTO agent_actions (timestamp, zone_id, action_type, parameters, reasoning, validated, applied, outcome) VALUES (?,?,?,?,?,?,?,?)",
            (datetime.now().isoformat(), zone_id, action.get("action_type", ""), json.dumps(action.get("parameters", {})), action.get("reasoning", ""), 1 if validation.valid else 0, 0, "")
        )
        await db.commit()
    
    return {"action": action, "validation": {"valid": validation.valid, "reason": validation.reason, "violations": validation.violations}}

@router.get("/actions")
async def action_history(limit: int = 50):
    settings = get_settings()
    async with get_db(settings.DB_PATH) as db:
        cursor = await db.execute("SELECT * FROM agent_actions ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = await cursor.fetchall()
        columns = [d[0] for d in cursor.description]
        return [dict(zip(columns, row)) for row in rows]

@router.post("/override")
async def override_action(action_id: int, approved: bool):
    settings = get_settings()
    async with get_db(settings.DB_PATH) as db:
        await db.execute("UPDATE agent_actions SET applied = ?, outcome = ? WHERE id = ?", (1 if approved else 0, "approved" if approved else "rejected", action_id))
        await db.commit()
    return {"status": "ok", "applied": approved}
