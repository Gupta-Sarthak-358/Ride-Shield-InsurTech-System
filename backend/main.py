"""
RideShield - Main FastAPI Application
Entry point for the backend server.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.claims import router as claims_router
from backend.api.events import router as events_router
from backend.api.health import router as health_router
from backend.api.policies import router as policies_router
from backend.api.payouts import router as payouts_router
from backend.api.triggers import router as triggers_router
from backend.api.workers import router as workers_router
from backend.config import settings
from backend.database import close_db, init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    display_host = "localhost" if settings.HOST == "0.0.0.0" else settings.HOST

    print(f"{settings.APP_NAME} v{settings.APP_VERSION} starting...")
    print(f"Simulation mode: {settings.SIMULATION_MODE}")
    print(f"Available cities: {', '.join(settings.CITY_RISK_PROFILES.keys())}")
    print(f"Available plans: {', '.join(settings.PLAN_DEFINITIONS.keys())}")
    print(
        "Trigger thresholds: "
        f"rain={settings.RAIN_THRESHOLD_MM}, "
        f"heat={settings.HEAT_THRESHOLD_C}, "
        f"aqi={settings.AQI_THRESHOLD}, "
        f"traffic={settings.TRAFFIC_THRESHOLD}, "
        f"platform={settings.PLATFORM_OUTAGE_THRESHOLD}"
    )

    if settings.DEBUG:
        await init_db()
        print("Database tables initialized")

    print(f"Server ready at http://{display_host}:{settings.PORT}")

    yield

    await close_db()
    print("RideShield shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Parametric AI Insurance for Gig Delivery Workers. "
        "Zero-touch claims, multi-signal fraud detection, "
        "and instant income protection."
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(workers_router)
app.include_router(policies_router)
app.include_router(triggers_router)
app.include_router(events_router)
app.include_router(claims_router)
app.include_router(payouts_router)


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": "Parametric AI Insurance for Gig Delivery Workers",
        "docs": "/docs",
        "health": "/health",
        "demo_flow": {
            "step_1": "POST /api/workers/register",
            "step_2": "POST /api/policies/create",
            "step_3": "POST /api/triggers/scenario/heavy_rain",
            "step_4": "POST /api/triggers/check",
            "step_5": "GET /api/claims/worker/{id}",
            "step_6": "GET /api/payouts/worker/{id}",
        },
        "endpoints": {
            "workers": "/api/workers",
            "policies": "/api/policies",
            "triggers": "/api/triggers",
            "events": "/api/events",
            "claims": "/api/claims",
            "payouts": "/api/payouts",
        },
    }
