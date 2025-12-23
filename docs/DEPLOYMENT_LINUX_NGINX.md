# Deployment Guide: IoT Humidity Monitor ke Jaringan Lokal dengan NGINX (Linux)

Panduan lengkap untuk melakukan deployment project NextJS + ExpressJS + PostgreSQL ke jaringan lokal perusahaan menggunakan NGINX sebagai reverse proxy pada Linux server.

---

## 📋 Arsitektur Deployment

```
┌─────────────────────────────────────────────────────────┐
│                JARINGAN LOKAL PERUSAHAAN                │
│                                                         │
│  ┌─────────────┐            ┌─────────────┐            │
│  │  ESP8266    │            │  Browser    │            │
│  │  + DHT22    │            │  Clients    │            │
│  └──────┬──────┘            └──────┬──────┘            │
│         │                          │                    │
│         │ HTTP POST                │ HTTPS              │
│         │                          │                    │
│  ┌──────┴──────────────────────────┴──────┐            │
│  │            LINUX SERVER                 │            │
│  │  ┌──────────────────────────────────┐  │            │
│  │  │     NGINX (:80 / :443)           │  │            │
│  │  │     • Reverse Proxy              │  │            │
│  │  │     • SSL Termination            │  │            │
│  │  │     • Rate Limiting              │  │            │
│  │  └────────────┬─────────────────────┘  │            │
│  │               │                         │            │
│  │       ┌───────┴───────┐                │            │
│  │       │               │                │            │
│  │  ┌────┴────┐    ┌─────┴─────┐          │            │
│  │  │ Next.js │    │ Express.js│          │            │
│  │  │ :3000   │    │ :8090     │          │            │
│  │  │Frontend │    │ Backend   │          │            │
│  │  └─────────┘    └─────┬─────┘          │            │
│  │                       │                 │            │
│  │              ┌────────┴────────┐       │            │
│  │              │   PostgreSQL    │       │            │
│  │              │     :5432       │       │            │
│  │              └─────────────────┘       │            │
│  └─────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Prerequisites

### Hardware Requirements
- Linux Server (Ubuntu 20.04/22.04 LTS recommended)
- Minimum: 2 Core CPU, 4GB RAM, 20GB Storage
- Static IP Address pada jaringan lokal

### Software Requirements
- Node.js 18+ (LTS)
- npm atau yarn
- PostgreSQL 14+
- NGINX
- OpenSSL (untuk SSL certificates)
- PM2 (Process Manager untuk Node.js)

---

## 📝 Langkah-langkah Deployment

### 1️⃣ Persiapan Server Linux

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential

# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 globally
sudo npm install -g pm2

# Install NGINX
sudo apt install -y nginx

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
```

---

### 2️⃣ Konfigurasi PostgreSQL

```bash
# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Login sebagai postgres user
sudo -u postgres psql
```

**Di dalam PostgreSQL prompt:**

```sql
-- Buat database
CREATE DATABASE db_iot;

-- Buat user untuk aplikasi (GANTI PASSWORD!)
CREATE USER iot_user WITH ENCRYPTED PASSWORD 'YOUR_SECURE_PASSWORD';

-- Berikan hak akses
GRANT ALL PRIVILEGES ON DATABASE db_iot TO iot_user;

-- Connect ke database
\c db_iot

-- Buat tabel (sesuaikan dengan schema Anda)
CREATE TABLE IF NOT EXISTS tb_device (
    id_device CHAR(6) PRIMARY KEY,
    location VARCHAR(255) NOT NULL,
    detil_location VARCHAR(255),
    mac_address VARCHAR(17)
);

CREATE TABLE IF NOT EXISTS tb_data (
    id SERIAL PRIMARY KEY,
    id_device CHAR(6) REFERENCES tb_device(id_device),
    temp FLOAT,
    hum FLOAT,
    datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    assigned_location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES tb_users(id),
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grant permissions pada semua tabel
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO iot_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO iot_user;

\q
```

**Konfigurasi PostgreSQL untuk koneksi lokal:**

```bash
# Edit pg_hba.conf untuk allow koneksi dari aplikasi
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Tambahkan line berikut (sesuaikan versi PostgreSQL)
# local   db_iot    iot_user                              md5
# host    db_iot    iot_user    127.0.0.1/32              md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

### 3️⃣ Transfer Project ke Server

**Opsi A: Via Git (Recommended)**
```bash
# Di server, clone repository
cd /var/www
sudo git clone <your-repo-url> iot-humidity-monitor
sudo chown -R $USER:$USER /var/www/iot-humidity-monitor
```

**Opsi B: Via SCP/SFTP**
```bash
# Dari Windows (PowerShell/CMD)
scp -r "D:\Project\Monitoring Humidity\iot-humidity-monitor" user@server-ip:/var/www/
```

---

### 4️⃣ Konfigurasi Environment Variables

**Frontend (.env.production):**
```bash
cd /var/www/iot-humidity-monitor
nano .env.production
```

```env
# Next.js Frontend - Production Environment
# ============================================

# Backend API URL (gunakan domain atau IP server)
NEXT_PUBLIC_API_URL=https://iot.yourcompany.local/api

# Atau jika tanpa subdomain:
# NEXT_PUBLIC_API_URL=https://192.168.x.x/api

# App Info
NEXT_PUBLIC_APP_NAME=IoT Humidity Monitor
```

**Backend (.env):**
```bash
cd /var/www/iot-humidity-monitor/backend
nano .env
```

```env
# Backend Environment Variables
# ============================================

# Database (gunakan credentials yang aman!)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=db_iot
DB_USER=iot_user
DB_PASSWORD=YOUR_SECURE_PASSWORD

# JWT Configuration (GENERATE NEW SECRET!)
# Gunakan: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=GENERATE_NEW_64_BYTE_HEX_SECRET_HERE
JWT_EXPIRES_IN=24h

# Web Push VAPID Keys
# Generate dengan: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=YOUR_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY=YOUR_VAPID_PRIVATE_KEY
VAPID_EMAIL=mailto:admin@yourcompany.com

# Server
PORT=8090
NODE_ENV=production
FRONTEND_URL=https://iot.yourcompany.local
```

**⚠️ KEAMANAN PENTING:**
- Jangan gunakan JWT_SECRET yang ada di development!
- Generate secret baru untuk production
- Simpan credentials dengan aman (gunakan vault jika tersedia)

---

### 5️⃣ Build dan Install Dependencies

```bash
# Frontend
cd /var/www/iot-humidity-monitor
npm install
npm run build

# Backend
cd /var/www/iot-humidity-monitor/backend
npm install
```

---

### 6️⃣ Generate SSL Certificates

**Opsi A: Self-Signed Certificate (untuk jaringan lokal)**

```bash
# Buat direktori untuk SSL
sudo mkdir -p /etc/nginx/ssl

# Generate self-signed certificate (valid 1 tahun)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/iot-monitor.key \
  -out /etc/nginx/ssl/iot-monitor.crt \
  -subj "/C=ID/ST=State/L=City/O=Company/CN=iot.yourcompany.local" \
  -addext "subjectAltName = DNS:iot.yourcompany.local,IP:192.168.x.x"

# Set permissions
sudo chmod 600 /etc/nginx/ssl/iot-monitor.key
sudo chmod 644 /etc/nginx/ssl/iot-monitor.crt
```

**Opsi B: Let's Encrypt (jika server accessible dari internet)**

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d iot.yourcompany.com
```

---

### 7️⃣ Konfigurasi NGINX

```bash
# Buat file konfigurasi untuk IoT Monitor
sudo nano /etc/nginx/sites-available/iot-humidity-monitor
```

**Konfigurasi NGINX Lengkap:**

```nginx
# /etc/nginx/sites-available/iot-humidity-monitor

# Rate limiting untuk keamanan
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=iot_limit:10m rate=10r/s;

# Upstream untuk backend
upstream backend_api {
    server 127.0.0.1:8090;
    keepalive 32;
}

# Upstream untuk frontend
upstream frontend_next {
    server 127.0.0.1:3000;
    keepalive 32;
}

# HTTP server - redirect ke HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name iot.yourcompany.local 192.168.x.x;

    # Redirect semua traffic HTTP ke HTTPS
    location / {
        return 301 https://$host$request_uri;
    }

    # Exception untuk IoT devices yang tidak support HTTPS
    # ESP8266 akan POST data ke endpoint ini
    location /api/data {
        limit_req zone=iot_limit burst=20 nodelay;
        
        proxy_pass http://127.0.0.1:8091;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # IoT device timeout settings
        proxy_connect_timeout 10s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
}

# HTTPS server - main application
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name iot.yourcompany.local 192.168.x.x;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/iot-monitor.crt;
    ssl_certificate_key /etc/nginx/ssl/iot-monitor.key;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logging
    access_log /var/log/nginx/iot-monitor.access.log;
    error_log /var/log/nginx/iot-monitor.error.log;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # API Routes - Backend Express.js
    location /api/ {
        limit_req zone=api_limit burst=50 nodelay;
        
        # Remove /api prefix before passing to backend
        rewrite ^/api/(.*) /$1 break;
        
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (public)
    location /api/health {
        proxy_pass http://backend_api/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Next.js static files
    location /_next/static/ {
        alias /var/www/iot-humidity-monitor/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Public static files
    location /public/ {
        alias /var/www/iot-humidity-monitor/public/;
        expires 30d;
        add_header Cache-Control "public";
    }

    # Service Worker untuk Push Notifications
    location /sw.js {
        alias /var/www/iot-humidity-monitor/public/sw.js;
        add_header Cache-Control "no-cache";
        add_header Service-Worker-Allowed "/";
    }

    # Frontend - Next.js Application (semua route lainnya)
    location / {
        proxy_pass http://frontend_next;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable site dan test konfigurasi:**

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/iot-humidity-monitor /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test konfigurasi
sudo nginx -t

# Reload NGINX
sudo systemctl reload nginx
```

---

### 8️⃣ Setup PM2 untuk Process Management

**Buat file ecosystem PM2:**

```bash
nano /var/www/iot-humidity-monitor/ecosystem.config.js
```

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'iot-frontend',
      cwd: '/var/www/iot-humidity-monitor',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: '/var/log/pm2/frontend-error.log',
      out_file: '/var/log/pm2/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'iot-backend',
      cwd: '/var/www/iot-humidity-monitor/backend',
      script: 'src/index.js',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      error_file: '/var/log/pm2/backend-error.log',
      out_file: '/var/log/pm2/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
```

**Jalankan aplikasi dengan PM2:**

```bash
# Buat direktori log
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Start aplikasi
cd /var/www/iot-humidity-monitor
pm2 start ecosystem.config.js

# Lihat status
pm2 status

# Lihat logs
pm2 logs

# Save PM2 process list
pm2 save

# Setup PM2 untuk auto-start saat boot
pm2 startup
# Ikuti instruksi yang diberikan (copy-paste command yang ditampilkan)
```

---

### 9️⃣ Modifikasi Backend untuk Production

Karena NGINX akan handle SSL, modifikasi backend untuk hanya run HTTP.

Edit file `/var/www/iot-humidity-monitor/backend/src/index.js`:

Ganti bagian `startServer()` menjadi:

```javascript
// ============================================
// START SERVER (Production with NGINX)
// ============================================

const http = require('http');

const startServer = () => {
    const HTTP_PORT = parseInt(process.env.PORT, 10) || 8090;
    const IOT_HTTP_PORT = HTTP_PORT + 1; // 8091 for IoT devices

    // Main HTTP server (NGINX will handle SSL termination)
    http.createServer(app).listen(HTTP_PORT, '127.0.0.1', () => {
        console.log(`API Server on http://127.0.0.1:${HTTP_PORT}`);
    });

    // IoT HTTP server (for ESP8266 devices that don't support HTTPS)
    http.createServer(app).listen(IOT_HTTP_PORT, '0.0.0.0', () => {
        console.log(`
============================================
IoT Humidity Monitor Backend
============================================
API (Internal):  http://127.0.0.1:${HTTP_PORT}
IoT (External):  http://0.0.0.0:${IOT_HTTP_PORT}
Started at: ${new Date().toISOString()}
============================================
        `);
    });
};

startServer();
```

---

### 🔟 Konfigurasi Firewall

```bash
# Install UFW jika belum ada
sudo apt install -y ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (PENTING! Jangan sampai terlock out)
sudo ufw allow 22/tcp

# Allow HTTP dan HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow IoT HTTP endpoint (untuk ESP8266)
sudo ufw allow 8091/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

---

## 🔐 Keamanan Tambahan

### Fail2Ban untuk Brute Force Protection

```bash
# Install fail2ban
sudo apt install -y fail2ban

# Buat konfigurasi untuk NGINX
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/iot-monitor.error.log
```

```bash
# Restart fail2ban
sudo systemctl restart fail2ban
```

---

## 📱 Konfigurasi ESP8266

Update kode ESP8266 untuk mengirim data ke server production:

```cpp
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Gunakan HTTP (port 8091) karena ESP8266 susah handle HTTPS
const char* serverUrl = "http://192.168.x.x:8091/data";
const char* deviceId = "B1MT01"; // Sesuaikan dengan device ID

#define DHTPIN D4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

void setup() {
    Serial.begin(115200);
    dht.begin();
    WiFi.begin(ssid, password);
    
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nConnected to WiFi");
    
    // Sync NTP Time
    configTime(7 * 3600, 0, "pool.ntp.org");
}

void loop() {
    if (WiFi.status() == WL_CONNECTED) {
        float temp = dht.readTemperature();
        float hum = dht.readHumidity();
        
        if (!isnan(temp) && !isnan(hum)) {
            HTTPClient http;
            WiFiClient client;
            
            http.begin(client, serverUrl);
            http.addHeader("Content-Type", "application/json");
            
            StaticJsonDocument<200> doc;
            doc["id_device"] = deviceId;
            doc["temp"] = temp;
            doc["hum"] = hum;
            
            String json;
            serializeJson(doc, json);
            
            int httpCode = http.POST(json);
            
            if (httpCode > 0) {
                Serial.printf("HTTP POST: %d\n", httpCode);
            } else {
                Serial.printf("HTTP Error: %s\n", http.errorToString(httpCode).c_str());
            }
            http.end();
        }
    }
    
    delay(60000); // Kirim setiap 1 menit
}
```

---

## ✅ Verification Checklist

Setelah deployment, verifikasi:

| Item | Command/URL | Expected |
|------|-------------|----------|
| NGINX Status | `sudo systemctl status nginx` | Active (running) |
| PM2 Apps | `pm2 status` | Both apps online |
| PostgreSQL | `sudo systemctl status postgresql` | Active (running) |
| Frontend | `https://iot.yourcompany.local` | Login page loads |
| Health Check | `https://iot.yourcompany.local/api/health` | `{"status":"ok"}` |
| DB Connection | `https://iot.yourcompany.local/api/test-db` | Success message |
| IoT Endpoint | `curl -X POST http://192.168.x.x:8091/data ...` | Data inserted |

---

## 🔄 Maintenance Commands

```bash
# Restart semua services
pm2 restart all

# View logs real-time
pm2 logs --lines 100

# Monitor CPU/Memory
pm2 monit

# Update aplikasi
cd /var/www/iot-humidity-monitor
git pull
npm install
npm run build
pm2 restart iot-frontend

cd backend
npm install
pm2 restart iot-backend

# Backup database
pg_dump -U iot_user -h localhost db_iot > backup_$(date +%Y%m%d).sql
```

---

## 📊 Monitoring (Optional)

Untuk monitoring lebih lengkap, pertimbangkan:

1. **PM2 Plus** - Monitoring dashboard untuk PM2
2. **Prometheus + Grafana** - Metrics monitoring
3. **Netdata** - Real-time system monitoring

```bash
# Install Netdata (simple monitoring)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
# Access di http://server-ip:19999
```

---

## ⚠️ PENTING: Sebelum Go-Live

1. Ganti semua password default
2. Generate JWT secret baru
3. Test semua endpoint
4. Backup konfigurasi
5. Dokumentasikan IP dan credentials di tempat aman

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Author**: IoT Development Team
