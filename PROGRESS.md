# StockFlow Project Progress

This document tracks all the features, integrations, and architectural milestones that have been completed in the StockFlow repository.

## 🏗️ Architecture & Core Infrastructure
- **Multi-Tenant System**: Implemented isolated workspaces using `companyId` throughout the database.
- **Tech Stack**:
  - Backend: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL.
  - Frontend: React, Vite, TailwindCSS, Zustand, React Router v7.
- **Authentication**: Secure JWT-based authentication (access & refresh tokens) with strict HTTP-only cookie support or token interceptors.

## 🔐 Security & DevSecOps
- **Two-Factor Authentication (2FA)**: Time-based One-Time Password (TOTP) support via Google Authenticator.
- **Role-Based Access Control (RBAC)**: Enforced strict separation between `admin` and `staff` roles.
- **Comprehensive Audit Trails**:
  - Persistent database logging of all sensitive mutations (Deletes, Password changes, User modifications).
  - Dedicated **System Logs UI** for administrators to monitor IP addresses and actions.
- **Error Masking & Intrusion Detection**: Integrated Sentry to catch unhandled exceptions without leaking database schemas to end-users.
- **Hardening**: Implemented `helmet` for secure HTTP headers, `express-rate-limit` to prevent brute force attacks, and strict CORS policies.
- **CI/CD Pipelines**: Added GitHub Actions workflows (`gatekeeper.yml`, `codeql.yml`, `dependabot.yml`) for automated builds, static application security testing (SAST), and dependency management.

## 💻 Frontend & User Interface
- **Modern UI/UX**: Professional design using TailwindCSS, subtle micro-animations, glassmorphism, and responsive layouts.
- **Dynamic Navigation**: Context-aware sidebar that highlights active routes and restricts links based on user roles.
- **State Management**: Centralized store using Zustand.
- **Data Fetching**: Custom Axios interceptors to automatically handle token refreshing without interrupting the user experience.
- **Alerts & Dialogs**: Reusable React Hot Toast notifications and custom Confirmation Dialogs.

## 📦 Features & Modules
1. **Dashboard**:
   - High-level metrics (Total Products, Inventory Value, Pending Orders).
   - Real-time Low Stock warnings.
   - Recent activity feeds.
2. **Products Management**:
   - Full CRUD operations with detailed stock tracking and pricing.
   - Status indicators for inventory health.
3. **Sales & Purchase Orders**:
   - Advanced order creation with multi-product selection.
   - Status tracking workflows (Quotation -> Packing -> Dispatched -> Completed).
   - Dynamic total calculations.
4. **Manufacturing**:
   - Bill of Materials (BOM) handling.
   - Conversion of raw materials into finished output products.
   - Batch tracking and status updates.
5. **Parties Management**:
   - Customers and Suppliers address books.
6. **Order History**:
   - Consolidated view of all historical transactions with advanced filtering.
7. **Staff Management**:
   - Admin-only module to invite, manage, and remove team members from the workspace.

## 🚀 Deployment
- **Database**: Hosted on robust PostgreSQL infrastructure.
- **Backend/Frontend**: Configuration and scripts optimized for automated deployment on Render.

---
*Document automatically updated to reflect the latest state of the StockFlow system.*
