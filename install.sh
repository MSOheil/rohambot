#!/bin/bash

# =================================================================
# Kaiser VPN Management & Bot System - Auto Installer & Deployer
# =================================================================

set -e

echo "👑 ==========================================================="
echo "👑 Kaiser Auto-Installer & Docker Deployer Starting..."
echo "👑 ==========================================================="

# 1. Update system packages
echo "📦 Updating system packages..."
sudo apt-get update -y
sudo apt-get install -y curl git ufw certbot

# 2. Check and Install Docker & Docker Compose Plugin
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker Engine..."
    curl -fsSL https://get.docker.com | sh
    sudo systemctl enable --now docker
fi

if ! command -v docker compose &> /dev/null; then
    echo "📦 Installing Docker Compose Plugin..."
    sudo apt-get install -y docker-compose-plugin
fi

# 3. Configure Firewall
echo "🛡️ Configuring Firewall..."
sudo ufw allow 80/tcp || true
sudo ufw allow 443/tcp || true
sudo ufw allow 5000/tcp || true
sudo ufw allow 8080/tcp || true
sudo ufw --force enable || true

# 4. Config variables
export BOT_TOKEN="8992025570:AAHsMAOG5_UbZXMW_CrkmufBq-4IW4I31zI"
export API_ID="36814355"
export API_HASH="1138b0ad3caf2d93a315cf9be02293b0"
export WEBHOOK_URL="https://botrohamapi.goodino24.ir"
export PANEL_URL="https://botroham.goodino24.ir"

# 5. Build and Launch Containers
echo "🚀 Building and Starting all services with Docker Compose (PostgreSQL, Backend, Frontend, Bot, Nginx)..."
docker compose down || true
docker compose up -d --build

echo ""
echo "==========================================================="
echo "✅ Kaiser System Successfully Built & Deployed!"
echo "==========================================================="
echo "🌐 Web Admin Panel (Angular): https://botroham.goodino24.ir"
echo "🤖 Telegram Webhook & API:    https://botrohamapi.goodino24.ir/bot-webhook"
echo "📖 Swagger API Docs:          https://botrohamapi.goodino24.ir/swagger"
echo "🔑 Super Admin Username:      admin"
echo "🔑 Super Admin Password:      kjhgfdsaMn01@"
echo "🤖 Telegram Bot Token:        $BOT_TOKEN"
echo "==========================================================="
