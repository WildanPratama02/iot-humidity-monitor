# Environment Configuration Guide

Panduan lengkap untuk mengkonfigurasi environment variables di project IoT Humidity Monitor.

---

## 📁 Struktur File

```
iot-humidity-monitor/
├── .env.development      # Frontend (Dev)
├── .env.production       # Frontend (Prod)
├── .env.local            # Frontend (Local overrides - opsional)
└── backend/
    ├── .env              # Backend (semua environment)
    └── .env.example      # Template
```

---

## 🖥️ Frontend (Next.js)

### `.env.development` (Development Mode)
Digunakan saat menjalankan `npm run dev`

```env
# ============================================
# Next.js Frontend - Development Environment
# ============================================

# Backend API URL (HTTP untuk development lokal)
NEXT_PUBLIC_API_URL=http://localhost:8090

# App Info
NEXT_PUBLIC_APP_NAME=IoT Humidity Monitor (DEV)
```

### `.env.production` (Production Mode)
Digunakan saat menjalankan `npm run build` dan `npm run start`

```env
# ============================================
# Next.js Frontend - Production Environment
# ============================================

# Backend API URL (HTTPS untuk production)
NEXT_PUBLIC_API_URL=https://192.168.43.175:8090

# App Info
NEXT_PUBLIC_APP_NAME=IoT Humidity Monitor
```

### `.env.local` (Optional - Local Overrides)
File ini akan override semua setting di atas. Cocok untuk development lokal dengan konfigurasi berbeda.

```env
# Override untuk testing lokal (opsional)
# NEXT_PUBLIC_API_URL=https://192.168.43.175:8090
```

---

## ⚙️ Backend (Express.js)

### `backend/.env`

```env
# ============================================
# IoT Humidity Monitor - Backend Configuration
# ============================================

# ===================
# Database PostgreSQL
# ===================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=iot_humidity_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# ===================
# Server Configuration
# ===================
PORT=8090
NODE_ENV=production

# ===================
# JWT Authentication
# ===================
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
JWT_EXPIRES_IN=7d

# ===================
# CORS Configuration  
# ===================
# Development
# FRONTEND_URL=http://localhost:3000

# Production (uncomment for production)
FRONTEND_URL=https://192.168.43.175:3000

# ===================
# Push Notification (VAPID Keys)
# ===================
# Generate dengan: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
VAPID_EMAIL=mailto:admin@example.com
```

### `backend/.env.example` (Template untuk sharing)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=iot_humidity_db
DB_USER=postgres
DB_PASSWORD=

# Server
PORT=8090
NODE_ENV=development

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:3000

# Push Notification
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=
```

---

## 🔄 Cara Kerja

| Command | Frontend Env | Backend Env |
|---------|-------------|-------------|
| `npm run dev` | `.env.development` | `backend/.env` |
| `npm run build` | `.env.production` | - |
| `npm run start` | `.env.production` | - |
| `npm run start:https` | `.env.production` | - |

---

## 🚀 Quick Setup

### 1. Frontend Development
```bash
# Buat file .env.development di root project
# Copy isi dari section "Frontend .env.development" di atas
```

### 2. Frontend Production
```bash
# Buat file .env.production di root project
# Copy isi dari section "Frontend .env.production" di atas
```

### 3. Backend
```bash
# Edit file backend/.env
# Sesuaikan dengan konfigurasi database dan server Anda
```

---

## ⚠️ Penting

1. **Jangan commit file `.env`** - File ini sudah ada di `.gitignore`
2. **Gunakan `.env.example`** untuk sharing template ke tim
3. **VAPID Keys** harus sama antara backend dan frontend
4. **Ganti semua nilai default** (password, secret, dll)
