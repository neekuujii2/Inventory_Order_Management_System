import time
from fastapi import HTTPException, Request, status


class RateLimiter:
    def __init__(self, requests_limit: int = 100, window_seconds: int = 60):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.history: dict[str, list[float]] = {}

    def __call__(self, request: Request):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        if client_ip not in self.history:
            self.history[client_ip] = []

        self.history[client_ip] = [t for t in self.history[client_ip] if now - t < self.window_seconds]

        if len(self.history[client_ip]) >= self.requests_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later."
            )

        self.history[client_ip].append(now)


api_limiter = RateLimiter(requests_limit=150, window_seconds=60)
auth_limiter = RateLimiter(requests_limit=10, window_seconds=60)
