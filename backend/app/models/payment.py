from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(64), primary_key=True, index=True)
    ride_id = Column(String(64), ForeignKey("rides.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(64), default="UPI", nullable=False)  # UPI, CREDIT_CARD, DEBIT_CARD, CASH, WALLET
    payment_status = Column(String(32), default="COMPLETED", nullable=False)  # COMPLETED, PENDING, FAILED
    transaction_reference = Column(String(128), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    ride = relationship("Ride", back_populates="payments")
