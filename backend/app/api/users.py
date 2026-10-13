from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.schemas.user import UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserResponse], status_code=status.HTTP_200_OK)
def list_users(db: Session = Depends(get_db)):
    """
    List available users for demo booking dropdown.
    """
    users = db.query(User).all()
    return [
        UserResponse(
            id=u.id,
            name=u.name,
            email=u.email,
            createdAt=u.created_at.isoformat() if u.created_at else ""
        )
        for u in users
    ]
