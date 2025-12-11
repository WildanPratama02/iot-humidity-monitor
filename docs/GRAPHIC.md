# Role
Bertindaklah sebagai Senior Frontend Engineer yang ahli dalam **Highcharts** dan Next.js (TypeScript).

# Context
Saya ingin mengubah library visualisasi data pada Dashboard IoT saya dari Recharts ke **Highcharts**.
Saya membutuhkan komponen `TemperatureChart` dan `HumidityChart` yang baru.

# Task
Buat komponen React (Client Component) menggunakan `highcharts-react-official` dengan spesifikasi berikut:

## 1. Setup & Dependencies
Pastikan kode mengasumsikan saya telah menginstall:
`npm install highcharts highcharts-react-official`

## 2. Data Processing (Time Filtering)
- Input props berupa array data sensor: `{ datetime: string, temp: number, hum: number, ... }`.
- **Logic:** Filter data agar hanya menampilkan data **Hari Ini** (00:00 - 24:00 local time).
- Konversi `datetime` string ke format Timestamp (miliseconds) agar bisa dibaca oleh Highcharts X-Axis `datetime`.

## 3. Chart Configuration (Highcharts Options)

### A. General
- Hapus *branding* Highcharts (`credits: { enabled: false }`).
- Chart harus responsive.
- Gunakan `time: { useUTC: false }` agar sesuai jam lokal user.

### B. X-Axis (Time & Grid Layout)
- **Type:** `datetime`.
- **Range:** Paksa rentang visualisasi (Min & Max) dari jam **00:00** sampai **24:00** hari ini.
- **Vertical Grid Lines (New Requirement):**
  - Tampilkan garis grid vertikal (`gridLineWidth: 1`).
  - Style: Putus-putus (`gridLineDashStyle: 'LongDash'`).
  - **Interval:** Per **3 Jam**.
  - *Technical impl:* Set `tickInterval: 3 * 3600 * 1000` (10,800,000 ms).
  - Format Label: Tampilkan jam saja (misal "03:00", "06:00").

### C. Y-Axis (Skala & Threshold)
Kustomisasi Y-Axis berbeda untuk setiap grafik:

**1. Temperature Chart:**
- Range: **0 - 50** (°C).
- **PlotLines (Garis Batas):** Buat garis putus-putus merah pada nilai **25**. Beri label "Max 25°C".
- **Color Logic (Zones):**
  - Nilai <= 25: Warna **Biru** (`#3b82f6`).
  - Nilai > 25: Warna **Merah** (`#ef4444`).

**2. Humidity Chart:**
- Range: **30 - 100** (%).
- **PlotLines (Garis Batas):** Buat garis putus-putus merah pada nilai **60**. Beri label "Max 60%".
- **Color Logic (Zones):**
  - Nilai <= 60: Warna **Hijau** (`#22c55e`).
  - Nilai > 60: Warna **Merah** (`#ef4444`).

*Technical Note:* Gunakan fitur `series.zones` dari Highcharts untuk mengatur perubahan warna ini secara otomatis. Jangan gunakan gradient.

### D. Custom Tooltip
Buat tooltip menggunakan HTML formatter (`useHTML: true`) yang estetik.
- Header: Tanggal (misal: "Senin, 12 Des 2023").
- Body:
  - Jam (misal: "14:30").
  - Nilai dengan satuan (misal: "32°C").
  - Beri styling warna pada teks nilai (Merah jika diatas threshold, Biru/Hijau jika normal).

# Expected Code Structure
Berikan kode lengkap untuk satu file komponen generik atau dua file terpisah (`TemperatureChart.tsx` dan `HumidityChart.tsx`).

Contoh implementasi `zones` yang saya harapkan:
```javascript
series: [{
    data: myData,
    zones: [{
        value: 25, // Sampai nilai 25...
        color: '#3b82f6' // ...warnanya Biru
    }, {
        color: '#ef4444' // Selebihnya (di atas 25) warnanya Merah
    }]
}]


---

### Mengapa Highcharts Lebih Baik untuk Kasus Anda?

Jika Anda menggunakan prompt ini, AI akan menggunakan fitur **Zones**. Perbedaan utamanya dengan Recharts (SVG Gradient) adalah:

1.  **Akurasi Mutlak:** Highcharts akan memotong garis tepat di pixel di mana nilai menyentuh angka 25 atau 60. Tidak ada lagi masalah warna "bergeser" atau gradient yang tidak pas.
2.  **Logika Sederhana:** Anda hanya perlu menentukan "Sampai nilai X warnanya A, selebihnya warnanya B". Jauh lebih bersih daripada menghitung offset gradient SVG secara manual.

Jangan lupa jalankan perintah ini di terminal sebelum menggunakan kode hasil generate:
```bash
npm install highcharts highcharts-react-official