# AutoTelemetry Pro — Automotive Vehicle Intelligence Platform

Enterprise-grade vehicle telemetry monitoring platform. Simulates real-world automotive systems used by Formula 1 teams, EV manufacturers, and fleet operators.

---

## Architecture

```
telemetry/
├── backend/
│   ├── core/           # Config, database engine
│   ├── generators/     # Physics-informed telemetry simulation
│   ├── models/         # SQLAlchemy ORM + Pydantic schemas
│   ├── routers/        # FastAPI route handlers + WebSocket
│   ├── services/       # Business logic: diagnostics, AI, vehicles
│   └── main.py         # Application entry point
│
└── frontend/
    └── src/
        ├── components/
        │   ├── charts/      # Recharts telemetry visualizations
        │   ├── diagnostics/ # Alert panel
        │   ├── fleet/       # Vehicle cards
        │   ├── gauges/      # Arc gauges, metric cards, tire display
        │   └── layout/      # Sidebar, header
        ├── hooks/           # useTelemetry (WebSocket), useFleet
        ├── pages/           # Fleet, VehicleDashboard, Alerts, AI, Login
        └── services/        # Axios API client
```

---

## Quick Start

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

→ API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

→ App: http://localhost:5173 (login with any credentials)

---

## Features

| Feature | Description |
|---------|-------------|
| **Live Telemetry** | WebSocket-streamed vehicle data at 2s intervals, falls back to polling |
| **Physics Engine** | Correlated sensor simulation with realistic thermal inertia |
| **Anomaly Injection** | Probabilistic fault injection (overtemp, tire deflation, voltage drop) |
| **Diagnostics** | Threshold-based alert engine with severity levels |
| **AI Analysis** | Domain-expert diagnostic reports with health scoring |
| **Fleet Dashboard** | Multi-vehicle overview with health scores and active alerts |
| **Arc Gauges** | SVG-based speed, RPM, throttle, fuel gauges |
| **Real-time Charts** | Recharts time-series for thermal, electrical, dynamics |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/health` | System health check |
| GET  | `/api/vehicles/` | Fleet list |
| GET  | `/api/vehicles/{id}` | Single vehicle |
| GET  | `/api/telemetry/{id}` | Latest snapshot |
| GET  | `/api/telemetry/{id}/history` | Historical records |
| WS   | `/api/telemetry/ws/{id}` | Live telemetry stream |
| GET  | `/api/alerts/` | Active alerts (fleet or per vehicle) |
| PUT  | `/api/alerts/{id}/resolve` | Resolve alert |
| POST | `/api/diagnostics/analyze` | Run AI diagnostic analysis |

---

## Enabling Real AI

```bash
# backend/.env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

The `generate_chat_response()` function in `services/ai_service.py` automatically routes to OpenAI when configured.

---

## Deployment

### Backend (Railway / Render / Fly.io)
```bash
# Set env vars on your platform
DATABASE_URL=postgresql://...
ENVIRONMENT=production
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Frontend (Vercel / Netlify)
```bash
cd frontend && npm run build
# Deploy dist/ — set VITE_API_URL to backend URL
```

---

Built to demonstrate: real-time systems, telemetry pipelines, WebSocket architecture, FastAPI backend design, physics simulation, AI integration, and enterprise dashboard engineering.
