from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.ride import Ride
from backend.app.schemas.ride import (
    RideRequestCreate,
    RideRequestResponse,
    RideAcceptRequest,
    RideCancelRequest,
    RideStatusResponse,
    RideListItem,
)
from backend.app.services.ride_service import ride_service

router = APIRouter(prefix="/rides", tags=["Rides"])

@router.post("", response_model=RideRequestResponse, status_code=status.HTTP_201_CREATED)
async def request_ride(req: RideRequestCreate, db: Session = Depends(get_db)):
    """
    3.1 A: Request a new ride.
    Calculates estimated fare, validates input, assigns a unique ride ID,
    persists record to DB, publishes RideRequested domain event.
    """
    result = await ride_service.create_ride(db, req)
    return result

@router.get("", response_model=List[RideListItem], status_code=status.HTTP_200_OK)
def list_rides(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter rides by status"),
    user_id: Optional[str] = Query(None, alias="userId", description="Filter rides by user"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    List rides with optional status and user filtering.
    """
    query = db.query(Ride)
    if status_filter:
        query = query.filter(Ride.status == status_filter)
    if user_id:
        query = query.filter(Ride.user_id == user_id)

    rides = query.order_by(Ride.created_at.desc()).limit(limit).all()

    return [
        RideListItem(
            rideId=r.id,
            userId=r.user_id,
            userName=r.user.name if r.user else None,
            driverId=r.driver_id,
            driverName=r.driver.name if r.driver else None,
            pickupAddress=r.pickup_address,
            destinationAddress=r.destination_address,
            status=r.status,
            estimatedFare=r.estimated_fare,
            finalFare=r.final_fare,
            createdAt=r.created_at.isoformat() if r.created_at else ""
        )
        for r in rides
    ]

@router.get("/{rideId}/status", response_model=RideStatusResponse, status_code=status.HTTP_200_OK)
def get_ride_status(rideId: str, db: Session = Depends(get_db)):
    """
    3.1 D: Get detailed ride status, driver location, pickup/destination, and fares.
    Utilizes Redis/memory cache with automatic fallback.
    """
    return ride_service.get_ride_status(db, rideId)

@router.post("/{rideId}/accept", status_code=status.HTTP_200_OK)
async def accept_ride(rideId: str, req: RideAcceptRequest, db: Session = Depends(get_db)):
    """
    3.1 C: Driver accepts an open ride request.
    Verifies ride is in REQUESTED state and driver is AVAILABLE.
    Atomically updates both states. Returns HTTP 409 Conflict if already taken.
    """
    return await ride_service.accept_ride(db, rideId, req)

@router.post("/{rideId}/start", status_code=status.HTTP_200_OK)
async def start_ride(rideId: str, db: Session = Depends(get_db)):
    """
    3.1 F: Driver starts the ride (ACCEPTED -> IN_PROGRESS).
    Returns HTTP 409 Conflict if not in ACCEPTED state.
    """
    return await ride_service.start_ride(db, rideId)

@router.post("/{rideId}/complete", status_code=status.HTTP_200_OK)
async def complete_ride(rideId: str, db: Session = Depends(get_db)):
    """
    3.1 F: Driver completes the ride (IN_PROGRESS -> COMPLETED).
    Releases driver to AVAILABLE, sets final fare.
    Returns HTTP 409 Conflict if not in IN_PROGRESS state.
    """
    return await ride_service.complete_ride(db, rideId)

@router.patch("/{rideId}/cancel", status_code=status.HTTP_200_OK)
async def cancel_ride(rideId: str, req: RideCancelRequest, db: Session = Depends(get_db)):
    """
    3.1 E: Cancel a ride.
    Only permitted for REQUESTED or ACCEPTED rides. Releases assigned driver.
    Returns HTTP 409 Conflict for invalid state transitions.
    """
    return await ride_service.cancel_ride(db, rideId, req)
