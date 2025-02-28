from fastapi import APIRouter, HTTPException, Body
import os
from pydantic import BaseModel
from sqlalchemy import text

router = APIRouter()

def get_recent_lines(file_path, num_lines=100):
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    return "".join(lines[-num_lines:][::-1])

@router.get("/backend", response_model=list)
def list_backend_logs():
    log_dir = "logs/backend"
    if not os.path.exists(log_dir):
        return []
    files = sorted(os.listdir(log_dir))
    log_files = [f for f in files if f.endswith(".log")]
    return log_files

@router.get("/backend/{filename}")
def get_backend_log_file(filename: str, lines: int = 100):
    log_dir = "logs/backend"
    file_path = os.path.join(log_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Log file not found")
    content = get_recent_lines(file_path, lines)
    return {"filename": filename, "content": content}

@router.get("/frontend", response_model=list)
def list_frontend_logs():
    log_dir = "logs/frontend"
    if not os.path.exists(log_dir):
        return []
    files = sorted(os.listdir(log_dir))
    log_files = [f for f in files if f.endswith(".log")]
    return log_files

@router.get("/frontend/{filename}")
def get_frontend_log_file(filename: str, lines: int = 100):
    log_dir = "logs/frontend"
    file_path = os.path.join(log_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Log file not found")
    content = get_recent_lines(file_path, lines)
    return {"filename": filename, "content": content}

class LogMessage(BaseModel):
    message: str

@router.post("/frontend/append", response_model=dict)
def append_frontend_log(log: LogMessage):
    log_file = "logs/frontend/frontend.log"
    try:
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"{log.message}\n")
        return {"message": "Frontend log appended"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
