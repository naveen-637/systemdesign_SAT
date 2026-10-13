import os
import json
import time
import logging
from typing import Any, Optional, Dict, Tuple
from threading import Lock

logger = logging.getLogger("cache_service")

class InMemoryCache:
    def __init__(self):
        self._store: Dict[str, Tuple[Any, float]] = {}
        self._lock = Lock()

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            item = self._store.get(key)
            if not item:
                return None
            val, expiry = item
            if expiry and time.time() > expiry:
                del self._store[key]
                return None
            return val

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        with self._lock:
            expiry = (time.time() + ttl) if ttl else 0
            self._store[key] = (value, expiry)

    def delete(self, key: str) -> None:
        with self._lock:
            if key in self._store:
                del self._store[key]

    def delete_pattern(self, pattern_prefix: str) -> None:
        with self._lock:
            keys_to_del = [k for k in self._store if k.startswith(pattern_prefix)]
            for k in keys_to_del:
                del self._store[k]

    def clear(self) -> None:
        with self._lock:
            self._store.clear()


class CacheService:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.redis_client = None
        self.is_redis_available = False
        self.in_memory = InMemoryCache()
        self._init_redis()

    def _init_redis(self):
        try:
            import redis
            client = redis.from_url(self.redis_url, decode_responses=True, socket_connect_timeout=1)
            # Test ping
            client.ping()
            self.redis_client = client
            self.is_redis_available = True
            logger.info("Successfully connected to Redis cache at %s", self.redis_url)
        except Exception as e:
            self.is_redis_available = False
            self.redis_client = None
            logger.info("Redis not reachable (%s); falling back to thread-safe InMemoryCache", str(e))

    def get(self, key: str) -> Optional[Any]:
        if self.is_redis_available and self.redis_client:
            try:
                data = self.redis_client.get(key)
                if data:
                    return json.loads(data)
                return None
            except Exception as e:
                logger.warning("Redis get error for key %s: %s; falling back to memory", key, str(e))
                self.is_redis_available = False
        return self.in_memory.get(key)

    def set(self, key: str, value: Any, ttl: int = 60) -> None:
        serialized = json.dumps(value)
        if self.is_redis_available and self.redis_client:
            try:
                self.redis_client.set(key, serialized, ex=ttl)
                return
            except Exception as e:
                logger.warning("Redis set error for key %s: %s; falling back to memory", key, str(e))
                self.is_redis_available = False
        self.in_memory.set(key, value, ttl=ttl)

    def delete(self, key: str) -> None:
        if self.is_redis_available and self.redis_client:
            try:
                self.redis_client.delete(key)
            except Exception:
                pass
        self.in_memory.delete(key)

    def delete_pattern(self, pattern: str) -> None:
        clean_prefix = pattern.replace("*", "")
        if self.is_redis_available and self.redis_client:
            try:
                keys = self.redis_client.keys(pattern)
                if keys:
                    self.redis_client.delete(*keys)
            except Exception:
                pass
        self.in_memory.delete_pattern(clean_prefix)

    # High-level domain cache helpers
    def get_nearby_drivers(self, lat: float, lng: float, radius_km: float) -> Optional[list]:
        # Quantize coordinates to ~2 decimal places for cache hit optimization
        key = f"nearby_drivers:{round(lat, 2)}:{round(lng, 2)}:{round(radius_km, 1)}"
        return self.get(key)

    def set_nearby_drivers(self, lat: float, lng: float, radius_km: float, drivers: list, ttl: int = 15) -> None:
        key = f"nearby_drivers:{round(lat, 2)}:{round(lng, 2)}:{round(radius_km, 1)}"
        self.set(key, drivers, ttl=ttl)

    def invalidate_driver_cache(self) -> None:
        # Clear nearby drivers cache whenever any driver updates location or changes status
        self.delete_pattern("nearby_drivers:*")

    def get_ride_status(self, ride_id: str) -> Optional[dict]:
        return self.get(f"ride_status:{ride_id}")

    def set_ride_status(self, ride_id: str, data: dict, ttl: int = 30) -> None:
        self.set(f"ride_status:{ride_id}", data, ttl=ttl)

    def invalidate_ride_cache(self, ride_id: str) -> None:
        self.delete(f"ride_status:{ride_id}")

cache_service = CacheService()
