# StockFlow — Inventory Management System
**Sunmount Solutions Hackathon · App/Web Development Category**

![Status](https://img.shields.io/badge/Status-Live-success) ![Hackathon](https://img.shields.io/badge/Sunmount%20Hackathon-App%20Dev-blue) ![Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Docker-informational) ![Deploy](https://img.shields.io/badge/Deployed-Render-46E3B7)

---

The application of it is deployed on render 

**Description:** Full-stack inventory management system with Multi-tenant architecture, RBAC, 2FA, JWT rotation, Docker & Electron desktop app

**Website:** https://stockflow-obza.onrender.com

**Topics:** inventory, react, typescript, nodejs, docker, electron, 2fa, multi-tenant, rbac


## What it does

StockFlow is a full-stack web application that helps SMEs manage their entire inventory workflow:
- **Multi-Company Architecture**: True multi-tenant isolation, allowing multiple companies to register and manage their own isolated workspaces.
- **Role-Based Access Control (RBAC)**: Differentiate between Admin and Staff roles. Staff have limited privileges (e.g. they cannot delete items or view reports).
- Product catalogue with live stock levels
- Sales orders (Quotation → Packing → Dispatched → Completed)
- Purchase orders (Quotation Received → Unpaid → Paid → Completed)
- Manufacturing / WIP batch tracking
- Customer & Supplier management
- Dashboard with real-time stats and low-stock alerts
- **Reports & Analytics**: Visual charts (via recharts) for sales trends, top-selling products, and revenue breakdowns (Admin only).
- **2-Step Authentication (TOTP)** — Google Authenticator / Authy
- Order history with CSV export

---

## Quick Start

### Option A — Docker (one command, recommended)
```bash
cd inventory-management
bash deploy.sh
# Open http://localhost
```

### Option B — Local (Node.js)
```bash
cd inventory-management

# Install dependencies
cd backend  && npm install && cd ..
cd frontend && npm install && cd ..

# Terminal 1: Backend
cd backend && cp .env.example .env && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Open http://localhost:5173
```

### Option C — Desktop App (Windows 10/11)
StockFlow now features a native Windows companion app built with Electron.

**To run the desktop client locally (Dev Mode):**
```bash
cd inventory-management/frontend
npm run start:desktop
```

**Physical Release:**
The standalone Windows `.exe` is generated via `npm run package:exe`. You can download the pre-built portable version from the GitHub Releases section.


### Login credentials
| Field    | Value       |
|----------|-------------|
| Username | `admin`     | Or register your own company workspace |
| Password | `Admin@123` | |

---

## Tech Stack

| Layer       | Technology                                |
|-------------|-------------------------------------------|
| Frontend    | React 18, TypeScript, Vite, Tailwind CSS  |
| State       | Zustand, React Router v6, Axios           |
| Backend     | Node.js 20, Express, TypeScript           |
| Database    | SQLite (sql.js — pure JS, zero native deps)|
| Auth        | JWT access tokens + refresh token rotation|
| 2FA         | TOTP via speakeasy + QR code setup        |
| Security    | helmet, express-rate-limit, bcrypt (cost 12)|
| Deployment  | Docker, docker-compose, nginx             |

---

## Security Features

| Feature              | Detail                                             |
|----------------------|----------------------------------------------------|
| 2FA (TOTP)           | RFC 6238, scan QR with any authenticator app       |
| Password hashing     | bcrypt cost-12                                     |
| Access tokens        | JWT, 15-minute expiry                              |
| Refresh tokens       | 64-byte random, SHA-256 hashed, rotated on every use|
| Account lockout      | 5 wrong passwords → locked 15 minutes             |
| Rate limiting        | 10 login attempts / 15 min, 300 API calls / min   |
| Security headers     | helmet (X-Frame-Options, HSTS, XSS protection)    |

---

## Core Workflows (tested & working)

1. **Sales Order** — create → packing → dispatch (auto-deducts stock) → complete
2. **Purchase Order** — create → unpaid → paid → complete (auto-adds stock)
3. **Manufacturing** — create batch (deducts raw materials) → complete (adds output products)
4. **2FA Setup** — Security page → Enable → scan QR → enter 6-digit code → enabled

---

## Project Structure

```
inventory-management/
├── README.md
├── deploy.sh               ← Docker one-command deploy
├── start.sh                ← Local one-command start
├── docker-compose.yml
├── .env.example
│
├── backend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── index.ts        ← Express server (helmet, rate-limit, CORS)
│   │   ├── db.ts           ← sql.js database + seed data
│   │   ├── middleware/
│   │   │   └── auth.ts     ← JWT middleware
│   │   └── routes/
│   │       ├── auth.ts     ← Login, 2FA setup/enable/disable, refresh, change-password
│   │       ├── products.ts
│   │       ├── orders.ts   ← Sales + Purchase with status flow
│   │       ├── manufacturing.ts
│   │       └── misc.ts     ← Customers, suppliers, dashboard
│   └── package.json
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── App.tsx
        ├── lib/api.ts           ← Axios with auto token refresh
        ├── hooks/useAuth.ts     ← Auth state (Zustand)
        └── pages/
            ├── LoginPage.tsx    ← 2-step login (password → TOTP code)
            ├── SecurityPage.tsx ← 2FA setup/disable, change password
            ├── DashboardPage.tsx
            ├── ReportsPage.tsx  ← Charts & analytics (Admins only)
            ├── ProductsPage.tsx
            ├── SalesPage.tsx
            ├── PurchasesPage.tsx
            ├── ManufacturingPage.tsx
            ├── HistoryPage.tsx
            ├── PartiesPage.tsx
            └── StaffPage.tsx    ← Staff management (Admins only)
```

---

## API Reference

### Auth
| Method | Endpoint                  | Description                    |
|--------|---------------------------|--------------------------------|
| POST   | /api/auth/register        | Register new company & admin   |
| POST   | /api/auth/login           | Step 1: password check         |
| POST   | /api/auth/verify-2fa      | Step 2: TOTP code verification |
| POST   | /api/auth/refresh         | Rotate refresh token           |
| POST   | /api/auth/logout          | Revoke refresh token           |
| GET    | /api/auth/me              | Get current user profile       |
| GET    | /api/auth/staff           | List all staff (Admin only)    |
| POST   | /api/auth/staff           | Create staff (Admin only)      |
| DELETE | /api/auth/staff/:id       | Delete staff (Admin only)      |
| POST   | /api/auth/2fa/setup       | Generate TOTP secret + QR code |
| POST   | /api/auth/2fa/enable      | Confirm and enable 2FA         |
| POST   | /api/auth/2fa/disable     | Disable 2FA (requires password + code)|
| POST   | /api/auth/change-password | Change password (revokes sessions)|

### Products
| Method | Endpoint              | Description    |
|--------|-----------------------|----------------|
| GET    | /api/products         | List / search  |
| POST   | /api/products         | Create         |
| PUT    | /api/products/:code   | Update         |
| DELETE | /api/products/:code   | Delete         |

### Orders
| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| GET    | /api/orders               | List (filter by type/status)|
| POST   | /api/orders               | Create order             |
| PUT    | /api/orders/:id           | Update order             |
| PATCH  | /api/orders/:id/status    | Advance status + update inventory|
| DELETE | /api/orders/:id           | Delete order             |

### Manufacturing
| Method | Endpoint                          | Description                      |
|--------|-----------------------------------|----------------------------------|
| GET    | /api/manufacturing                | List batches                     |
| POST   | /api/manufacturing                | Create batch (deducts raw materials)|
| PATCH  | /api/manufacturing/:id/complete   | Complete (adds output to stock)  |
| DELETE | /api/manufacturing/:id            | Cancel batch                     |

### Other
| Method | Endpoint            | Description            |
|--------|---------------------|------------------------|
| GET    | /api/dashboard      | Live stats + alerts    |
| GET    | /api/analytics      | Aggregated stats & chart data (Admin only)|
| GET    | /api/customers      | List customers         |
| POST   | /api/customers      | Add customer           |
| GET    | /api/suppliers      | List suppliers         |
| POST   | /api/suppliers      | Add supplier           |

---

## Participant Details
- **Project**: StockFlow — Inventory Management System
- **Hackathon**: Sunmount Solutions — App/Web Development Category
