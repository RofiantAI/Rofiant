import logging

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

logger = logging.getLogger(__name__)
app = FastAPI(title="KiroBots API")

# Catch failures inside the user middleware stack. A global exception handler
# runs in Starlette's outer ServerErrorMiddleware, outside CORS, which turns a
# useful 500 into a misleading browser-side CORS error.
@app.middleware("http")
async def unhandled_exception_middleware(request: Request, call_next):
    try:
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
