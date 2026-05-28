import time
import hashlib
from typing import Dict, Any, Optional

class AsyncCache:
    """
    A lightweight, thread-safe asynchronous cache for policy analysis results.
    Includes TTL (Time-To-Live) expiration.
    """
    def __init__(self, ttl_seconds: int = 86400):
        self.ttl = ttl_seconds
        self.cache: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        if key in self.cache:
            entry = self.cache[key]
            # Verify entry timestamp is within TTL
            if time.time() - entry["timestamp"] < self.ttl:
                return entry["data"]
            else:
                del self.cache[key] # Expired entry
        return None

    def set(self, key: str, data: Any):
        self.cache[key] = {
            "data": data,
            "timestamp": time.time()
        }

    def clear(self):
        self.cache.clear()

# Global cache instance (24-hour expiration)
analysis_cache = AsyncCache(ttl_seconds=86400)

def get_cache_key(url: str, text: Optional[str] = None) -> str:
    """
    Generates a unique SHA-256 cache key based on normalized URL or pasted policy text.
    """
    if text:
        return hashlib.sha256(text.strip().encode("utf-8")).hexdigest()
    # Normalize URL by removing trailing slash, stripping, and converting to lowercase
    normalized_url = url.strip().lower().rstrip("/")
    return hashlib.sha256(normalized_url.encode("utf-8")).hexdigest()
