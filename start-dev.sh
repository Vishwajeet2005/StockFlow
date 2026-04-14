#!/bin/bash
# StockFlow — Quick local start for development
# Usage: bash start-dev.sh

echo ""
echo "  StockFlow — Starting..."
echo ""

command -v node >/dev/null 2>&1 || { echo "Error: Node.js not installed. Get it from https://nodejs.org"; exit 1; }

# Install if needed
[ ! -d "backend/node_modules" ]  && echo "Installing backend..."  && (cd backend  && npm install)
[ ! -d "frontend/node_modules" ] && echo "Installing frontend..." && (cd frontend && npm install)

# Setup .env
[ ! -f "backend/.env" ] && cp backend/.env.example backend/.env && echo "Created backend/.env"

echo ""
echo "  Starting backend on http://localhost:3001"
echo "  Starting frontend on http://localhost:5173"
echo "  Login: admin / Admin@123"
echo ""
echo "  Press Ctrl+C to stop both servers"
echo ""

# Run both with a simple trap
cleanup() { kill 0; exit; }
trap cleanup INT TERM

(cd backend && npm run dev) &
sleep 3
(cd frontend && npm run dev) &
wait
