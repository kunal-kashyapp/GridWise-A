from fastapi import APIRouter
from app.api.routes.energy import router as energy_router
from app.api.routes.zones import router as zones_router
from app.api.routes.forecasts import router as forecasts_router
from app.api.routes.anomalies import router as anomalies_router
from app.api.routes.agent import router as agent_router
from app.api.routes.ws import router as ws_router

router = APIRouter()

router.include_router(energy_router)
router.include_router(zones_router)
router.include_router(forecasts_router)
router.include_router(anomalies_router)
router.include_router(agent_router)
router.include_router(ws_router)

__all__ = ["router", "energy_router", "zones_router", "forecasts_router", "anomalies_router", "agent_router", "ws_router"]
