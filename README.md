# 📸 KK Scan

> Aplikasi web mobile-first untuk input data Kartu Keluarga (KK) Indonesia via OCR AI Vision. Foto KK → AI memproses → data tersimpan otomatis.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## ✨ Fitur Utama

### 🤖 OCR AI Vision Multi-Provider
- **Primary**: Z.AI GLM-4V Vision (gratis di sandbox, auto-configured)
- **Fallback**: Google Gemini 2.0 Flash Vision (jika `GEMINI_API_KEY` di-set)
- Auto-retry otomatis jika provider pertama gagal
- Timeout protection (50 detik per provider)

### 🧠 Auto-Fill dari NIK (Akurasi 100%)
Alih-alih mengandalkan OCR untuk membaca tanggal lahir, jenis kelamin, dan alamat — aplikasi **mengekstrak data ini langsung dari struktur NIK** yang deterministic:

- ✅ **Tanggal lahir** (DD-MM-YYYY) dari digit 7-12 NIK
- ✅ **Jenis kelamin** (tanggal >40 = perempuan)
- ✅ **Provinsi** (database 34 provinsi Kemendagri)
- ✅ **Kabupaten/Kota** (database 514 kabupaten/kota)
- ✅ **Kecamatan** (database 7094 kecamatan Kemendagri)

### 📷 Kamera & Upload
- **Live camera modal** menggunakan `getUserMedia` API (support mobile)
- **Upload dari galeri** dengan auto-compression
- **3 quality presets**: Standar (1920px), Tinggi (2560px), Asli (full res)
- Auto-compress client-side sebelum upload (hemat bandwidth)

### 🖼️ Image Editor
- **Tab Rotasi**: Auto-deskew (projection profile method), slider rotasi halus (±45°), quick rotate 90°
- **Tab Perspektif**: Manual 4-corner selection dengan homography transform (untuk foto miring/keystone)

### 🔄 Auto-Deskew (Server + Client)
- **Client-side**: Canvas API + projection profile method (untuk preview real-time)
- **Server-side**: Sharp-based deskew sebelum OCR (untuk akurasi maksimal)
- Auto-detect sudut kemiringan -30° sampai +30°

### 💾 Manajemen Data
- **Local storage** dengan Zustand + persist middleware
- **Search & filter** berdasarkan No KK, NIK, atau nama
- **Export Excel/CSV** (semua data atau single KK)
- **Statistik dashboard** (total KK, total anggota, breakdown gender)
- **Validasi real-time**: NIK 16 digit, No KK 16 digit, anti-duplikasi

### 📱 Mobile-First Design
- Frame HP simulation di desktop
- Touch-friendly UI (min 44px touch targets)
- Emerald color palette (hijau profesional)
- Responsive di semua ukuran layar

## 🛠️ Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui (New York style) |
| State Management | Zustand + persist middleware |
| AI Vision | Z.AI GLM-4V (primary), Google Gemini 2.0 Flash (fallback) |
| Image Processing (server) | Sharp |
| Image Processing (client) | Canvas API |
| Icons | Lucide React |
| Database | LocalStorage (demo), siap migrasi ke Firebase Firestore |
| Auth | Mock auth (demo), siap migrasi ke Firebase Auth |

## 📦 Instalasi

### Prerequisites
- Node.js 18+ atau Bun 1.0+
- npm, yarn, pnpm, atau bun

### Langkah Instalasi

1. **Clone repository**
   ```bash
   git clone https://github.com/ronnin4111/scane-kk.git
   cd scane-kk
   ```

2. **Install dependencies**
   ```bash
   # Dengan bun (recommended)
   bun install

   # Atau dengan npm
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` dan isi API keys yang diperlukan:
   ```env
   # Optional - untuk fallback Z.AI
   GEMINI_API_KEY=your-gemini-api-key-here

   # Required di production (Vercel/hosting)
   ZAI_BASE_URL=https://api.z.ai/api/v1
   ZAI_API_KEY=your-zai-api-key-here
   ```

4. **Jalankan development server**
   ```bash
   # Dengan bun
   bun run dev

   # Atau dengan npm
   npm run dev
   ```

5. **Buka aplikasi**
   - Development: http://localhost:3000
   - Login dengan email & password apa saja (demo mode)

## 🚀 Deployment

### Deploy ke Vercel (Recommended)

1. Push kode ke GitHub (sudah otomatis jika Anda clone dari sini)
2. Buka https://vercel.com/new
3. Import repository `scane-kk`
4. Set environment variables di Vercel dashboard:
   - `GEMINI_API_KEY` (optional)
   - `ZAI_API_KEY` (required untuk production)
   - `ZAI_BASE_URL` = `https://api.z.ai/api/v1`
5. **Penting**: Set function timeout ke 60s+ di `vercel.json`:
   ```json
   {
     "functions": {
       "src/app/api/ocr/route.ts": {
         "maxDuration": 60
       }
     }
   }
   ```
6. Deploy!

### Deploy ke Hosting Lain

Pastikan:
- Node.js 18+ tersedia
- Sharp library terinstall (untuk server-side deskew)
- Environment variables diset
- Reverse proxy timeout minimal 120 detik (OCR butuh 10-20 detik)

## 📁 Struktur Project

```
scane-kk/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── ocr/route.ts          # Multi-provider OCR endpoint
│   │   ├── globals.css               # Tema emerald
│   │   ├── icon.svg                  # Favicon KK
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Main router
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── screens/                  # 6 screens (Login, Home, Scan, dll)
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── ScanScreen.tsx
│   │   │   ├── ProcessingScreen.tsx
│   │   │   ├── ReviewScreen.tsx
│   │   │   └── DetailScreen.tsx
│   │   ├── camera-modal.tsx          # Live camera modal
│   │   ├── image-editor-modal.tsx    # Editor (rotasi + perspektif)
│   │   ├── perspective-editor.tsx    # 4-corner draggable
│   │   └── mobile-frame.tsx          # Mobile frame wrapper
│   ├── hooks/
│   │   ├── use-toast.ts
│   │   └── use-mobile.ts
│   └── lib/
│       ├── types.ts                  # TypeScript types
│       ├── mock-data.ts              # KK seed data + validation
│       ├── nik-parser.ts             # NIK parser (provinsi + kabupaten)
│       ├── kecamatan-data.ts         # 7094 kecamatan Kemendagri (178KB)
│       ├── store.ts                  # Zustand store
│       ├── image-compress.ts         # Client-side compression
│       ├── image-utils.ts            # Rotate + deskew (client)
│       ├── perspective-transform.ts  # Homography math
│       └── server-deskew.ts          # Sharp-based deskew (server)
├── scripts/
│   ├── generate-kecamatan-data.ts    # Database kecamatan generator
│   └── generate-kk-samples.ts        # Sample KK image generator
├── public/
│   └── samples/                      # Sample KK images
├── prisma/                           # Database schema (untuk migrasi)
├── .env.example                      # Template env vars
├── .gitignore
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## 🔌 API Documentation

### `POST /api/ocr`

Endpoint utama untuk OCR Kartu Keluarga.

**Request:**
```json
{
  "image": "data:image/jpeg;base64,..."
}
```

**Response (success):**
```json
{
  "success": true,
  "data": {
    "noKK": "6102180312100010",
    "alamat": {
      "provinsi": "KALIMANTAN BARAT",
      "kabupaten": "KAB. MEMPAWAH",
      "kecamatan": "MEMPAWAH TIMUR",
      "kelurahan": "ANTIBAR",
      "rt": "020",
      "rw": "006",
      "kodePos": "78917",
      "alamatLengkap": "JL. DJOHANSYAH BAKRI"
    },
    "kepalaKeluargaId": "a1",
    "anggota": [
      {
        "id": "a1",
        "nik": "6102181505480003",
        "nama": "ABDULLAH",
        "jenisKelamin": "LAKI-LAKI",
        "tanggalLahir": "1948-05-15",
        "agama": "ISLAM",
        "statusHubungan": "KEPALA KELUARGA",
        ...
      }
    ]
  },
  "provider": "Z.AI GLM-4V",
  "durationMs": 10100,
  "deskewInfo": {
    "detectedAngle": 0,
    "confidence": 0,
    "corrected": false,
    "durationMs": 1200
  }
}
```

**Response (error):**
```json
{
  "success": false,
  "error": "Error message",
  "durationMs": 5000
}
```

### `GET /api/ocr`

Health check endpoint.

```json
{
  "status": "ok",
  "providers": {
    "zai": "available",
    "gemini": "available"
  }
}
```

## 🎯 Cara Pakai

1. **Login** dengan email & password apa saja (demo mode)
2. Klik tombol **+ (kamera)** di pojok kanan bawah
3. Pilih:
   - **Ambil Foto**: Buka kamera langsung (mobile)
   - **Pilih Galeri**: Upload foto KK dari device
   - **Sample KK**: Coba dengan sample yang disediakan
4. (Opsional) Klik **Edit Foto** untuk luruskan foto miring
5. Pilih **kualitas gambar**: Standar / Tinggi / Asli
6. Klik **Proses dengan AI** → tunggu 10-15 detik
7. **Review & Edit** data hasil OCR (semua field editable)
8. Klik **Simpan Data KK** → data tersimpan ke database lokal

## 🧠 Cara Kerja Auto-Fill dari NIK

NIK Indonesia (16 digit) mengandung informasi struktural:

```
6102 18 15 05 48 0003
│││ ││ ││ ││ ││ └──└── Nomor urut
│││ ││ ││ ││ └└────── Tahun lahir (2 digit → 4 digit)
│││ ││ ││ └─────────── Bulan lahir (01-12)
│││ ││ └────────────── Tanggal (1-31 L, 41-71 P)
│││ └────────────────── Kode kecamatan
│└───────────────────── Kode kabupaten
└────────────────────── Kode provinsi
```

Aplikasi meng-ekstrak:
- **Provinsi** dari digit 1-2 (database 34 provinsi)
- **Kabupaten/Kota** dari digit 1-4 (database 514 kab/kota)
- **Kecamatan** dari digit 1-6 (database 7094 kecamatan)
- **Tanggal lahir** dari digit 7-12 (DD-MM-YY)
- **Jenis kelamin** dari digit 7-8 (>40 = perempuan)

**Keuntungan:**
- Akurasi 100% (vs OCR ~70-80% untuk tanggal)
- Tidak ada ambiguity format tanggal (DD-MM vs MM-DD)
- OCR bisa skip field-field ini → lebih cepat

## 📊 Performance

| Operasi | Waktu |
|---------|-------|
| Upload + compress gambar | 1-3 detik |
| Auto-deskew (server) | 1-3 detik |
| OCR AI Vision | 8-15 detik |
| NIK parsing + auto-fill | <1ms |
| **Total end-to-end** | **10-20 detik** |

## 🔒 Privacy & Security

- **Data KK sensitif**: aplikasi ini memproses data pribadi (NIK, nama, alamat)
- **Local storage**: data tersimpan di browser, tidak dikirim ke server kecuali untuk OCR
- **OCR processing**: gambar dikirim ke Z.AI / Gemini untuk diproses, lalu dihapus (tidak disimpan di server)
- **API keys**: simpan di environment variables, JANGAN commit ke repo
- **Production**: pertimbangkan migrasi ke Firebase Firestore dengan rules yang proper

## 🗺️ Roadmap

### ✅ Done
- [x] OCR AI Vision multi-provider (Z.AI + Gemini)
- [x] Auto-fill dari NIK (tanggal lahir, gender, alamat)
- [x] Live camera modal
- [x] Image editor (rotasi + perspektif)
- [x] Auto-deskew (client + server)
- [x] Quality presets
- [x] Export Excel/CSV
- [x] Database kecamatan Kemendagri (7094 entries)

### 🚧 TODO
- [ ] Firebase Auth integration
- [ ] Firebase Firestore (multi-device sync)
- [ ] Edit mode di Detail screen
- [ ] PWA installable + offline mode
- [ ] Auto-detect 4 corners dengan ML (TensorFlow.js)
- [ ] Database kelurahan (74.000+ entries)
- [ ] Multi-user dengan role (admin + operator)
- [ ] Backup otomatis ke Google Drive
- [ ] Dark mode
- [ ] Bahasa Inggris

## 🤝 Contributing

Contributions welcome! Silakan:
1. Fork repository
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

MIT License - bebas digunakan untuk projek personal maupun komersial.

## 🙏 Acknowledgments

- Database wilayah Kemendagri: [edwin/database-wilayah-kemendagri](https://github.com/edwin/database-wilayah-kemendagri)
- UI Components: [shadcn/ui](https://ui.shadcn.com/)
- AI Vision: [Z.AI](https://chat.z.ai) & [Google Gemini](https://aistudio.google.com)
- Inspiration: Pemerintah Indonesia (untuk struktur NIK & KK)

## 📧 Contact

- GitHub: [@ronnin4111](https://github.com/ronnin4111)
- Repository: [scane-kk](https://github.com/ronnin4111/scane-kk)

---

Dibuat dengan ❤️ untuk Indonesia 🇮🇩
