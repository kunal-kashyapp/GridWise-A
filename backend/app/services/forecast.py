import numpy as np
from datetime import datetime, timedelta
from typing import Optional
import aiosqlite

class PersistenceBaseline:
    """Naive forecast: predict last known value."""
    def predict(self, last_value: float) -> dict:
        return {"predicted_kw": last_value, "confidence_low": last_value * 0.85, "confidence_high": last_value * 1.15, "model": "persistence"}

class GradientBoostingForecaster:
    """Feature-engineered gradient boosting forecaster."""
    def __init__(self):
        self.model = None
        self.is_trained = False
    
    def _extract_features(self, timestamp: str, readings_history: list[dict]) -> np.ndarray:
        """Extract: hour_of_day, day_of_week, is_weekend, lag_1h (mean power 1h ago), lag_24h, outdoor_temp_approx."""
        dt = datetime.fromisoformat(timestamp)
        hour = dt.hour + dt.minute / 60
        dow = dt.weekday()
        is_weekend = 1 if dow >= 5 else 0
        # Calculate lags from history
        lag_1h = np.mean([r["power_kw"] for r in readings_history[-720:]]) if len(readings_history) >= 720 else (readings_history[-1]["power_kw"] if readings_history else 50.0)
        lag_24h = np.mean([r["power_kw"] for r in readings_history[:12]]) if len(readings_history) >= 17280 else lag_1h
        outdoor = 20 + 7 * np.sin(2 * np.pi * (hour - 6) / 24)  # approx
        return np.array([[hour, dow, is_weekend, lag_1h, lag_24h, outdoor]])
    
    async def train(self, db_path: str, zone_id: str):
        """Train on historical sensor_readings if enough data exists (>100 rows)."""
        from sklearn.ensemble import GradientBoostingRegressor
        async with aiosqlite.connect(db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("SELECT timestamp, power_kw FROM sensor_readings WHERE zone_id = ? ORDER BY timestamp", (zone_id,))
            rows = await cursor.fetchall()
        if len(rows) < 100:
            return False
        X, y = [], []
        for i, row in enumerate(rows):
            dt = datetime.fromisoformat(row["timestamp"])
            hour = dt.hour + dt.minute / 60
            dow = dt.weekday()
            is_weekend = 1 if dow >= 5 else 0
            lag = rows[max(0, i-720)]["power_kw"]
            outdoor = 20 + 7 * np.sin(2 * np.pi * (hour - 6) / 24)
            X.append([hour, dow, is_weekend, lag, lag, outdoor])
            y.append(row["power_kw"])
        self.model = GradientBoostingRegressor(n_estimators=50, max_depth=4, random_state=42)
        self.model.fit(np.array(X), np.array(y))
        self.is_trained = True
        return True
    
    def predict(self, timestamp: str, readings_history: list[dict]) -> dict:
        if not self.is_trained or self.model is None:
            return PersistenceBaseline().predict(readings_history[-1]["power_kw"] if readings_history else 50.0)
        features = self._extract_features(timestamp, readings_history)
        pred = self.model.predict(features)[0]
        return {"predicted_kw": round(pred, 2), "confidence_low": round(pred * 0.88, 2), "confidence_high": round(pred * 1.12, 2), "model": "gradient_boosting"}

# Module-level instances per zone
forecasters: dict[str, GradientBoostingForecaster] = {}
baseline = PersistenceBaseline()

async def get_forecast(zone_id: str, timestamp: str, readings_history: list[dict], db_path: str) -> dict:
    if zone_id not in forecasters:
        forecasters[zone_id] = GradientBoostingForecaster()
    forecaster = forecasters[zone_id]
    if not forecaster.is_trained and len(readings_history) >= 100:
        await forecaster.train(db_path, zone_id)
    result = forecaster.predict(timestamp, readings_history)
    result["zone_id"] = zone_id
    result["timestamp"] = timestamp
    return result
