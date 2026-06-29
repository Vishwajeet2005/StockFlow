<div align="center">
  <img src="https://img.icons8.com/color/96/000000/inventory-flow.png" alt="StockFlow Logo" width="80" />
  
  # StockFlow
  **Enterprise-Grade Inventory & Supply Chain Management System**
  
  *Sunmount Solutions Hackathon · App/Web Development Category*

  [![Status](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)](https://stockflow-obza.onrender.com)
  [![Hackathon](https://img.shields.io/badge/Sunmount%20Hackathon-App%20Dev-blue?style=for-the-badge)]()
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)]()
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)]()
  [![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)]()
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)]()
</div>

---

## Overview

**StockFlow** is a comprehensive, full-stack inventory and supply chain management platform designed for modern SMEs. Built with a focus on **security**, **scalability**, and **user experience**, StockFlow provides true multi-tenant architecture, allowing multiple companies to operate isolated workspaces within a single deployment.

Whether accessed via the web or the native Windows companion app, StockFlow orchestrates the entire lifecycle of products—from raw material purchasing and manufacturing batch tracking, to sales order fulfillment and real-time analytics.

**Live Demo:** [https://stockflow-obza.onrender.com](https://stockflow-obza.onrender.com)

---

## Key Features

- **Multi-Tenant Architecture**: True data isolation. Multiple companies can register and manage their own isolated workspaces seamlessly.
- **Role-Based Access Control (RBAC)**: Distinct `Admin` and `Staff` roles ensure granular permission controls. Staff members have restricted access (e.g., restricted from deleting records or viewing financial reports).
- **End-to-End Order Lifecycle**: 
  - **Sales Orders**: Quotation -> Packing -> Dispatched (Auto-deducts stock) -> Completed.
  - **Purchase Orders**: Quotation Received -> Unpaid -> Paid -> Completed (Auto-adds stock).
- **Manufacturing & WIP**: Create manufacturing batches that automatically deduct raw materials and add finished goods to inventory upon completion.
- **Modern UI & Analytics**: Interactive, visual dashboards (via Recharts) displaying sales vs purchases trends, supported by robust features like **System/Dark Mode toggling**, pagination, and skeleton loading states for a premium user experience.
- **Zero-Trust Security Model**: Advanced security featuring strict schema input validation (**Zod**), TOTP 2-Factor Authentication, JWT rotation, rate limiting, bcrypt hashing, and automated security scanning (CodeQL).

---

## Technology Stack

StockFlow is built on a modern, robust, and scalable technology stack:

| Category | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite 8, Tailwind CSS, Zustand, React Router v6, Recharts |
| **Backend** | Node.js 20, Express.js, TypeScript |
| **Database** | PostgreSQL, Prisma ORM |
| **Security** | JSON Web Tokens (JWT), Speakeasy (TOTP 2FA), Bcrypt (Cost 12), Helmet, Express Rate Limit |
| **DevOps** | Docker, Docker Compose, NGINX, Render (Cloud Deployment) |
| **Desktop App**| Electron.js (Windows Native Client) |

---

## Enterprise Security Posture

Security is treated as a first-class citizen in StockFlow:

- **2-Factor Authentication (TOTP)**: RFC 6238 compliant. Setup via QR code scanning compatible with any authenticator app.
- **Strict Schema Validation**: Bulletproof input validation for all API endpoints using Zod to prevent injection and guarantee data integrity.
- **Advanced Session Management**: Short-lived JWT access tokens (15-minute expiry) paired with 64-byte random, SHA-256 hashed refresh tokens that rotate on every use.
- **Brute Force Protection**: Account lockout after 5 incorrect password attempts (15-minute lockout).
- **Rate Limiting**: Strict API rate limiting (10 login attempts / 15 mins, 200 API calls / min) to prevent DoS attacks.
- **Database Audit Logging**: Permanent tracking of critical system actions (deletions, modifications) with timestamp and IP address linking back to the responsible user account.
- **Intrusion Detection & Error Masking**: Integrated with Sentry to detect and alert on anomalous activity, while a global error handler prevents stack trace leaks.
- **Continuous Automated Security (DevSecOps)**:
  - **CodeQL SAST**: Automated static analysis on every push/PR to detect XSS, injection loopholes, and hardcoded secrets.
  - **Dependabot**: Automated weekly vulnerability scanning and PR generation for Node.js and Docker dependencies.
  - **CI Gatekeeper**: GitHub Actions pipeline runs strict `npm audit` checks, failing the build immediately if high/critical vulnerabilities are introduced.
- **Hardened HTTP Headers**: Implemented via Helmet (X-Frame-Options, HSTS, XSS protection, strict CORS).

---

## Getting Started

### Option 1: Docker (Recommended for Production)
Deploy the entire stack (Frontend, Backend, and PostgreSQL) with a single command.

```bash
git clone https://github.com/Vishwajeet2005/StockFlow.git
cd StockFlow/inventory-management

# Launch the entire stack via Docker Compose
docker-compose up -d --build

# The app will be available at http://localhost
```

### Option 2: Local Development Setup
Run the environment natively using Node.js.

```bash
cd inventory-management

# 1. Install Dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 2. Setup Environment Variables
# Copy .env.example to .env in the backend folder and configure your PostgreSQL DATABASE_URL

# 3. Start Backend (Terminal 1)
cd backend
npm run dev

# 4. Start Frontend (Terminal 2)
cd frontend
npm run dev

# Open http://localhost:5173
```

### Option 3: Desktop App (Windows Native)
StockFlow includes a native Windows desktop client built with Electron.

```bash
# To run the desktop client in development mode:
cd inventory-management/frontend
npm run start:desktop

# To package the standalone Windows .exe:
npm run package:exe
```

---

## System Architecture & Structure

```text
inventory-management/
├── deploy.sh               # Docker deployment script
├── docker-compose.yml      # Multi-container orchestration (DB, API, Web)
│
├── backend/                # Node.js / Express API
│   ├── prisma/             # Prisma ORM Schema & Migrations
│   ├── src/
│   │   ├── index.ts        # Server entry point & security middleware
│   │   ├── db.ts           # PostgreSQL connection handler
│   │   ├── middleware/     # JWT authentication middleware
│   │   └── routes/         # RESTful API Controllers (Auth, Products, Orders, etc.)
│   └── package.json
│
└── frontend/               # React SPA
    ├── src/
    │   ├── lib/api.ts      # Axios instance with auto token refresh interceptors
    │   ├── hooks/useAuth.ts# Global state management via Zustand
    │   ├── components/     # Reusable UI components
    │   └── pages/          # Application views (Dashboard, Manufacturing, Reports, etc.)
    └── vite.config.ts      # Vite 8 bundler configuration
```

---

## Participating Team
- **Project**: StockFlow
- **Developer**: Vishwajeet2005
- **Event**: Sunmount Solutions Hackathon
- **Category**: App/Web Development

<div align="center">
  <i>Built for the Sunmount Hackathon</i>
</div>
