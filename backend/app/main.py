import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.database import engine, Base, SessionLocal
from backend.app.events.event_broker import event_broker, DomainEvent
from backend.app.services.notification_service import notification_service
from backend.app.services.websocket_manager import websocket_manager
from backend.app.seed import seed_database
from backend.app.models.user import User

from backend.app.api.rides import router as rides_router
from backend.app.api.drivers import router as drivers_router
from backend.app.api.pricing import router as pricing_router
from backend.app.api.payments import router as payments_router
from backend.app.api.health import router as health_router
from backend.app.api.users import router as users_router
from backend.app.api.analytics import router as analytics_router
from backend.app.api.admin import router as admin_router
from backend.app.api.ws import router as ws_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")

# Wire EventBroker to NotificationService & WebSocket broadcasts
async def domain_event_forwarder(event: DomainEvent):
    # 1. Store notification
    notification_service.handle_event(event)
    # 2. Broadcast to connected WebSocket clients for real-time live UI updates
    await websocket_manager.broadcast({
        "type": "DOMAIN_EVENT",
        "eventType": event.event_type,
        "payload": event.payload,
        "timestamp": event.timestamp
    })

event_broker.subscribe("*", domain_event_forwarder)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist and seed initial demo data if empty
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            logger.info("Initializing database with demo seed records...")
            seed_database(db)
            logger.info("Demo seeding complete.")
        else:
            logger.info("Database already populated (%d users found).", user_count)
    finally:
        db.close()
    yield
    # Shutdown logic if any

app = FastAPI(
    title="Ride-Sharing & Driver Dispatch Platform API",
    description="Full-stack enterprise ride-sharing platform demonstrating Round 2 (LLD) and Round 3 (HLD) architectures.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins_str = os.getenv("CORS_ORIGINS", "*")
origins = [o.strip() for o in origins_str.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins_str != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info("HTTP %s %s", request.method, request.url.path)
    response = await call_next(request)
    return response

# Mount routers under /api and /ws
app.include_router(rides_router, prefix="/api")
app.include_router(drivers_router, prefix="/api")
app.include_router(pricing_router, prefix="/api")
app.include_router(payments_router, prefix="/api")
app.include_router(health_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(ws_router)

@app.get("/", tags=["Root"])
def root_info():
    return {
        "service": "Ride-Sharing & Driver Dispatch Platform API",
        "docs": "/docs",
        "health": "/api/health",
        "version": "1.0.0"
    }
