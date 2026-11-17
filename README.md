# GridWise: Edge AI & Agentic BEMS Dashboard

> **Autonomous Building Energy Management System** with Edge AI demand forecasting, real-time anomaly detection, local Ollama LLM optimization, and deterministic safety constraint enforcement.

---

## 🎨 Design Philosophy: "Terracotta"

GridWise rejects the ubiquitous "generic dark-mode purple AI" trope in favor of a tactile, industrial, and human-centered aesthetic designed for facility operators:

- **Parchment Canvas**: `#F5F0E6` (warm beige background)
- **Cream Card Surface**: `#FFFBF4` (soft ivory elevated surfaces)
- **Dividers & Borders**: `#D4C9B5` (subtle sand borders)
- **Forest Green (Primary)**: `#2D6A2E` (actions, positive status, HVAC efficiency)
- **Walnut Brown (Secondary)**: `#7A5C2E` (power metrics, comparative baselines)
- **Espresso Ink**: `#2C1810` (high-contrast, readable text)
- **Zero Purple / Blue-purple Gradients**: Custom tailored to real-world industrial SCADA/BEMS environments.

---

## ⚡ Tech Stack

- **Frontend**: React 18 + Vite, Tailwind CSS, TanStack React Query v5, Recharts, Lucide Icons
- **Backend**: FastAPI (Python 3.11+), Uvicorn, SQLite (via `aiosqlite`)
- **Edge Analytics**:
  - **Forecasting**: Gradient Boosting Regressor (`scikit-learn`) vs Persistence Baseline
  - **Anomaly Detection**: Rolling window Z-Score (60-step window, 2.5σ threshold)
  - **Agentic Optimization**: Local **Ollama** (`llama3`) via asynchronous REST
  - **Safety Layer**: Deterministic constraint validator (ASHRAE 55 comfort bounds [20°C–26°C], occupied zone HVAC guard, peak threshold envelope)

---

## 🏛️ Campus Architecture & Zones

The prototype simulates 4 distinct university building zones:
1. **Lecture Hall**: 120 capacity, high occupancy volatility, scheduled class peaks
2. **Computer Lab**: 60 capacity, constant internal equipment load (servers/workstations)
3. **Library**: 80 capacity, strict thermal comfort requirements, quiet occupancy
4. **Common Area**: 40 capacity, fluctuating walk-through traffic and atrium solar gain

---

## 🚀 Quick Start

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & npm
- **Ollama** (optional, recommended for live AI agent recommendations):
  ```bash
  ollama run llama3
  ```

### 2. One-Click Launch (Windows)
Double-click `start.bat` or run:
```cmd
start.bat
```

### 3. Manual Startup

**Terminal 1 — Backend:**
```bash
cd backend
pip install -r requirements.txt
python run.py
```
*Backend runs at `http://localhost:8000` (Swagger UI at `/docs`)*

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at `http://localhost:5173`*

---

## 📊 Application Pages

- **`/` (Dashboard)**: Real-time aggregated power, 4 zone status cards, live WebSocket streaming, stacked energy chart (HVAC vs Base Load), peak demand headroom meter, active anomaly alerts, and one-click agent action approval banner.
- **`/zones/:id` (Zone Deep Dive)**: Per-zone temperature vs comfort bounds, interactive setpoint slider, humidity, occupancy counter, dual-axis historical trend chart, and zone anomaly log.
- **`/forecasts` (Demand Forecasts)**: Short-term power predictions, Gradient Boosting vs Persistence Baseline comparison, MAE/RMSE evaluation metrics, and prediction residual table.
- **`/agent` (Agent Console)**: Ollama reasoning chat stream, proposed candidate action with deterministic constraint validation status, simulate impact drawer, and complete audit history with override controls.
- **`/settings` (Settings)**: Configurable comfort bounds [min/max], peak demand threshold, simulation speed, and Ollama edge connectivity test.

---

## 🛡️ Alignment with Milestone 1 Capstone Report

| Capstone Requirement | GridWise Implementation |
|---|---|
| **Multi-zone academic simulation** | 4 zones with distinct occupancy schedules and thermodynamic properties (`engine.py`) |
| **Short-term demand forecasting** | GBR trained on rolling lags + outdoor temp vs Persistence Baseline (`forecast.py`) |
| **Anomaly detection** | Rolling Z-Score detector tracking unexpected load departures (`anomaly.py`) |
| **Tool-using agent orchestration** | Structured prompt with tool context routed to local Ollama (`agent.py`) |
| **Deterministic safety validator** | Rejects any action violating 20–26°C comfort bounds or turning off HVAC when occupied (`validator.py`) |
| **Operator override** | Facility manager can approve, reject, or manually adjust any action (`AgentConsole.tsx`) |
| **Edge-first / Zero cloud egress** | Everything runs 100% locally on your machine with Ollama and FastAPI |
