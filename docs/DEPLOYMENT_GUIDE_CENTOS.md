# IoT Humidity Monitor - CentOS Deployment Guide

This guide details the steps to deploy the IoT Humidity Monitor application on a CentOS 7/10 server.

## Server Information
- **IP Address**: `192.168.40.193`
- **User**: `pwj-iot-server`
- **Application Path**: `/home/ftp_iot/ftp/upload/iot-humidity-monitor`
- **Domain/URL**: `https://192.168.40.193`

## 1. Prerequisites
Ensure the following are installed on the server:

### Update System
```bash
sudo yum update -y
sudo yum install -y epel-release git curl wget
```

### Install Node.js (v18/v20)
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
sudo npm install -g pm2
```

### Install PostgreSQL
```bash
# Install PostgreSQL repository
sudo yum install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm
sudo yum install -y postgresql14-server

# Initialize and Start
sudo /usr/pgsql-14/bin/postgresql-14-setup initdb
sudo systemctl enable postgresql-14
sudo systemctl start postgresql-14
```

### Install NGINX
```bash
sudo yum install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

## 2. Database Setup

Login to Postgres and create the user/database:
```bash
sudo -u postgres psql
```

Run the following SQL commands:
```sql
CREATE DATABASE db_iot;
CREATE USER qip_iot WITH ENCRYPTED PASSWORD 'qipIOT2026@#$';
GRANT ALL PRIVILEGES ON DATABASE db_iot TO qip_iot;
\c db_iot
GRANT ALL ON SCHEMA public TO qip_iot;
\q
```

Import the database schema:
```bash
# Assuming you have uploaded db_iot.sql to the server
psql -U qip_iot -d db_iot -f /path/to/db_iot.sql
```

## 3. SSL Configuration (Self-Signed)
Generate the SSL certificate for internal use:
```bash
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/iot-monitor.key \
    -out /etc/nginx/ssl/iot-monitor.crt \
    -subj "/C=ID/ST=Jakarta/L=Jakarta/O=PWJ Parkland/OU=IT/CN=192.168.40.193"

sudo chmod 600 /etc/nginx/ssl/iot-monitor.key
sudo chmod 644 /etc/nginx/ssl/iot-monitor.crt
```

## 4. Application Deployment

### Step 1: Upload Code
Upload the project files to: `/home/ftp_iot/ftp/upload/iot-humidity-monitor`

### Step 2: Configure Environment Variables
**Backend:**
Copy `.env.production` to `.env`:
```bash
cd /home/ftp_iot/ftp/upload/iot-humidity-monitor/backend
cp .env.production .env
```
Ensure `.env` contains:
```env
DB_USER=qip_iot
DB_PASSWORD=qipIOT2026@#$
FRONTEND_URL=https://192.168.40.193
```

**Frontend:**
Ensure `.env.production` exists in the root directory.

### Step 3: Install Dependencies & Build
```bash
# Backend
cd /home/ftp_iot/ftp/upload/iot-humidity-monitor/backend
npm install

# Frontend
cd /home/ftp_iot/ftp/upload/iot-humidity-monitor
npm install
npm run build
```

### Step 4: Start with PM2
```bash
cd /home/ftp_iot/ftp/upload/iot-humidity-monitor/deploy
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 5. NGINX Configuration

Copy the configuration file:
```bash
sudo cp /home/ftp_iot/ftp/upload/iot-humidity-monitor/deploy/nginx-iot-monitor-centos.conf /etc/nginx/conf.d/iot-monitor.conf
```

Test and Reload NGINX:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 6. Accessing the Application
- Open `https://192.168.40.193` in your browser.
- Accept the security warning (since using self-signed SSL).
