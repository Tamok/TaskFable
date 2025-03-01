from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers import tasks, stories, users, logs
import logging_config

app = FastAPI(title="TaskFable API", version="0.1.0", docs_url="/")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logging_config.backend_logger.error(f"Validation error on {request.url}: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/users")
app.include_router(tasks.router, prefix="/tasks")
app.include_router(stories.router, prefix="/stories")
app.include_router(logs.router, prefix="/logs")

@app.on_event("startup")
def startup_event():
    logging_config.backend_logger.info("Application startup complete.")

@app.on_event("shutdown")
def shutdown_event():
    logging_config.backend_logger.info("Application shutdown complete.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
