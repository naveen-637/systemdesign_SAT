from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.payment import PaymentCreateRequest, PaymentResponse
from backend.app.services.payment_service import payment_service

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(req: PaymentCreateRequest, db: Session = Depends(get_db)):
    """
    3.1 F: Simulate payment for a completed or active ride.
    Demonstrates transactional database write and idempotency.
    """
    result = await payment_service.process_payment(db, req)
    return result
