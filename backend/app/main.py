import logging
from hashlib import sha256

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import (
    account,
    bots,
    conversations,
    lsp,
    machine,
    messages,
    providers,
    skills,
    transcribe,
    usage,
    workspaces,
)
from app.rate_limit import RateLimiter

logger = logging.getLogger(__name__)
app = FastAPI(title="Rofiant API")

# ponytail: per-process limits match today's single Railway worker; use a
# shared store before adding workers or replicas.
request_limiter = RateLimiter(limit=300, window_seconds=60)
expensive_request_limiter = RateLimiter(limit=10, window_seconds=60)
expensive_paths = {"/api/messages/stream", "/api/transcribe"}


def _rate_limit_key(request: Request) -> str:
    authorization = request.headers.get("authorization")
    if authorization:
        return sha256(authorization.encode()).hexdigest()
    return request.client.host if request.client else "unknown"

# Catch failures inside the user middleware stack. A global exception handler
# runs in Starlette's outer ServerErrorMiddleware, outside CORS, which turns a
# useful 500 into a misleading browser-side CORS error.
@app.middleware("http")
async def unhandled_exception_middleware(request: Request, call_next):
    try:
        if request.method != "OPTIONS" and request.url.path != "/health":
            limiter = (
                expensive_request_limiter
                if request.url.path in expensive_paths
                else request_limiter
            )
            retry_after = limiter.retry_after(_rate_limit_key(request))
            if retry_after is not None:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded"},
                    headers={"Retry-After": str(retry_after)},
                )
        return await call_next(request)
    except Exception:
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

# Auth is via bearer JWT, not cookies, so a wildcard origin carries no
# credential-leak risk and keeps the Tauri dev/prod origin churn a non-issue.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(account.router)
app.include_router(bots.router)
app.include_router(machine.router)
app.include_router(conversations.router)
app.include_router(messages.router)
app.include_router(providers.router)
app.include_router(skills.router)
app.include_router(transcribe.router)
app.include_router(usage.router)
app.include_router(workspaces.router)
app.include_router(lsp.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
