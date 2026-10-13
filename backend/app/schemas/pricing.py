from pydantic import BaseModel, Field
from backend.app.schemas.ride import LocationSchema

class PricingEstimateRequest(BaseModel):
    pickup: LocationSchema = Field(..., description="Pickup location")
    destination: LocationSchema = Field(..., description="Destination location")

class PricingEstimateResponse(BaseModel):
    estimatedFare: float
    distanceKm: float
    durationMinutes: int
    baseFare: float
    perKmRate: float
    surgeMultiplier: float
