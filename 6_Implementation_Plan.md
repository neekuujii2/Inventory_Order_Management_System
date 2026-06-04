# Implementation Plan
## Inventory & Order Management System (IMS)

**Version:** 1.0.0  
**Date:** 2025

---

## 1. Overview

Total estimated time: **8 working days** (solo engineer)

| Phase | Days | Focus |
|-------|------|-------|
| Phase 0 | 0.5 | Repo setup, Docker scaffold |
| Phase 1 | 2.5 | Backend API (FastAPI + PostgreSQL) |
| Phase 2 | 3.0 | Frontend React application |
| Phase 3 | 1.0 | Integration, Docker Compose, testing |
| Phase 4 | 1.0 | Deployment + submission |

---

## 2. Phase 0 — Project Scaffolding (0.5 days)

### Tasks
- [ ] Create GitHub repository
- [ ] Set up monorepo structure:
  ```
  ims-project/
  ├── backend/
  ├── frontend/
  ├── docker-compose.yml
  ├── docker-compose.override.yml   ← dev overrides
  └── README.md
  ```
- [ ] Create `.gitignore` (Python + Node + .env)
- [ ] Initialize `backend/` with virtual env
- [ ] Initialize `frontend/` with Vite + React
- [ ] Create initial `docker-compose.yml` skeleton

### Deliverables
- Empty but structured repo pushed to GitHub
- Docker Compose with postgres service running

---

## 3. Phase 1 — Backend Development (2.5 days)

### Day 1 — Database & Core Setup

#### Step 1.1: Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              ← FastAPI app, CORS, include routers
│   ├── database.py          ← SQLAlchemy engine, session, Base
│   ├── config.py            ← pydantic Settings from env
│   ├── models/
│   │   ├── __init__.py
│   │   ├── product.py
│   │   ├── customer.py
│   │   └── order.py
│   ├── schemas/
│   │   ├── product.py
│   │   ├── customer.py
│   │   └── order.py
│   ├── routers/
│   │   ├── products.py
│   │   ├── customers.py
│   │   ├── orders.py
│   │   └── dashboard.py
│   └── crud/
│       ├── product.py
│       ├── customer.py
│       └── order.py
├── alembic/
├── alembic.ini
├── requirements.txt
├── Dockerfile
└── .dockerignore
```

#### Step 1.2: `requirements.txt`
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9
pydantic[email]==2.5.2
python-dotenv==1.0.0
```

#### Step 1.3: `app/config.py`
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

#### Step 1.4: `app/main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import products, customers, orders, dashboard
from app.database import engine, Base

Base.metadata.create_all(bind=engine)  # or use alembic

app = FastAPI(title="IMS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router, prefix="/products", tags=["Products"])
app.include_router(customers.router, prefix="/customers", tags=["Customers"])
app.include_router(orders.router, prefix="/orders", tags=["Orders"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])

@app.get("/health")
def health():
    return {"status": "ok"}
```

---

### Day 1–2 — CRUD Implementation

#### Products Router Template
```python
# app/routers/products.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud, schemas

router = APIRouter()

@router.post("/", response_model=schemas.ProductResponse, status_code=201)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    existing = crud.product.get_by_sku(db, product.sku)
    if existing:
        raise HTTPException(400, "SKU already exists")
    return crud.product.create(db, product)

@router.get("/", response_model=list[schemas.ProductResponse])
def list_products(db: Session = Depends(get_db)):
    return crud.product.get_all(db)

@router.get("/{id}", response_model=schemas.ProductResponse)
def get_product(id: int, db: Session = Depends(get_db)):
    product = crud.product.get_by_id(db, id)
    if not product:
        raise HTTPException(404, "Product not found")
    return product

@router.put("/{id}", response_model=schemas.ProductResponse)
def update_product(id: int, data: schemas.ProductUpdate, db: Session = Depends(get_db)):
    product = crud.product.update(db, id, data)
    if not product:
        raise HTTPException(404, "Product not found")
    return product

@router.delete("/{id}", status_code=204)
def delete_product(id: int, db: Session = Depends(get_db)):
    if not crud.product.delete(db, id):
        raise HTTPException(404, "Product not found")
```

#### Apply same pattern for Customers and Orders routers

---

### Day 2.5 — Order Business Logic + Docker

#### Order CRUD (transactional)
See Backend Schema Document Section 5.1 for full implementation.

#### Backend Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

#### `.dockerignore`
```
__pycache__/
*.pyc
.env
.venv/
venv/
*.egg-info/
.pytest_cache/
```

---

## 4. Phase 2 — Frontend Development (3 days)

### Day 3 — Setup + Layout + Dashboard

#### Step 2.1: Vite + React Setup
```bash
cd frontend
npm create vite@latest . -- --template react
npm install react-router-dom @tanstack/react-query axios \
  react-hook-form zustand react-hot-toast recharts \
  @dnd-kit/core @dnd-kit/sortable
```

#### Step 2.2: Folder Structure
```
frontend/src/
├── main.jsx
├── App.jsx
├── components/
│   ├── layout/
│   │   ├── TopNav.jsx
│   │   └── Footer.jsx
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Modal.jsx
│   │   ├── Badge.jsx
│   │   ├── Skeleton.jsx
│   │   └── Toast.jsx
│   ├── dashboard/
│   │   ├── MetricCard.jsx
│   │   ├── KanbanBoard.jsx
│   │   └── RevenueChart.jsx
│   ├── products/
│   ├── customers/
│   └── orders/
├── pages/
│   ├── DashboardPage.jsx
│   ├── ProductsPage.jsx
│   ├── CustomersPage.jsx
│   ├── OrdersPage.jsx
│   ├── CreateOrderPage.jsx
│   ├── OrderDetailPage.jsx
│   └── NotFoundPage.jsx
├── services/
│   ├── api.js
│   ├── products.js
│   ├── customers.js
│   ├── orders.js
│   └── dashboard.js
├── hooks/
│   ├── useProducts.js
│   ├── useCustomers.js
│   └── useOrders.js
└── styles/
    ├── globals.css
    └── variables.css
```

#### Step 2.3: API Service Layer
```javascript
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.detail || 'Something went wrong';
    return Promise.reject(new Error(msg));
  }
);

export default api;
```

---

### Day 4 — Products + Customers Pages

#### Products Page Checklist
- [ ] Table with all products (ID, Name, SKU, Price, Stock, Actions)
- [ ] Search bar (client-side filter)
- [ ] "Add Product" button → opens Modal
- [ ] Add Product Modal (form with validation)
- [ ] Edit product inline or via modal
- [ ] Delete with confirmation modal
- [ ] Low stock badge on quantity < 10
- [ ] Skeleton loading state

#### Customers Page Checklist
- [ ] Table with all customers (ID, Name, Email, Phone, Actions)
- [ ] "Add Customer" button → opens Modal
- [ ] Delete with confirmation modal
- [ ] Skeleton loading state

---

### Day 5 — Orders Pages + Remaining Components

#### Orders Page Checklist
- [ ] Orders table (ID, Customer, Items Count, Total, Status, Date, Actions)
- [ ] Status filter tabs (All / Pending / Fulfilled / Cancelled)
- [ ] Click row → navigate to order detail
- [ ] Delete/Cancel order

#### Create Order Page Checklist
- [ ] Customer dropdown (searchable)
- [ ] Dynamic product line items (add/remove rows)
- [ ] Each row: product selector, quantity input, calculated subtotal
- [ ] Order summary sidebar with estimated total
- [ ] Submit → POST /orders
- [ ] Handle insufficient stock error gracefully

#### Feature Zigzag Section
- [ ] Alternating rows: text | visual, visual | text
- [ ] Scroll-triggered fade-in animation
- [ ] 4–6 features highlighted

#### 404 Page
- [ ] Large "404" in JetBrains Mono, teal
- [ ] Clear message
- [ ] "Back to Dashboard" CTA + "Contact Support" CTA

#### Skeleton Components
- [ ] `<SkeletonTable>` — 8 rows, shimmer
- [ ] `<SkeletonCards>` — 4 metric card skeletons
- [ ] `<SkeletonChart>` — rectangular shimmer block

#### Footer
- [ ] Single row: Logo + nav links + copyright
- [ ] Responsive: stack on mobile

---

### Frontend Dockerfile
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### `nginx.conf`
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;
  
  location / {
    try_files $uri $uri/ /index.html;
  }
  
  location /api {
    proxy_pass http://backend:8000;
  }
}
```

---

## 5. Phase 3 — Integration & Testing (1 day)

### `docker-compose.yml` (Final)
```yaml
version: "3.9"

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      CORS_ORIGINS: ${CORS_ORIGINS}
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_URL: ${VITE_API_URL}
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  pg_data:
```

### `.env` (root)
```
POSTGRES_USER=imsuser
POSTGRES_PASSWORD=imspassword123
POSTGRES_DB=imsdb
CORS_ORIGINS=http://localhost:3000
VITE_API_URL=http://localhost:8000
```

### Integration Testing Checklist
- [ ] `docker-compose up --build` starts all 3 services
- [ ] Frontend loads at `http://localhost:3000`
- [ ] FastAPI docs accessible at `http://localhost:8000/docs`
- [ ] Create a product via UI → appears in list
- [ ] Create a customer via UI
- [ ] Create an order linking both → stock reduced
- [ ] Attempt order with zero stock → error shown
- [ ] Dashboard shows correct counts

---

## 6. Phase 4 — Deployment (1 day)

### Step 4.1: Push Docker Image to Docker Hub
```bash
docker build -t yourusername/ims-backend:latest ./backend
docker push yourusername/ims-backend:latest
```

### Step 4.2: Deploy Backend to Render
1. Create new Web Service on Render
2. Connect GitHub repo → `backend/` directory
3. Set environment variables:
   - `DATABASE_URL` (from Render PostgreSQL add-on)
   - `CORS_ORIGINS` = frontend Vercel URL
4. Deploy

### Step 4.3: Deploy Frontend to Vercel
```bash
cd frontend
vercel --prod
# Set env var: VITE_API_URL = https://your-backend.render.com
```

### Step 4.4: Final Verification
- [ ] Backend health: `GET https://your-backend.render.com/health`
- [ ] Swagger docs: `https://your-backend.render.com/docs`
- [ ] Frontend loads: `https://your-app.vercel.app`
- [ ] Full order creation flow works on live URLs
- [ ] All Docker Hub images are public

---

## 7. Submission Checklist

- [ ] GitHub repo (public) with all code
- [ ] `README.md` with setup instructions and live URLs
- [ ] Docker Hub image: `yourusername/ims-backend:latest`
- [ ] Live frontend URL (Vercel/Netlify)
- [ ] Live backend API URL (Render/Railway/Fly.io)

---

## 8. README Template

```markdown
# Inventory & Order Management System (IMS)

## Live URLs
- **Frontend:** https://your-app.vercel.app
- **Backend API:** https://your-backend.render.com
- **API Docs:** https://your-backend.render.com/docs
- **Docker Hub:** https://hub.docker.com/r/yourusername/ims-backend

## Local Development
### Prerequisites
- Docker & Docker Compose v2
- Node.js 20+ (for frontend dev without Docker)
- Python 3.11+ (for backend dev without Docker)

### Run with Docker
\`\`\`bash
cp .env.example .env
docker-compose up --build
\`\`\`
Frontend: http://localhost:3000  
Backend:  http://localhost:8000

### Environment Variables
Copy `.env.example` to `.env` and fill in values.
```

---

*End of Implementation Plan*
