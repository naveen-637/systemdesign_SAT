import uuid
import logging
from datetime import datetime, timezone
from backend.app.database import SessionLocal
from backend.app.models.notification import Notification
from backend.app.events.event_broker import DomainEvent

logger = logging.getLogger("notification_service")

class NotificationService:
    @staticmethod
    def handle_event(event: DomainEvent):
        """
        Event handler that records notifications for domain events
        """
        payload = event.payload
        user_id = payload.get("userId")
        ride_id = payload.get("rideId")
        event_type = event.event_type

        message_map = {
            "RideRequested": f"Ride {ride_id} requested successfully. Searching for nearby drivers...",
            "DriverAssigned": f"Driver {payload.get('driverName', 'Assigned')} accepted your ride {ride_id}.",
            "RideStarted": f"Your trip {ride_id} has started! Safe travels.",
            "RideCompleted": f"Your trip {ride_id} has completed. Total fare: ₹{payload.get('finalFare', '0.00')}.",
            "RideCancelled": f"Ride {ride_id} has been cancelled. Reason: {payload.get('reason', 'N/A')}.",
            "PaymentCompleted": f"Payment of ₹{payload.get('amount', '0.00')} received for ride {ride_id}.",
        }

        msg = message_map.get(event_type, f"Event {event_type} for ride {ride_id}")

        db = SessionLocal()
        try:
            notif = Notification(
                id=f"NOTIF_{uuid.uuid4().hex[:8].upper()}",
                user_id=user_id,
                ride_id=ride_id,
                message=msg,
                read_status=False,
                created_at=datetime.now(timezone.utc)
            )
            db.add(notif)
            db.commit()
            logger.info("Saved notification for %s: %s", event_type, msg)
        except Exception as e:
            db.rollback()
            logger.error("Failed to persist notification for event %s: %s", event_type, str(e))
        finally:
            db.close()

notification_service = NotificationService()
