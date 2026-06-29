# Enterprise Inventory & Order Management System (IMS)

A modern, full-stack enterprise-grade web application for managing products, customers, orders, multi-warehouse inventory, procurement, and more. Built with React, FastAPI, PostgreSQL, and Docker.

**Live Demo**: [Deployed on Vercel + Render](https://inventory-order-management-system-ten-nu.vercel.app)

## 🎯 Features

### Core Operations
- 📦 **Product Management** — Create, update, and delete products with SKU, barcode, and QR code tracking.
- 👥 **Customer Management** — Manage customer information and contact details.
- 🛒 **Order Management** — Create and track orders with real-time stock validation and multi-product handling.
- 📊 **Dashboard & Analytics** — Real-time KPIs, 30-day revenue charts, and a Kanban board for order status.

### Enterprise Modules
- 🔐 **Authentication & Security** — Complete JWT-based auth with session management, multi-role access control (Super Admin, Admin, Manager, Staff, Viewer), and account lockout.
- 🏢 **Multi-Warehouse Network** — Manage distributed inventory, track location capacity, and monitor utilization.
- 🚚 **Stock Transfers** — Route inventory between warehouses with approval workflows and auto-reconciliation.
- 🏭 **Procurement & Purchase Orders** — Manage suppliers, track outstanding payments, and issue multi-line purchase orders that automatically increment stock upon receipt.
- 🔄 **Returns Management** — Process customer and supplier returns with automatic stock adjustments and reason tracking.
- 📋 **Immutable Audit Logs** — Comprehensive, SOC 2 ready audit trails logging every CREATE, UPDATE, and DELETE action across the platform.
- ⚙️ **Global Settings** — Centralized control panel for system-wide configurations (Security, Inventory, Appearance).

### UI / UX
- 🎨 **Premium Modern Design** — Glassmorphism, dynamic micro-animations, curated color palettes, and sleek dark mode.
- 📱 **Responsive Design** — Fully optimized for desktop, tablet, and mobile viewing.
- ⚡ **Real-time UX** — Toast notifications, skeleton loaders, and TanStack Table (IMSDataTable) with global search and column visibility.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database**: PostgreSQL 15
- **ORM**: SQLAlchemy 2.0
- **Migration**: Alembic
- **Authentication**: PyJWT, passlib (bcrypt)
- **Deployment**: Docker, Render

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Vanilla CSS (CSS Variables, Flexbox/Grid, animations)
- **State Management**: React Query (TanStack Query v5) + Zustand
- **Forms**: React Hook Form
- **UI Components**: Custom Design System + Lucide React + react-hot-toast
- **Charts**: Recharts
- **Routing**: React Router v6
- **Deployment**: Vercel

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx
- **Package Manager**: npm / pip

---

## ⚡ Quick Start

### Prerequisites
- Docker & Docker Compose v2 (recommended)
- OR: Node.js 18+, Python 3.11+, PostgreSQL 15

### Option 1: Docker Compose (Recommended)

```bash
# Clone or navigate to project
cd Inventory_Order_Management_System

# Create .env from example
cp .env.example .env

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost (or http://localhost:8080)
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option 2: Local Development

**Backend Setup:**
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment variables file
cp .env.example .env
# Edit .env and ensure DATABASE_URL is set correctly and JWT_SECRET_KEY is populated

# Run migrations to setup database schema
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

**Frontend Setup:**
```bash
cd frontend

# Install dependencies
npm install

# Create environment variables file
cp .env.example .env.local
# Make sure VITE_API_URL points to your backend (default is http://localhost:8000)

# Start dev server
npm run dev
# Visit http://localhost:5173
```

---

## 📋 Configuration

### Environment Variables

Create `.env` file in root for Docker, or in respective directories for local dev:

```env
# Database
POSTGRES_USER=imsuser
POSTGRES_PASSWORD=changeme_strong_password
POSTGRES_DB=imsdb
DATABASE_URL=postgresql://imsuser:changeme_strong_password@localhost:5432/imsdb

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Frontend API
VITE_API_URL=http://localhost:8000

# JWT Auth
JWT_SECRET_KEY=super_secret_jwt_key_please_change_in_production
JWT_ACCESS_TOKEN_EXPIRES_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRES_DAYS=7
```

See `.env.example` inside the `backend` and root directories for all options.

---

## 📚 API Documentation

Once the backend is running, visit: **http://localhost:8000/docs** (Swagger UI) for interactive API documentation.

### Core Endpoints

```
POST /auth/login               — Authenticate and receive JWT tokens
GET  /dashboard/stats          — Dashboard KPIs
GET  /products                 — List all products
GET  /categories               — List categories
GET  /warehouses               — List warehouses and capacity
GET  /purchase-orders          — List POs
GET  /stock-transfers          — List internal stock transfers
GET  /audit-logs               — Read-only audit trail
```
*(All endpoints are protected and require a valid Bearer token)*

---

## 🔒 Default Demo Credentials

During database initialization, the application seeds dummy users representing different roles. You can log in with:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `super_admin@ims.com` | `password123` |
| Admin | `admin@ims.com` | `password123` |
| Manager | `manager@ims.com` | `password123` |
| Warehouse Mgr | `warehouse_manager@ims.com` | `password123` |
| Sales Mgr | `sales_manager@ims.com` | `password123` |
| Purchase Mgr | `purchase_manager@ims.com` | `password123` |
| Staff | `staff@ims.com` | `password123` |
| Viewer | `viewer@ims.com` | `password123` |

---

## 📁 Project Structure

```
Inventory_Order_Management_System/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── main.py            # Entry point
│   │   ├── config.py          # Configuration
│   │   ├── database.py        # Database setup
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic & Audit logic
│   │   └── routers/           # API routes (Auth, Products, POs, etc.)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── alembic/               # Database migrations
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── pages/             # All UI Pages
│   │   ├── components/        # Reusable UI components (IMSDataTable, Modals)
│   │   ├── context/           # AuthContext & state providers
│   │   ├── services/          # Axios API service layer
│   │   ├── styles/            # CSS variables and global theme
│   │   ├── App.jsx            # Router setup
│   │   └── main.jsx           # Entry point
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
│
├── docker-compose.yml         # Container orchestration
├── .env.example               # Root Environment template
├── RENDER_DEPLOYMENT.md       # Cloud deployment guide
└── README.md                  # This file
```

---

## 🚀 Deployment

### Cloud Platforms (Render, Vercel, AWS, etc.)
1. Deploy the backend API using Docker or native Python environment. Ensure `DATABASE_URL` is configured.
2. Deploy the frontend React app as a static site (e.g., Vercel, Netlify). Set `VITE_API_URL` to point to the backend domain.
3. Configure `CORS_ORIGINS` on the backend to accept requests from the frontend domain.

---

## 🐛 Troubleshooting

### "Unable to connect to server"
- Check backend is running: `docker-compose ps` or check local logs.
- Verify `VITE_API_URL` is exactly matching the backend URL (no trailing slash).
- Check `CORS_ORIGINS` includes your exact frontend URL (e.g., `http://localhost:5173`).

### Database connection failed
- Verify `DATABASE_URL` format.
- Check PostgreSQL is running.

### Invalid Credentials (Auth)
- If `password123` doesn't work, ensure you ran the seed script or that `AUTO_SEED=true` is set on first launch.
- Try creating a new account via the register page.

---

## 🗺️ Roadmap

- [x] Phase 1: Core CRUD (Products, Customers, Orders)
- [x] Phase 2: Enterprise SaaS (Auth, Warehouses, POs, Returns, Audit Logs)
- [ ] Phase 3: Reporting & Analytics Export (PDF/CSV)
- [ ] Phase 4: Real-time Notifications (WebSockets)
- [ ] Phase 5: Mobile Application (React Native)

---

**Built with ❤️ using React, FastAPI, and PostgreSQL**
