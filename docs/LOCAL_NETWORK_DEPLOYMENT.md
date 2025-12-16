# Panduan Deploy IoT Humidity Monitor ke Local Network

## Prerequisites
- Server dengan Windows/Linux yang terkoneksi ke jaringan lokal perusahaan
- Node.js v18+ sudah terinstall
- PostgreSQL sudah terinstall dan berjalan
- Akses ke router/firewall untuk membuka port

---

## Struktur Deployment

```
Server (contoh: 192.168.1.100)
├── Backend Express.js → Port 8090
├── Frontend Next.js  → Port 3000
└── PostgreSQL        → Port 5432
```

---

## Step 1: Persiapan Database

### 1.1 Buat Database
```sql
CREATE DATABASE db_iot;
```

### 1.2 Jalankan Migration
```bash
cd backend
# Jalankan script SQL
psql -U postgres -d db_iot -f scripts/001_auth_schema.sql
```

---

## Step 2: Konfigurasi Environment

### 2.1 Backend `.env`
Buat file `backend/.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=db_iot
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT
JWT_SECRET=ganti_dengan_secret_yang_kuat_dan_random
JWT_EXPIRES_IN=24h

# VAPID Keys for Push Notification
# Generate dengan: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=BBIsENwo68u8sPtJRDK91CYkqfBCKpoxJQKn3Tm_pM-xQ08KaH_t8eX968NhVdsE-IB30drKV_v6rax75i-HSR4
VAPID_PRIVATE_KEY=wkdVGO2xuecqTpj2kdwSDw3aQTxxa-UMIekx9SDxU10
VAPID_EMAIL=mailto:admin@perusahaan.com

# Server
PORT=8090
FRONTEND_URL=https://192.168.1.100:3000
```

### 2.2 Frontend `.env.local`
Buat file `.env.local` di root project:
```env
NEXT_PUBLIC_API_URL=https://192.168.1.100:8090
```

---

## Step 3: Generate SSL Certificate (Self-Signed)

Push notification **membutuhkan HTTPS**. Untuk local network, gunakan self-signed certificate.

### 3.1 Install OpenSSL (jika belum ada)
- **Windows**: Download dari https://slproweb.com/products/Win32OpenSSL.html
- **Linux**: `sudo apt install openssl`

### 3.2 Generate Certificate

**Option A: Menggunakan OpenSSL (Git Bash recommended)**
Jalankan di terminal (Git Bash):

```bash
# Buat folder untuk SSL
mkdir ssl

# Generate private key dan certificate
# Note: Gunakan tanda double slash (//) di awal -subj agar Git Bash Windows tidak mengkonversinya menjadi path file
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/server.key \
  -out ssl/server.crt \
  -subj "//C=ID/ST=Jakarta/L=Jakarta/O=PWJ-QIP/CN=192.168.43.175"
```

**Option B: Menggunakan PowerShell (Windows Native)**
Jika tidak punya OpenSSL, gunakan script PowerShell berikut.
Simpan sebagai `generate_cert.ps1` dan jalankan as Administrator:

```powershell
$cert = New-SelfSignedCertificate -DnsName "192.168.43.175" -CertStoreLocation "cert:\LocalMachine\My"
$password = ConvertTo-SecureString -String "Pwj123$%" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "ssl\server.pfx" -Password $password

# Note: Node.js lebih mudah membaca .key/.crt dari OpenSSL. 
# Jika menggunakan PFX, perlu konfigurasi tambahan.
# SANGAT DISARANKAN menggunakan Option A (OpenSSL).
```

---

## Step 4: Modifikasi Backend untuk HTTPS

Edit `backend/src/index.js`, ganti bagian server listen:

```javascript
// Di bagian paling atas, tambahkan:
const https = require('https');
const fs = require('fs');

// Di bagian START SERVER, ganti dengan:
const PORT = process.env.PORT || 8090;

// Check if SSL certificates exist for HTTPS
const sslPath = './ssl';
if (fs.existsSync(`${sslPath}/server.key`) && fs.existsSync(`${sslPath}/server.crt`)) {
    const httpsOptions = {
        key: fs.readFileSync(`${sslPath}/server.key`),
        cert: fs.readFileSync(`${sslPath}/server.crt`)
    };
    
    https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
        console.log(`🔒 HTTPS Server running on port ${PORT}`);
    });
} else {
    // Fallback to HTTP for development
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🌐 HTTP Server running on port ${PORT}`);
    });
}
```

---

## Step 5: Modifikasi Next.js untuk HTTPS

### 5.1 Install package
```bash
npm install --save-dev local-ssl-proxy
```

### 5.2 Atau modifikasi `package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "dev:https": "next dev --experimental-https",
    "build": "next build",
    "start": "next start",
    "start:https": "node server.js"
  }
}
```

### 5.3 Buat `server.js` untuk production HTTPS:
```javascript
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
    key: fs.readFileSync('./ssl/server.key'),
    cert: fs.readFileSync('./ssl/server.crt')
};

app.prepare().then(() => {
    createServer(httpsOptions, (req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    }).listen(3000, '0.0.0.0', () => {
        console.log('🔒 HTTPS Frontend running on https://0.0.0.0:3000');
    });
});
```

---

## Step 6: Install Sebagai Service (Windows)

### 6.1 Install PM2
```bash
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install
```

### 6.2 Start Applications
```bash
# Start Backend
cd backend
pm2 start src/index.js --name "iot-backend"

# Start Frontend (production build)
cd ..
npm run build
pm2 start server.js --name "iot-frontend"

# Save PM2 config
pm2 save
```

---

## Step 7: Konfigurasi Firewall

Buka port yang diperlukan di Windows Firewall:
- Port 3000 (Frontend HTTPS)
- Port 8090 (Backend HTTPS)

```powershell
# Windows PowerShell (Run as Admin)
New-NetFirewallRule -DisplayName "IoT Frontend" -Direction Inbound -Port 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "IoT Backend" -Direction Inbound -Port 8090 -Protocol TCP -Action Allow
```

---

## Step 8: Akses dari Device Lain

### 8.1 Di Browser (Laptop/HP)
Akses: `https://192.168.1.100:3000`

### 8.2 Accept Self-Signed Certificate
Browser akan menampilkan warning "Not Secure". Klik:
- Chrome: "Advanced" → "Proceed to 192.168.1.100"
- Firefox: "Advanced" → "Accept the Risk and Continue"

### 8.3 Install di Homescreen (PWA)
Setelah accept certificate, Anda bisa "Add to Homescreen" untuk akses cepat.

---

## Step 9: Test Push Notification

1. Login ke aplikasi
2. Izinkan notifikasi saat diminta
3. Cek console browser untuk "[Push] Subscription saved to backend"
4. Trigger alert dengan mengirim data sensor yang melebihi threshold

---

## Troubleshooting

### Push notification tidak muncul
1. Pastikan HTTPS sudah aktif
2. Pastikan service worker terdaftar (DevTools → Application → Service Workers)
3. Pastikan subscription tersimpan di database `tb_subscriptions`

### Tidak bisa akses dari device lain
1. Pastikan server dan client di network yang sama
2. Cek firewall sudah membuka port
3. Gunakan IP address, bukan localhost

### Certificate error
1. Accept certificate di browser
2. Atau install certificate ke trusted store di device
