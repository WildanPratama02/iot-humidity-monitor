# 🚀 Panduan Deployment Production Ready
## IoT Humidity Monitor — CentOS Linux Server (192.168.40.193)

Dokumentasi ini dibuat khusus sebagai panduan instalasi, konfigurasi, dan pemeliharaan aplikasi **IoT Humidity Monitor** pada server Linux **CentOS** dengan IP Server **`192.168.40.193`**.

---

## 📋 Daftar Isi
1. [Arsitektur Sistem](#1-arsitektur-sistem)
2. [Prasyarat & Persiapan Server](#2-prasyarat--persiapan-server)
3. [Setup Database PostgreSQL](#3-setup-database-postgresql)
4. [Penempatan Kode & Environment Variables](#4-penempatan-kode--environment-variables)
5. [Build & Konfigurasi PM2](#5-build--konfigurasi-pm2)
6. [Konfigurasi NGINX Reverse Proxy](#6-konfigurasi-nginx-reverse-proxy)
7. [Konfigurasi Firewall & SELinux (Khusus CentOS)](#7-konfigurasi-firewall--selinux-khusus-centos)
8. [Konfigurasi ESP8266 IoT Device](#8-konfigurasi-esp8266-iot-device)
9. [Verifikasi & Pengujian](#9-verifikasi--pengujian)
10. [Maintenance, Backup & Troubleshooting](#10-maintenance-backup--troubleshooting)

---

## 1. Arsitektur Sistem

```text
[ Browser / Client ]              [ ESP8266 IoT Sensors ]
         │                                   │
         │ (HTTP / HTTPS)                    │ (HTTP POST /api/data)
         ▼                                   ▼
┌─────────────────────────────────────────────────────────────┐
│              Server CentOS (192.168.40.193)                 │
│                                                             │
│   NGINX Reverse Proxy (Port 80 / 443)                       │
│   ├── /api/* & direct routes ──► Backend Express (Port 8091)│
│   └── /* (Web Dashboard)     ──► Frontend Next.js(Port 3000)│
│                                                             │
│   PM2 Process Manager                                       │
│   ├── iot-frontend (Node server.js)                         │
│   └── iot-backend  (Node src/index.js)                      │
│                                                             │
│   Database                                                  │
│   └── PostgreSQL (Port 5432) -> Database: db_iot            │
└─────────────────────────────────────────────────────────────┘
```

| Komponen | Service / Port | Path di Server |
|---|---|---|
| **Frontend** | Next.js (`server.js`) / Port `3000` | `/var/www/iot-humidity` |
| **Backend** | Express.js / Port `8091` | `/var/www/iot-humidity/backend` |
| **Database** | PostgreSQL / Port `5432` | Database `db_iot`, User `qip_iot` |
| **Web Server** | NGINX / Port `80` & `443` | `/etc/nginx/conf.d/iot-humidity.conf` |
| **Process Manager** | PM2 | `/var/log/pm2` |
| **Server IP** | `192.168.40.193` | - |

---

## 2. Prasyarat & Persiapan Server

Pastikan versi Node.js yang terpasang adalah minimal **Node.js 18.x atau 20.x LTS** (karena Next.js 16 & React 19 membutuhkan Node.js 18.17+):

```bash
node -v    # Minimal v18.18.0+ atau v20.x
npm -v
pm2 -v
nginx -v
psql --version
```

Buat direktori kerja aplikasi dan direktori log PM2:
```bash
# Buat direktori aplikasi
sudo mkdir -p /var/www/iot-humidity
sudo chown -R $USER:$USER /var/www/iot-humidity

# Buat folder log PM2 agar tidak error saat PM2 dijalankan
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2
sudo chmod 755 /var/log/pm2
```

---

## 3. Setup Database PostgreSQL

### 3.1. Buat User & Database
Masuk ke user postgres:
```bash
sudo -u postgres psql
```

Jalankan query SQL berikut:
```sql
-- 1. Buat User
CREATE USER qip_iot WITH PASSWORD 'qipIOT2026@#$';

-- 2. Buat Database
CREATE DATABASE db_iot OWNER qip_iot;

-- 3. Berikan hak akses
GRANT ALL PRIVILEGES ON DATABASE db_iot TO qip_iot;

\q
```

### 3.2. Import Schema & Data Awal
Copy file `db_iot.sql` ke server, lalu lakukan import:
```bash
# Import database schema dan data
psql -U qip_iot -d db_iot -h localhost -f /var/www/iot-humidity/db_iot.sql
```

### 3.3. Pastikan PostgreSQL Aktif Saat Booting
```bash
sudo systemctl enable postgresql
sudo systemctl restart postgresql
```

---

## 4. Penempatan Kode & Environment Variables

### 4.1. Salin Source Code
Salin file repository ke `/var/www/iot-humidity/`. Struktur folder utama harus seperti berikut:
```text
/var/www/iot-humidity/
├── .env.production
├── deploy/
│   ├── ecosystem.config.js
│   └── nginx.conf
├── backend/
│   ├── .env.production
│   ├── src/
│   └── package.json
├── public/
├── src/
├── package.json
├── server.js
└── next.config.ts
```

### 4.2. Konfigurasi Frontend `.env.production`
Pastikan file `/var/www/iot-humidity/.env.production` berisi:
```env
# Next.js Frontend - Production Environment
# Server: 192.168.40.193 / iot-humidity.qdms.web.id

# Backend API URL (via NGINX reverse proxy)
NEXT_PUBLIC_API_URL=/api

# App Info
NEXT_PUBLIC_APP_NAME="IoT Humidity Monitor"

# Web Push VAPID Key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BLixrpWNDzz-9V5DiczCJm9iTATMA7m3AintGWHufRW5JyL0Uzc_iXKDx-OCgHi6quH29Vp9PonLFZ0E0fUQDiE
```

### 4.3. Konfigurasi Backend `.env`
Salin atau buat file `.env` di dalam folder `/var/www/iot-humidity/backend/.env`:
```bash
cp /var/www/iot-humidity/backend/.env.production /var/www/iot-humidity/backend/.env
```

Pastikan isi `/var/www/iot-humidity/backend/.env` sesuai:
```env
USE_SSL=false

# Database PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=db_iot
DB_USER=qip_iot
DB_PASSWORD=qipIOT2026@#$

# JWT Authentication
JWT_SECRET=9ca4918358a7903150a087a644d943a93ce9ed8d9263d6490877488af26633b59a9be8c1c2ceee60a3e03fa89b600bb94dc95a201671c81fe61d242485cfe148
JWT_EXPIRES_IN=24h

# Web Push VAPID Keys
VAPID_PUBLIC_KEY=BLixrpWNDzz-9V5DiczCJm9iTATMA7m3AintGWHufRW5JyL0Uzc_iXKDx-OCgHi6quH29Vp9PonLFZ0E0fUQDiE
VAPID_PRIVATE_KEY=Ifd0vB67Y0MhOI1BZg1v6eEc0OeBCuiWwPnTdBDHAQc
VAPID_EMAIL=mailto:admin@qdms.web.id

# Server Port
PORT=8091
NODE_ENV=production
FRONTEND_URL=*
```

---

## 5. Build & Konfigurasi PM2

### 5.1. Install Dependencies & Build Frontend
```bash
cd /var/www/iot-humidity

# Install dependencies frontend
npm install --omit=dev  # Atau npm install

# Build Next.js untuk production
npm run build

# Install dependencies backend
cd /var/www/iot-humidity/backend
npm install --omit=dev
```

### 5.2. Verifikasi File `ecosystem.config.js`
Periksa file `/var/www/iot-humidity/deploy/ecosystem.config.js`:
> **PENTING:** Pastikan PORT frontend bernilai `3000` (sama dengan yang di-proxy oleh NGINX).

```javascript
module.exports = {
  apps: [
    {
      name: 'iot-frontend',
      script: 'server.js',
      cwd: '/var/www/iot-humidity',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      error_file: '/var/log/pm2/iot-frontend-error.log',
      out_file: '/var/log/pm2/iot-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true
    },
    {
      name: 'iot-backend',
      script: 'src/index.js',
      cwd: '/var/www/iot-humidity/backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 8091,
        HOST: '0.0.0.0'
      },
      error_file: '/var/log/pm2/iot-backend-error.log',
      out_file: '/var/log/pm2/iot-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true
    }
  ]
};
```

### 5.3. Jalankan Aplikasi dengan PM2 & Buat Auto-Startup
```bash
cd /var/www/iot-humidity

# Jalankan kedua service
pm2 start deploy/ecosystem.config.js

# Cek status
pm2 status

# Simpan state PM2 saat ini
pm2 save

# Daftarkan PM2 agar otomatis jalan saat server reboot (Systemd)
pm2 startup systemd
# Jalankan perintah sudo env PATH=... yang dimunculkan di terminal!
```

---

## 6. Konfigurasi NGINX Reverse Proxy

### 6.1. Pasang File Konfigurasi NGINX
Buat atau edit file `/etc/nginx/conf.d/iot-humidity.conf`:
```bash
sudo nano /etc/nginx/conf.d/iot-humidity.conf
```

Gunakan konfigurasi berikut yang sudah dioptimasi untuk IP `192.168.40.193` dan domain:

```nginx
# =======================================================
# NGINX Configuration for IoT Humidity Monitor
# Server IP : 192.168.40.193
# Domain    : iot-humidity.qdms.web.id (Optional)
# =======================================================

# -------------------------------------------------------
# HTTP Server (Port 80)
# Menerima request dari browser via IP & request dari ESP8266 IoT
# -------------------------------------------------------
server {
    listen 80;
    server_name 192.168.40.193 iot-humidity.qdms.web.id localhost;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # 1. API Endpoint untuk Sensor IoT & Backend (/api/)
    location /api/ {
        rewrite ^/api/(.*)$ /$1 break;
        proxy_pass http://127.0.0.1:8091;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90;
    }

    # 2. Rute Backend Direct (auth, data, devices, notifications, health)
    location ~ ^/(notifications|auth|data|devices|users|locations|health|admin|test-db)(/.*)?$ {
        proxy_pass http://127.0.0.1:8091;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90;
    }

    # 3. Static Files Caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 4. Frontend Next.js Web App
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # Error Page Handling
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

> **Catatan jika memakai HTTPS / SSL (Certbot / Let's Encrypt):**
> Jika Anda sudah memiliki sertifikat SSL untuk domain `iot-humidity.qdms.web.id`, Anda dapat menambahkan blok `server { listen 443 ssl http2; ... }`. Namun, **pastikan port 80 tetap melayani `/api/` dan `/data`** tanpa di-redirect ke HTTPS agar modul ESP8266 tetap bisa mengirim data via HTTP.

### 6.2. Test & Reload NGINX
```bash
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable nginx
```

---

## 7. Konfigurasi Firewall & SELinux (Khusus CentOS)

CentOS memiliki 2 lapisan keamanan bawaan yang **wajib** dikonfigurasi:

### 7.1. Buka Port di Firewalld
```bash
# Izinkan HTTP & HTTPS
sudo firewall-cmd --permanent --zone=public --add-service=http
sudo firewall-cmd --permanent --zone=public --add-service=https
sudo firewall-cmd --permanent --zone=public --add-port=80/tcp
sudo firewall-cmd --permanent --zone=public --add-port=443/tcp

# Reload firewall
sudo firewall-cmd --reload

# Periksa status
sudo firewall-cmd --list-all
```

### 7.2. Atur SELinux (Penyebab Umum 502 Bad Gateway di CentOS)
Secara default, SELinux di CentOS melarang NGINX menghubungkan koneksi ke socket/port lokal (Node.js):

```bash
# Izinkan NGINX melakukan reverse-proxy ke Node.js (Port 3000 & 8091)
sudo setsebool -P httpd_can_network_connect 1

# Berikan izin konteks SELinux untuk file web di /var/www/
sudo chcon -R -t httpd_sys_content_t /var/www/iot-humidity
```

---

## 8. Konfigurasi ESP8266 IoT Device

Pastikan firmware Arduino pada file `humidity_production.ino` atau `humidity_localserver.ino` dikonfigurasi dengan IP server:

```cpp
// -----------------------
// Production Server API
// -----------------------
const char *serverURL = "192.168.40.193";
const int portLocal = 80;               // Port NGINX
const char *endpointLocal = "/api/data"; // Endpoint forward ke backend

// Format URL yang dihasilkan:
// http://192.168.40.193:80/api/data
```

**Payload JSON yang dikirim oleh ESP8266:**
```json
{
  "id_device": "PXMO01",
  "temp": 25.4,
  "hum": 65.2,
  "datetime": "2026-09-14 13:00:00"
}
```

---

## 9. Verifikasi & Pengujian

### 9.1. Uji Endpoint Backend Langsung
```bash
# 1. Test Health Check
curl http://127.0.0.1:8091/health

# 2. Test Koneksi Database
curl http://127.0.0.1:8091/test-db
```
Hasil yang diharapkan:
```json
{"status":"ok","timestamp":"..."}
{"success":true,"message":"Database connected","time":"..."}
```

### 9.2. Uji Lewat NGINX (Port 80)
```bash
# Dari server lokal
curl http://localhost/health
curl http://192.168.40.193/api/devices

# Uji kirim data sensor simulasi (POST)
curl -X POST http://192.168.40.193/api/data \
  -H "Content-Type: application/json" \
  -d '{"id_device":"PXMO01","temp":26.5,"hum":60.0,"datetime":"2026-09-14 13:05:00"}'
```

### 9.3. Buka Dashboard dari Browser
Buka browser pada PC/Laptop yang satu jaringan dengan server:
```text
http://192.168.40.193
```
Dashboard IoT Humidity Monitor akan tampil dan data realtime dari sensor akan langsung terupdate.

---

## 10. Maintenance, Backup & Troubleshooting

### 10.1. Perintah Harian PM2
```bash
# Cek status proses
pm2 status

# Lihat log realtime
pm2 logs

# Lihat log spesifik frontend / backend
pm2 logs iot-frontend
pm2 logs iot-backend

# Restart service setelah update kode
pm2 restart iot-frontend
pm2 restart iot-backend
# Atau restart semua
pm2 restart ecosystem.config.js
```

### 10.2. Cek Log NGINX
Jika terjadi error (misal 502 / 500):
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### 10.3. Script Backup Otomatis Database (Cron Job)
Buat file backup script `/root/backup_db_iot.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgres"
DATE=$(date +\%Y\%m\%d_\%H\%M\%S)
mkdir -p $BACKUP_DIR

PGPASSWORD='qipIOT2026@#$' pg_dump -U qip_iot -h localhost db_iot > $BACKUP_DIR/db_iot_$DATE.sql

# Hapus backup yang lebih tua dari 14 hari
find $BACKUP_DIR -type f -name "*.sql" -mtime +14 -exec rm {} \;
```
Beri hak eksekusi dan pasang cron job:
```bash
chmod +x /root/backup_db_iot.sh
# Pasang cron setiap jam 01:00 pagi
(crontab -l 2>/dev/null; echo "0 1 * * * /root/backup_db_iot.sh") | crontab -
```

---

## 11. Cheat Sheet Troubleshooting

| Gejala Masalah | Penyebab Umum | Solusi |
|---|---|---|
| **502 Bad Gateway** di NGINX | SELinux memblokir koneksi NGINX ke backend/frontend | Jalankan: `sudo setsebool -P httpd_can_network_connect 1` |
| **502 Bad Gateway** di NGINX | Port mismatch (`ecosystem.config.js` port 3001, tapi NGINX port 3000) | Samakan port di `ecosystem.config.js` ke port `3000` lalu `pm2 restart all` |
| **Tidak bisa diakses dari PC lain** | Port 80 diblokir oleh firewalld | Jalankan: `sudo firewall-cmd --permanent --add-port=80/tcp && sudo firewall-cmd --reload` |
| **ESP8266 Gagal Kirim Data (-1)** | ESP8266 di-redirect ke HTTPS atau IP/WiFi tidak menjangkau 192.168.40.193 | Pastikan NGINX port 80 melayani `/api/` tanpa redirect HTTPS, dan ESP8266 terhubung ke WiFi lokal yang sama |
| **Database Connection Failed** | Service PostgreSQL mati atau password salah | Cek: `sudo systemctl status postgresql` dan verifikasi `.env` di folder `backend/` |
