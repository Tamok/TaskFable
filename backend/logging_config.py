import os
import logging
from logging.handlers import TimedRotatingFileHandler

# Ensure log directories exist
os.makedirs("logs/backend", exist_ok=True)
os.makedirs("logs/frontend", exist_ok=True)

def setup_backend_logger():
    logger = logging.getLogger("backend-logger")
    logger.setLevel(logging.INFO)
    handler = TimedRotatingFileHandler(
        filename="logs/backend/backend.log",
        when="midnight",
        backupCount=7,
        encoding="utf-8"
    )
    formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger

def setup_frontend_logger():
    logger = logging.getLogger("frontend-logger")
    logger.setLevel(logging.INFO)
    handler = TimedRotatingFileHandler(
        filename="logs/frontend/frontend.log",
        when="midnight",
        backupCount=7,
        encoding="utf-8"
    )
    formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger

backend_logger = setup_backend_logger()
frontend_logger = setup_frontend_logger()
