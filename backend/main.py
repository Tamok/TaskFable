from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import tasks, stories, users, logs
import logging_config

app = FastAPI(title="Gamified Task Portal")

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
