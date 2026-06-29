import time
from typing import Any


class CacheManager:
    def __init__(self):
        self._cache: dict[str, tuple[Any, float | None]] = {}

    def get(self, key: str) -> Any | None:
        if key not in self._cache:
            return None
        val, expiry = self._cache[key]
        if expiry is not None and time.time() > expiry:
            del self._cache[key]
            return None
        return val

    def set(self, key: str, value: Any, expire_seconds: int | None = None) -> None:
        expiry = time.time() + expire_seconds if expire_seconds else None
        self._cache[key] = (value, expiry)

    def delete(self, key: str) -> None:
        if key in self._cache:
            del self._cache[key]

    def clear(self) -> None:
        self._cache.clear()


cache_manager = CacheManager()
