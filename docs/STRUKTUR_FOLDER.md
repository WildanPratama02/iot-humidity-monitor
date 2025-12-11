# Struktur Folder Proyek

Berikut adalah struktur folder yang telah dirapikan untuk proyek IoT Humidity Monitor:

```
iot-humidity-monitor/
├── docs/                    # Dokumentasi proyek
│   ├── README.md           # Dokumentasi utama proyek
│   ├── sop.md              # Standard Operating Procedure
│   ├── action-plan.md      # Rencana tindakan
│   ├── FOOTER.md           # Konten footer
│   └── GRAPHIC.md          # Panduan grafis
│
├── public/                  # Static assets
│   ├── assets/             # Asset gambar dan dokumen
│   │   └── location/       # Asset per lokasi
│   │       ├── AQL F1&2/
│   │       ├── AQL F3&4/
│   │       ├── AQL F5/
│   │       ├── AQL F6/
│   │       ├── BC GRADE/
│   │       ├── BOTTOM 1/
│   │       ├── BOTTOM 2/
│   │       ├── FACTORY 1/
│   │       ├── FACTORY 2/
│   │       ├── FACTORY 3/
│   │       ├── FACTORY 4/
│   │       ├── FACTORY 5/
│   │       ├── FGWH F1&2/
│   │       ├── FGWH F3&4/
│   │       ├── FGWH F5/
│   │       ├── FGWH F6/
│   │       ├── IMWH B1/
│   │       ├── IMWH B2/
│   │       ├── INHOUSE/
│   │       ├── LAMINATING B1/
│   │       ├── LAMINATING B2/
│   │       ├── PAXAR/
│   │       ├── REPACKING/
│   │       ├── WH CHEMICAL/
│   │       ├── WH PACKAGING/
│   │       └── WH RUBBER/
│   └── manifest.json       # Konfigurasi PWA
│
├── scripts/                 # Build dan utility scripts
│   └── check-assets.js     # Script untuk memvalidasi assets
│
├── src/                     # Source code utama
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx      # Root layout aplikasi
│   │   └── page.tsx        # Halaman dashboard utama
│   │
│   ├── components/          # Komponen React
│   │   ├── charts/         # Komponen visualisasi data
│   │   │   ├── HumidityChart.tsx
│   │   │   └── TemperatureChart.tsx
│   │   │
│   │   ├── ui/             # UI components (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── radio-group.tsx
│   │   │   └── select.tsx
│   │   │
│   │   ├── providers/      # Context providers
│   │   │   └── query-client-provider.tsx
│   │   │
│   │   ├── DeviceCard.tsx  # Kartu device individual
│   │   ├── DeviceGrid.tsx  # Grid tampilan device
│   │   ├── ExportDialog.tsx # Dialog export data
│   │   ├── Footer.tsx      # Footer aplikasi
│   │   ├── Sidebar.tsx     # Sidebar navigasi
│   │   └── SOPSection.tsx  # Section SOP & QR codes
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useExportData.ts # Hook untuk export functionality
│   │   └── useIoTData.ts    # Hook untuk data IoT
│   │
│   ├── lib/                 # Utility libraries
│   │   ├── axios.ts        # Konfigurasi Axios
│   │   ├── export.ts       # Fungsi export data
│   │   ├── locationData.ts # Data lokasi dan helper functions
│   │   └── utils.ts        # Utility functions umum
│   │
│   └── types/               # TypeScript type definitions
│       └── api.ts          # Type definitions untuk API
│
├── .claude/                 # Claude Code configuration
│   └── settings.local.json
│
├── .gitignore              # File yang diabaikan Git
├── components.json         # Konfigurasi shadcn/ui
├── eslint.config.mjs       # Konfigurasi ESLint
├── next.config.ts          # Konfigurasi Next.js
├── next-env.d.ts           # Type definitions Next.js
├── package.json            # Dependencies dan scripts
├── package-lock.json       # Lock file dependencies
├── postcss.config.mjs      # Konfigurasi PostCSS
└── tsconfig.json           # Konfigurasi TypeScript
```

## Penjelasan Struktur

### `/docs`
Menampung semua dokumentasi terkait proyek untuk kemudahan akses dan maintenance.

### `/public/assets/location`
Berisi aset spesifik untuk setiap lokasi monitoring (QR codes, dokumen SOP, gambar).

### `/src/components`
- **`charts/`**: Komponen untuk visualisasi data kelembaban dan suhu
- **`ui/`**: Komponen UI reusable dari shadcn/ui
- **`providers/`**: React context providers untuk state management

### `/src/hooks`
Custom hooks untuk logic yang dapat digunakan kembali, seperti pengambilan data IoT dan export functionality.

### `/src/lib`
Berisi utility functions, konfigurasi, dan helper modules.

### `/src/types`
Definisi TypeScript untuk memastikan type safety across aplikasi.

## Konvensi Import

Menggunakan alias `@/` untuk import dari dalam folder `src`:
```typescript
import { Component } from '@/components/Component';
import { utility } from '@/lib/utility';
import { Type } from '@/types/api';
```

## Best Practices

1. **Struktur Flat**: Hindari nesting yang terlalu dalam untuk maintainability
2. **Grouping by Feature**: File-file terkait dikelompokkan berdasarkan fitur
3. **Clear Separation**: Pemisahan jelas antara UI logic, business logic, dan data
4. **Consistent Naming**: Menggunakan PascalCase untuk komponen, camelCase untuk utilities
5. **Type Safety**: Semua file TypeScript menggunakan proper type definitions