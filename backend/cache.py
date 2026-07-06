import time
import hashlib
from typing import Dict, Any, Optional

from collections import OrderedDict

class AsyncCache:
    """
    A lightweight, thread-safe asynchronous cache for policy analysis results.
    Includes TTL (Time-To-Live) expiration and LRU eviction.
    """
    def __init__(self, ttl_seconds: int = 86400, max_size: int = 1000):
        self.ttl = ttl_seconds
        self.max_size = max_size
        self.cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()

    def get(self, key: str) -> Optional[Any]:
        if key in self.cache:
            entry = self.cache[key]
            # Verify entry timestamp is within TTL
            if time.time() - entry["timestamp"] < self.ttl:
                self.cache.move_to_end(key) # Mark as recently used
                return entry["data"]
            else:
                del self.cache[key] # Expired entry
        return None

    def set(self, key: str, data: Any):
        self.cache[key] = {
            "data": data,
            "timestamp": time.time()
        }
        self.cache.move_to_end(key)
        if len(self.cache) > self.max_size:
            # Pop the least recently used item
            self.cache.popitem(last=False)

    def clear(self):
        self.cache.clear()

# Global cache instance (24-hour expiration, max 1000 items)
analysis_cache = AsyncCache(ttl_seconds=86400, max_size=1000)

def get_cache_key(url: str, text: Optional[str] = None) -> str:
    """
    Generates a unique SHA-256 cache key based on normalized URL or pasted policy text.
    """
    if text:
        return hashlib.sha256(text.strip().encode("utf-8")).hexdigest()
    # Normalize URL by removing trailing slash, stripping, and converting to lowercase
    normalized_url = url.strip().lower().rstrip("/")
    return hashlib.sha256(normalized_url.encode("utf-8")).hexdigest()
