import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.driver import Driver
from backend.app.services.pricing_service import haversine_distance
from backend.app.cache.cache_service import cache_service

logger = logging.getLogger("location_service")

class LocationService:
    def find_nearby_drivers(self, db: Session, lat: float, lng: float, radius_km: float = 5.0) -> List[Dict[str, Any]]:
        # 1. Attempt cache lookup
        cached_result = cache_service.get_nearby_drivers(lat, lng, radius_km)
        if cached_result is not None:
            return cached_result

        # 2. Database fallback: Fetch all AVAILABLE drivers
        # In PostgreSQL/PostGIS, we'd do ST_DWithin(geom, ST_MakePoint(lng, lat), radius_meters)
        # In SQLite, we fetch available drivers and compute Haversine distance
        drivers = db.query(Driver).filter(Driver.availability_status == "AVAILABLE").all()

        nearby = []
        for d in drivers:
            dist = haversine_distance(lat, lng, d.latitude, d.longitude)
            if dist <= radius_km:
                nearby.append({
                    "driverId": d.id,
                    "name": d.name,
                    "vehicleNumber": d.vehicle_number,
                    "vehicleType": d.vehicle_type,
                    "rating": d.rating,
                    "distanceKm": dist,
                    "location": {
                        "lat": d.latitude,
                        "lng": d.longitude
                    },
                    "availabilityStatus": d.availability_status
                })

        # Sort by proximity
        nearby.sort(key=lambda x: x["distanceKm"])

        # Cache result with a short TTL (15s) so stale data isn't held too long
        cache_service.set_nearby_drivers(lat, lng, radius_km, nearby, ttl=15)
        return nearby

    def update_driver_location(self, db: Session, driver_id: str, lat: float, lng: float, availability_status: Optional[str] = None) -> Optional[Driver]:
        driver = db.query(Driver).filter(Driver.id == driver_id).first()
        if not driver:
            return None

        driver.latitude = lat
        driver.longitude = lng
        if availability_status:
            driver.availability_status = availability_status

        db.commit()
        db.refresh(driver)

        # Invalidate cached nearby lookups
        cache_service.invalidate_driver_cache()
        return driver

location_service = LocationService()
