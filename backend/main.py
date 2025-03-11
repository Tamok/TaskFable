"""
backend/main.py
---------------
Main application entry point for TaskFable.
This file configures the FastAPI application, including CORS, exception handling,
and includes all routers (users, tasks, stories, logs, changelog, and questlogs).
It also provides a simple endpoint to retrieve the server's local timezone.
Note: This file uses relative imports. To run it, execute from the project root:
    python -m backend.main
"""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .routers import tasks, stories, users, logs, changelog, questlogs
from . import logging_config
from datetime import datetime
from tzlocal import get_localzone
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code
    logging_config.backend_logger.info("Application startup complete.")
    yield
    # Shutdown code
    logging_config.backend_logger.info("Application shutdown complete.")

app = FastAPI(lifespan=lifespan, title="TaskFable API", version="0.2.6", docs_url="/")

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )

# Configure CORS (if needed)
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers.
app.include_router(users.router, prefix="/users")
app.include_router(tasks.router, prefix="/tasks")
app.include_router(stories.router, prefix="/stories")
app.include_router(logs.router, prefix="/logs")
app.include_router(changelog.router, prefix="/other")
app.include_router(questlogs.router, prefix="/questlogs")

@app.get("/server/timezone")
def get_server_timezone():
    """
    Returns the server's local timezone offset in the format 'UTC±HH:MM'.
    """
    local_zone = get_localzone()
    offset = local_zone.utcoffset(datetime.now())
    sign = "+" if offset.total_seconds() >= 0 else "-"
    hours = int(abs(offset.total_seconds()) // 3600)
    minutes = int((abs(offset.total_seconds()) % 3600) // 60)
    offset_str = f"UTC{sign}{hours:02d}:{minutes:02d}"
    return {"server_timezone": offset_str}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)