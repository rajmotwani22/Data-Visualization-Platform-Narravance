import json
import functools
import hashlib
from typing import Callable, Optional
import logging
from fastapi import Request, Response

logger = logging.getLogger(__name__)

def redis_cache(expire_seconds: int = 60, prefix: str = "cache:api:"):
    """
    Decorator to cache FastAPI endpoint responses in Redis.
    
    Args:
        expire_seconds: Time in seconds for the cache to expire
        prefix: Prefix for the Redis cache key
        
    Example usage:
        @app.get("/api/companies")
        @redis_cache(expire_seconds=300)  # Cache for 5 minutes
        async def get_companies(db: Session = Depends(get_db)):
            ...
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Get Redis manager from app state
            from app import app  # Import here to avoid circular imports
            redis_manager = app.state.redis_manager
            
            # Skip caching if Redis is not connected
            if not redis_manager.is_connected:
                return await func(*args, **kwargs)
            
            # Build cache key from function name and arguments
            # Find the Request object if it exists in args
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            # If no Request in args, check kwargs
            if not request and 'request' in kwargs:
                request = kwargs['request']
            
            if not request:
                # If we still don't have a request object, we can't build a proper cache key
                return await func(*args, **kwargs)
            
            # Create a hash of the request path and query params
            request_key = f"{request.url.path}?{request.url.query}"
            cache_key = f"{prefix}{hashlib.md5(request_key.encode()).hexdigest()}"
            
            # Try to get from cache
            cached_response = redis_manager.get_cache(cache_key)
            if cached_response:
                try:
                    logger.debug(f"Cache hit for {request_key}")
                    # Parse the cached JSON response
                    cached_data = json.loads(cached_response)
                    return cached_data
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON in cache for {cache_key}")
            
            # Execute the function if cache miss
            logger.debug(f"Cache miss for {request_key}")
            response = await func(*args, **kwargs)
            
            # Cache the response
            try:
                response_json = json.dumps(response)
                redis_manager.set_cache(cache_key, response_json, expire_seconds)
            except (TypeError, ValueError) as e:
                logger.error(f"Could not cache response: {str(e)}")
            
            return response
        
        return wrapper
    
    return decorator

def invalidate_cache_prefix(prefix: str):
    """
    Decorator to invalidate all cache entries with a given prefix after a function executes.
    Useful for write operations that modify data that's cached elsewhere.
    
    Example usage:
        @app.post("/api/tasks")
        @invalidate_cache_prefix("cache:api:tasks")
        async def create_task(...):
            ...
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Execute the function first
            result = await func(*args, **kwargs)
            
            # Then invalidate cache
            from app import app  # Import here to avoid circular imports
            redis_manager = app.state.redis_manager
            
            if redis_manager.is_connected:
                pattern = f"{prefix}*"
                invalidated = redis_manager.invalidate_cache(pattern)
                logger.debug(f"Invalidated {invalidated} cache entries with pattern '{pattern}'")
            
            return result
        
        return wrapper
    
    return decorator