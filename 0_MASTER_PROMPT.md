# MASTER PROMPT — Inventory & Order Management System (IMS)
## Complete Build Instructions for AI Assistant

---

> **HOW TO USE THIS PROMPT:**  
> Paste this entire document into any capable AI coding assistant (Claude, Cursor, GPT-4, etc.) to generate the complete Inventory & Order Management System. The prompt is self-contained and ordered — follow each section in sequence.

---

## SYSTEM CONTEXT

You are an expert full-stack engineer. Build a complete, production-ready **Inventory & Order Management System (IMS)** from scratch. The system manages Products, Customers, and Orders for a business. Output working, deployable code with zero placeholders unless explicitly marked.

**Tech Stack:**
- Backend: Python 3.11 + FastAPI + SQLAlchemy 2 + PostgreSQL 15 + Alembic
- Frontend: React 18 + Vite + TailwindCSS (or CSS variables) + React Query + React Router v6 + React Hook Form + Recharts + @dnd-kit
- Infra: Docker + Docker Compose v2 + Nginx
- Deploy: Render (backend) + Vercel (frontend) + Docker Hub

---

## DESIGN SYSTEM (apply to ALL frontend code)

### Color Palette (CSS Variables)
```css
:root {
  --bg-base:        #0F172A;
  --bg-surface:     #1E293B;
  --bg-elevated:    #334155;
  --border:         #475569;
  --accent:         #0D9488;
  --accent-hover:   #0F766E;
  --accent-light:   #CCFBF1;
  --text-primary:   #F1F5F9;
  --text-secondary: #94A3B8;
  --text-disabled:  #475569;
  --success:        #10B981;
  --warning:        #F59E0B;
  --danger:         #EF4444;
  --info:           #3B82F6;
}
```

### Typography
- Display/Logo: `DM Serif Display` 400
- Headings: `Sora` 600/700
- Body/UI: `Inter` 400/500
- KPI Numbers: `JetBrains Mono` 600

### Design Rules
1. Dark theme throughout — background `#0F172A`, cards `#1E293B`
2. Teal `#0D9488` is the sole primary accent — no purple gradients
3. Status colors: amber (pending/warning), emerald (success/fulfilled), red (danger/cancelled)
4. Generous padding (16–24px), subtle rounded corners (8–12px)
5. Smooth transitions on all interactive elements (150–200ms ease)
6. NO flat/generic designs — premium SaaS aesthetic
7. Font import via Google Fonts CDN

---

## PART 1 — BACKEND (FastAPI + PostgreSQL)

### 1.1 File: `backend/requirements.txt`
Generate a `requirements.txt` with these exact packages:
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9
pydantic[email]==2.5.2
pydantic-settings==2.1.0
python-dotenv==1.0.0
```

### 1.2 File: `backend/app/config.py`
Create a pydantic-settings `Settings` class reading from environment:
- `database_url: str`
- `cors_origins: str = "http://localhost:3000,http://localhost:5173"`

### 1.3 File: `backend/app/database.py`
Create SQLAlchemy engine + SessionLocal + Base + `get_db()` dependency.
- pool_size=5, max_overflow=10, pool_pre_ping=True
- Read DATABASE_URL from Settings

### 1.4 Files: `backend/app/models/`

**`product.py`** — Table `products`:
- id (PK, SERIAL)
- name (VARCHAR 200, NOT NULL)
- sku (VARCHAR 50, UNIQUE, NOT NULL, indexed)
- price (NUMERIC 10,2, CHECK > 0)
- quantity (INTEGER, DEFAULT 0, CHECK >= 0)
- created_at, updated_at (TIMESTAMP WITH TIME ZONE, auto-managed)

**`customer.py`** — Table `customers`:
- id (PK, SERIAL)
- full_name (VARCHAR 200, NOT NULL)
- email (VARCHAR 254, UNIQUE, NOT NULL, indexed)
- phone (VARCHAR 20, NOT NULL)
- created_at (TIMESTAMP WITH TIME ZONE)
- Relationship: orders → back_populates

**`order.py`** — Tables `orders` + `order_items`:
- orders: id, customer_id (FK → customers), status (ENUM: pending/fulfilled/cancelled, DEFAULT pending), total_amount (NUMERIC 12,2), created_at
- order_items: id, order_id (FK → orders, CASCADE DELETE), product_id (FK → products, RESTRICT), quantity (CHECK > 0), unit_price (NUMERIC 10,2)
- Relationships: order → customer, order → items, item → product

### 1.5 Files: `backend/app/schemas/`

**`product.py`**:
- `ProductBase`: name, sku, price (> 0 validator), quantity (>= 0 validator)
- `ProductCreate(ProductBase)`
- `ProductUpdate`: all Optional fields (name, price, quantity)
- `ProductResponse(ProductBase)`: + id, created_at, updated_at; `from_attributes = True`

**`customer.py`**:
- `CustomerBase`: full_name, email (EmailStr), phone
- `CustomerCreate(CustomerBase)`
- `CustomerResponse(CustomerBase)`: + id, created_at

**`order.py`**:
- `OrderItemInput`: product_id, quantity
- `OrderCreate`: customer_id, items: List[OrderItemInput]
- `OrderItemResponse`: product_id, product_name, quantity, unit_price, subtotal
- `OrderResponse`: id, customer_id, customer_name, status, total_amount, items, created_at

### 1.6 Files: `backend/app/crud/`

**`product.py`**: Functions: `get_by_id`, `get_by_sku`, `get_all`, `create`, `update`, `delete`

**`customer.py`**: Functions: `get_by_id`, `get_by_email`, `get_all`, `create`, `delete`

**`order.py`**: Function `create_order` — CRITICAL TRANSACTION:
1. For each item: lock product row WITH FOR UPDATE
2. Validate product exists → 404 if not
3. Validate product.quantity >= requested → 400 with human message: "Insufficient stock for '[name]'. Available: X, Requested: Y"
4. Calculate subtotal = price × quantity; accumulate total
5. Create Order record (db.flush() for ID)
6. Create OrderItem records
7. Decrement each product.quantity
8. db.commit()
9. Return refreshed order

Also: `get_all`, `get_by_id` (with eager-loaded customer + items + product names), `delete_by_id`

### 1.7 Files: `backend/app/routers/`

**`products.py`**:
- POST `/` → 201, check SKU uniqueness → 400
- GET `/` → 200 list
- GET `/{id}` → 200 or 404
- PUT `/{id}` → 200 or 404; validate quantity >= 0
- DELETE `/{id}` → 204 or 404

**`customers.py`**:
- POST `/` → 201, check email uniqueness → 400
- GET `/` → 200 list
- GET `/{id}` → 200 or 404
- DELETE `/{id}` → 204 or 404

**`orders.py`**:
- POST `/` → 201, delegates to create_order (catches HTTPException)
- GET `/` → 200 list
- GET `/{id}` → 200 or 404
- DELETE `/{id}` → 204 or 404

**`dashboard.py`**:
- GET `/stats` → { total_products, total_customers, total_orders, low_stock: Product[] (quantity < 10), recent_revenue: float }

### 1.8 File: `backend/app/main.py`
- FastAPI app with title "IMS API v1.0"
- CORSMiddleware with origins from settings.cors_origins.split(",")
- Include all 4 routers with correct prefixes and tags
- `GET /health` → `{"status": "ok", "version": "1.0.0"}`
- Auto-create tables on startup (or use alembic)

### 1.9 File: `backend/Dockerfile`
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

### 1.10 File: `backend/.dockerignore`
```
__pycache__/
*.pyc
.env
.venv/
venv/
*.egg-info/
.pytest_cache/
alembic/versions/
```

---

## PART 2 — FRONTEND (React + Vite)

### 2.1 Install Dependencies
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install react-router-dom@6 @tanstack/react-query axios react-hook-form \
  zustand react-hot-toast recharts @dnd-kit/core @dnd-kit/sortable \
  @dnd-kit/utilities
```

### 2.2 File: `frontend/src/styles/globals.css`
Apply ALL CSS variables from the design system above. Add:
- Google Fonts import for DM Serif Display, Sora, Inter, JetBrains Mono
- Base reset: `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`
- Body: `background: var(--bg-base); color: var(--text-primary); font-family: 'Inter', sans-serif;`
- Shimmer keyframe animation for skeleton loading
- Custom scrollbar styling (thin, teal thumb)
- Smooth scroll behavior

### 2.3 File: `frontend/src/services/api.js`
Axios instance with:
- baseURL: `import.meta.env.VITE_API_URL || 'http://localhost:8000'`
- Response interceptor: extract `error.response.data.detail` or fallback message
- Export typed functions for all endpoints

### 2.4 File: `frontend/src/App.jsx`
React Router v6 setup:
```
/           → DashboardPage
/products   → ProductsPage
/customers  → CustomersPage
/orders     → OrdersPage
/orders/new → CreateOrderPage
/orders/:id → OrderDetailPage
*           → NotFoundPage
```
Wrap with: `<QueryClientProvider>`, `<Toaster>` from react-hot-toast, `<Layout>`

---

### 2.5 Component: `Layout` (TopNav + Footer + page content)

**TopNav Requirements:**
- Full-width, sticky top, height 60px
- Background `var(--bg-base)`, bottom border `1px solid var(--border)`
- Left: Logo — "[IMS]" text in DM Serif Display 24px white, with small teal square icon
- Center/Right: Nav links — Dashboard, Products, Customers, Orders
- Active link: teal color + 2px teal bottom border underline
- On mobile (< 768px): hamburger menu → slide-down nav
- Transition: link hover color change 150ms

**Footer Requirements:**
- Single row, height 56px, background `var(--bg-surface)`, top border `1px solid var(--border)`
- Left: IMS logo (small)
- Center: links — Products · Customers · Orders · Dashboard
- Right: "© 2025 IMS. All rights reserved."
- All text: `var(--text-secondary)`, 13px
- On mobile: stack to 2 rows

---

### 2.6 Page: `DashboardPage`

**Section 1 — Metric Cards Grid (4 columns, responsive to 2×2 on tablet, 1 col mobile)**

Each `MetricCard` component:
- Background `var(--bg-surface)`, border `1px solid var(--border)`, rounded-xl
- Icon in colored circle (teal bg for products, blue for customers, emerald for orders, amber for low stock)
- KPI value: JetBrains Mono 36px, `var(--text-primary)`
- Label: Inter 13px, `var(--text-secondary)`
- Sub-text: trend or description, 12px
- Cards: Total Products, Total Customers, Total Orders, Low Stock count

**Section 2 — Kanban Board (Order Status Columns)**

Three columns: PENDING (amber), FULFILLED (emerald), CANCELLED (red)

Each column:
- Header: status label + count badge
- Background `var(--bg-surface)`, rounded-xl
- Scrollable cards list

Each Order Card (draggable via @dnd-kit):
- Background `var(--bg-elevated)`, rounded-lg, padding 12px
- Order ID (mono font), Customer name, Total amount, Created date
- Click → navigate to /orders/:id
- Drag between columns updates order status (PATCH /orders/:id/status)

**Section 3 — Revenue Chart**

- Recharts `AreaChart`, full width, height 280px
- Data: last 30 days of order totals (from /dashboard/stats)
- Teal gradient fill (`var(--accent)` → transparent)
- Custom tooltip: dark bg, teal border, shows date + total
- X axis: dates (short format), Y axis: $ values
- Responsive container

**Loading State:** Show `<SkeletonDashboard>` — 4 card skeletons + kanban column skeletons + chart rectangle skeleton, all with shimmer animation.

---

### 2.7 Page: `ProductsPage`

Full-featured product management:

**Header Row:** "Products" title (Sora 24px bold) + "Add Product" button (teal bg)

**Search + Filter Bar:** search input (client-side filter on name/SKU), "Filter" dropdown

**Products Table:**
- Columns: ID, Name, SKU, Price, Stock, Actions
- Alternating row bg: `var(--bg-surface)` / `var(--bg-elevated)`
- Stock column: show amber `⚠️ LOW` badge when quantity < 10
- Actions column (shown on row hover): Edit pencil icon + Delete trash icon
- Edit icon → opens Edit Product Modal
- Delete icon → opens confirmation modal

**Add Product Modal:**
- Slide-up or centered modal, backdrop blur overlay
- Form fields: Product Name, SKU/Code, Price ($), Quantity
- React Hook Form validation: all required, price > 0, quantity >= 0
- On submit: POST /products, show success toast, close modal, refresh list
- On SKU conflict: show inline error "SKU already exists"
- Footer: Cancel (ghost) + Save Product (teal)

**Edit Product Modal:**
- Same as Add but pre-filled via GET /products/:id
- On submit: PUT /products/:id

**Delete Confirmation Modal:**
- "Delete [Product Name]?" heading
- "This action cannot be undone." subtext
- Cancel + Delete (red) buttons

**Loading:** `<SkeletonTable rows={8} />`

---

### 2.8 Page: `CustomersPage`

Similar pattern to Products:

**Customers Table:** ID, Full Name, Email, Phone, Joined Date, Actions
- Delete only (no edit in v1)
- Delete confirmation modal

**Add Customer Modal:**
- Fields: Full Name, Email (validated format), Phone
- On email conflict: inline error "Email already registered"

**Loading:** `<SkeletonTable rows={6} />`

---

### 2.9 Page: `OrdersPage`

**Header:** "Orders" + "New Order" button

**Status Filter Tabs:** All | Pending | Fulfilled | Cancelled
- Active tab: teal underline
- Clicking filters the displayed orders

**Orders Table:** ID, Customer, Items, Total, Status, Date, Actions
- Status shown as colored badge pill
- Click row → navigate to /orders/:id
- Delete/Cancel icon with confirmation

**Loading:** `<SkeletonTable rows={8} />`

---

### 2.10 Page: `CreateOrderPage`

Multi-step form for creating an order:

**Step 1 — Select Customer:**
- Searchable dropdown populated from GET /customers
- Shows customer name + email in option

**Step 2 — Add Products (dynamic line items):**
- "+ Add Item" button adds a new row
- Each row: product dropdown (from GET /products, show name + available stock), quantity input, calculated subtotal (read-only)
- Product dropdown shows stock warning if selected product quantity < requested quantity
- Remove row button (×) for each line item
- Minimum 1 item required

**Step 3 — Order Summary:**
- Table of items: Product, Qty, Unit Price, Subtotal
- Total row (bold)
- Note: "Final total calculated by server"

**Submit Button:** "Place Order" (teal, full-width on mobile)
- Shows spinner while submitting
- On success: navigate to /orders/:id with success toast
- On error (insufficient stock): show error banner with exact message from API
- Keep form state on error so user can adjust quantities

---

### 2.11 Page: `OrderDetailPage`

GET /orders/:id → display:

- Header: "Order #[id]" + Status badge + Cancel button (if not cancelled)
- Info grid: Customer name/email, Date, Status, Total Amount
- Line items table: Product, SKU, Qty, Unit Price, Subtotal
- Total row highlighted
- Back to Orders link

---

### 2.12 Page: `NotFoundPage` (404)

**Layout:** Centered vertically and horizontally, full viewport height

**Visual:**
- "404" in JetBrains Mono, 120px, color: `var(--accent)` with subtle text-shadow glow
- Dotted/grid subtle pattern background (CSS background-image)
- "Page Not Found" in Sora 28px, `var(--text-primary)`, below the number
- Paragraph: "This page doesn't exist or may have been moved. Double-check the URL or navigate home." in `var(--text-secondary)` 15px

**CTAs (two buttons, centered, horizontal on desktop):**
1. "← Back to Dashboard" — filled teal button, navigates to /
2. "Contact Support" — ghost button with teal border/text

**Animation:** 404 number has subtle floating animation (CSS keyframe, translateY ±8px, 3s ease-in-out infinite)

---

### 2.13 Component: `SkeletonLoader`

Create reusable skeleton components:

**Base `Skeleton` component:**
```jsx
// Uses CSS shimmer animation
// Props: width, height, borderRadius, className
```

**`SkeletonTable` component:**
- Renders a table-shaped skeleton
- Props: `rows` (default 8), `cols` (default 5)
- Header row: darker shimmer block
- Each data row: shimmer blocks of varying widths

**`SkeletonCards` component:**
- 4 card-shaped rectangles in a grid
- Each has: icon circle skeleton + number block + label block

**`SkeletonChart` component:**
- Full-width rectangle with shimmer

**Shimmer CSS:**
```css
@keyframes shimmer {
  0%   { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    #475569 50%,
    var(--bg-elevated) 75%
  );
  background-size: 2000px 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 6px;
}
```

---

### 2.14 Feature Zigzag Section (Component: `FeaturesSection`)

Create a `FeaturesSection` component for a potential landing/about page (also usable in Dashboard as an onboarding section for empty states):

**Layout:** Alternating rows, each row is 2 columns (60/40 split):
- Row 1: Visual LEFT, Text RIGHT
- Row 2: Text LEFT, Visual RIGHT
- Row 3: Visual LEFT, Text RIGHT
- (alternates indefinitely)

**Features to include (6 features):**
1. **Real-Time Inventory Tracking** — Visual: animated stock gauge
2. **Smart Order Management** — Visual: order flow diagram
3. **Customer Database** — Visual: customer card grid
4. **Low Stock Alerts** — Visual: amber warning dashboard widget
5. **Automated Calculations** — Visual: order total breakdown
6. **Full Docker Deployment** — Visual: containerization diagram

**Each Text Side:**
- Feature number (01, 02...) in teal, JetBrains Mono 12px
- Feature title: Sora 22px bold, text-primary
- Description: Inter 15px, text-secondary, 2–3 sentences
- Bullet points: 3 key points with teal check icons

**Each Visual Side:**
- Rounded card (var(--bg-surface)), border, subtle shadow
- Teal gradient top border (4px)
- Icon centered with teal bg circle (60px)
- Feature-specific illustration using CSS/SVG — no external images

**Animation:** On scroll into view, slide in from outside (left or right based on side), fade in. Use Intersection Observer API.

---

### 2.15 File: `frontend/Dockerfile`
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2.16 File: `frontend/nginx.conf`
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

### 2.17 File: `frontend/.dockerignore`
```
node_modules/
dist/
.env
.env.local
.git/
```

---

## PART 3 — DOCKER COMPOSE & CONFIG

### 3.1 File: `docker-compose.yml` (root)
```yaml
version: "3.9"

services:
  db:
    image: postgres:15-alpine
    restart: unless-stopped
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
    restart: unless-stopped
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
        VITE_API_URL: ${VITE_API_URL:-http://localhost:8000}
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  pg_data:
```

### 3.2 File: `.env.example` (root)
```
POSTGRES_USER=imsuser
POSTGRES_PASSWORD=changeme_strong_password
POSTGRES_DB=imsdb
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
VITE_API_URL=http://localhost:8000
```

### 3.3 File: `.gitignore` (root)
```
.env
*.pyc
__pycache__/
node_modules/
dist/
.venv/
venv/
*.egg-info/
.DS_Store
```

---

## PART 4 — QUALITY & COMPLETENESS REQUIREMENTS

### Error Handling
Every API call in the frontend must:
1. Show `<LoadingSkeleton>` while fetching
2. Show toast notification on success (react-hot-toast, green)
3. Show toast notification on error (red, with API error message)
4. Handle network errors (server unreachable)

### Validation Rules
| Field | Rule |
|-------|------|
| Product name | Required, max 200 chars |
| SKU | Required, max 50, alphanumeric + hyphens |
| Price | Required, > 0, max 2 decimal places |
| Quantity | Required, >= 0, integer |
| Customer name | Required, max 200 chars |
| Email | Required, valid email format |
| Phone | Required, 7–20 chars |
| Order customer | Required, must exist |
| Order items | At least 1 item required |
| Order quantity | Required, > 0, integer |

### Toast Messages
| Action | Toast |
|--------|-------|
| Product created | "Product added successfully" |
| Product updated | "Product updated" |
| Product deleted | "Product deleted" |
| Customer created | "Customer added successfully" |
| Customer deleted | "Customer removed" |
| Order created | "Order #[id] placed successfully" |
| Order cancelled | "Order cancelled" |
| Error | Show API error message |

---

## PART 5 — README.md

Generate a comprehensive `README.md` at the project root with:

1. Project title + description
2. Screenshots section (placeholder notes: "Dashboard", "Products", "Orders")
3. Tech stack badges/list
4. Features list (bullet points)
5. Prerequisites (Docker, Node, Python)
6. Quick Start with Docker: `cp .env.example .env && docker-compose up --build`
7. Development without Docker (backend + frontend instructions)
8. API Documentation (link to /docs)
9. Environment Variables table
10. Project Structure tree
11. Deployment instructions (Render + Vercel)
12. Live URLs section (placeholders)
13. Contributing guidelines

---

## EXECUTION ORDER

Build in this exact sequence:

1. `backend/requirements.txt`
2. `backend/app/database.py`
3. `backend/app/config.py`
4. `backend/app/models/` (product → customer → order)
5. `backend/app/schemas/` (product → customer → order)
6. `backend/app/crud/` (product → customer → order)
7. `backend/app/routers/` (products → customers → orders → dashboard)
8. `backend/app/main.py`
9. `backend/Dockerfile` + `.dockerignore`
10. `frontend/` Vite init + npm install
11. `frontend/src/styles/globals.css`
12. `frontend/src/services/api.js` + all service files
13. `frontend/src/components/layout/TopNav.jsx`
14. `frontend/src/components/layout/Footer.jsx`
15. `frontend/src/components/ui/` (Skeleton, Button, Modal, Badge)
16. `frontend/src/pages/DashboardPage.jsx` (with MetricCards, Kanban, Chart)
17. `frontend/src/pages/ProductsPage.jsx`
18. `frontend/src/pages/CustomersPage.jsx`
19. `frontend/src/pages/OrdersPage.jsx`
20. `frontend/src/pages/CreateOrderPage.jsx`
21. `frontend/src/pages/OrderDetailPage.jsx`
22. `frontend/src/pages/NotFoundPage.jsx`
23. `frontend/src/components/FeaturesSection.jsx`
24. `frontend/src/App.jsx`
25. `frontend/Dockerfile` + `nginx.conf` + `.dockerignore`
26. `docker-compose.yml`
27. `.env.example`
28. `.gitignore`
29. `README.md`

---

## FINAL CHECKS

After generating all files, verify:
- [ ] No hardcoded database credentials anywhere
- [ ] All env vars read from `.env` / environment
- [ ] `docker-compose up --build` would work
- [ ] All 14 REST endpoints implemented (5 products + 4 customers + 4 orders + 1 dashboard)
- [ ] Order creation reduces stock atomically
- [ ] Insufficient stock returns 400 with clear message
- [ ] SKU uniqueness enforced → 400
- [ ] Email uniqueness enforced → 400
- [ ] Quantity cannot go negative
- [ ] All pages show skeleton while loading
- [ ] Toast notifications on all mutations
- [ ] 404 page handles unknown routes
- [ ] Footer is single-row minimal
- [ ] Dashboard has metric cards + kanban + chart
- [ ] Features section uses zigzag alternating layout
- [ ] Design uses the defined color palette throughout
- [ ] No purple gradients or generic AI design

---

*End of Master Prompt*
