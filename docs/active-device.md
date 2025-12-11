# Role
Bertindaklah sebagai Senior Fullstack Engineer (Next.js, TypeScript, Express.js).

# Context
Kita sedang melanjutkan pengembangan proyek `iot-humidity-monitor`.
Saat ini Dashboard sudah menampilkan grafik dan data sensor, namun ada 3 fitur krusial yang perlu diperbaiki dan ditambahkan.

# Tasks

Tolong implementasikan solusi untuk 3 poin berikut:

## 1. Fix: Search Device Location
**Masalah:** Fitur pencarian lokasi di Sidebar saat ini tidak berjalan dengan baik (mungkin tidak reaktif atau filternya salah).
**Requirement:**
- Perbaiki logika filter pada list Sidebar.
- Input search harus *case-insensitive* (tidak peduli huruf besar/kecil).
- Pencarian harus real-time (langsung memfilter list saat user mengetik).
- Jika keyword tidak ditemukan, tampilkan pesan ramah "Lokasi tidak ditemukan".
- Pastikan state `searchTerm` terhubung dengan benar ke method `.filter()`.

## 2. Feature: Device Connection Status (Online/Offline)
**Masalah:** User tidak tahu apakah device sedang mati atau hidup.
**Requirement:**
- Tentukan status device berdasarkan data `last_updated` atau `datetime` terakhir dari API.
- **Logika:**
  - Jika data terakhir diterima < 5 menit yang lalu -> Status **ONLINE** (Hijau).
  - Jika data terakhir diterima > 30 menit yang lalu -> Status **OFFLINE** (Abu-abu/Merah).
- **UI Update:**
  - Tambahkan indikator visual (Badge/Dot) di Sidebar di samping nama lokasi.
  - Tambahkan indikator status teks "Online/Offline" di header halaman Dashboard (sebelah nama lokasi).

## 3. Feature: Push Notification Alert (Browser)
**Masalah:** User harus memantau layar terus menerus untuk tahu jika ada masalah.
**Requirement:**
- Gunakan Browser Notification API (`window.Notification`).
- **Trigger:**
  - Jika `temp > 25°C` ATAU `humidity > 60%`.
  - Notification hanya muncul **sekali** saat status berubah dari "Aman" ke "Bahaya" (jangan spam notifikasi setiap detik).
- **Implementation Details:**
  - Minta izin notifikasi (`Notification.requestPermission`) saat aplikasi pertama dibuka.
  - Buat custom hook `useAlertSystem.ts` yang memantau data sensor terbaru.
  - Isi pesan notifikasi: "ALERT: [Nama Lokasi] Suhu Tinggi (28°C)!"

# Expected Output
Berikan kode yang telah direfactor/dibuat baru untuk:
1.  `components/Sidebar.tsx` (Logic Search & Status Icon).
2.  `hooks/useDeviceStatus.ts` (Helper untuk cek Online/Offline).
3.  `hooks/useAlertSystem.ts` (Logic Push Notification).
4.  Snippet integrasi di `app/page.tsx`.

Silakan kerjakan sekarang.