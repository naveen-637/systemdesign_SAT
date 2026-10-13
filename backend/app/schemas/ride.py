from typing import Optional
from pydantic import BaseModel, Field

class LocationSchema(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitude coordinate")
    lng: float = Field(..., ge=-180.0, le=180.0, description="Longitude coordinate")
    address: str = Field(..., min_length=1, max_length=256, description="Human readable address")

class RideRequestCreate(BaseModel):
    userId: str = Field(..., min_length=1, description="Identifier of requesting user")
    pickup: LocationSchema = Field(..., description="Pickup location details")
    destination: LocationSchema = Field(..., description="Destination location details")

class RideRequestResponse(BaseModel):
    rideId: str
    userId: str
    status: str
    message: str

class RideAcceptRequest(BaseModel):
    driverId: str = Field(..., min_length=1, description="Identifier of the driver accepting the ride")

class RideCancelRequest(BaseModel):
    reason: str = Field(..., min_length=1, max_length=256, description="Reason for cancellation")

class AssignedDriverInfo(BaseModel):
    driverId: str
    name: str
    vehicleNumber: str
    vehicleType: str
    rating: float
    currentLocation: Optional[dict] = None

class RideStatusResponse(BaseModel):
    rideId: str
    status: str
    userId: str
    pickup: dict
    destination: dict
    assignedDriver: Optional[AssignedDriverInfo] = None
    estimatedFare: float
    finalFare: Optional[float] = None
    cancellationReason: Optional[str] = None
    currentDriverLocation: Optional[dict] = None
    createdAt: str
    updatedAt: str

class RideListItem(BaseModel):
    rideId: str
    userId: str
    userName: Optional[str] = None
    driverId: Optional[str] = None
    driverName: Optional[str] = None
    pickupAddress: str
    destinationAddress: str
    status: str
    estimatedFare: float
    finalFare: Optional[float] = None
    createdAt: str
