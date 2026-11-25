# API

Base URL lokal: `http://localhost:3000`.
Semua endpoint bertipe `POST` kecuali export (`GET`), menerima/merespons JSON
kecuali export (CSV). Tidak ada endpoint yang butuh API key — yang dipakai
adalah **cookie sesi admin**.

| # | Method | Path | Auth | Rate limit key | File |
|:--|:---|:---|:---|:---|:---|
| 1 | POST | `/api/register` | publik | per IP | `src/app/api/register/route.ts` |
| 2 | POST | `/api/validate-voucher` | publik | per IP | `src/app/api/validate-voucher/route.ts` |
| 3 | POST | `/api/vouchers/generate` | sesi admin | `west:admin:vouchers` | `src/app/api/vouchers/generate/route.ts` |
| 4 | GET | `/api/admin/pendaftaran/export` | sesi admin | — | `src/app/api/admin/pendaftaran/export/route.ts` |

> Rate limit detail: [throttling-pagination-filtering.md](throttling-pagination-filtering.md).
> Detail sesi: [auth.md](auth.md).

---

## 1. `POST /api/register`

Menyimpan pendaftar ke `west_leads`, menandai voucher dipakai.

### Request body

| Field | Tipe | Wajib | Aturan |
|:---|:---|:---|:---|
| `nama` | string | ✅ | strip `<>`, trim, max 500 |
| `jenis_kelamin` | string | ✅ | — |
| `umur` | number | ✅ | di-floor lalu di-clamp 1–100 |
| `ttl` | string | ✅ | — |
| `alamat` | string | ✅ | — |
| `email` | string | ✅ | regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` |
| `whatsapp` | string | ✅ | regex `^[0-9+\-\s()]{7,20}$` |
| `program` | string | ✅ | harus kunci `PRICE_MAP` |
| `level` | string | ✅ | salah satu `VALID_LEVELS` |
| `voucher_code` | string | ❌ | di-trim + di-uppercase |

### Response

| Status | Body |
|:---|:---|
| `200` | `{ "success": true, "total_bayar": 199000 }` |
| `400` | `{ "success": false, "error": "Data tidak lengkap" \| "Level tidak valid" \| "Format email tidak valid" \| "Format nomor WhatsApp tidak valid" \| "Program tidak valid" }` |
| `400` | `{ "success": false, "error": "Invalid JSON" }` |
| `429` | `{ "success": false, "error": "Terlalu banyak permintaan, coba lagi nanti" }` |
| `500` | `{ "success": false, "error": "Gagal menyimpan data pendaftaran" }` |

### Contoh

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "nama": "Budi", "jenis_kelamin": "Laki-laki", "umur": 20,
    "ttl": "Bandung, 12-03-2005", "alamat": "Jl. Merdeka No. 1",
    "email": "budi@mail.com", "whatsapp": "6281234567890",
    "program": "Adult / Month", "level": "Basic",
    "voucher_code": "WEST-ABCD2345"
  }'
```

**Catatan perilaku:** voucher yang tidak valid/lewat/kadaluarsa **tidak**
menggagalkan request — diskon jadi 0 dan `success` tetap `true`.

---

## 2. `POST /api/validate-voucher`

Validasi kode (dipakai form pendaftaran dengan debounce 600 ms).

### Request

```json
{ "code": "WEST-ABCD2345" }
```

### Response

Kode tidak valid umumnya balas **`200` dengan `valid: false`** — bukan 4xx:

| Status | Body |
|:---|:---|
| `200` | `{ "valid": true, "discount_1bulan": 51000, "discount_2minggu": 65000 }` |
| `200` | `{ "valid": false, "error": "Voucher tidak ditemukan" }` |
| `200` | `{ "valid": false, "error": "Voucher sudah pernah digunakan" }` |
| `200` | `{ "valid": false, "error": "Voucher sudah kadaluarsa" }` |
| `400` | `{ "valid": false, "error": "Kode voucher harus diisi" }` / `"Invalid JSON"` |
| `429` | `{ "valid": false, "error": "Terlalu banyak permintaan, coba lagi nanti" }` |
| `500` | `{ "valid": false, "error": "Gagal terhubung ke database" }` |

Urutan cek: ditemukan → `is_used` → `expires_at`.

```bash
curl -X POST http://localhost:3000/api/validate-voucher \
  -H "Content-Type: application/json" -d '{"code":"WEST-ABCD2345"}'
```

---

## 3. `POST /api/vouchers/generate`

Generate kupon massal. **Butuh sesi admin.**

### Pemeriksaan (berurutan)

1. **`401`** `{ "error": "Login diperlukan." }` — tidak ada sesi.
2. **`415`** `{ "error": "Gunakan Content-Type application/json." }` —
   `Content-Type` harus diawali `application/json`.
3. **`403`** `{ "error": "Origin tidak diizinkan." }` — header `Origin`
   ada tapi `host`-nya tidak cocok dengan `x-forwarded-host`/`host`
   (proteksi CSRF sederhana). Request tanpa `Origin` lolos.
4. **`429`** `{ "error": "Terlalu banyak permintaan." }`
5. **`400`** `{ "error": "JSON tidak valid." }` — body bukan objek
   (array/null/bukan JSON).
6. **`400`** `{ "error": "Periksa jumlah (1–100), batas diskon, dan tanggal kupon." }`

### Body

| Field | Tipe | Default | Validasi |
|:---|:---|:---|---|
| `jumlah` | integer | `20` | 1–100 |
| `expires_at` | string \| null | `null` | format `YYYY-MM-DD HH:mm:ss` dan harus tanggal valid |
| `discount_1bulan` | integer | `51000` | 0–250000 |
| `discount_2minggu` | integer | `65000` | 0–165000 |

### Response

```json
{ "success": true, "jumlah": 20, "codes": ["WEST-XXXXXXXX", "..."] }
```

- Kode dibuat dengan `node:crypto` `randomInt` dari alfabet
  `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (tanpa `O/0/I/1`), unik via `Set`.
- Insert + `recordActivity` dijalankan dalam **satu transaksi**
  (`beginTransaction` → `commit`; gagal → `rollback` → `500`).
- `500`: `{ "error": "Gagal membuat kupon. Coba lagi." }`

```bash
curl -X POST http://localhost:3000/api/vouchers/generate \
  -H "Content-Type: application/json" \
  -b "west_admin_session=$TOKEN" \
  -d '{"jumlah":20,"expires_at":"2026-12-31 23:59:59"}'
```

---

## 4. `GET /api/admin/pendaftaran/export`

Export CSV pendaftar. **Butuh sesi admin.**

### Query parameter

Menerima parameter yang sama dengan halaman daftar (`q`, `filter`, `limit`,
`page` — dinormalisasi `readFilters`), **tetapi pagination tidak dipakai**:
`exportLeads` mengembalikan **semua baris** yang cocok.

### Response

- Status `200`, `Content-Type: text/csv; charset=utf-8`
- Body diawali **BOM UTF-8** (`\uFEFF`) dan baris dipisah `\r\n`
- Header kolom: `Nama,Email,WhatsApp,Program,Tanggal`
- `Content-Disposition: attachment; filename="pendaftaran-west.csv"`
- `Cache-Control: private, no-store`

**Perlindungan CSV injection:** nilai yang diawali `=`, `+`, `@`, `-`
(atau kontrol `\t\r\n`) diberi awalan `'`, lalu semua sel dibungkus kutip
dengan escape `"` → `""`.

Tanpa sesi: `401 { "error": "Login diperlukan." }`.

```bash
curl -b "west_admin_session=$TOKEN" \
  "http://localhost:3000/api/admin/pendaftaran/export?q=&filter=&limit=10" \
  -o pendaftaran-west.csv
```

---

## 5. Halaman vs endpoint

| URL | Jenis | Keterangan |
|:---|:---|:---|
| `/login` | halaman | form login (`src/app/login/page.tsx`) |
| `/admin`, `/admin/kupon`, `/admin/pendaftaran`, `/admin/aktivitas` | halaman | dilindungi `requireAdmin()` |
| `/api/*` | endpoint | lihat tabel di atas |

Tidak ada `middleware.ts` — proteksi halaman ada di `src/app/admin/layout.tsx`,
proteksi API ada di masing-masing route handler.
