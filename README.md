# Ridesharing System Design Platform (SD-SAT)

A distributed ridesharing system simulation and reference architecture demonstrating end-to-end ridesharing workflow, real-time matching, dynamic surge pricing, event-driven domain communication, WebSockets, and interactive analytics.

---

## 🚀 Features

- **Ride Booking & Lifecycle**: Full lifecycle state machine (REQUESTED -> MATCHED -> ARRIVED -> IN_PROGRESS -> COMPLETED / CANCELLED).
- **Driver Matching & Dispatch**: Proximity matching with caching and geospatial filtering.
- **Dynamic Surge Pricing**: Real-time multiplier calculation based on regional supply & demand ratios.
- **Event-Driven Architecture**: In-memory domain event broker broadcasting updates to notification services and WebSocket subscribers.
- **Real-Time WebSockets**: Live ride updates, driver locations, and status push notifications to the frontend.
- **Interactive Dashboard**: Modern React + TypeScript + Tailwind CSS dashboard with analytics, simulation controls, and ride tracking.
- **Containerized Stack**: Docker Compose configuration for backend, frontend, PostgreSQL, and Redis.

---

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **ORM / Database**: SQLAlchemy with PostgreSQL / SQLite fallback
- **Caching & Pub/Sub**: Redis
- **Testing**: Pytest & HTTPX test client

### Frontend
- **Framework**: React 19 + TypeScript
- **Bundler & Tooling**: Vite
- **Styling**: Tailwind CSS
- **Charts & Icons**: Recharts & Lucide React
- **API Client**: Axios

---

## 📂 Project Structure

```
SD-SAT/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (rides, drivers, pricing, payments, etc.)
│   │   ├── cache/        # Redis & in-memory caching clients
│   │   ├── events/       # Event broker & domain event dispatching
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── repositories/ # Data access layer
│   │   ├── schemas/      # Pydantic validation schemas
│   │   ├── services/     # Core business logic (matching, pricing, notifications)
│   │   ├── database.py   # DB connection & session management
│   │   ├── main.py       # Application entrypoint & middleware setup
│   │   └── seed.py       # Initial seed data generator
│   ├── tests/            # Automated test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Dashboard, Ride Booking, Driver View, Analytics
│   │   ├── services/     # Axios client & WebSocket connections
│   │   └── types/        # TypeScript interfaces
│   ├── Dockerfile
│   └── package.json
├── docs/                 # Documentation & architectural diagrams
├── docker-compose.yml    # Multi-container orchestration
└── pytest.ini
```

---

## 🏁 Getting Started

### 1. Using Docker Compose (Recommended)

```bash
docker-compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

---

### 2. Manual Local Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn backend.app.main:app --reload --port 8000
```

#### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## 🧪 Running Tests

```bash
# Run backend pytest suite
pytest
```
