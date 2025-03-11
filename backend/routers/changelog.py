# backend/routers/changelog.py
from fastapi import APIRouter, HTTPException
import os

router = APIRouter()

@router.get("/changelog", response_model=str)
def get_changelog():
    # Build an absolute path relative to this file.
    this_dir = os.path.dirname(os.path.abspath(__file__))
    # Move two levels up to the project root, then locate CHANGELOG.md.
    changelog_path = os.path.join(this_dir, "..", "..", "CHANGELOG.md")
    if not os.path.exists(changelog_path):
        raise HTTPException(status_code=404, detail="CHANGELOG.md not found")
    with open(changelog_path, "r", encoding="utf-8") as f:
        content = f.read()
    return content
