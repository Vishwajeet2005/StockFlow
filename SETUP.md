# StockFlow — Setup & Demo Guide

## Prerequisites

Choose ONE of these options:

### Option A: Docker (Easiest — no Node.js needed)
- Install Docker Desktop: https://www.docker.com/products/docker-desktop/
- That's it.

### Option B: Node.js (Local development)
- Install Node.js 18+: https://nodejs.org/
- npm is included with Node.js.

---

## Running the App

### Docker (Option A) — 2 minutes

```bash
# 1. Open terminal in the project folder
cd StockFlow-Submission

# 2. Run the deploy script
bash deploy.sh

# 3. Open http://localhost in your browser
```

The script automatically:
- Generates secure JWT secrets
- Builds Docker images for backend + frontend
- Starts both containers

---

### Local Node.js (Option B) — 3 minutes

Open **two terminal windows**, both in the project folder.

**Terminal 1 — Backend:**
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
You should see:
```
✅ Database ready
🚀 StockFlow API running on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```
You should see:
```
  VITE ready in Xs
  ➜  Local:   http://localhost:5173/
```

**Open http://localhost:5173 in your browser.**

---

## First Login

| Field    | Value       |
|----------|-------------|
| Username | `admin`     |
| Password | `Admin@123` |

---

## Demo Walkthrough (for judges)

### 1. Dashboard
- See total inventory value (₹5,83,600), 5 products, low stock alerts.

### 2. Products
- Browse the 5 seeded products.
- Click **Add Product** → fill in code, name, price, quantity → Save.
- Click a product → Edit it → Update.

### 3. Sales Order
- Go to **Sales Orders** → **New Order**.
- Search customer: type "Ramesh" → select.
- Add products: type "PRD001" → tab → quantity 10.
- Click **+ Add Product**, add "PRD002" qty 5.
- Click **Create Order**.
- In the detail panel: click **Move to Packing** → **Move to Dispatched**.
- Go to Products: PRD001 stock is now reduced by 10.

### 4. Purchase Order
- Go to **Purchase Orders** → **New Order**.
- Search supplier: type "Tata" → select.
- Add PRD001 qty 100.
- Create Order → advance through all stages to **Completed**.
- PRD001 stock increases by 100.

### 5. Manufacturing (WIP)
- Go to **Manufacturing** → **New Batch**.
- Batch number: `BATCH-001`.
- Raw materials: PRD001, qty 20.
- Output: PRD004, qty 50.
- Click **Start Batch** → raw materials deducted immediately.
- Click **Mark Complete** → output added to inventory.

### 6. Enable 2FA
- Go to **Security** (sidebar).
- Click **Enable** under 2-Step Verification.
- Scan the QR code with Google Authenticator or Authy.
- Enter the 6-digit code → 2FA is now on.
- Log out and log back in → you'll see a second screen asking for the TOTP code.

### 7. Order History
- Go to **Order History** → filter by Sales / Purchases / Manufacturing.
- Click **Export CSV** to download a CSV of all orders.

---

## API Testing (optional)

If you have curl installed:

```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'

# Dashboard (replace TOKEN with access token from login)
curl http://localhost:3001/api/dashboard \
  -H "Authorization: Bearer TOKEN"
```

---

## Stopping the App

### Docker:
```bash
docker-compose down
```

### Local:
Press `Ctrl+C` in both terminal windows.

---

## Troubleshooting

**Port 3001 already in use:**
```bash
# Mac/Linux
fuser -k 3001/tcp

# Windows
netstat -ano | findstr :3001
taskkill /PID <pid> /F
```

**npm install fails:**
```bash
# Try with legacy peer deps flag
npm install --legacy-peer-deps
```

**Docker build fails:**
```bash
# Make sure Docker Desktop is running
docker info

# Pull fresh base images
docker-compose build --no-cache
```

**Forgot password / locked out:**
The database resets cleanly if you delete `backend/data/inventory.db` and restart the backend. A fresh admin account will be created with the default password.

---

## Production Deployment (Cloud)

### On any VPS (AWS EC2, Azure VM, DigitalOcean Droplet):

```bash
# SSH into your server
ssh user@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone / upload project
scp -r StockFlow-Submission user@your-server-ip:~/

# Deploy
cd StockFlow-Submission
bash deploy.sh
```

The app will be available at `http://your-server-ip`.

For HTTPS, place nginx or Caddy in front of the Docker container.
