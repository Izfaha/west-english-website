# Product Requirement Document (PRD) — WEST Kampung Inggris Portal

**Project Name:** WEST Kampung Inggris Web & Registration Portal  
**Tech Stack:** Next.js 16 (Frontend & API Routes) + MariaDB + Docker Compose  
**Repository:** `west-web/`

---

## 1. System Architecture & Docker Services

Aplikasi dibagi menjadi 3 container dalam satu file `docker-compose.yml`:

1. **`frontend` (Next.js):** UI/UX, SEO, API Routes (validate voucher, register lead, generate voucher).
2. **`db` (MariaDB 10.6):** Database untuk menyimpan data pendaftar (leads) dan voucher.
3. **`phpmyadmin`:** Web UI untuk admin melihat dan mengelola data di database.

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Next.js    │────▶│  MariaDB     │◀────│ phpMyAdmin  │
│  :3000      │     │  :3306       │     │  :8080      │
└─────────────┘     └──────────────┘     └─────────────┘
```

---

## 2. Page Architecture & Features

### 2.1. Home Page (`/`)
- **Hero Section:** Gambar banner full-width dengan badge voucher oranye overlapping.
- **White Text Bar:** Tagline "Let's learning with WEST Kampung Inggris".
- **Kelas Online Reguler:** 3 kartu program (Kids/Teenager/Adult — Month, Rp250.000).
- **Kelas Online Private:** 3 kartu program (Kids/Teenager/Adult — 2 Weeks, Rp165.000).
- **About WEST:** Section diagonal dengan deskripsi lembaga.

### 2.2. Tutor Page (`/tutor`)
- **Header:** "Meet Our Tutors" dengan background hijau.
- **Tutor Cards:** Layout horizontal (desktop) / vertikal (mobile) dengan foto profil bulat, nama, universitas, jurusan, dan pengalaman mengajar.
- **Curved Transition:** Lengkungan putih di bawah sebagai transisi ke footer.

### 2.3. Registration Form Page (`/pendaftaran`)
- **Form Data Diri:** Nama, Tempat & Tanggal Lahir, Alamat, No WhatsApp, Email.
- **Pilihan Program Kelas:** Dropdown (Kids/Teenager/Adult — Month atau 2 Weeks).
- **Pilihan Level:** Dropdown yang muncul setelah program dipilih (Pre basic, Basic, Intermediate, Advance).
- **Field Voucher:** Input kode voucher dengan validasi real-time (debounce 600ms).
- **Rincian Harga:** Harga dasar, potongan voucher, garis pemisah, dan total bayar.
- **Note Box:** Peringatan merah bahwa user akan diarahkan ke WA admin.
- **CTA Button:** "Lanjutkan Pembayaran Via WA".

---

## 3. User Registration Flow

```
User isi form → Klik "Lanjutkan Pembayaran Via WA"
  │
  ├─ Validasi: Nama, Program, Level harus terisi
  │   └─ Gagal → Modal Error (warning icon + pesan)
  │
  ├─ Berhasil → Modal Konfirmasi: "Apakah data sudah benar?" [Ya / Tidak]
  │   └─ Klik "Tidak" → Kembali ke form
  │
  └─ Klik "Ya"
      │
      ├─ 1. Data dikirim ke POST /api/register → Simpan ke DB
      │     └─ Jika ada voucher valid → Voucher ditandai is_used = 1
      │
      ├─ 2. Modal Waiting: Countdown 3 detik
      │
      ├─ 3. Redirect ke WhatsApp Admin dengan pesan dynamic
      │     - Dengan voucher: "Halo westmin, nama aku {nama} mau daftar kelas {program}, pake voucher {kode}. Langkah selanjutnya gimana ya?"
      │     - Tanpa voucher: "Halo westmin, nama aku {nama} mau daftar kelas {program}. Langkah selanjutnya gimana ya?"
      │
      └─ 4. Form di-clear (reset semua field)
```

---

## 4. Voucher System

### 4.1. Potongan Harga (Fixed Amount)
| Tipe Program | Harga Asli | Potongan Voucher | Total Setelah Voucher |
|:---|:---|:---|:---|
| Month (1 Bulan) | Rp250.000 | Rp51.000 | Rp199.000 |
| 2 Weeks (2 Minggu) | Rp165.000 | Rp65.000 | Rp100.000 |

### 4.2. Voucher Validation Rules
1. Kode voucher ditemukan di DB? → Jika tidak: `"Voucher tidak ditemukan"`
2. Voucher belum digunakan (`is_used = 0`)? → Jika sudah: `"Voucher sudah pernah digunakan"`
3. Tanggal sekarang ≤ `expires_at`? → Jika lewat: `"Voucher sudah kadaluarsa"`
4. Semua valid → Return `discount_1bulan` dan `discount_2minggu`, frontend pilih sesuai program.

### 4.3. Voucher Lifecycle
```
Generate (POST /api/vouchers/generate)
  → is_used = 0, used_by_lead_id = NULL

User pakai voucher saat register
  → is_used = 1, used_by_lead_id = {lead_id}, used_at = NOW()
```

### 4.4. Generate Voucher Bulk
```
POST /api/vouchers/generate
{
  "jumlah": 5000,
  "expires_at": "2026-12-31 23:59:59",
  "discount_1bulan": 51000,    // optional, default 51000
  "discount_2minggu": 65000    // optional, default 65000
}
```
Format kode: `WEST-XXXXXXXX` (8 karakter alfanumerik, tanpa karakter ambigu O/0/I/1).

---

## 5. API & Integration Matrix

| Endpoint | Method | Deskripsi |
|:---|:---|:---|
| `/api/validate-voucher` | POST | Validasi kode voucher terhadap DB. Return status + nilai diskon. |
| `/api/register` | POST | Simpan data pendaftar ke `west_leads`, update voucher `is_used`. |
| `/api/vouchers/generate` | POST | Generate voucher bulk dengan kode unik random. |

### 5.1. Rate Limiting
Semua endpoint dilindungi rate limit: **10 request per menit per IP**.

### 5.2. Input Sanitization
Semua input string di-sanitize: strip tag `<>`, trim whitespace, max 500 karakter.

---

## 6. Database Schema

### 6.1. Tabel `west_leads`
| Kolom | Tipe | Deskripsi |
|:---|:---|:---|
| id | INT AUTO_INCREMENT PK | ID unik pendaftar |
| nama | VARCHAR(255) NOT NULL | Nama lengkap |
| ttl | VARCHAR(255) | Tempat & tanggal lahir |
| alamat | TEXT | Alamat |
| whatsapp | VARCHAR(30) NOT NULL | Nomor WhatsApp |
| email | VARCHAR(255) | Email |
| program | VARCHAR(100) NOT NULL | Program kelas (misal: "Kids / Month") |
| level | VARCHAR(50) NOT NULL | Tingkatan (Pre basic/Basic/Intermediate/Advance) |
| voucher_code | VARCHAR(50) | Kode voucher yang digunakan |
| discount_amount | INT DEFAULT 0 | Nominal potongan (Rp) |
| total_bayar | INT NOT NULL | Total yang harus dibayar |
| status_bayar | VARCHAR(20) DEFAULT 'Pending' | Status pembayaran |
| created_at | TIMESTAMP | Waktu pendaftaran |

### 6.2. Tabel `west_vouchers`
| Kolom | Tipe | Deskripsi |
|:---|:---|:---|
| id | INT AUTO_INCREMENT PK | ID voucher |
| code | VARCHAR(50) UNIQUE NOT NULL | Kode voucher (format: WEST-XXXXXXXX) |
| discount_1bulan | INT DEFAULT 51000 | Potongan untuk program 1 bulan |
| discount_2minggu | INT DEFAULT 65000 | Potongan untuk program 2 minggu |
| expires_at | DATETIME | Tanggal kedaluwarsa |
| is_used | TINYINT(1) DEFAULT 0 | Status terpakai (0/1) |
| used_by_lead_id | INT FK → west_leads(id) | ID pendaftar yang menggunakan |
| used_at | DATETIME | Waktu penggunaan |
| created_at | TIMESTAMP | Waktu pembuatan |

---

## 7. Docker Infrastructure

### 7.1. Services
```yaml
services:
  db:         # MariaDB 10.6 — port 3306
  phpmyadmin: # phpMyAdmin — port 8080
  frontend:   # Next.js 16 dev server — port 3000
```

### 7.2. Environment Variables
| Variable | Lokasi | Deskripsi |
|:---|:---|:---|
| `MYSQL_ROOT_PASSWORD` | `.env` | Root password MariaDB |
| `MYSQL_PASSWORD` | `.env` | Password user `west_user` |
| `DB_HOST` | docker-compose | Hostname DB (default: `db`) |
| `DB_PORT` | docker-compose | Port DB (default: `3306`) |
| `DB_USER` | docker-compose | Username DB (default: `west_user`) |
| `DB_PASSWORD` | docker-compose | Password DB |
| `DB_NAME` | docker-compose | Nama database (default: `west_db`) |
| `NEXT_PUBLIC_ADMIN_WA_NUMBER` | `.env` | Nomor WA admin untuk redirect |

### 7.3. Cara Menjalankan
```bash
docker compose up
```
- Frontend: `http://localhost:3000`
- phpMyAdmin: `http://localhost:8080`
- Database otomatis ter-inisialisasi dari `init.sql`

---

## 8. UI/UX Responsive Breakpoints

| Breakpoint | Width | Target Device |
|:---|:---|:---|
| Default | < 640px | Mobile |
| `sm:` | ≥ 640px | Tablet |
| `md:` | ≥ 768px | Tablet landscape / small desktop |
| `lg:` | ≥ 1024px | Desktop |

Semua halaman (Home, Tutor, Pendaftaran) dan komponen (Navbar, Footer, AlertModal) responsive di ketiga breakpoint.
