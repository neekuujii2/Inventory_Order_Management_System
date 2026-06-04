# IMS Implementation Todo

Source of truth: `0_MASTER_PROMPT.md`, supported by `1_PRD.md` through `6_Implementation_Plan.md`.

## Overall Status

- Project state: `planned`
- Build mode: `follow spec exactly`
- Current implementation coverage: `0%`

## Phase 0: Repository And Setup

- [x] Initialize dedicated git repository for this project
- [x] Add project `README.md`
- [x] Add root `.gitignore`
- [x] Push initial planning docs to GitHub remote
- [ ] Create backend folder structure
- [ ] Create frontend Vite app
- [ ] Add root `docker-compose.yml`
- [ ] Add root `.env.example`

## Phase 1: Backend

### Backend Core
- [ ] Create `backend/requirements.txt`
- [ ] Create `backend/app/config.py`
- [ ] Create `backend/app/database.py`
- [ ] Create `backend/app/main.py`
- [ ] Add backend `Dockerfile`
- [ ] Add backend `.dockerignore`

### Models
- [ ] Create `backend/app/models/product.py`
- [ ] Create `backend/app/models/customer.py`
- [ ] Create `backend/app/models/order.py`
- [ ] Create model package exports

### Schemas
- [ ] Create `backend/app/schemas/product.py`
- [ ] Create `backend/app/schemas/customer.py`
- [ ] Create `backend/app/schemas/order.py`
- [ ] Create schema package exports

### CRUD
- [ ] Create `backend/app/crud/product.py`
- [ ] Create `backend/app/crud/customer.py`
- [ ] Create `backend/app/crud/order.py`
- [ ] Implement transactional order creation with row locking

### Routers
- [ ] Create `backend/app/routers/products.py`
- [ ] Create `backend/app/routers/customers.py`
- [ ] Create `backend/app/routers/orders.py`
- [ ] Create `backend/app/routers/dashboard.py`
- [ ] Include routers in `main.py`

### Backend Validation
- [ ] Enforce SKU uniqueness
- [ ] Enforce email uniqueness
- [ ] Enforce quantity non-negative
- [ ] Enforce insufficient-stock 400 response
- [ ] Implement health endpoint
- [ ] Ensure all env vars come from environment

## Phase 2: Frontend

### Frontend Setup
- [ ] Initialize `frontend/` with Vite React
- [ ] Install frontend dependencies from spec
- [ ] Create `frontend/src/styles/globals.css`
- [ ] Create `frontend/src/services/api.js`
- [ ] Create route structure in `frontend/src/App.jsx`

### Layout And Shared UI
- [ ] Create `Layout`
- [ ] Create `TopNav`
- [ ] Create `Footer`
- [ ] Create `Skeleton` base component
- [ ] Create `SkeletonTable`
- [ ] Create `SkeletonCards`
- [ ] Create `SkeletonChart`
- [ ] Create shared `Button`
- [ ] Create shared `Modal`
- [ ] Create shared `Badge`

### Pages
- [ ] Build `DashboardPage`
- [ ] Build `ProductsPage`
- [ ] Build `CustomersPage`
- [ ] Build `OrdersPage`
- [ ] Build `CreateOrderPage`
- [ ] Build `OrderDetailPage`
- [ ] Build `NotFoundPage`
- [ ] Build `FeaturesSection`

### Frontend Behavior
- [ ] Add React Query data fetching
- [ ] Add React Hook Form validation
- [ ] Add toast notifications for all mutations
- [ ] Add loading skeletons for all major pages
- [ ] Add mobile navigation behavior
- [ ] Add order status kanban with `@dnd-kit`
- [ ] Add revenue chart with Recharts

### Frontend Containerization
- [ ] Add frontend `Dockerfile`
- [ ] Add frontend `nginx.conf`
- [ ] Add frontend `.dockerignore`

## Phase 3: Integration

- [ ] Create root `docker-compose.yml`
- [ ] Wire backend to PostgreSQL
- [ ] Wire frontend to backend via `VITE_API_URL`
- [ ] Add CORS configuration
- [ ] Add named Postgres volume
- [ ] Verify local Docker startup

## Phase 4: Verification

- [ ] Verify all 14 REST endpoints exist
- [ ] Verify `/docs` works
- [ ] Verify order creation reduces stock atomically
- [ ] Verify insufficient stock keeps frontend form state
- [ ] Verify 404 route handling
- [ ] Verify responsive layout
- [ ] Verify no hardcoded credentials
- [ ] Verify design system is applied consistently

## Phase 5: Delivery

- [ ] Expand `README.md` to full project documentation
- [ ] Add local run instructions
- [ ] Add Docker run instructions
- [ ] Add deployment instructions
- [ ] Commit implementation changes
- [ ] Push final implementation to GitHub

## Working Rule

When a task is started, update both:
- `TODO.md`
- `implementation-tracker.json`
