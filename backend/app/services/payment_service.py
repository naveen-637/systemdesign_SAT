import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.app.models.payment import Payment
from backend.app.models.ride import Ride
from backend.app.events.event_broker import event_broker
from backend.app.schemas.payment import PaymentCreateRequest

logger = logging.getLogger("payment_service")

class PaymentService:
    async def process_payment(self, db: Session, req: PaymentCreateRequest) -> Dict[str, Any]:
        ride = db.query(Ride).filter(Ride.id == req.rideId).first()
        if not ride:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ride '{req.rideId}' not found for payment processing"
            )

        # Idempotency check: check if already paid
        existing_payment = db.query(Payment).filter(
            Payment.ride_id == req.rideId,
            Payment.payment_status == "COMPLETED"
        ).first()

        if existing_payment:
            logger.info("Idempotent payment return for ride %s", req.rideId)
            return {
                "id": existing_payment.id,
                "rideId": existing_payment.ride_id,
                "amount": existing_payment.amount,
                "paymentMethod": existing_payment.payment_method,
                "paymentStatus": existing_payment.payment_status,
                "transactionReference": existing_payment.transaction_reference,
                "createdAt": existing_payment.created_at.isoformat(),
                "message": "Payment already completed for this ride (idempotent response)"
            }

        txn_ref = f"TXN_{uuid.uuid4().hex[:12].upper()}"
        payment = Payment(
            id=f"PAY_{uuid.uuid4().hex[:8].upper()}",
            ride_id=req.rideId,
            amount=round(req.amount, 2),
            payment_method=req.paymentMethod,
            payment_status="COMPLETED",
            transaction_reference=txn_ref,
            created_at=datetime.now(timezone.utc)
        )

        db.add(payment)
        db.commit()
        db.refresh(payment)

        # Publish event
        await event_broker.publish("PaymentCompleted", {
            "paymentId": payment.id,
            "rideId": payment.ride_id,
            "userId": ride.user_id,
            "amount": payment.amount,
            "paymentMethod": payment.payment_method,
            "transactionReference": payment.transaction_reference,
            "status": payment.payment_status
        })

        return {
            "id": payment.id,
            "rideId": payment.ride_id,
            "amount": payment.amount,
            "paymentMethod": payment.payment_method,
            "paymentStatus": payment.payment_status,
            "transactionReference": payment.transaction_reference,
            "createdAt": payment.created_at.isoformat(),
            "message": "Payment processed successfully (Demo Simulation)"
        }

payment_service = PaymentService()
