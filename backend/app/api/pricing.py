from fastapi import APIRouter, status
from backend.app.schemas.pricing import PricingEstimateRequest, PricingEstimateResponse
from backend.app.services.pricing_service import pricing_service

router = APIRouter(prefix="/pricing", tags=["Pricing"])

@router.post("/estimate", response_model=PricingEstimateResponse, status_code=status.HTTP_200_OK)
def estimate_fare(req: PricingEstimateRequest):
    """
    3.1 F: Calculate estimated fare, distance, and duration given pickup and destination coordinates.
    """
    result = pricing_service.estimate_fare(
        pickup_lat=req.pickup.lat,
        pickup_lng=req.pickup.lng,
        dest_lat=req.destination.lat,
        dest_lng=req.destination.lng
    )
    return result
