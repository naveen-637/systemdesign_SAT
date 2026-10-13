from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from backend.app.database import engine, Base, SessionLocal
from backend.app.models.user import User
from backend.app.models.driver import Driver
from backend.app.models.ride import Ride
from backend.app.models.payment import Payment
from backend.app.models.notification import Notification
from backend.app.cache.cache_service import cache_service

def seed_database(db: Session):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    # Clear existing demo records
    db.query(Notification).delete()
    db.query(Payment).delete()
    db.query(Ride).delete()
    db.query(Driver).delete()
    db.query(User).delete()
    db.commit()

    now = datetime.now(timezone.utc)

    # 1. Seed Users (6 users)
    users = [
        User(id="U101", name="Ananya Sharma", email="ananya.sharma@example.com", created_at=now - timedelta(days=10)),
        User(id="U102", name="Karthik Raja", email="karthik.raja@example.com", created_at=now - timedelta(days=8)),
        User(id="U103", name="Divya Ramesh", email="divya.ramesh@example.com", created_at=now - timedelta(days=6)),
        User(id="U104", name="Priya Natarajan", email="priya.natarajan@example.com", created_at=now - timedelta(days=4)),
        User(id="U105", name="Arvind Swaminathan", email="arvind.s@example.com", created_at=now - timedelta(days=2)),
        User(id="U106", name="Sneha Subramanian", email="sneha.subramanian@example.com", created_at=now - timedelta(days=1)),
    ]
    db.add_all(users)
    db.commit()

    # 2. Seed Drivers (12 drivers with varied vehicle types and states)
    drivers = [
        Driver(id="D201", name="Rajesh Kumar", vehicle_number="TN 38 BJ 1204", vehicle_type="Sedan", rating=4.9, latitude=11.0175, longitude=76.9565, availability_status="AVAILABLE", updated_at=now),
        Driver(id="D202", name="Suresh Babu", vehicle_number="TN 38 CZ 9981", vehicle_type="SUV", rating=4.8, latitude=11.0090, longitude=76.9520, availability_status="AVAILABLE", updated_at=now),
        Driver(id="D203", name="Manikandan V", vehicle_number="TN 38 BK 4412", vehicle_type="Auto", rating=4.7, latitude=10.9995, longitude=76.9610, availability_status="AVAILABLE", updated_at=now),
        Driver(id="D204", name="Vigneshwaran S", vehicle_number="TN 38 DL 5543", vehicle_type="Sedan", rating=4.95, latitude=11.0250, longitude=77.0120, availability_status="BUSY", updated_at=now),
        Driver(id="D205", name="Praveen Kumar", vehicle_number="TN 38 EF 1122", vehicle_type="Bike", rating=4.65, latitude=11.0810, longitude=76.9940, availability_status="AVAILABLE", updated_at=now),
        Driver(id="D206", name="Murugan K", vehicle_number="TN 38 GA 7765", vehicle_type="SUV", rating=4.85, latitude=11.0050, longitude=76.9720, availability_status="OFFLINE", updated_at=now),
        Driver(id="D207", name="Anand Raj", vehicle_number="TN 38 HB 3321", vehicle_type="Sedan", rating=4.75, latitude=11.0125, longitude=76.9620, availability_status="AVAILABLE", updated_at=now),
        Driver(id="D208", name="Senthil Nathan", vehicle_number="TN 38 JA 8890", vehicle_type="Auto", rating=4.6, latitude=11.0010, longitude=77.0200, availability_status="AVAILABLE", updated_at=now),
        Driver(id="D209", name="Dinesh Karthik", vehicle_number="TN 38 KC 4432", vehicle_type="Sedan", rating=4.9, latitude=11.0280, longitude=76.9450, availability_status="BUSY", updated_at=now),
        Driver(id="D210", name="Balaji T", vehicle_number="TN 38 LD 6654", vehicle_type="SUV", rating=4.8, latitude=11.0220, longitude=77.0240, availability_status="OFFLINE", updated_at=now),
        Driver(id="D211", name="Kavin Prasad", vehicle_number="TN 38 ME 9911", vehicle_type="Bike", rating=4.7, latitude=11.0005, longitude=76.9850, availability_status="AVAILABLE", updated_at=now),
        Driver(id="D212", name="Gokulnath M", vehicle_number="TN 38 NF 2233", vehicle_type="Sedan", rating=4.85, latitude=11.0200, longitude=76.9050, availability_status="AVAILABLE", updated_at=now),
    ]
    db.add_all(drivers)
    db.commit()

    # 3. Seed Rides across diverse states
    rides = [
        # REQUESTED (awaiting driver)
        Ride(
            id="R501",
            user_id="U101",
            driver_id=None,
            pickup_latitude=11.0168,
            pickup_longitude=76.9558,
            pickup_address="Gandhipuram Cross Cut Road",
            destination_latitude=11.0310,
            destination_longitude=77.0320,
            destination_address="Coimbatore Airport (CJB), Peelamedu",
            status="REQUESTED",
            estimated_fare=185.0,
            final_fare=None,
            cancellation_reason=None,
            created_at=now - timedelta(minutes=15),
            updated_at=now - timedelta(minutes=15)
        ),
        # ACCEPTED (driver D204 assigned and BUSY)
        Ride(
            id="R502",
            user_id="U102",
            driver_id="D204",
            pickup_latitude=10.9987,
            pickup_longitude=76.9600,
            pickup_address="Coimbatore Junction Railway Station",
            destination_latitude=11.0085,
            destination_longitude=76.9515,
            destination_address="RS Puram DB Road",
            status="ACCEPTED",
            estimated_fare=95.0,
            final_fare=None,
            cancellation_reason=None,
            created_at=now - timedelta(minutes=25),
            updated_at=now - timedelta(minutes=20)
        ),
        # IN_PROGRESS (driver D209 assigned and BUSY)
        Ride(
            id="R503",
            user_id="U103",
            driver_id="D209",
            pickup_latitude=11.0085,
            pickup_longitude=76.9515,
            pickup_address="Brookefields Mall, Sukrawar Pettai",
            destination_latitude=11.0827,
            destination_longitude=76.9958,
            destination_address="CHIL SEZ IT Park, Saravanampatti",
            status="IN_PROGRESS",
            estimated_fare=235.0,
            final_fare=None,
            cancellation_reason=None,
            created_at=now - timedelta(minutes=45),
            updated_at=now - timedelta(minutes=10)
        ),
        # COMPLETED (driver D201 released back to AVAILABLE)
        Ride(
            id="R504",
            user_id="U104",
            driver_id="D201",
            pickup_latitude=11.0168,
            pickup_longitude=76.9558,
            pickup_address="Gandhipuram Bus Stand",
            destination_latitude=10.9987,
            destination_longitude=76.9600,
            destination_address="Coimbatore Railway Station",
            status="COMPLETED",
            estimated_fare=85.0,
            final_fare=85.0,
            cancellation_reason=None,
            created_at=now - timedelta(hours=2),
            updated_at=now - timedelta(hours=1, minutes=30)
        ),
        # CANCELLED
        Ride(
            id="R505",
            user_id="U105",
            driver_id=None,
            pickup_latitude=11.0250,
            pickup_longitude=76.9500,
            pickup_address="Saibaba Colony 5th Cross",
            destination_latitude=11.0005,
            destination_longitude=76.9850,
            destination_address="Ramanathapuram Signal",
            status="CANCELLED",
            estimated_fare=110.0,
            final_fare=None,
            cancellation_reason="Driver taking too long to accept (User cancelled)",
            created_at=now - timedelta(hours=3),
            updated_at=now - timedelta(hours=2, minutes=50)
        ),
    ]
    db.add_all(rides)
    db.commit()

    # 4. Seed Payments
    payments = [
        Payment(
            id="PAY_DEMO001",
            ride_id="R504",
            amount=85.0,
            payment_method="UPI",
            payment_status="COMPLETED",
            transaction_reference="TXN_UPI_9988223344",
            created_at=now - timedelta(hours=1, minutes=30)
        )
    ]
    db.add_all(payments)
    db.commit()

    # 5. Seed Notifications
    notifications = [
        Notification(id="NOTIF_01", user_id="U101", ride_id="R501", message="Ride R501 requested. Looking for drivers near Gandhipuram.", read_status=False, created_at=now - timedelta(minutes=15)),
        Notification(id="NOTIF_02", user_id="U102", ride_id="R502", message="Driver Vigneshwaran S accepted your ride R502.", read_status=True, created_at=now - timedelta(minutes=20)),
        Notification(id="NOTIF_03", user_id="U103", ride_id="R503", message="Trip R503 is now IN_PROGRESS. Enjoy your ride to Saravanampatti.", read_status=False, created_at=now - timedelta(minutes=10)),
        Notification(id="NOTIF_04", user_id="U104", ride_id="R504", message="Trip R504 completed. Payment of ₹85.00 confirmed.", read_status=True, created_at=now - timedelta(hours=1, minutes=30)),
    ]
    db.add_all(notifications)
    db.commit()

    # Flush caches
    cache_service.invalidate_driver_cache()
    for r in ["R501", "R502", "R503", "R504", "R505"]:
        cache_service.invalidate_ride_cache(r)

if __name__ == "__main__":
    db = SessionLocal()
    seed_database(db)
    db.close()
    print("Demo database successfully initialized and seeded with realistic records!")
