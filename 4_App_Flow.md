# Application Flow Document
## Inventory & Order Management System (IMS)

**Version:** 1.0.0  
**Date:** 2025

---

## 1. Overall Application Flow

```
Browser / Mobile
      │
      ▼
┌─────────────┐
│  React App  │  ← Served by Nginx (Docker) or Vercel
│  (Frontend) │
└──────┬──────┘
       │ HTTP REST (JSON)
       │ VITE_API_URL env var
       ▼
┌─────────────────┐
│  FastAPI Backend │  ← Python 3.11, Uvicorn
│  Port 8000      │
└──────┬──────────┘
       │ SQLAlchemy ORM
       ▼
┌─────────────────┐
│  PostgreSQL DB  │  ← Port 5432, Volume: pg_data
└─────────────────┘
```

---

## 2. Page & Route Map

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | KPI cards, kanban, charts |
| `/products` | Products List | All products, CRUD actions |
| `/products/new` | Add Product | Form to create product |
| `/products/:id` | Product Detail | View + edit product |
| `/customers` | Customers List | All customers, CRUD actions |
| `/customers/new` | Add Customer | Form to create customer |
| `/customers/:id` | Customer Detail | View customer info |
| `/orders` | Orders List | All orders, status filters |
| `/orders/new` | Create Order | Multi-product order form |
| `/orders/:id` | Order Detail | Full order breakdown |
| `*` | 404 Page | Not found with CTAs |

---

## 3. Feature Flows

### 3.1 Dashboard Flow

```
User Opens App
      │
      ▼
Dashboard loads
      │
      ├── GET /dashboard/stats ──► Receive:
      │                            - total_products
      │                            - total_customers
      │                            - total_orders
      │                            - low_stock[]
      │
      ├── Metric Cards render (4 KPI tiles)
      ├── Kanban Board renders (orders by status)
      └── Chart renders (recent order totals)
```

---

### 3.2 Product Creation Flow

```
User clicks "Add Product"
      │
      ▼
Navigate to /products/new
      │
      ▼
Form renders (name, SKU, price, quantity)
      │
User fills form → clicks Submit
      │
      ▼
Frontend validates:
  - name not empty
  - SKU not empty
  - price > 0
  - quantity >= 0
      │
      ▼ (if valid)
POST /products { name, sku, price, quantity }
      │
      ├── 201 Created ──► Show success toast
      │                   Navigate to /products
      │
      └── 400 Bad Request (SKU exists) ──► Show error message inline
          422 Validation Error ──► Show field-level errors
```

---

### 3.3 Product Update Flow

```
User clicks "Edit" on product row
      │
      ▼
Navigate to /products/:id (edit mode)
      │
      ▼
GET /products/:id → Pre-fill form
      │
User changes fields → clicks Save
      │
      ▼
PUT /products/:id { updated fields }
      │
      ├── 200 OK ──► Show success toast, refresh list
      └── 404     ──► Show "Product not found" error
```

---

### 3.4 Order Creation Flow (Critical Path)

```
User clicks "New Order"
      │
      ▼
Navigate to /orders/new
      │
      ▼
Step 1: Select Customer
  GET /customers → populate dropdown
      │
Step 2: Add Products
  GET /products → populate product selector
  User selects product + enters quantity
  User can add multiple line items
      │
Step 3: Review
  Frontend displays:
    - Line items with unit prices
    - Calculated subtotals (qty × price)
    - Estimated total
    
  NOTE: Final total is calculated by backend
      │
User clicks "Place Order"
      │
      ▼
POST /orders
{
  "customer_id": N,
  "items": [
    { "product_id": A, "quantity": X },
    { "product_id": B, "quantity": Y }
  ]
}
      │
Backend processes:
  1. Validate customer exists
  2. For each item:
     a. Lock product row (FOR UPDATE)
     b. Check quantity >= requested
     c. If not → 400 "Insufficient stock for [Product Name]"
  3. Create Order record
  4. Create OrderItem records
  5. Reduce product.quantity for each item
  6. Calculate total_amount
  7. Commit transaction
      │
      ├── 201 Created ──► Show success toast
      │                   Navigate to /orders/:id
      │
      └── 400 Insufficient Stock ──► Show which product failed
                                     Keep form state intact
```

---

### 3.5 Order Cancellation Flow

```
User opens Order Detail (/orders/:id)
      │
User clicks "Cancel Order"
      │
      ▼
Confirmation modal: "Cancel this order?"
      │
User confirms
      │
      ▼
DELETE /orders/:id
      │
      ├── 204 No Content ──► Show toast "Order cancelled"
      │                      Navigate to /orders
      │
      └── 404 ──► Show error
```

> **Note:** Stock restoration on cancellation is a v2 feature. In v1, deletion is hard delete with no stock rollback.

---

### 3.6 Customer Deletion Flow

```
User clicks Delete on customer row
      │
      ▼
Confirmation modal: "Delete [Name]? This cannot be undone."
      │
User confirms
      │
      ▼
DELETE /customers/:id
      │
      ├── 204 No Content ──► Remove from list, show toast
      │
      └── 409 / 400 ──► "Cannot delete customer with active orders"
```

---

## 4. Error State Flows

### 4.1 API Unreachable

```
Frontend → API call fails (network error)
      │
      ▼
React Query catches error
      │
      ▼
Display: Banner "Unable to connect to server. Please try again."
         Retry button triggers refetch
```

### 4.2 404 Page

```
User navigates to unknown route
      │
      ▼
React Router renders <NotFoundPage>
      │
      ▼
Display:
  - 404 headline
  - "This page doesn't exist" message
  - CTA: "Go to Dashboard" (primary)
  - CTA: "Contact Support" (secondary)
```

---

## 5. Loading States

| Page/Component | Loading Behavior |
|----------------|-----------------|
| Dashboard | Skeleton cards for metrics, shimmer for charts |
| Products List | Skeleton table rows (8 rows) |
| Customers List | Skeleton table rows |
| Orders List | Skeleton table rows |
| Order Detail | Skeleton order summary + line items |
| Forms | Button shows spinner on submit |

---

## 6. Component Data Flow

```
App (Router)
├── Layout
│   ├── TopNavBar
│   │   ├── Logo
│   │   ├── NavLinks (Dashboard, Products, Customers, Orders)
│   │   └── (future: user avatar)
│   └── Footer
│       └── Logo + Links + Copyright
│
├── DashboardPage
│   ├── MetricCards (4x)  ← GET /dashboard/stats
│   ├── KanbanBoard       ← GET /orders (by status)
│   └── RevenueChart      ← derived from orders data
│
├── ProductsPage
│   ├── ProductTable      ← GET /products
│   ├── AddProductModal
│   └── EditProductModal
│
├── CustomersPage
│   ├── CustomerTable     ← GET /customers
│   └── AddCustomerModal
│
├── OrdersPage
│   ├── OrderTable        ← GET /orders
│   └── OrderFilters
│
├── CreateOrderPage
│   ├── CustomerSelect    ← GET /customers
│   ├── ProductLineItems  ← GET /products
│   └── OrderSummary
│
├── OrderDetailPage       ← GET /orders/:id
│
└── NotFoundPage
```

---

## 7. State Management Strategy

| State Type | Tool |
|-----------|------|
| Server state (API data) | React Query (TanStack Query) |
| Form state | React Hook Form |
| UI state (modals, toasts) | Zustand or React Context |
| URL/routing state | React Router v6 |

---

## 8. API Integration Layer

```
src/services/
├── api.js          ← Axios instance with baseURL from VITE_API_URL
├── products.js     ← getProducts, createProduct, updateProduct, deleteProduct
├── customers.js    ← getCustomers, createCustomer, deleteCustomer
├── orders.js       ← getOrders, getOrder, createOrder, deleteOrder
└── dashboard.js    ← getStats
```

---

*End of App Flow Document*
