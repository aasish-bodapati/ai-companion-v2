from __future__ import annotations
import time
import threading
from typing import Any, Optional, Tuple


class TTLCache:
    def __init__(self, maxsize: int = 1024):
        self._data: dict[str, Tuple[float, Any]] = {}
        self._lock = threading.Lock()
        self._maxsize = maxsize

    def get(self, key: str) -> Optional[Any]:
        now = time.time()
        with self._lock:
            item = self._data.get(key)
            if not item:
                return None
            exp, val = item
            if exp and exp < now:
                self._data.pop(key, None)
                return None
            return val

    def set(self, key: str, value: Any, ttl_seconds: int = 30) -> None:
        exp = time.time() + max(0, int(ttl_seconds)) if ttl_seconds else 0
        with self._lock:
            if len(self._data) >= self._maxsize:
                # naive eviction of one arbitrary item
                try:
                    self._data.pop(next(iter(self._data)))
                except Exception:
                    self._data.clear()
            self._data[key] = (exp, value)


cache = TTLCache(maxsize=2048)
