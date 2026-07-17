<div align="center">
  <img src="https://img.icons8.com/color/96/000000/inventory-flow.png" alt="StockFlow Logo" width="100" />
  
  # StockFlow
  
  **An Enterprise-Grade, Multi-Tenant Inventory & Supply Chain Management System**
  
  *Built for the Sunmount Solutions Hackathon · App/Web Development Category*

  [![Status](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)](https://stockflow-obza.onrender.com)
  [![Hackathon](https://img.shields.io/badge/Sunmount%20Hackathon-App%20Dev-blue?style=for-the-badge)]()
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)]()
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)]()
  [![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)]()
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)]()
</div>

---

## Overview

**StockFlow** is a comprehensive, full-stack inventory and supply chain management platform engineered for modern SMEs. Designed with an unwavering focus on **security**, **scalability**, and **user experience**, StockFlow leverages a true multi-tenant architecture. This enables multiple companies to operate entirely isolated, secure workspaces within a single deployment instance.

Whether accessed via the web or through the native Windows companion application, StockFlow orchestrates the complete product lifecycle—from raw material purchasing and manufacturing batch tracking to final sales order fulfillment and real-time analytics.

**🔗 Live Demo:** [https://stockflow-obza.onrender.com](https://stockflow-obza.onrender.com)

---

## Key Features

- **🏢 True Multi-Tenant Architecture**  
  Complete data isolation at the database level. Multiple organizations can seamlessly register, operate, and manage their own isolated workspaces without risk of cross-tenant data leakage.

- **🛡️ Role-Based Access Control (RBAC)**  
  Distinct permissions for `Admin` and `Staff` roles. Staff members are granted restricted access, ensuring they cannot delete critical records, view financial analytics, or modify security configurations.

- **🔄 End-to-End Order Lifecycle Management**  
  - **Sales Orders:** Quotation → Packing → Dispatched (Auto-deducts stock) → Completed.
  - **Purchase Orders:** Quotation Received → Unpaid → Paid → Completed (Auto-adds stock).

- **🏭 Manufacturing & Work-In-Progress (WIP)**  
  Define and execute manufacturing batches. The system automatically calculates and deducts the required raw materials while adding the finished goods to your inventory upon completion.

- **📊 Advanced Real-Time Analytics & UX**  
  Interactive visual dashboards powered by Recharts provide insights into sales and purchase trends. Enjoy a premium, modern interface featuring **System/Dark Mode toggling**, responsive pagination, and fluid skeleton loading states.

- **📩 Automated Low-Stock Email Alerts** *(New!)*  
  Admins can define custom minimum stock thresholds per product. A daily background cron job securely dispatches an HTML email digest summarizing all products that require restocking, powered by NodeMailer.

---

## Enterprise Security Posture

Security is treated as a first-class citizen in StockFlow, implementing a **Zero-Trust Security Model**:

- **2-Factor Authentication (TOTP):** RFC 6238 compliant setup via QR code scanning, compatible with Google Authenticator, Authy, and other TOTP apps.
- **Strict Schema Validation:** Bulletproof input validation for all API payloads using **Zod**, preventing injection attacks and guaranteeing data integrity.
- **Advanced Session Management:** Short-lived JWT access tokens (15-minute expiry) paired with securely stored, 64-byte random SHA-256 hashed refresh tokens that rotate upon every use.
- **Brute Force & DoS Protection:** Account lockout policies (after 5 failed attempts) and strict API rate limiting (10 login attempts per 15 minutes; 200 general API calls per minute).
- **Database Audit Logging:** Immutable tracking of critical system actions (e.g., deletions, structural modifications) linked to timestamps, user accounts, and IP addresses.
- **DevSecOps Pipeline:** Automated static code analysis (CodeQL) on every PR to detect XSS and injection loopholes, paired with Dependabot vulnerability scanning.

---

## Technology Stack

StockFlow is built on a modern, robust, and scalable foundation:

| Domain | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Router v6, Recharts |
| **Backend** | Node.js 20, Express.js, TypeScript, node-cron, NodeMailer |
| **Database** | PostgreSQL, Prisma ORM |
| **Security** | JSON Web Tokens (JWT), Speakeasy (TOTP 2FA), Bcrypt (Cost 12), Helmet, Express Rate Limit, Zod |
| **DevOps** | Docker, Docker Compose, NGINX, GitHub Actions, Render |
| **Desktop App**| Electron.js (Windows Native Client) |

---

## 🚀 Getting Started

### Option 1: Docker (Recommended for Production)
Deploy the entire stack (Frontend, Backend, and PostgreSQL) seamlessly with a single command.

```bash
git clone https://github.com/Vishwajeet2005/StockFlow.git
cd StockFlow/inventory-management

# Launch the entire stack via Docker Compose
docker-compose up -d --build

# The application will be immediately available at http://localhost
```

### Option 2: Local Development Setup
Run the environment natively using Node.js for active development.

```bash
cd StockFlow/inventory-management

# 1. Install Dependencies for both environments
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 2. Setup Environment Variables
# Copy backend/.env.example to backend/.env and configure your PostgreSQL DATABASE_URL and SMTP credentials

# 3. Start the Backend API (Terminal 1)
cd backend
npm run dev

# 4. Start the Frontend Application (Terminal 2)
cd frontend
npm run dev

# Navigate to http://localhost:5173
```

### Option 3: Desktop App (Windows Native)
StockFlow includes a native Windows desktop client for a dedicated application experience.

```bash
# To run the desktop client in development mode:
cd inventory-management/frontend
npm run start:desktop

# To package and build the standalone Windows .exe file:
npm run package:exe
```

---

## System Architecture

```text
inventory-management/
├── deploy.sh               # Docker deployment and build automation script
├── docker-compose.yml      # Multi-container orchestration (PostgreSQL, API, Frontend/NGINX)
│
├── backend/                # Node.js / Express API Server
│   ├── prisma/             # Prisma ORM Schema & Migration histories
│   ├── src/
│   │   ├── index.ts        # Server entry point, cron initialization, and security middleware
│   │   ├── db.ts           # PostgreSQL connection handler
│   │   ├── services/       # Background services (e.g., Email Alerting)
│   │   ├── middleware/     # JWT authentication and RBAC validation
│   │   └── routes/         # RESTful API Controllers (Auth, Products, Orders, etc.)
│   └── package.json
│
└── frontend/               # React Single Page Application (SPA)
    ├── src/
    │   ├── lib/api.ts      # Axios instance configured with auto token refresh interceptors
    │   ├── hooks/useAuth.ts# Global authentication state management via Zustand
    │   ├── components/     # Reusable UI components (Modals, Tables, Forms)
    │   └── pages/          # Primary application views (Dashboard, Manufacturing, Reports)
    └── vite.config.ts      # Vite bundler configuration
```

---

## Participating Team
- **Project:** StockFlow
- **Developer:** Vishwajeet2005
- **Event:** Sunmount Solutions Hackathon
- **Category:** App/Web Development

<div align="center">
  <br/>
  <i>Engineered for Excellence. Built for the Sunmount Hackathon.</i>
</div>
