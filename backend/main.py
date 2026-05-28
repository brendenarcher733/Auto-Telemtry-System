# main.py — Automotive Telemetry Platform — FastAPI Application

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.database import init_db
from routers import vehicles, telemetry, alerts, diagnostics
from services.vehicle_service import seed_demo_vehicles
from core.database import SessionLocal


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database and seed demo fleet
    init_db()
    db = SessionLocal()
    try:
        seed_demo_vehicles(db)
        print(f"✅ {settings.app_name} v{settings.version} started")
        print(f"   Environment : {settings.environment}")
        print(f"   AI Provider : {settings.ai_provider}")
        print(f"   API Docs    : http://localhost:8000/docs")
    finally:
        db.close()
    yield


app = FastAPI(
    title="Automotive Telemetry Platform",
    description="Enterprise vehicle telemetry monitoring, diagnostics, and AI analysis",
    version=settings.version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vehicles.router)
app.include_router(telemetry.router)
app.include_router(alerts.router)
app.include_router(diagnostics.router)


@app.get("/health", tags=["System"])
def health():
    return {
        "status": "operational",
        "app": settings.app_name,
        "version": settings.version,
        "environment": settings.environment,
        "ai_provider": settings.ai_provider,
    }
