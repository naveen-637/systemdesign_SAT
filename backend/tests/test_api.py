import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.seed import seed_database
from backend.app.services.pricing_service import haversine_distance, pricing_service

TEST_DB_PATH = "./test_ridesharing.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

import backend.app.services.notification_service as notif_svc
notif_svc.SessionLocal = TestingSessionLocal
app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_database(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except Exception:
            pass

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

# 1. Successful ride request
def test_1_successful_ride_request(client):
    payload = {
        "userId": "U101",
        "pickup": {
            "lat": 11.0168,
            "lng": 76.9558,
            "address": "Coimbatore Pickup Junction"
        },
        "destination": {
            "lat": 10.9987,
            "lng": 76.9600,
            "address": "Coimbatore Destination Station"
        }
    }
    response = client.post("/api/rides", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "rideId" in data
    assert data["userId"] == "U101"
    assert data["status"] == "REQUESTED"
    assert data["message"] == "Ride requested successfully"

# 2. Invalid ride request (invalid coordinates or missing address)
def test_2_invalid_ride_request(client):
    invalid_payload = {
        "userId": "U101",
        "pickup": {
            "lat": 150.0,
            "lng": 76.9558,
            "address": "Invalid Latitude"
        },
        "destination": {
            "lat": 10.9987,
            "lng": 76.9600,
            "address": "Destination"
        }
    }
    response = client.post("/api/rides", json=invalid_payload)
    assert response.status_code == 422

    missing_address = {
        "userId": "U101",
        "pickup": {
            "lat": 11.0,
            "lng": 76.9,
            "address": "Pickup"
        },
        "destination": {
            "lat": 11.1,
            "lng": 76.8,
            "address": ""
        }
    }
    response2 = client.post("/api/rides", json=missing_address)
    assert response2.status_code == 422

# 3. Nearby-driver search
def test_3_nearby_driver_search(client):
    response = client.get("/api/drivers/nearby?lat=11.0168&lng=76.9558&radius_km=5")
    assert response.status_code == 200
    drivers = response.json()
    assert isinstance(drivers, list)
    assert len(drivers) > 0

    for d in drivers:
        assert d["availabilityStatus"] == "AVAILABLE"
        assert "driverId" in d
        assert "name" in d
        assert "distanceKm" in d
        assert d["distanceKm"] <= 5.0

    distances = [d["distanceKm"] for d in drivers]
    assert distances == sorted(distances)

# 4. Successful driver acceptance
def test_4_successful_driver_acceptance(client):
    accept_payload = {"driverId": "D201"}
    response = client.post("/api/rides/R501/accept", json=accept_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["rideId"] == "R501"
    assert data["status"] == "ACCEPTED"
    assert data["driverId"] == "D201"

    driver_resp = client.get("/api/drivers")
    d201 = next(d for d in driver_resp.json() if d["id"] == "D201")
    assert d201["availabilityStatus"] == "BUSY"

# 5. Prevention of double assignment
def test_5_prevention_of_double_assignment(client):
    client.post("/api/rides/R501/accept", json={"driverId": "D201"})

    response2 = client.post("/api/rides/R501/accept", json={"driverId": "D202"})
    assert response2.status_code == 409
    assert "no longer available" in response2.json()["detail"]

# 6. Ride status retrieval
def test_6_ride_status_retrieval(client):
    response = client.get("/api/rides/R501/status")
    assert response.status_code == 200
    data = response.json()
    assert data["rideId"] == "R501"
    assert data["status"] == "REQUESTED"
    assert "pickup" in data
    assert "destination" in data
    assert "estimatedFare" in data

# 7. Successful cancellation
def test_7_successful_cancellation(client):
    cancel_payload = {"reason": "Change of travel plans"}
    response = client.patch("/api/rides/R501/cancel", json=cancel_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["rideId"] == "R501"
    assert data["status"] == "CANCELLED"
    assert data["cancellationReason"] == "Change of travel plans"

    status_resp = client.get("/api/rides/R501/status")
    assert status_resp.json()["status"] == "CANCELLED"

# 8. Cancellation of a nonexistent ride
def test_8_cancellation_of_nonexistent_ride(client):
    response = client.patch("/api/rides/R999999/cancel", json={"reason": "Test"})
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

# 9. Invalid ride state transition
def test_9_invalid_ride_state_transition(client):
    start_resp = client.post("/api/rides/R504/start")
    assert start_resp.status_code == 409

    cancel_resp = client.patch("/api/rides/R504/cancel", json={"reason": "Cannot cancel completed"})
    assert cancel_resp.status_code == 409

    start_unaccepted = client.post("/api/rides/R501/start")
    assert start_unaccepted.status_code == 409

# 10. Ride start and completion
def test_10_ride_start_and_completion(client):
    client.post("/api/rides/R501/accept", json={"driverId": "D201"})

    start_resp = client.post("/api/rides/R501/start")
    assert start_resp.status_code == 200
    assert start_resp.json()["status"] == "IN_PROGRESS"

    comp_resp = client.post("/api/rides/R501/complete")
    assert comp_resp.status_code == 200
    assert comp_resp.json()["status"] == "COMPLETED"
    assert "finalFare" in comp_resp.json()

    driver_resp = client.get("/api/drivers")
    d201 = next(d for d in driver_resp.json() if d["id"] == "D201")
    assert d201["availabilityStatus"] == "AVAILABLE"

# 11. Fare calculation
def test_11_fare_calculation(client):
    dist = haversine_distance(11.0168, 76.9558, 10.9987, 76.9600)
    assert dist > 1.0
    fare_info = pricing_service.estimate_fare(11.0168, 76.9558, 10.9987, 76.9600)
    assert fare_info["estimatedFare"] >= fare_info["baseFare"]
    assert fare_info["distanceKm"] == dist

    payload = {
        "pickup": {"lat": 11.0168, "lng": 76.9558, "address": "Gandhipuram"},
        "destination": {"lat": 10.9987, "lng": 76.9600, "address": "Junction"}
    }
    resp = client.post("/api/pricing/estimate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["estimatedFare"] > 0
    assert data["distanceKm"] > 0

# 12. Payment creation
def test_12_payment_creation(client):
    payment_payload = {
        "rideId": "R504",
        "amount": 85.0,
        "paymentMethod": "UPI"
    }
    resp = client.post("/api/payments", json=payment_payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["rideId"] == "R504"
    assert data["amount"] == 85.0
    assert data["paymentStatus"] == "COMPLETED"
    assert "transactionReference" in data

    resp2 = client.post("/api/payments", json=payment_payload)
    assert resp2.status_code == 201
    assert resp2.json()["transactionReference"] == data["transactionReference"]

# 13. Health endpoint
def test_13_health_endpoint(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ["HEALTHY", "DEGRADED"]
    assert "database" in data
    assert "cache" in data
    assert "messageBroker" in data
