# StockFlow — Inventory Management System
**Sunmount Solutions Hackathon · App/Web Development Category**

---

## What it does

StockFlow is a full-stack web application that helps SMEs manage their entire inventory workflow:
- Product catalogue with live stock levels
- Sales orders (Quotation → Packing → Dispatched → Completed)
- Purchase orders (Quotation Received → Unpaid → Paid → Completed)
- Manufacturing / WIP batch tracking
- Customer & Supplier management
- Dashboard with real-time stats and low-stock alerts
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

### Login credentials
| Field    | Value       |
|----------|-------------|
| Username | `admin`     |
| Password | `Admin@123` |

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
            ├── ProductsPage.tsx
            ├── SalesPage.tsx
            ├── PurchasesPage.tsx
            ├── ManufacturingPage.tsx
            ├── HistoryPage.tsx
            └── PartiesPage.tsx
```

---

## API Reference

### Auth
| Method | Endpoint                  | Description                    |
|--------|---------------------------|--------------------------------|
| POST   | /api/auth/login           | Step 1: password check         |
| POST   | /api/auth/verify-2fa      | Step 2: TOTP code verification |
| POST   | /api/auth/refresh         | Rotate refresh token           |
| POST   | /api/auth/logout          | Revoke refresh token           |
| GET    | /api/auth/me              | Get current user profile       |
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
| GET    | /api/customers      | List customers         |
| POST   | /api/customers      | Add customer           |
| GET    | /api/suppliers      | List suppliers         |
| POST   | /api/suppliers      | Add supplier           |

---

## Participant Details
- **Project**: StockFlow — Inventory Management System
- **Hackathon**: Sunmount Solutions — App/Web Development Category
- **Email**: *(add your email here)*
