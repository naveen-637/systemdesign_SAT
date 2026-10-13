from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.ride import Ride
from backend.app.models.driver import Driver
from backend.app.models.payment import Payment
from backend.app.events.event_broker import event_broker

class AnalyticsService:
    def get_dashboard_stats(self, db: Session) -> Dict[str, Any]:
        total_rides = db.query(Ride).count()

        active_rides = db.query(Ride).filter(
            Ride.status.in_(["REQUESTED", "ACCEPTED", "IN_PROGRESS"])
        ).count()

        available_drivers = db.query(Driver).filter(
            Driver.availability_status == "AVAILABLE"
        ).count()

        completed_rides = db.query(Ride).filter(
            Ride.status == "COMPLETED"
        ).count()

        cancelled_rides = db.query(Ride).filter(
            Ride.status == "CANCELLED"
        ).count()

        revenue_result = db.query(func.sum(Payment.amount)).filter(
            Payment.payment_status == "COMPLETED"
        ).scalar()
        total_revenue = round(float(revenue_result or 0.0), 2)

        # Status distribution
        statuses = ["REQUESTED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]
        status_dist = {}
        for s in statuses:
            status_dist[s] = db.query(Ride).filter(Ride.status == s).count()

        # Recent 10 rides
        recent_rides_query = db.query(Ride).order_by(Ride.created_at.desc()).limit(10).all()
        recent_rides = []
        for r in recent_rides_query:
            recent_rides.append({
                "rideId": r.id,
                "userId": r.user_id,
                "driverId": r.driver_id,
                "driverName": r.driver.name if r.driver else None,
                "pickupAddress": r.pickup_address,
                "destinationAddress": r.destination_address,
                "status": r.status,
                "estimatedFare": r.estimated_fare,
                "finalFare": r.final_fare,
                "createdAt": r.created_at.isoformat() if r.created_at else ""
            })

        recent_activity = event_broker.get_recent_events(limit=15)

        return {
            "totalRides": total_rides,
            "activeRides": active_rides,
            "availableDrivers": available_drivers,
            "completedRides": completed_rides,
            "cancelledRides": cancelled_rides,
            "totalRevenue": total_revenue,
            "statusDistribution": status_dist,
            "recentRides": recent_rides,
            "recentActivity": recent_activity
        }

analytics_service = AnalyticsService()
