#!/bin/bash
# ============================================
# IoT Humidity Monitor - Deployment Script
# Server: 192.168.40.193 (CentOS 7)
# ============================================

set -e

echo "============================================"
echo "IoT Humidity Monitor - CentOS 7 Deployment"
echo "============================================"

APP_DIR="/var/www/iot-humidity-monitor"

# Step 1: Install EPEL Repository
echo "[1/9] Installing EPEL repository..."
sudo yum install -y epel-release

# Step 2: Install dependencies
echo "[2/9] Installing dependencies..."
sudo yum install -y curl wget git gcc-c++ make openssl openssl-devel

# Step 3: Install Node.js 18
echo "[3/9] Installing Node.js 18..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

echo "Node: $(node --version)"
echo "NPM: $(npm --version)"

# Step 4: Install PM2
echo "[4/9] Installing PM2..."
sudo npm install -g pm2

# Step 5: Install NGINX
echo "[5/9] Installing NGINX..."
sudo yum install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Step 6: Generate SSL Certificate
echo "[6/9] Generating SSL Certificate..."
sudo mkdir -p /etc/nginx/ssl

if [ ! -f /etc/nginx/ssl/iot-monitor.crt ]; then
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/iot-monitor.key \
        -out /etc/nginx/ssl/iot-monitor.crt \
        -subj "/C=ID/ST=Jakarta/L=Jakarta/O=PWJ-Parkland/CN=192.168.40.193"
    
    sudo chmod 600 /etc/nginx/ssl/iot-monitor.key
    sudo chmod 644 /etc/nginx/ssl/iot-monitor.crt
    echo "SSL Certificate generated!"
fi

# Step 7: Setup Application
echo "[7/9] Setting up application..."
cd $APP_DIR

# Copy production env
cp backend/.env.production backend/.env

# Install dependencies
npm install
npm run build

cd backend
npm install
cd ..

# Step 8: Configure NGINX
echo "[8/9] Configuring NGINX..."
sudo cp deploy/nginx-iot-monitor-centos.conf /etc/nginx/conf.d/iot-humidity-monitor.conf

# Test NGINX
sudo nginx -t
sudo systemctl reload nginx

# Step 9: Start PM2
echo "[9/9] Starting applications..."
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

pm2 delete all 2>/dev/null || true
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup systemd

sudo systemctl reload nginx

# Configure Firewall (firewalld for CentOS 7)
echo "Configuring firewall..."
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload

echo ""
echo "============================================"
echo "✅ Deployment Complete!"
echo "============================================"
echo "Frontend: https://192.168.40.193"
echo "API:      https://192.168.40.193/api"
echo "IoT:      http://192.168.40.193/api/data"
echo "============================================"
