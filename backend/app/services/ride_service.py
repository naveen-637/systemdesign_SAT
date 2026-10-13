import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.app.models.ride import Ride
from backend.app.models.driver import Driver
from backend.app.models.user import User
from backend.app.services.pricing_service import pricing_service
from backend.app.cache.cache_service import cache_service
from backend.app.events.event_broker import event_broker
from backend.app.schemas.ride import RideRequestCreate, RideAcceptRequest, RideCancelRequest

logger = logging.getLogger("ride_service")

class RideService:
    @staticmethod
    def _generate_ride_id(db: Session) -> str:
        count = db.query(Ride).count()
        return f"R{501 + count}"

    async def create_ride(self, db: Session, req: RideRequestCreate) -> Dict[str, Any]:
        # Validate user
        user = db.query(User).filter(User.id == req.userId).first()
        if not user:
            # Auto-register demo user or validate
            user = User(
                id=req.userId,
                name=f"User {req.userId}",
                email=f"{req.userId.lower()}@rideshare.demo",
                created_at=datetime.now(timezone.utc)
            )
            db.add(user)
            db.flush()

        # Calculate estimated fare
        fare_data = pricing_service.estimate_fare(
            pickup_lat=req.pickup.lat,
            pickup_lng=req.pickup.lng,
            dest_lat=req.destination.lat,
            dest_lng=req.destination.lng
        )

        ride_id = self._generate_ride_id(db)

        ride = Ride(
            id=ride_id,
            user_id=req.userId,
            driver_id=None,
            pickup_latitude=req.pickup.lat,
            pickup_longitude=req.pickup.lng,
            pickup_address=req.pickup.address,
            destination_latitude=req.destination.lat,
            destination_longitude=req.destination.lng,
            destination_address=req.destination.address,
            status="REQUESTED",
            estimated_fare=fare_data["estimatedFare"],
            final_fare=None,
            cancellation_reason=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(ride)
        db.commit()
        db.refresh(ride)

        # Publish domain event
        await event_broker.publish("RideRequested", {
            "rideId": ride.id,
            "userId": ride.user_id,
            "pickup": {"lat": ride.pickup_latitude, "lng": ride.pickup_longitude, "address": ride.pickup_address},
            "destination": {"lat": ride.destination_latitude, "lng": ride.destination_longitude, "address": ride.destination_address},
            "estimatedFare": ride.estimated_fare,
            "status": ride.status
        })

        return {
            "rideId": ride.id,
            "userId": ride.user_id,
            "status": ride.status,
            "message": "Ride requested successfully",
            "estimatedFare": ride.estimated_fare
        }

    async def accept_ride(self, db: Session, ride_id: str, req: RideAcceptRequest) -> Dict[str, Any]:
        ride = db.query(Ride).filter(Ride.id == ride_id).first()
        if not ride:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ride '{ride_id}' not found")

        driver = db.query(Driver).filter(Driver.id == req.driverId).first()
        if not driver:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Driver '{req.driverId}' not found")

        # Atomic state check
        if ride.status != "REQUESTED":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ride '{ride_id}' is no longer available for acceptance (current status: {ride.status})"
            )

        if driver.availability_status != "AVAILABLE":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Driver '{req.driverId}' is currently {driver.availability_status} and cannot accept a new ride"
            )

        # Atomically assign driver and update statuses
        ride.driver_id = driver.id
        ride.status = "ACCEPTED"
        ride.updated_at = datetime.now(timezone.utc)

        driver.availability_status = "BUSY"
        driver.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(ride)
        db.refresh(driver)

        # Cache invalidations
        cache_service.invalidate_ride_cache(ride_id)
        cache_service.invalidate_driver_cache()

        # Publish event
        await event_broker.publish("DriverAssigned", {
            "rideId": ride.id,
            "userId": ride.user_id,
            "driverId": driver.id,
            "driverName": driver.name,
            "vehicleNumber": driver.vehicle_number,
            "vehicleType": driver.vehicle_type,
            "rating": driver.rating,
            "status": ride.status
        })

        return {
            "rideId": ride.id,
            "status": ride.status,
            "driverId": driver.id,
            "message": f"Ride accepted by driver {driver.name}"
        }

    async def start_ride(self, db: Session, ride_id: str) -> Dict[str, Any]:
        ride = db.query(Ride).filter(Ride.id == ride_id).first()
        if not ride:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ride '{ride_id}' not found")

        if ride.status != "ACCEPTED":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot start ride in status '{ride.status}'. Only ACCEPTED rides can be started."
            )

        ride.status = "IN_PROGRESS"
        ride.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(ride)

        cache_service.invalidate_ride_cache(ride_id)

        await event_broker.publish("RideStarted", {
            "rideId": ride.id,
            "userId": ride.user_id,
            "driverId": ride.driver_id,
            "status": ride.status
        })

        return {
            "rideId": ride.id,
            "status": ride.status,
            "message": "Ride started successfully. Trip is now IN_PROGRESS."
        }

    async def complete_ride(self, db: Session, ride_id: str) -> Dict[str, Any]:
        ride = db.query(Ride).filter(Ride.id == ride_id).first()
        if not ride:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ride '{ride_id}' not found")

        if ride.status != "IN_PROGRESS":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot complete ride in status '{ride.status}'. Only IN_PROGRESS rides can be completed."
            )

        ride.status = "COMPLETED"
        ride.final_fare = ride.estimated_fare  # Standard final fare equals estimated fare in baseline
        ride.updated_at = datetime.now(timezone.utc)

        # Release driver back to available
        if ride.driver_id:
            driver = db.query(Driver).filter(Driver.id == ride.driver_id).first()
            if driver:
                driver.availability_status = "AVAILABLE"
                driver.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(ride)

        cache_service.invalidate_ride_cache(ride_id)
        cache_service.invalidate_driver_cache()

        await event_broker.publish("RideCompleted", {
            "rideId": ride.id,
            "userId": ride.user_id,
            "driverId": ride.driver_id,
            "finalFare": ride.final_fare,
            "status": ride.status
        })

        return {
            "rideId": ride.id,
            "status": ride.status,
            "finalFare": ride.final_fare,
            "message": "Ride completed successfully"
        }

    async def cancel_ride(self, db: Session, ride_id: str, req: RideCancelRequest) -> Dict[str, Any]:
        ride = db.query(Ride).filter(Ride.id == ride_id).first()
        if not ride:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ride '{ride_id}' not found")

        # Cancellation rules: Can cancel if REQUESTED or ACCEPTED.
        # Cannot cancel if already COMPLETED or CANCELLED, or IN_PROGRESS (per business rules)
        if ride.status in ["COMPLETED", "CANCELLED"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot cancel ride in terminal status '{ride.status}'"
            )

        if ride.status == "IN_PROGRESS":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot cancel ride that is already IN_PROGRESS. Please contact dispatch emergency support."
            )

        prev_status = ride.status
        ride.status = "CANCELLED"
        ride.cancellation_reason = req.reason
        ride.updated_at = datetime.now(timezone.utc)

        # If a driver was assigned, release them
        if ride.driver_id:
            driver = db.query(Driver).filter(Driver.id == ride.driver_id).first()
            if driver:
                driver.availability_status = "AVAILABLE"
                driver.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(ride)

        cache_service.invalidate_ride_cache(ride_id)
        cache_service.invalidate_driver_cache()

        await event_broker.publish("RideCancelled", {
            "rideId": ride.id,
            "userId": ride.user_id,
            "driverId": ride.driver_id,
            "previousStatus": prev_status,
            "reason": req.reason,
            "status": ride.status
        })

        return {
            "rideId": ride.id,
            "status": ride.status,
            "cancellationReason": req.reason,
            "message": "Ride cancelled successfully"
        }

    def get_ride_status(self, db: Session, ride_id: str) -> Dict[str, Any]:
        # Cache check
        cached = cache_service.get_ride_status(ride_id)
        if cached:
            return cached

        ride = db.query(Ride).filter(Ride.id == ride_id).first()
        if not ride:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ride '{ride_id}' not found")

        assigned_driver_info = None
        driver_loc = None
        if ride.driver:
            assigned_driver_info = {
                "driverId": ride.driver.id,
                "name": ride.driver.name,
                "vehicleNumber": ride.driver.vehicle_number,
                "vehicleType": ride.driver.vehicle_type,
                "rating": ride.driver.rating,
                "currentLocation": {
                    "lat": ride.driver.latitude,
                    "lng": ride.driver.longitude
                }
            }
            driver_loc = {
                "lat": ride.driver.latitude,
                "lng": ride.driver.longitude
            }

        response_data = {
            "rideId": ride.id,
            "status": ride.status,
            "userId": ride.user_id,
            "pickup": {
                "lat": ride.pickup_latitude,
                "lng": ride.pickup_longitude,
                "address": ride.pickup_address
            },
            "destination": {
                "lat": ride.destination_latitude,
                "lng": ride.destination_longitude,
                "address": ride.destination_address
            },
            "assignedDriver": assigned_driver_info,
            "estimatedFare": ride.estimated_fare,
            "finalFare": ride.final_fare,
            "cancellationReason": ride.cancellation_reason,
            "currentDriverLocation": driver_loc,
            "createdAt": ride.created_at.isoformat() if ride.created_at else "",
            "updatedAt": ride.updated_at.isoformat() if ride.updated_at else ""
        }

        # Cache for 15 seconds
        cache_service.set_ride_status(ride_id, response_data, ttl=15)
        return response_data

ride_service = RideService()
