# backend/routers/changelog.py
from fastapi import APIRouter, HTTPException
import os

router = APIRouter()

@router.get("/changelog", response_model=str)
def get_changelog():
    changelog_path = os.path.join(os.getcwd(), "..", "CHANGELOG.md")
    if not os.path.exists(changelog_path):
        raise HTTPException(status_code=404, detail="CHANGELOG.md not found")
    with open(changelog_path, "r", encoding="utf-8") as f:
        content = f.read()
    return content
