from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.driver import Driver
from backend.app.schemas.driver import (
    NearbyDriverResponse,
    DriverLocationUpdate,
    DriverDetail,
)
from backend.app.services.location_service import location_service

router = APIRouter(prefix="/drivers", tags=["Drivers"])

@router.get("/nearby", response_model=List[NearbyDriverResponse], status_code=status.HTTP_200_OK)
def get_nearby_drivers(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Center latitude"),
    lng: float = Query(..., ge=-180.0, le=180.0, description="Center longitude"),
    radius_km: float = Query(5.0, gt=0, le=50.0, description="Search radius in kilometers"),
    db: Session = Depends(get_db)
):
    """
    3.1 B: Get nearby available drivers within radius_km, sorted by distance.
    Uses geographical Haversine formula and checks cache.
    """
    drivers = location_service.find_nearby_drivers(db, lat=lat, lng=lng, radius_km=radius_km)
    return drivers

@router.put("/location", status_code=status.HTTP_200_OK)
def update_driver_location(req: DriverLocationUpdate, db: Session = Depends(get_db)):
    """
    3.1 F: Driver updates GPS location coordinates and optional status.
    Invalidates nearby driver cache and records new telemetry.
    """
    driver = location_service.update_driver_location(
        db,
        driver_id=req.driverId,
        lat=req.lat,
        lng=req.lng,
        availability_status=req.availabilityStatus
    )
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Driver '{req.driverId}' not found"
        )

    return {
        "driverId": driver.id,
        "name": driver.name,
        "location": {"lat": driver.latitude, "lng": driver.longitude},
        "availabilityStatus": driver.availability_status,
        "message": "Driver location updated successfully"
    }

@router.get("", response_model=List[DriverDetail], status_code=status.HTTP_200_OK)
def list_drivers(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    """
    List all fleet drivers for dispatch monitoring.
    """
    query = db.query(Driver)
    if status_filter:
        query = query.filter(Driver.availability_status == status_filter)

    drivers = query.all()
    return [
        DriverDetail(
            id=d.id,
            name=d.name,
            vehicleNumber=d.vehicle_number,
            vehicleType=d.vehicle_type,
            rating=d.rating,
            latitude=d.latitude,
            longitude=d.longitude,
            availabilityStatus=d.availability_status,
            updatedAt=d.updated_at.isoformat() if d.updated_at else ""
        )
        for d in drivers
    ]
