import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Callable, Dict, List, Any, Optional

logger = logging.getLogger("event_broker")

class DomainEvent:
    def __init__(self, event_type: str, payload: Dict[str, Any], event_id: Optional[str] = None):
        self.event_id = event_id or str(uuid.uuid4())
        self.event_type = event_type
        self.payload = payload
        self.timestamp = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "eventId": self.event_id,
            "eventType": self.event_type,
            "payload": self.payload,
            "timestamp": self.timestamp,
        }

class EventBroker:
    """
    Local asynchronous in-memory event broker that abstracts publish-subscribe messaging.
    In a distributed production environment, this abstraction is swapped with
    Apache Kafka or RabbitMQ producers and consumer worker groups.
    Includes idempotency guards to prevent duplicate event processing.
    """
    def __init__(self):
        self._subscribers: Dict[str, List[Callable[[DomainEvent], Any]]] = {}
        self._processed_event_ids = set()
        self._recent_events: List[Dict[str, Any]] = []
        self._max_event_history = 100

    def subscribe(self, event_type: str, handler: Callable[[DomainEvent], Any]):
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(handler)
        logger.info("Subscribed handler %s to event %s", getattr(handler, "__name__", str(handler)), event_type)

    async def publish(self, event_type: str, payload: Dict[str, Any], event_id: Optional[str] = None):
        event = DomainEvent(event_type=event_type, payload=payload, event_id=event_id)

        # Idempotency check
        if event.event_id in self._processed_event_ids:
            logger.warning("Duplicate event discarded: %s (%s)", event.event_type, event.event_id)
            return

        self._processed_event_ids.add(event.event_id)
        if len(self._processed_event_ids) > 5000:
            # Prevent memory leak
            self._processed_event_ids.clear()

        # Keep in recent event history for audit and demo
        self._recent_events.insert(0, event.to_dict())
        if len(self._recent_events) > self._max_event_history:
            self._recent_events.pop()

        handlers = self._subscribers.get(event_type, [])
        # Also notify wildcard subscribers
        all_handlers = handlers + self._subscribers.get("*", [])

        logger.info("Publishing event %s (%d handlers registered)", event_type, len(all_handlers))

        for handler in all_handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    asyncio.create_task(handler(event))
                else:
                    handler(event)
            except Exception as e:
                logger.error("Error executing handler for event %s: %s", event_type, str(e))

    def get_recent_events(self, limit: int = 20) -> List[Dict[str, Any]]:
        return self._recent_events[:limit]

# Singleton instance for local backend
event_broker = EventBroker()
