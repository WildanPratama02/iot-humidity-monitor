#!/bin/bash
# ============================================
# IoT Humidity Monitor - Deployment Script
# Server: 192.168.40.193
# ============================================

set -e

echo "============================================"
echo "IoT Humidity Monitor - Deployment"
echo "============================================"

# Variables
APP_DIR="/var/www/iot-humidity-monitor"
NGINX_CONF="/etc/nginx/sites-available/iot-humidity-monitor"

# Step 1: Update system
echo "[1/8] Updating system..."
sudo apt update && sudo apt upgrade -y

# Step 2: Install dependencies
echo "[2/8] Installing dependencies..."
sudo apt install -y curl wget git build-essential openssl nginx

# Install Node.js 18 if not exists
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install PM2
sudo npm install -g pm2

echo "Node: $(node --version)"
echo "NPM: $(npm --version)"

# Step 3: Setup directories
echo "[3/8] Setting up directories..."
sudo mkdir -p $APP_DIR
sudo mkdir -p /var/log/pm2
sudo mkdir -p /etc/nginx/ssl

# Step 4: Generate SSL Certificate
echo "[4/8] Generating SSL Certificate..."
if [ ! -f /etc/nginx/ssl/iot-monitor.crt ]; then
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/iot-monitor.key \
        -out /etc/nginx/ssl/iot-monitor.crt \
        -subj "/C=ID/ST=Jakarta/L=Jakarta/O=PWJ-Parkland/CN=192.168.40.193" \
        -addext "subjectAltName = IP:192.168.40.193"
    
    sudo chmod 600 /etc/nginx/ssl/iot-monitor.key
    sudo chmod 644 /etc/nginx/ssl/iot-monitor.crt
    echo "SSL Certificate generated!"
else
    echo "SSL Certificate already exists."
fi

# Step 5: Install application dependencies
echo "[5/8] Installing application dependencies..."
cd $APP_DIR

# Copy production env for backend
cp backend/.env.production backend/.env

# Install frontend
npm install
npm run build

# Install backend
cd backend
npm install
cd ..

# Step 6: Configure NGINX
echo "[6/8] Configuring NGINX..."
sudo cp deploy/nginx-iot-monitor.conf $NGINX_CONF
sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test NGINX config
sudo nginx -t

# Step 7: Start services
echo "[7/8] Starting services with PM2..."
pm2 delete all 2>/dev/null || true
pm2 start deploy/ecosystem.config.js
pm2 save

# Setup PM2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

# Reload NGINX
sudo systemctl reload nginx

# Step 8: Configure Firewall
echo "[8/8] Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo ""
echo "============================================"
echo "✅ Deployment Complete!"
echo "============================================"
echo "Frontend: https://192.168.40.193"
echo "API:      https://192.168.40.193/api"
echo "IoT:      http://192.168.40.193/api/data"
echo ""
echo "Commands:"
echo "  pm2 status     - Check app status"
echo "  pm2 logs       - View logs"
echo "  pm2 restart all - Restart apps"
echo "============================================"
