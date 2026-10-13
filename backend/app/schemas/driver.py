from typing import Optional
from pydantic import BaseModel, Field

class DriverLocationUpdate(BaseModel):
    driverId: str = Field(..., min_length=1, description="Driver unique identifier")
    lat: float = Field(..., ge=-90.0, le=90.0, description="Current latitude")
    lng: float = Field(..., ge=-180.0, le=180.0, description="Current longitude")
    availabilityStatus: Optional[str] = Field(None, description="Optional availability status: AVAILABLE, BUSY, OFFLINE")

class NearbyDriverResponse(BaseModel):
    driverId: str
    name: str
    vehicleNumber: str
    vehicleType: str
    rating: float
    distanceKm: float
    location: dict
    availabilityStatus: str

class DriverDetail(BaseModel):
    id: str
    name: str
    vehicleNumber: str
    vehicleType: str
    rating: float
    latitude: float
    longitude: float
    availabilityStatus: str
    updatedAt: str
