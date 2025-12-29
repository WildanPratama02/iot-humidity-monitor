# Panduan Setup Ngrok (Strategi Single Tunnel)

Berikut adalah solusi permanen untuk mengatasi error `ERR_NGROK_334` (tunnel conflict) dan `CORS`. Kita menggunakan fitur **Next.js Rewrites** untuk menggabungkan Frontend dan Backend dalam satu tunnel.

## Kelebihan Solusi Ini
- **Hanya butuh 1 Tunnel Ngrok** (Hemat resource & tidak bentrok).
- **Tidak ada error CORS** (Karena API dipanggil dari domain yang sama).
- **Support Web Push Notification** dengan mudah.

---

## Langkah 1: Konfigurasi Project (Sudah Saya Otomatisasi)

Saya telah mengupdate file `next.config.ts` dan `.env.development` Anda dengan konfigurasi berikut:

1. **Next.js Proxy** (`next.config.ts`):
   Setiap request ke `/api/*` akan diteruskan otomatis ke Backend (`http://localhost:8091`).
   
2. **Environment Variable** (`.env.development`):
   `NEXT_PUBLIC_API_URL` diset menjadi `/api` (path relatif).

## Langkah 2: Jalankan Server Lokal

Pastikan Anda merestart Frontend agar perubahan konfigurasi terbaca (Ctrl+C lalu `npm run dev`).

1. **Terminal Backend**:
   Jalankan backend seperti biasa (pastikan jalan di port default/8091).
   ```bash
   cd backend
   npm run dev
   ```

2. **Terminal Frontend**:
   Jalankan frontend:
   ```bash
   # Di root folder
   npm run dev
   ```

## Langkah 3: Jalankan Ngrok (Hanya 1 Command)

Sekarang Anda cukup menjalankan Ngrok untuk **Frontend saja**.

1. Buka Terminal Baru.
2. Jalankan perintah ini (tambahkan `host-header` agar Next.js tidak menolak request):
   ```bash
   ngrok http 3000 --host-header="localhost:3000"
   ```
   *(Jika error `--host-header` tidak dikenali, coba update ngrok atau gunakan `ngrok http 3000` biasa).*

3. Copy URL HTTPS yang muncul (Contoh: `https://abcd-1234.ngrok-free.app`).

## Langkah 4: Testing

1. Buka URL Ngrok tersebut di **HP Anda**.
2. Login dan cek data.
   - Saat Frontend memanggil `/api/auth/login`, Next.js akan meneruskannya ke Backend secara internal.
3. Coba **Web Push Notification**:
   - Klik Subscribe. Browser akan meminta izin notifikasi (karena HTTPS).
   
## Troubleshooting

- **502 Bad Gateway**: Pastikan Backend sedang berjalan (`npm run dev` di folder backend).
- **404 Not Found pada API**: Pastikan Backend berjalan di port yang benar (`8091`). Cek log di terminal Backend.
- **WebSocket/Socket.io**: Jika aplikasi menggunakan WebSocket, konfigurasi rewrite HTTP mungkin tidak cukup, tapi untuk REST API standar ini sudah sempurna.
