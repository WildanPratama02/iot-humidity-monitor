# Role
Bertindaklah sebagai Senior Frontend Engineer (Next.js & Tailwind CSS).

# Context
Project Dashboard IoT sudah hampir selesai. Kita sudah memiliki Grafik Highcharts di bagian atas dan SOP Section di bagian tengah.
Terakhir, saya ingin menambahkan **Footer** di bagian paling bawah halaman sebagai penanda identitas pengembang.

# Task
Buat komponen `Footer` dan integrasikan ke halaman utama.

## 1. Create Component (`components/Footer.tsx`)
Buat komponen sederhana dengan spesifikasi berikut:
- **Teks:** "DEVELOP BY QIP DIGITAL TEAM 2026 ©"
- **Styling (Tailwind CSS):**
  - Container: `w-full`, `py-6` (padding vertical yang cukup), `mt-8` (jarak dari konten atas).
  - Background: Bisa transparan atau `bg-gray-50` jika perlu pembeda tipis.
  - Border: Opsional, tambahkan `border-t` (border top) tipis warna `gray-200` agar terpisah rapi dari konten SOP.
  - Typography: `text-center` (rata tengah), `text-sm` (ukuran kecil), `font-bold` atau `font-medium`.
  - Warna Teks: `text-gray-500` atau `text-gray-600` (jangan hitam pekat, agar elegan).

## 2. Integration (`app/page.tsx`)
Tunjukkan cara meletakkan komponen `<Footer />` ini di bagian paling bawah struktur halaman Dashboard, tepat di bawah `<SOPSection />`.

# Expected Output
1. Kode lengkap `components/Footer.tsx`.
2. Snippet `app/page.tsx` yang menunjukkan penempatan footer.

Silakan kerjakan.