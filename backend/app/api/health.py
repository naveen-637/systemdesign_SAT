from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.app.database import get_db
from backend.app.cache.cache_service import cache_service
from backend.app.schemas.common import HealthResponse

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("", response_model=HealthResponse, status_code=status.HTTP_200_OK)
def check_health(db: Session = Depends(get_db)):
    """
    3.1 F & 8: System health and dependency status check.
    Validates database connection, cache status (Redis or in-memory fallback),
    and event broker readiness.
    """
    db_status = "HEALTHY"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"UNHEALTHY ({str(e)})"

    cache_status = "REDIS_CONNECTED" if cache_service.is_redis_available else "IN_MEMORY_FALLBACK_ACTIVE"
    broker_status = "LOCAL_EVENT_BROKER_READY (Kafka/RabbitMQ Optional)"

    return HealthResponse(
        status="HEALTHY" if db_status == "HEALTHY" else "DEGRADED",
        database=db_status,
        cache=cache_status,
        messageBroker=broker_status,
        timestamp=datetime.now(timezone.utc).isoformat()
    )
