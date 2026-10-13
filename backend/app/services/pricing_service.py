import math
import os

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on Earth in kilometers.
    """
    R = 6371.0  # Earth radius in kilometers

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

class PricingService:
    def __init__(self):
        self.base_fare = float(os.getenv("BASE_FARE", "50.0"))
        self.per_km_rate = float(os.getenv("PER_KM_RATE", "15.0"))
        self.surge_multiplier = float(os.getenv("SURGE_MULTIPLIER", "1.0"))

    def estimate_fare(self, pickup_lat: float, pickup_lng: float, dest_lat: float, dest_lng: float, surge: float = None) -> dict:
        distance_km = haversine_distance(pickup_lat, pickup_lng, dest_lat, dest_lng)
        # Avoid zero distance minimum calculation
        effective_distance = max(distance_km, 0.5)

        active_surge = surge if surge is not None else self.surge_multiplier
        estimated_fare = self.base_fare + (effective_distance * self.per_km_rate * active_surge)
        estimated_fare = round(max(estimated_fare, self.base_fare), 2)

        # Average city speed ~ 25 km/h
        duration_minutes = max(int(round((distance_km / 25.0) * 60)), 3)

        return {
            "estimatedFare": estimated_fare,
            "distanceKm": distance_km,
            "durationMinutes": duration_minutes,
            "baseFare": self.base_fare,
            "perKmRate": self.per_km_rate,
            "surgeMultiplier": active_surge,
        }

pricing_service = PricingService()
