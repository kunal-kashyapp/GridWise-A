import numpy as np
from collections import defaultdict
from datetime import datetime

class RollingZScoreDetector:
    """Detects anomalies using rolling z-score (window=60 readings)."""
    def __init__(self, window: int = 60, threshold: float = 2.5):
        self.window = window
        self.threshold = threshold
        self.history: dict[str, list[float]] = defaultdict(list)  # zone_id -> list of power_kw values
    
    def add_reading(self, zone_id: str, power_kw: float) -> dict | None:
        """Add reading and return anomaly dict if detected, else None."""
        self.history[zone_id].append(power_kw)
        if len(self.history[zone_id]) > self.window * 2:
            self.history[zone_id] = self.history[zone_id][-self.window * 2:]
        
        if len(self.history[zone_id]) < self.window:
            return None
        
        window_data = self.history[zone_id][-self.window:]
        mean = np.mean(window_data)
        std = np.std(window_data)
        
        if std < 0.01:  # avoid division by near-zero
            return None
        
        z_score = abs(power_kw - mean) / std
        
        if z_score > self.threshold:
            severity = "critical" if z_score > 4.0 else "warning" if z_score > 3.0 else "info"
            return {
                "zone_id": zone_id,
                "timestamp": datetime.now().isoformat(),
                "metric": "power_kw",
                "value": round(power_kw, 2),
                "threshold": round(mean + self.threshold * std, 2),
                "z_score": round(z_score, 2),
                "severity": severity,
                "message": f"Power consumption {power_kw:.1f} kW is {z_score:.1f}σ from rolling mean ({mean:.1f} kW)"
            }
        return None

# Module-level detector
detector = RollingZScoreDetector()
active_anomalies: list[dict] = []  # Recent active anomalies (kept last 50)

def check_anomaly(zone_id: str, power_kw: float) -> dict | None:
    result = detector.add_reading(zone_id, power_kw)
    if result:
        active_anomalies.append(result)
        if len(active_anomalies) > 50:
            active_anomalies.pop(0)
    return result

def get_active_anomalies() -> list[dict]:
    return list(active_anomalies)

def clear_anomalies():
    active_anomalies.clear()
