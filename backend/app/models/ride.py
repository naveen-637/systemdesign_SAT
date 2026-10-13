from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Ride(Base):
    __tablename__ = "rides"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    driver_id = Column(String(64), ForeignKey("drivers.id"), nullable=True, index=True)

    pickup_latitude = Column(Float, nullable=False)
    pickup_longitude = Column(Float, nullable=False)
    pickup_address = Column(String(256), nullable=False)

    destination_latitude = Column(Float, nullable=False)
    destination_longitude = Column(Float, nullable=False)
    destination_address = Column(String(256), nullable=False)

    # Statuses: REQUESTED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED
    status = Column(String(32), default="REQUESTED", nullable=False, index=True)

    estimated_fare = Column(Float, nullable=False)
    final_fare = Column(Float, nullable=True)
    cancellation_reason = Column(String(256), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="rides")
    driver = relationship("Driver", back_populates="rides")
    payments = relationship("Payment", back_populates="ride", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="ride", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_rides_status_driver", "status", "driver_id"),
    )
