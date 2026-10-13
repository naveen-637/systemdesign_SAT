from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    vehicle_number = Column(String(64), nullable=False)
    vehicle_type = Column(String(64), default="Sedan", nullable=False)  # Sedan, SUV, Auto, Bike
    rating = Column(Float, default=4.8, nullable=False)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    availability_status = Column(String(32), default="AVAILABLE", index=True, nullable=False)  # AVAILABLE, BUSY, OFFLINE
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    rides = relationship("Ride", back_populates="driver")
