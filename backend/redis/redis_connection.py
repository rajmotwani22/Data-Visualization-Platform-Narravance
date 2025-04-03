import redis
import logging
import os
from contextlib import contextmanager
from typing import Optional

logger = logging.getLogger(__name__)

class RedisManager:
    def __init__(self, redis_url: str = None):
        """Initialize Redis manager with optional connection URL."""
        # Use provided URL or get from environment
        self.redis_url = redis_url or os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
        self._redis_client = None
        self.is_connected = False
        
    def connect(self) -> bool:
        """Establish connection to Redis server."""
        try:
            self._redis_client = redis.from_url(self.redis_url)
            # Test connection
            self._redis_client.ping()
            self.is_connected = True
            logger.info(f"Connected to Redis at {self.redis_url}")
            return True
        except redis.ConnectionError as e:
            self.is_connected = False
            logger.error(f"Failed to connect to Redis: {str(e)}")
            return False
    
    @property
    def client(self) -> Optional[redis.Redis]:
        """Get Redis client, connecting if needed."""
        if self._redis_client is None or not self.is_connected:
            self.connect()
        return self._redis_client
    
    @contextmanager
    def get_connection(self):
        """Context manager for Redis connection."""
        try:
            if not self.is_connected:
                self.connect()
            yield self._redis_client
        except redis.RedisError as e:
            logger.error(f"Redis error: {str(e)}")
            raise
    
    def get_cache(self, key: str) -> Optional[str]:
        """Get a value from Redis cache."""
        if not self.is_connected:
            return None
            
        try:
            result = self._redis_client.get(key)
            return result.decode('utf-8') if result else None
        except redis.RedisError as e:
            logger.error(f"Redis get error: {str(e)}")
            return None
    
    def set_cache(self, key: str, value: str, expire_seconds: int = None) -> bool:
        """Set a value in Redis cache with optional expiration."""
        if not self.is_connected:
            return False
            
        try:
            self._redis_client.set(key, value)
            if expire_seconds:
                self._redis_client.expire(key, expire_seconds)
            return True
        except redis.RedisError as e:
            logger.error(f"Redis set error: {str(e)}")
            return False
            
    def invalidate_cache(self, key_pattern: str = None) -> int:
        """Invalidate cache for a key pattern or all keys."""
        if not self.is_connected:
            return 0
            
        try:
            if key_pattern:
                keys = self._redis_client.keys(key_pattern)
                if keys:
                    return self._redis_client.delete(*keys)
                return 0
            else:
                return self._redis_client.flushdb()
        except redis.RedisError as e:
            logger.error(f"Redis invalidation error: {str(e)}")
            return 0
            
    def health_check(self) -> dict:
        """Check Redis connection health."""
        status = {
            "connected": False,
            "error": None,
            "info": {}
        }
        
        try:
            if not self.is_connected:
                self.connect()
                
            if self.is_connected:
                info = self._redis_client.info()
                status["connected"] = True
                status["info"] = {
                    "used_memory": info.get("used_memory_human", "unknown"),
                    "version": info.get("redis_version", "unknown"),
                    "uptime_days": info.get("uptime_in_days", "unknown"),
                    "clients_connected": info.get("connected_clients", "unknown")
                }
        except redis.RedisError as e:
            status["error"] = str(e)
            
        return status