# West English — Landing & Pendaftaran

Landing page pendaftaran kelas West English dengan sistem voucher diskon.

## Techstack
- **Next.js 16** (App Router) + React 19 + Tailwind CSS 4
- **MariaDB 10.6** + phpMyAdmin
- **Docker / Docker Compose**
- `mysql2` sebagai driver database

---

## Environment Variables

Buat file `.env` di root project:

```env
DB_HOST=db
DB_PORT=3306
DB_USER=west_user
DB_PASSWORD=west_password
DB_NAME=west_db
NEXT_PUBLIC_ADMIN_WA_NUMBER=6281234567890
```

| Variable | Keterangan |
|:---|:---|
| `DB_HOST` | Host database (pakai `db` saat jalan di Docker, `localhost` saat lokal) |
| `DB_PORT` | Port database (`3306` di dalam container) |
| `DB_USER` | Username database |
| `DB_PASSWORD` | Password database — **wajib diisi**, compose akan gagal jika kosong |
| `DB_NAME` | Nama database |
| `NEXT_PUBLIC_ADMIN_WA_NUMBER` | Nomor WA admin untuk tombol chat (format `628...`) — **wajib diisi di compose prod** |

> File `.env` sudah tersedia di repo lokal. Jangan commit berisi secret production.

---

## Menjalankan dengan Docker

### 1. Development

```bash
docker compose up -d
```

Service yang jalan:

| Service | Container | Port | Keterangan |
|:---|:---|:---|:---|
| `db` | `west_db` | `3307 → 3306` | MariaDB, schema di-init dari `database/init.sql` |
| `phpmyadmin` | `west_phpmyadmin` | `8082 → 80` | Admin DB di http://localhost:8082 |
| `frontend` | `west_frontend` | `3000 → 3000` | Next.js dev server (hot reload) di http://localhost:3000 |

Perintah lain:

```bash
docker compose up -d            # start di background
docker compose logs -f frontend # lihat log app
docker compose down             # stop (data DB tetap tersimpan di volume)
docker compose down -v          # stop + hapus volume database
```

> Port MariaDB di host adalah **3307** (bukan 3306), karena 3306 dipakai proses lokal.

### 2. Production

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Service:

| Service | Container | Port |
|:---|:---|:---|
| `frontend` | `west-frontend` | `3000` (image di-build dari `Dockerfile`, mode standalone) |
| `db` | `west-mariadb` | internal only |
| `phpmyadmin` | `west-phpmyadmin` | `8008 → 80` |

> Compose prod **wajib** punya `DB_PASSWORD` dan `NEXT_PUBLIC_ADMIN_WA_NUMBER` di `.env`, kalau tidak build/start akan gagal.

### 3. Nginx reverse proxy (opsional)

```bash
cd nginx
docker compose up -d --build
```

Menjalankan `west-nginx` di port **80/443** dengan certificate Let's Encrypt (mount `/etc/letsencrypt`). Network `reverse-proxy` harus sudah dibuat external.

### Dockerfile
- database → `database/Dockerfile`
- app (prod multi-stage) → `Dockerfile`

---

## Menjalankan tanpa Docker (lokal)

```bash
yarn install
yarn dev
```

App jalan di http://localhost:3000. Pastikan MariaDB sudah jalan dan `DB_HOST` di `.env` menunjuk host yang benar.

---

## API Endpoints

Semua endpoint bertipe `POST`, menerima JSON, dan menerapkan rate limit **10 request per menit per IP** (kecuali `/api/vouchers/generate`). Base URL: `http://localhost:3000`.

### 1. `POST /api/vouchers/generate`

Generate voucher bulk dengan kode unik random. Tidak butuh auth.

**Request body (semua field opsional):**

| Field | Type | Default | Keterangan |
|:---|:---|:---|:---|
| `jumlah` | number | `20` | Jumlah voucher yang dibuat |
| `expires_at` | string | `null` | Tanggal kadaluarsa, format `YYYY-MM-DD HH:mm:ss` |
| `discount_1bulan` | number | `51000` | Potongan untuk program bulanan |
| `discount_2minggu` | number | `65000` | Potongan untuk program 2 minggu |

**Contoh (curl):**

```bash
# Default: 20 voucher, tanpa expiry
curl -X POST http://localhost:3000/api/vouchers/generate \
  -H "Content-Type: application/json" \
  -d '{}'
```

```bash
# Custom jumlah, kadaluarsa, dan besaran diskon
curl -X POST http://localhost:3000/api/vouchers/generate \
  -H "Content-Type: application/json" \
  -d '{
    "jumlah": 50,
    "expires_at": "2026-12-31 23:59:59",
    "discount_1bulan": 51000,
    "discount_2minggu": 65000
  }'
```

**Response:**

```json
{
  "success": true,
  "jumlah": 50,
  "codes": ["WEST-ABCD2345", "WEST-XK7P9MQ2"]
}
```

Format kode: `WEST-XXXXXXXX` — 8 karakter alfanumerik tanpa karakter ambigu `O/0/I/1`.

**Error:**

| Status | Body |
|:---|:---|
| `400` | `{"error": "Invalid JSON"}` |
| `500` | `{"error": "Gagal generate voucher", "detail": "..."}` |

---

### 2. `POST /api/validate-voucher`

Validasi kode voucher (dipakai form pendaftaran, debounce 600ms).

**Request:**

```json
{ "code": "WEST-ABCD2345" }
```

**Response — valid:**

```json
{ "valid": true, "discount_1bulan": 51000, "discount_2minggu": 65000 }
```

**Response — tidak valid** (`valid: false` + `error`):

| Pesan | Kondisi |
|:---|:---|
| `Kode voucher harus diisi` | `code` kosong / bukan string |
| `Voucher tidak ditemukan` | kode tidak ada di DB |
| `Voucher sudah pernah digunakan` | `is_used = 1` |
| `Voucher sudah kadaluarsa` | lewat `expires_at` |
| `Terlalu banyak permintaan, coba lagi nanti` | kena rate limit (`429`) |
| `Gagal terhubung ke database` | query gagal (`500`) |

**Contoh:**

```bash
curl -X POST http://localhost:3000/api/validate-voucher \
  -H "Content-Type: application/json" \
  -d '{"code": "WEST-ABCD2345"}'
```

---

### 3. `POST /api/register`

Simpan data pendaftar ke `west_leads`, tandai voucher dipakai, dan hitung total bayar.

**Request:**

```json
{
  "nama": "Budi",
  "jenis_kelamin": "Laki-laki",
  "umur": 20,
  "ttl": "Bandung, 12-03-2005",
  "alamat": "Jl. Merdeka No. 1",
  "email": "budi@mail.com",
  "whatsapp": "6281234567890",
  "program": "Adult / Month",
  "level": "Basic",
  "voucher_code": "WEST-ABCD2345"
}
```

| Field | Wajib | Keterangan |
|:---|:---|:---|
| `nama`, `jenis_kelamin`, `ttl`, `alamat`, `email`, `whatsapp`, `program` | ✅ | string |
| `umur` | ✅ | number (dibatasi 1–100) |
| `level` | ✅ | salah satu dari `Pre basic`, `Basic`, `Intermediate`, `Advance` |
| `voucher_code` | ❌ | kode voucher (otomatis di-uppercase & di-trim) |

**Program yang valid & harga dasar:**

| Program | Harga |
|:---|:---|
| `Kids / Month`, `Teenager / Month`, `Adult / Month` | 250.000 |
| `Kids / 2 Weeks`, `Teenager / 2 Weeks`, `Adult / 2 Weeks` | 165.000 |

Diskon voucher: `discount_1bulan` untuk program `* Month`, `discount_2minggu` untuk program `* 2 Weeks`. Total = `max(0, harga - diskon)`.

**Response — sukses:**

```json
{ "success": true, "total_bayar": 199000 }
```

Voucher yang valid otomatis di-set `is_used = 1`, `used_by_lead_id`, dan `used_at = NOW()`.

**Response — gagal:**

| Status | Kondisi |
|:---|:---|
| `400` | `Invalid JSON`, `Data tidak lengkap`, `Level tidak valid`, `Format email tidak valid`, `Format nomor WhatsApp tidak valid`, `Program tidak valid` |
| `429` | Kena rate limit |
| `500` | `Gagal menyimpan data pendaftaran` |

**Contoh:**

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "nama": "Budi",
    "jenis_kelamin": "Laki-laki",
    "umur": 20,
    "ttl": "Bandung, 12-03-2005",
    "alamat": "Jl. Merdeka No. 1",
    "email": "budi@mail.com",
    "whatsapp": "6281234567890",
    "program": "Adult / Month",
    "level": "Basic",
    "voucher_code": "WEST-ABCD2345"
  }'
```

---

## Alur Voucher

```
POST /api/vouchers/generate
  → voucher dibuat: is_used = 0, used_by_lead_id = NULL

User isi form + kode voucher
  → POST /api/validate-voucher (real-time, debounce 600ms)

User submit pendaftaran
  → POST /api/register
  → voucher valid: is_used = 1, used_by_lead_id = {lead_id}, used_at = NOW()
```

### Cek voucher via phpMyAdmin

Buka http://localhost:8082 (dev) atau http://localhost:8008 (prod), lalu lihat tabel **`west_vouchers`**.

| Kolom | Keterangan |
|:---|:---|
| `code` | Kode voucher (unique) |
| `discount_1bulan` / `discount_2minggu` | Besaran potongan |
| `expires_at` | Tanggal kadaluarsa (`NULL` = tidak pernah kadaluarsa) |
| `is_used` | `0` = belum dipakai, `1` = sudah dipakai |
| `used_by_lead_id` | ID lead yang memakai voucher |
| `used_at` | Waktu voucher dipakai |

---

## Struktur API

```
src/app/api/
├── register/route.ts           # POST — simpan pendaftar
├── validate-voucher/route.ts   # POST — validasi kode voucher
└── vouchers/generate/route.ts  # POST — generate voucher bulk
```
