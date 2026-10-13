from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.seed import seed_database

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/reset-demo", status_code=status.HTTP_200_OK)
def reset_demo_database(db: Session = Depends(get_db)):
    """
    Safely reset and re-seed the local demonstration database.
    Restores clean initial users, drivers, active/completed rides, and demo payments.
    """
    seed_database(db)
    return {
        "status": "SUCCESS",
        "message": "Demonstration database successfully reset and seeded with fresh records."
    }
