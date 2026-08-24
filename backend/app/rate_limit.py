import math
import time
from collections import OrderedDict, deque


class RateLimiter:
    """Small in-process sliding-window limiter."""

    def __init__(self, limit: int, window_seconds: float, max_clients: int = 10_000):
        self.limit = limit
        self.window_seconds = window_seconds
        self.max_clients = max_clients
        self._requests: OrderedDict[str, deque[float]] = OrderedDict()

    def retry_after(self, key: str, now: float | None = None) -> int | None:
        now = time.monotonic() if now is None else now
        requests = self._requests.get(key)
        if requests is None:
            if len(self._requests) >= self.max_clients:
                self._requests.popitem(last=False)
            requests = self._requests[key] = deque()
        else:
            self._requests.move_to_end(key)

        cutoff = now - self.window_seconds
        while requests and requests[0] <= cutoff:
            requests.popleft()
        if len(requests) >= self.limit:
            return max(1, math.ceil(requests[0] + self.window_seconds - now))
        requests.append(now)
        return None
