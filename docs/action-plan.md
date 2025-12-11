# Role
Bertindaklah sebagai Senior Frontend Engineer (Next.js, TypeScript, Tailwind CSS).

# Context
Kita sedang mengembangkan Dashboard IoT. Kita perlu menambahkan fitur **"Operational Section"** di bawah grafik data sensor.
Fitur ini akan menampilkan QR Code dan Link untuk "Action Plan" dan "Summary Action Plan", serta menampilkan gambar SOP (Standard Operating Procedure) di bagian paling bawah.

# Data Sources & Assets Structure
Saya telah menyiapkan aset gambar di folder lokal project dengan struktur berikut:
`public/assets/location/[NAMA_LOKASI]/`

Di dalam setiap folder lokasi, terdapat 3 file gambar standar:
1.  `QR Action.png` (Gambar QR Code untuk Action Plan)
2.  `QR Summary.png` (Gambar QR Code untuk Summary)
3.  `SOP.jpg` (Gambar Dokumen SOP)

*Catatan: `[NAMA_LOKASI]` harus sesuai dengan nama folder, misalnya "AQL F1&2".*

# Task
Tolong buatkan sistem **Data Mapping** dan **Komponen UI** untuk fitur ini.

## 1. Data Configuration (`lib/locationData.ts`)
Buat file data yang memetakan **Nama Lokasi** ke **URL Link** (dari data yang saya miliki) dan **Path Gambar**.

Gunakan data real berikut untuk mengisi object `LOCATION_DATA`:

**Struktur Link Action Plan (Google Form):**
- AQL F1&2: `https://forms.gle/P8CVuKFmf7CqdDb88`
- IMWH B1: `https://forms.gle/4kR7iL6WrMD3KT8A6`
- IMWH B2: `https://forms.gle/nqqRHskFPeYnuhweA`
- FGWH F5: `https://forms.gle/yJFbujpSotpm5C9y7`
- FGWH F6: `https://forms.gle/prmxhWwX5oSA3dgE7`
- FGWH F1&2: `https://forms.gle/AQhDVP1CfNTpPnwx8`
- FGWH F3&4: `https://forms.gle/uzhBvQiN5uWmSfSq6`
- BC GRADE: `https://forms.gle/9N3ntTPs82kvFqubA`
- FACTORY 1: `https://forms.gle/ZNhfRxhNGnF87WEF7`
- FACTORY 2: `https://forms.gle/hWsAHxwRUAqTvWaN7`
- FACTORY 3: `https://forms.gle/zssKieVMJEVviKj76`
- FACTORY 4: `https://forms.gle/kPXfiRdaDVShiMYv6`
- PAXAR: `https://forms.gle/8Z5uXcGAsi673cqp7`
- FACTORY 5: `https://forms.gle/4TBB4Gz1ibBPjend7`
- BOTTOM 1: `https://forms.gle/V2Jd2yUmjKNtgDex7`
- BOTTOM 2: `https://forms.gle/R7TSGrkPCfa778fD7`
- INHOUSE: `https://forms.gle/uzndR9J5bYBjQYxJ9`
- AQL F3&4: `https://forms.gle/nXQeqWrmrgFE1TR98`
- AQL F5: `https://forms.gle/rnq44LCd4Ekac7VU7`
- AQL F6: `https://forms.gle/WhWpGEmAbENbEjco9`
- REPACKING: `https://forms.gle/JyJMZ4mU3MDciAvq6`
- WH CHEMICAL: `https://forms.gle/EM4nMVkDxxLaFguZ6`
- WH RUBBER: `https://forms.gle/fK3UMQe56RKLtEUY7`
- WH PACKAGING: `https://forms.gle/R3cMKuU8ZgdoER3Q6`
- LAMINATING B1: `https://forms.gle/3g9dbqYTXiG7P5xP8`
- LAMINATING B2: `https://forms.gle/LYaEPx8NEJJnJ5TSA`

**Struktur Link Summary Action Plan (Google Sheets):**
- AQL F1&2: `https://docs.google.com/spreadsheets/d/15QwQff0-DAZ8La4Sr02ybtyzmvlSt2hCWsIMVvErWgw/edit?usp=sharing`
- IMWH B1: `https://docs.google.com/spreadsheets/d/1dqiKS-yKjFTMbkQdQqL6oZM99bugibYgW4zJDpXZdWs/edit?usp=sharing`
- IMWH B2: `https://docs.google.com/spreadsheets/d/1g1gvSaTPqp2vK_WH8ZKAvhcVCaO_G0l0FlNJG0SMi-4/edit?usp=sharing`
- FGWH F5: `https://docs.google.com/spreadsheets/d/12rjnowhNhPbakjbdfyEZDctvd0ublDFoXrAJ55nZNSM/edit?usp=sharing`
- FGWH F6: `https://docs.google.com/spreadsheets/d/1-wL-Y1YalrFpr6lWdJGWUjfYJqx-BWFtY1WkcqKZ2JQ/edit?usp=sharing`
- FGWH F1&2: `https://docs.google.com/spreadsheets/d/1tI4L7yzbWwobGtXA1g89NmURRUQr9lTdN7hHWVZ0ctc/edit?usp=sharing`
- FGWH F3&4: `https://docs.google.com/spreadsheets/d/1Ul4w0pqw3qNikhQuTebc87VXW-fkEZuxCJieKIPaRMQ/edit?usp=sharing`
- BC GRADE: `https://docs.google.com/spreadsheets/d/1CtiZ9skEZH7fVxPIG1CznpRSz7nLNBrSH3cqIIzEAWQ/edit?usp=sharing`
- FACTORY 1: `https://docs.google.com/spreadsheets/d/1Lb25omuscxws5BIB56U0iX_H-AiOepSLcE0Uo9VyUTE/edit?usp=sharing`
- FACTORY 2: `https://docs.google.com/spreadsheets/d/12DcHop5xcDDiMTB9JsCRCz5bI1HSgKGXHgSO2dlwRu0/edit?usp=sharing`
- FACTORY 3: `https://docs.google.com/spreadsheets/d/1NZeT2vd-F8FY3qaupYrXztG4c-e7G9ck24KvL_ooTMg/edit?usp=sharing`
- FACTORY 4: `https://docs.google.com/spreadsheets/d/1nz-SsiUgBW9h3egrrTC-lunjdiKsQQAE0TRX5age7uQ/edit?usp=sharing`
- PAXAR: `https://docs.google.com/spreadsheets/d/1Z3KimCtKalh9hVyrCu1spQCXc7pVO4jWZhIArqUfhCg/edit?usp=sharing`
- FACTORY 5: `https://docs.google.com/spreadsheets/d/16Bdr09Kt5t6fCf960KANX3nQSD1O0GvJbiXMtTVCBEY/edit?usp=sharing`
- BOTTOM 1: `https://docs.google.com/spreadsheets/d/1t31heJ89e7_sm76bESD_5L28-8Htxq7M5GnuWiFkJYU/edit?usp=sharing`
- BOTTOM 2: `https://docs.google.com/spreadsheets/d/1lj9JFUdvDlrfq-WXRVRQQ76PHxUAMZaqHrOF3jMsSdA/edit?usp=sharing`
- INHOUSE: `https://docs.google.com/spreadsheets/d/1D4JiA33t77lwM9YcEvLgjkMldCgFlfLHfBMOFAKi-X4/edit?usp=sharing`
- AQL F3&4: `https://docs.google.com/spreadsheets/d/16mt6s4Csl5s9U309LnNoBPvJHs8-k3vFAyW2xpBdJkM/edit?usp=sharing`
- AQL F5: `https://docs.google.com/spreadsheets/d/1omzasfyVH61nkjkaryKhkF3XsBziSWb0SpBrqcPzGGU/edit?usp=sharing`
- AQL F6: `https://docs.google.com/spreadsheets/d/1qUUAzJfOUtjnP49boUjp8Jr6FW5olm1_FYHa4fZ2e80/edit?usp=sharing`
- REPACKING: `https://docs.google.com/spreadsheets/d/1Ee0Y2LRZT7qn1ZQcG4186wCWqeS0mOyF93ZnqL8giGw/edit?usp=sharing`
- WH CHEMICAL: `https://docs.google.com/spreadsheets/d/1apNXKeI1E6v4_sJLn8dkMh1Q1UO4XuMuNCr-a8kXLDY/edit?usp=sharing`
- WH RUBBER: `https://docs.google.com/spreadsheets/d/1Uqjcw57MUXfbjafQl-T7g25brh8SlPgIz2sAuRmHNgc/edit?usp=sharing`
- WH PACKAGING: `https://docs.google.com/spreadsheets/d/1daMT_gUX6xxE3gRDrugW_aqInn328e0I7iM2nHyl3xs/edit?usp=sharing`
- LAMINATING B1: `https://docs.google.com/spreadsheets/d/1C2-hMV0nPp3ynHx9nwNFKchsFyBBECCjZuK2uUWnXgI/edit?usp=sharing`
- LAMINATING B2: `https://docs.google.com/spreadsheets/d/1VL4bcj0r8Er1DvzAMCqxQ-CqlZ41puyD54H_-QLop8Q/edit?usp=sharing`

*Logic Generasi Path Gambar:*
Helper function harus otomatis menghasilkan path berdasarkan nama lokasi.
Contoh: Jika lokasi = "AQL F1&2", maka path image = `/assets/location/AQL F1&2/QR Action.png`.

## 2. Component Requirements (`components/SOPSection.tsx`)
Buat komponen UI yang meniru layout gambar referensi:

1.  **Layout Grid:**
    - Atas: 2 Kolom untuk QR Code & Button.
        - **Kiri:** QR Action Plan + Button "CLICK HERE TO ACTION PLAN" (Bg Abu Gelap/Hitam).
        - **Kanan:** QR Summary + Button "CLICK HERE TO SUMMARY ACTION PLAN" (Bg Putih, Border Hitam).
    - Bawah: Gambar SOP (Full Width/Responsive).

2.  **Image Handling:**
    - Gunakan `next/image`.
    - Handle kasus jika gambar belum ada (onError atau fallback).
    - Pastikan QR Code Action dan Summary memiliki ukuran yang sama.

3.  **Button functionality:**
    - Button harus berupa tag `<a>` yang membuka Link URL di tab baru (`target="_blank"`).

## 3. Integration (`app/page.tsx`)
Update halaman utama untuk:
1.  Menerima state lokasi yang dipilih user.
2.  Mengambil data assets (Link & Path Gambar) menggunakan `lib/locationData.ts`.
3.  Passing data tersebut ke `<SOPSection />`.

# Expected Output
Generate kode lengkap untuk:
1.  `lib/locationData.ts` (Berisi mapping lengkap link di atas).
2.  `components/SOPSection.tsx` (Styling Tailwind yang presisi).
3.  Snippet integrasi di `app/page.tsx`.

Silakan kerjakan sekarang.