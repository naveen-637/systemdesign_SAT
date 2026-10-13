from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.notification import Notification
from backend.app.schemas.common import DashboardStatsResponse, NotificationResponse
from backend.app.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=DashboardStatsResponse, status_code=status.HTTP_200_OK)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """
    Get aggregated dashboard operational metrics:
    active rides, driver fleet status, revenue, status distributions.
    """
    return analytics_service.get_dashboard_stats(db)

@router.get("/notifications", response_model=List[NotificationResponse], status_code=status.HTTP_200_OK)
def list_notifications(
    user_id: Optional[str] = Query(None, alias="userId"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Fetch system and user notifications.
    """
    query = db.query(Notification)
    if user_id:
        query = query.filter(Notification.user_id == user_id)
    notifs = query.order_by(Notification.created_at.desc()).limit(limit).all()

    return [
        NotificationResponse(
            id=n.id,
            userId=n.user_id,
            rideId=n.ride_id,
            message=n.message,
            readStatus=n.read_status,
            createdAt=n.created_at.isoformat() if n.created_at else ""
        )
        for n in notifs
    ]
