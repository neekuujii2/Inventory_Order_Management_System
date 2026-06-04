# Product Requirements Document (PRD)
## Inventory & Order Management System (IMS)

**Version:** 1.0.0  
**Date:** 2025  
**Status:** Approved  
**Owner:** Engineering Team

---

## 1. Executive Summary

The Inventory & Order Management System (IMS) is a full-stack web application that enables businesses to efficiently manage their product catalog, customer records, and order lifecycle. The system provides real-time inventory tracking, automatic stock adjustment on order placement, and a dashboard for business intelligence at a glance.

---

## 2. Problem Statement

Small to mid-sized businesses often lack a centralized, digital tool to:
- Track product inventory in real time
- Manage customer data securely
- Process and monitor orders end-to-end
- Prevent overselling when stock is insufficient

This system solves these pain points through a simple, containerized, deployable web application.

---

## 3. Goals & Success Metrics

### Goals
- Enable CRUD operations for Products, Customers, and Orders
- Enforce business rules (unique SKUs, emails, inventory checks)
- Provide a responsive, professional UI accessible on desktop and mobile
- Deliver a fully containerized, deployment-ready system

### Success Metrics
| Metric | Target |
|--------|--------|
| API response time | < 300ms (p95) |
| Frontend load time | < 2s (LCP) |
| Uptime | 99.9% |
| Zero hardcoded credentials | ✅ Mandatory |
| All Docker services start via single command | ✅ Mandatory |

---

## 4. Stakeholders

| Role | Responsibility |
|------|----------------|
| Business Owner | Define requirements, accept deliverables |
| Software Engineer | Design, build, deploy the system |
| End User (Staff) | Use the UI to manage products, customers, orders |

---

## 5. User Personas

### Persona 1 — Warehouse Manager (Primary)
- **Goals:** Add/update products, track inventory levels, see low-stock alerts
- **Pain Points:** Manual spreadsheet errors, no real-time visibility
- **Tech Savvy:** Moderate

### Persona 2 — Sales Representative
- **Goals:** Create orders for customers quickly, check product availability
- **Pain Points:** Placing orders without knowing current stock
- **Tech Savvy:** Low–Moderate

### Persona 3 — Business Administrator
- **Goals:** View dashboard KPIs, manage customer records
- **Pain Points:** Fragmented data across systems
- **Tech Savvy:** Moderate–High

---

## 6. Functional Requirements

### 6.1 Product Management
| ID | Requirement | Priority |
|----|-------------|----------|
| P-01 | Create a product with name, SKU, price, and quantity | Must Have |
| P-02 | List all products with search/filter | Must Have |
| P-03 | View a single product by ID | Must Have |
| P-04 | Update product fields (name, price, quantity) | Must Have |
| P-05 | Delete a product | Must Have |
| P-06 | SKU must be unique across all products | Must Have |
| P-07 | Quantity cannot be negative | Must Have |
| P-08 | Display low-stock warning (quantity < 10) | Should Have |

### 6.2 Customer Management
| ID | Requirement | Priority |
|----|-------------|----------|
| C-01 | Create a customer with name, email, phone | Must Have |
| C-02 | List all customers | Must Have |
| C-03 | View a single customer by ID | Must Have |
| C-04 | Delete a customer | Must Have |
| C-05 | Email must be unique across all customers | Must Have |
| C-06 | Email format validation | Must Have |

### 6.3 Order Management
| ID | Requirement | Priority |
|----|-------------|----------|
| O-01 | Create an order linked to a customer and one or more products | Must Have |
| O-02 | List all orders | Must Have |
| O-03 | View order details including line items | Must Have |
| O-04 | Cancel/delete an order | Must Have |
| O-05 | Validate sufficient inventory before creating order | Must Have |
| O-06 | Auto-reduce stock on order creation | Must Have |
| O-07 | Auto-calculate total order amount in backend | Must Have |
| O-08 | Order status tracking (pending, fulfilled, cancelled) | Should Have |

### 6.4 Dashboard
| ID | Requirement | Priority |
|----|-------------|----------|
| D-01 | Show total products count | Must Have |
| D-02 | Show total customers count | Must Have |
| D-03 | Show total orders count | Must Have |
| D-04 | Show low-stock products list | Must Have |
| D-05 | Revenue summary / order value chart | Should Have |

---

## 7. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | APIs respond in < 300ms under normal load |
| **Security** | No hardcoded credentials; use environment variables |
| **Scalability** | Stateless backend; DB in named Docker volume |
| **Availability** | Deployed to public cloud, accessible via URL |
| **Usability** | Responsive design for 320px–1920px viewports |
| **Maintainability** | Modular codebase, clean folder structure |
| **Observability** | HTTP status codes used correctly; error messages are human-readable |

---

## 8. Out of Scope (v1.0)

- User authentication / role-based access control
- Invoice generation / PDF export
- Email notifications
- Multi-warehouse support
- Returns / refund management
- Payment gateway integration

---

## 9. Assumptions & Constraints

- Deployment uses free-tier platforms (Render/Railway + Vercel/Netlify)
- PostgreSQL is the only supported database
- Single-tenant system (one business per deployment)
- Internet connectivity required for deployment; local dev via Docker Compose

---

## 10. Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Free hosting cold starts | Medium | Add loading state UI; use Render paid tier if needed |
| Inventory race conditions | Low | Use DB-level transactions for stock updates |
| CORS misconfiguration | Medium | Configure allowed origins via env var |
| Data loss on container restart | Low | Use named Docker volume for PostgreSQL |

---

## 11. Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 – Backend API | 3 days | All REST endpoints, DB schema, Dockerfile |
| Phase 2 – Frontend | 3 days | React UI, all pages, Docker setup |
| Phase 3 – Integration | 1 day | Docker Compose, env vars, testing |
| Phase 4 – Deployment | 1 day | Live URLs, Docker Hub image |

---

*End of PRD*
