# 🚀 Technology Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=react,vite,python,fastapi,postgres,docker,nginx,git,github&perline=9" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white" />
  <img src="https://img.shields.io/badge/Zustand-443E38?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Recharts-FF6384?style=for-the-badge" />
  <img src="https://img.shields.io/badge/SQLAlchemy-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white" />
  <img src="https://img.shields.io/badge/Alembic-000000?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel" />
  <img src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black" />
</p>

<p align="center">
  <a href=https://github.com/neekuujii2>
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github">
  </a>

  <a href=https://www.linkedin.com/in/neeraj-kumar-b12-datascienecist/>
    <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin">
  </a>

  <a href=https://neeraj-kumar-aidevportfolio.vercel.app/>
    <img src="https://img.shields.io/badge/Portfolio-000000?style=for-the-badge&logo=vercel">
  </a>

  <a href="mailto:neerajkumar75260@email.com">
    <img src="https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail">
  </a>
</p>

# Inventory & Order Management System (IMS)

A modern, full-stack web application for managing products, customers, and orders. Built with React, FastAPI, PostgreSQL, and Docker.

**Live Demo**: [Deployed on Vercel + Render](https://inventory-order-management-system-ten-nu.vercel.app)

## 🎯 Features

- 📦 **Product Management** — Create, update, and delete products with inventory tracking
- 👥 **Customer Database** — Manage customer information and contact details
- 🛒 **Order Management** — Create and track orders with real-time status updates
- 📊 **Dashboard** — Real-time KPIs, kanban board, and revenue charts
- ⚠️ **Low Stock Alerts** — Automatic warnings for items below threshold
- 🎨 **Premium UI** — Dark theme with teal accents, professional design
- 📱 **Responsive Design** — Works perfectly on desktop, tablet, and mobile
- 🚀 **Docker Ready** — Complete Docker Compose setup for local and cloud deployment

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database**: PostgreSQL 15
- **ORM**: SQLAlchemy 2.0
- **Migration**: Alembic
- **Deployment**: Docker, Render

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: CSS Variables + Custom CSS (Design System)
- **State Management**: React Query + Zustand
- **Forms**: React Hook Form
- **UI Components**: Custom + react-hot-toast
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
cd Inventory

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

**Backend:**
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up database
export DATABASE_URL="postgresql://imsuser:password@localhost:5432/imsdb"

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local

# Start dev server
npm run dev
# Visit http://localhost:5173
```

---

## 📋 Configuration

### Environment Variables

Create `.env` file in root:

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
```

See [.env.example](.env.example) for all options.

---

## 📚 API Documentation

Visit: http://localhost:8000/docs (Swagger UI)

### Main Endpoints

```
GET  /health                    — Health check
GET  /dashboard/stats           — Dashboard KPIs
GET  /products                  — List all products
POST /products                  — Create product
PUT  /products/{id}             — Update product
DELETE /products/{id}           — Delete product
GET  /customers                 — List customers
POST /customers                 — Create customer
DELETE /customers/{id}          — Delete customer
GET  /orders                    — List orders
POST /orders                    — Create order (with transaction)
GET  /orders/{id}               — Get order details
DELETE /orders/{id}             — Cancel order
```

---

## 📁 Project Structure

```
Inventory/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── main.py            # Entry point
│   │   ├── config.py          # Configuration
│   │   ├── database.py        # Database setup
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── crud/              # CRUD operations
│   │   └── routers/           # API routes
│   ├── requirements.txt
│   ├── Dockerfile
│   └── alembic/               # Database migrations
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── pages/             # Page components
│   │   ├── components/        # UI components
│   │   ├── services/          # API layer
│   │   ├── styles/            # Global styles
│   │   ├── App.jsx            # Root
│   │   └── main.jsx           # Entry point
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
│
├── docker-compose.yml         # Container orchestration
├── .env.example               # Environment template
├── RENDER_DEPLOYMENT.md       # Cloud deployment guide
└── README.md                  # This file
```

---

## 🚀 Deployment

### Render (Recommended)

See detailed guide in [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)

Quick steps:
1. Create PostgreSQL database
2. Deploy backend (Docker)
3. Deploy frontend (Static Site)
4. Connect with environment variables

**Available on free tier** (with limitations)

### Other Platforms

Works with AWS, Google Cloud, Azure, DigitalOcean, Heroku, etc.

---

## 🔧 Development

### Database Migrations

```bash
cd backend

# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Revert
alembic downgrade -1
```

### Build for Production

```bash
# Backend
cd backend
docker build -t ims-backend:latest .

# Frontend
cd frontend
npm run build
# Output: dist/
```

---

## ✨ Key Features Explained

### Dashboard
- Real-time KPI cards (products, customers, orders, low stock)
- Kanban board for order status management
- 30-day revenue chart visualization

### Products
- Create, read, update, delete operations
- SKU uniqueness validation
- Automatic low-stock warnings

### Orders
- Multi-product order creation
- Real-time stock validation
- Automatic total calculation
- Order history and tracking

### UI/UX
- Dark theme with teal accents
- Responsive grid layouts
- Skeleton loading states
- Toast notifications
- Smooth animations

---

## 🐛 Troubleshooting

### "Unable to connect to server"
- Check backend is running: `docker-compose ps`
- Verify VITE_API_URL is correct
- Check CORS_ORIGINS includes frontend URL

### Database connection failed
- Verify DATABASE_URL format
- Check PostgreSQL is running
- Verify credentials in .env

### CORS errors
- Add frontend URL to CORS_ORIGINS
- Use https:// for production domains
- Restart backend after changes

### Port conflicts
- Change port in docker-compose.yml
- Or kill process: `lsof -i :8000` → `kill -9 <PID>`

---

## 📊 Performance Tips

1. Add database indexes for frequent queries
2. React Query caching is pre-configured
3. Optimize product images before upload
4. Consider pagination for large datasets
5. Use React.memo for expensive components

---

## 🔒 Security

- ✅ Environment variables for secrets (no hardcoding)
- ✅ Database user with limited permissions
- ✅ CORS origin validation
- ✅ Input validation on all endpoints
- 📋 TODO: Add authentication (JWT)
- 📋 TODO: Add rate limiting
- 📋 TODO: Add data encryption

---

## 📖 Docs

- API Docs: http://localhost:8000/docs
- Frontend env: See [frontend/.env.example](frontend/.env.example)
- Backend env: See [backend/.env.example](backend/.env.example)
- Deployment: See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)

---

## 🗺️ Roadmap

- [ ] User authentication (login/register)
- [ ] Order history and analytics
- [ ] Inventory forecasting
- [ ] Email notifications
- [ ] Payment integration
- [ ] Export reports (PDF/CSV)
- [ ] Mobile app (React Native)
- [ ] Real-time notifications (WebSocket)

---

**Built with ❤️ using React, FastAPI, and PostgreSQL**

For help, check the troubleshooting section or review application logs: `docker-compose logs -f`
