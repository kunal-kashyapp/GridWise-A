"""GridWise BEMS — FastAPI application entry point."""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import init_db


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Startup / shutdown lifecycle handler."""
    # ── Startup ──────────────────────────────────────────────
    await init_db()

    # Start the building simulator as a background task
    simulator_task = None
    try:
        from app.simulator import run_simulation_loop

        simulator_task = asyncio.create_task(run_simulation_loop())
    except (ImportError, AttributeError):
        pass  # Simulator not built yet — that's fine

    yield

    # ── Shutdown ─────────────────────────────────────────────
    if simulator_task is not None:
        simulator_task.cancel()
        try:
            await simulator_task
        except asyncio.CancelledError:
            pass


app = FastAPI(title="GridWise BEMS API")

# CORS — allow the React / Vite dev servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers (graceful when routes aren't built yet)
try:
    from app.api.routes import router as api_router

    app.include_router(api_router)
except (ImportError, AttributeError):
    pass
