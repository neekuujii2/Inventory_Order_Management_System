# Technical Requirements Document (TRD)
## Inventory & Order Management System (IMS)

**Version:** 1.0.0  
**Date:** 2025  
**Status:** Approved  
**Author:** Engineering Team

---

## 1. Technology Stack

### 1.1 Required Technologies

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React (JavaScript) | 18.x |
| Backend | Python + FastAPI | 3.11 / 0.104+ |
| Database | PostgreSQL | 15.x |
| ORM | SQLAlchemy + Alembic | 2.x |
| Containerization | Docker | 24.x |
| Orchestration | Docker Compose | v2.x |
| Version Control | Git | Latest |

### 1.2 Additional Libraries

**Backend**
```
fastapi
uvicorn[standard]
sqlalchemy
alembic
psycopg2-binary
pydantic
python-dotenv
```

**Frontend**
```
react
react-dom
react-router-dom
axios
@tanstack/react-query
react-hook-form
zustand (or Context API)
tailwindcss (or styled-components)
recharts (for dashboard charts)
react-hot-toast (notifications)
```

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Compose Network                  │
│                                                             │
│  ┌──────────────┐    HTTP/JSON    ┌──────────────────────┐  │
│  │   Frontend   │ ──────────────► │   Backend (FastAPI)  │  │
│  │  React App   │ ◄────────────── │   Python 3.11        │  │
│  │  Port: 3000  │                 │   Port: 8000         │  │
│  └──────────────┘                 └──────────┬───────────┘  │
│                                              │ SQLAlchemy   │
│                                   ┌──────────▼───────────┐  │
│                                   │   PostgreSQL DB      │  │
│                                   │   Port: 5432         │  │
│                                   │   Volume: pg_data    │  │
│                                   └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. API Specification

### 3.1 Base URL
- Local: `http://localhost:8000`
- Production: `https://<backend-service>.render.com`

### 3.2 Common Headers
```
Content-Type: application/json
Accept: application/json
```

### 3.3 Product Endpoints

| Method | Path | Description | Status Codes |
|--------|------|-------------|--------------|
| POST | `/products` | Create product | 201, 400, 422 |
| GET | `/products` | List all products | 200 |
| GET | `/products/{id}` | Get product by ID | 200, 404 |
| PUT | `/products/{id}` | Update product | 200, 400, 404, 422 |
| DELETE | `/products/{id}` | Delete product | 204, 404 |

**Product Schema**
```json
{
  "id": "integer",
  "name": "string (required, max 200)",
  "sku": "string (required, unique, max 50)",
  "price": "float (required, > 0)",
  "quantity": "integer (required, >= 0)",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### 3.4 Customer Endpoints

| Method | Path | Description | Status Codes |
|--------|------|-------------|--------------|
| POST | `/customers` | Create customer | 201, 400, 422 |
| GET | `/customers` | List all customers | 200 |
| GET | `/customers/{id}` | Get customer by ID | 200, 404 |
| DELETE | `/customers/{id}` | Delete customer | 204, 404 |

**Customer Schema**
```json
{
  "id": "integer",
  "full_name": "string (required, max 200)",
  "email": "string (required, unique, valid email)",
  "phone": "string (required, max 20)",
  "created_at": "datetime"
}
```

### 3.5 Order Endpoints

| Method | Path | Description | Status Codes |
|--------|------|-------------|--------------|
| POST | `/orders` | Create order | 201, 400, 422 |
| GET | `/orders` | List all orders | 200 |
| GET | `/orders/{id}` | Get order details | 200, 404 |
| DELETE | `/orders/{id}` | Cancel order | 204, 404 |

**Order Request Schema**
```json
{
  "customer_id": "integer (required)",
  "items": [
    {
      "product_id": "integer",
      "quantity": "integer (> 0)"
    }
  ]
}
```

**Order Response Schema**
```json
{
  "id": "integer",
  "customer_id": "integer",
  "customer": { "full_name": "...", "email": "..." },
  "items": [
    {
      "product_id": "integer",
      "product_name": "string",
      "quantity": "integer",
      "unit_price": "float",
      "subtotal": "float"
    }
  ],
  "total_amount": "float",
  "status": "pending | fulfilled | cancelled",
  "created_at": "datetime"
}
```

### 3.6 Dashboard Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard/stats` | Returns aggregate counts + low-stock list |

---

## 4. Business Logic Rules (Backend Enforcement)

| Rule | Implementation |
|------|---------------|
| SKU uniqueness | Unique constraint on `products.sku` + 400 error on conflict |
| Email uniqueness | Unique constraint on `customers.email` + 400 error on conflict |
| Quantity >= 0 | Check constraint + Pydantic validator |
| Inventory check on order | Pre-transaction validation loop across all items |
| Stock reduction on order | DB transaction: UPDATE products SET quantity = quantity - X |
| Total amount calculation | Backend: SUM(item.quantity × product.price) |
| Cascade delete protection | Orders referencing customer → soft-block or cascade config |

---

## 5. Database Requirements

- PostgreSQL 15 running in Docker container
- Named volume `pg_data` for persistence
- Alembic for schema migrations
- Connection pooling via SQLAlchemy (pool_size=5, max_overflow=10)
- All timestamps stored as UTC

---

## 6. Docker Requirements

### 6.1 Backend Dockerfile
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 6.2 Frontend Dockerfile
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 6.3 Docker Compose Services

```yaml
services:
  db:
    image: postgres:15-alpine
    environment: [POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB]
    volumes: [pg_data:/var/lib/postgresql/data]

  backend:
    build: ./backend
    depends_on: [db]
    environment: [DATABASE_URL, CORS_ORIGINS]
    ports: ["8000:8000"]

  frontend:
    build: ./frontend
    depends_on: [backend]
    environment: [VITE_API_URL]
    ports: ["3000:80"]

volumes:
  pg_data:
```

---

## 7. Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@db:5432/imsdb
CORS_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app
SECRET_KEY=your-secret-key
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
```

---

## 8. Error Handling Standard

All API errors return:
```json
{
  "detail": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE"
}
```

| HTTP Code | Meaning |
|-----------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content (delete) |
| 400 | Bad Request (business rule violation) |
| 404 | Not Found |
| 422 | Validation Error (Pydantic) |
| 500 | Internal Server Error |

---

## 9. CORS Configuration

Backend must allow:
- Local dev: `http://localhost:3000`, `http://localhost:5173`
- Production: Frontend deployed URL (from env var `CORS_ORIGINS`)

---

## 10. Deployment Targets

| Service | Platform | Notes |
|---------|----------|-------|
| Backend | Render / Railway / Fly.io | Free tier; set all env vars |
| Frontend | Vercel / Netlify | Set `VITE_API_URL` to backend URL |
| Docker Image | Docker Hub | Tag as `username/ims-backend:latest` |

---

## 11. Project Structure

```
ims-project/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/
│   │   └── crud/
│   ├── alembic/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── store/
│   ├── public/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .dockerignore
├── docker-compose.yml
├── docker-compose.override.yml
└── README.md
```

---

*End of TRD*
