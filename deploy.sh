#!/bin/bash
set -e

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   StockFlow — Deployment Script        ║"
echo "╚════════════════════════════════════════╝"
echo ""

# ─── Check requirements ────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not installed. Visit https://docs.docker.com/get-docker/"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ docker-compose not installed."; exit 1; }

# ─── Generate .env if missing ─────────────────────────────────────────────────
if [ ! -f .env ]; then
  echo "⚙️  Creating .env from template..."
  cp .env.example .env

  # Auto-generate secrets if openssl is available
  if command -v openssl >/dev/null 2>&1; then
    JWT=$(openssl rand -hex 32)
    REFRESH=$(openssl rand -hex 32)
    sed -i "s/CHANGE_THIS_TO_A_SECURE_RANDOM_64_CHAR_STRING/$JWT/" .env
    sed -i "s/CHANGE_THIS_REFRESH_SECRET_64_CHAR_STRING/$REFRESH/" .env
    echo "✅ Auto-generated secure JWT_SECRET and REFRESH_SECRET"
  else
    echo "⚠️  Please edit .env and set JWT_SECRET and REFRESH_SECRET before continuing."
    echo "   Generate them with: openssl rand -hex 32"
    exit 1
  fi
fi

# ─── Build & start ────────────────────────────────────────────────────────────
echo ""
echo "🐳 Building Docker images..."
docker-compose build --no-cache

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
HEALTH=$(curl -sf http://localhost/health 2>/dev/null || echo "pending")
if [ "$HEALTH" = "ok" ]; then
  echo "✅ StockFlow is running!"
else
  echo "⏳ Still starting up... check with: docker-compose logs -f"
fi

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  🌐 App:   http://localhost            ║"
echo "║  👤 Login: admin / Admin@123           ║"
echo "║  📋 Logs:  docker-compose logs -f      ║"
echo "║  🛑 Stop:  docker-compose down         ║"
echo "╚════════════════════════════════════════╝"
echo ""
