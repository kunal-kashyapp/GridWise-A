"""Async SQLite database helpers using aiosqlite."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

import aiosqlite

from app.core.config import get_settings

_CREATE_TABLES = """
CREATE TABLE IF NOT EXISTS sensor_readings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    zone_id     TEXT    NOT NULL,
    timestamp   TEXT    NOT NULL,
    temperature REAL,
    humidity    REAL,
    occupancy   INTEGER,
    hvac_status TEXT,
    power_kw    REAL
);

CREATE TABLE IF NOT EXISTS forecasts (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    zone_id          TEXT    NOT NULL,
    timestamp        TEXT    NOT NULL,
    horizon_minutes  INTEGER,
    predicted_kw     REAL,
    actual_kw        REAL,
    mae              REAL
);

CREATE TABLE IF NOT EXISTS anomalies (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    zone_id   TEXT    NOT NULL,
    timestamp TEXT    NOT NULL,
    metric    TEXT,
    value     REAL,
    threshold REAL,
    severity  TEXT
);

CREATE TABLE IF NOT EXISTS agent_actions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp   TEXT    NOT NULL,
    zone_id     TEXT    NOT NULL,
    action_type TEXT,
    parameters  TEXT,
    reasoning   TEXT,
    validated   INTEGER DEFAULT 0,
    applied     INTEGER DEFAULT 0,
    outcome     TEXT
);
"""


async def init_db(db_path: Optional[str] = None) -> None:
    """Create all tables if they do not exist."""
    path = db_path or get_settings().DB_PATH
    async with aiosqlite.connect(path) as db:
        await db.executescript(_CREATE_TABLES)
        await db.commit()


@asynccontextmanager
async def get_db(db_path: Optional[str] = None) -> AsyncGenerator[aiosqlite.Connection, None]:
    """Yield an aiosqlite connection; close it on exit."""
    path = db_path or get_settings().DB_PATH
    db = await aiosqlite.connect(path)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()
