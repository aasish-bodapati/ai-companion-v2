from fastapi import APIRouter, Depends
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app import crud
from app.api import deps

router = APIRouter()

@router.post("/test-email")
def test_email(email_to: str):
    """
    Test emails.
    """
    # In a real app, you would send an email here
    return {"msg": "Test email sent", "email_to": email_to}

@router.get("/health")
def health_check():
    """
    Health check endpoint.
    """
    return {"status": "ok"}
