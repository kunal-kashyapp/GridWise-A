from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.simulator.engine import latest_readings
from app.services.anomaly import get_active_anomalies
import asyncio
import json

router = APIRouter(tags=["websocket"])

class ConnectionManager:
    def __init__(self):
        self.connections: list[WebSocket] = []
    
    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.connections.append(ws)
    
    def disconnect(self, ws: WebSocket):
        self.connections.remove(ws)
    
    async def broadcast(self, data: dict):
        dead = []
        for ws in self.connections:
            try:
                await ws.send_text(json.dumps(data))
            except:
                dead.append(ws)
        for ws in dead:
            self.connections.remove(ws)

manager = ConnectionManager()

@router.websocket("/ws/live")
async def live_feed(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = {
                "zones": {zid: reading for zid, reading in latest_readings.items()},
                "anomalies": get_active_anomalies()[-5:],
                "total_power_kw": round(sum(r.get("power_kw", 0) for r in latest_readings.values()), 1),
            }
            await websocket.send_text(json.dumps(data, default=str))
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
