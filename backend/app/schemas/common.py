from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str
    database: str
    cache: str
    messageBroker: str
    timestamp: str

class DashboardStatsResponse(BaseModel):
    totalRides: int
    activeRides: int
    availableDrivers: int
    completedRides: int
    cancelledRides: int
    totalRevenue: float
    statusDistribution: Dict[str, int]
    recentRides: List[Dict[str, Any]]
    recentActivity: List[Dict[str, Any]]

class NotificationResponse(BaseModel):
    id: str
    userId: Optional[str] = None
    rideId: Optional[str] = None
    message: str
    readStatus: bool
    createdAt: str
