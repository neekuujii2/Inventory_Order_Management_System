# Inventory Order Management System (IMS)

## Overview
IMS is a comprehensive system built for managing products, customers, and orders with full transaction support. It features a modern React frontend and a FastAPI backend powered by PostgreSQL.

## Features
- **Products**: Manage your product catalog, prices, and stock.
- **Customers**: Maintain your customer base with detailed information.
- **Orders**: Create orders transactionally with automatic stock reduction.
- **Dashboard**: Get insights into revenue, low stock items, and recent activity.

## Tech Stack
- **Frontend**: React 19, Vite, React Router, React Query, Zustand, React Hook Form.
- **Backend**: FastAPI, SQLAlchemy, Pydantic, PostgreSQL.
- **Containerization**: Docker & Docker Compose.

## Running Locally

### Using Docker Compose (Recommended)
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Start the services:
   ```bash
   docker-compose up --build
   ```
3. Access the application:
   - Frontend: `http://localhost:8080`
   - Backend API Docs: `http://localhost:8000/docs`

### Manual Setup
**Backend**:
```bash
cd backend
python -m venv venv
source venv/bin/activate # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

## Architecture Details
The system utilizes a transactional order creation process. When an order is placed, PostgreSQL row-level locks (`with_for_update()`) are acquired to prevent race conditions during concurrent requests.
