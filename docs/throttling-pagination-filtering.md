# Throttling, Pagination, Filtering

---

# 1. Throttling (rate limit)

**File:** `src/lib/rate-limit.ts`

## 1.1 Implementasi

```ts
const WINDOW_MS = 60_000;    // 1 menit
const MAX_REQUESTS = 10;     // 10 request per window per key
```

- Penyimpanan: `Map<string, { count, resetAt }>` **in-memory di proses**.
- `rateLimit(key)` mengembalikan `true` bila lolos, `false` bila melebihi.
- Window digulirkan per key: saat `now > resetAt`, counter di-reset.
- Tidak ada hook ekspor untuk me-reset map (perlu dipertimbangkan saat menulis
  unit test — lihat [unit-testing.md](unit-testing.md)).

`getClientIp(headers)`:

```ts
headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
```

## 1.2 Penerapan

| Lokasi | Key | Bila kena limit |
|:---|:---|:---|
| `POST /api/register` | IP klien | `429 { success:false, error:"Terlalu banyak permintaan, coba lagi nanti" }` |
| `POST /api/validate-voucher` | IP klien | `429 { valid:false, error:"..." }` |
| `POST /api/vouchers/generate` | `"west:admin:vouchers"` (global) | `429 { error:"Terlalu banyak permintaan." }` |
| `login` (server action) | `"west:admin:login"` (global) | pesan `"Terlalu banyak percobaan. Coba lagi dalam satu menit."` |
| `GET /api/admin/pendaftaran/export` | — | tidak ada rate limit |

**Dua pola key berbeda:**

- **Per IP** → dipakai endpoint publik (register, validate-voucher).
- **Global (tetap)** → dipakai endpoint admin (`west:admin:vouchers`) dan
  login (`west:admin:login`). Artinya **semua IP berbagi kuota yang sama**
  untuk dua endpoint tersebut.

## 1.3 Batasan yang perlu diketahui

1. **Per proses** — restart server mengosongkan semua counter.
2. **Tidak terbagi antar instance** — di beberapa instance, limit jadi
   `10 × jumlah instance`.
3. **Tidak ada persistensi** — bukan rate limit berbasis DB.
4. **`x-forwarded-for` bisa dipalsukan** bila tidak ada proxy tepercaya.

---

# 2. Pagination

**File:** `src/lib/admin-data.ts` → `readFilters()`, `readPage()`
**UI:** `src/app/admin/ui.tsx` → `FilterForm`, `Pagination`, `filterUrl`

## 2.1 Parameter query

| Param | Nilai | Normalisasi |
|:---|:---|:---|
| `limit` | `10`, `25`, `50` | selain itu → `10` |
| `page` | integer ≥ 1 | `Math.min(100000, Math.max(1, Math.floor(Number(page) \|\| 1)))` |
| `q` | teks pencarian | `trim()` + `slice(0, 100)`, harus `string` |
| `filter` | nilai filter | divalidasi allowlist per halaman |

`page` dibatasi maksimum **100000**.

## 2.2 Alur `readPage()`

```ts
1. SELECT COUNT(*) AS total FROM <table> <WHERE>      -- hitung dulu
2. page = min(filters.page, max(1, ceil(total / limit)))  -- clamp ke halaman terakhir
3. SELECT ... ORDER BY created_at DESC, id DESC
   LIMIT ? OFFSET ?                                    -- offset = (page-1) * limit
4. return { rows, total, page }
```

Konsekuensi: **`page` yang dirender selalu halaman valid** — melebihi halaman
terakhir otomatis ditarik ke halaman terakhir.

## 2.3 Komponen UI

- `FilterForm` → `<form action={path}>` dengan input `q`, `select filter`,
  `select limit`, tombol "Terapkan".
- `filterUrl(path, filters, page?)` → membangun URL dengan
  `q`, `filter`, `limit` (+ `page` bila diberikan) memakai `URLSearchParams`.
- `Pagination` → menampilkan "Menampilkan {first}–{last} dari {total} data"
  dan navigasi `‹` / `page / pages` / `›`.
  `pages = max(1, ceil(total / limit))`.

Halaman yang memakai pagination:

| Path halaman | Fungsi list | Filter |
|:---|:---|:---|
| `/admin/pendaftaran` | `listLeads` | program kategori |
| `/admin/kupon` | `listVouchers` | status kupon |
| `/admin/aktivitas` | `listActivity` | aksi log |
| `/admin` (dashboard) | `listLeads` + `listActivity` dengan `limit: 4` | tanpa filter |

---

# 3. Filtering & pencarian

## 3.1 Klausa umum (`conditions()`)

```ts
if (query)  → (LOCATE(?, kolom1) > 0 OR LOCATE(?, kolom2) > 0 ...)
if (filter) → <ekspresi filter> = ?
```

- Pencarian memakai **`LOCATE(?, kolom) > 0`** — padanan `LIKE '%q%'`
  tanpa perlu escape wildcard `%`/`_` (karena `q` dikirim sebagai parameter).
- Semua nilai dikirim lewat **binding parameter** (`?`), bukan interpolasi
  string → aman dari SQL injection.
- Kombinasi pencarian **AND** filter.

## 3.2 Allowlist filter (wajib lolos validasi)

| Halaman | Filter diterima | Ekspresi SQL |
|:---|:---|:---|
| `/admin/pendaftaran` | `Kids`, `Teenager`, `Adult` (`programs`) | `SUBSTRING_INDEX(program, ' / ', 1) = ?` |
| `/admin/kupon` | `available`, `used`, `expired` (`voucherStatuses`) | `(CASE WHEN is_used = 1 THEN 'used' WHEN expires_at <= NOW() THEN 'expired' ELSE 'available' END) = ?` |
| `/admin/aktivitas` | `login`, `logout`, `vouchers` (`actions`) | `action = ?` |

Nilai filter di luar allowlist **diabaikan** (diubah jadi `""` → tidak ada
klausa filter), bukan error. Ini mencegah injeksi lewat parameter `filter`.

## 3.3 Kolom yang dicari

| Sumber | Kolom pencarian (`q`) |
|:---|:---|
| `listLeads` / `exportLeads` | `nama`, `email` |
| `listVouchers` | `code` |
| `listActivity` | `actor`, `description` |

## 3.4 Export

`exportLeads(filters)` memakai `WHERE` yang sama dengan `listLeads`
(`leadConditions`), tetapi **tanpa `LIMIT`/`OFFSET`** — seluruh baris yang
cocok diekspor.

---

# 4. Ringkasan alur request data admin

```
URL ?q=&filter=&limit=&page=
        │
        ▼
 readFilters(searchParams)     ← normalisasi & clamp
        │
        ▼
 listLeads / listVouchers / listActivity
        │
        ├─ conditions()        ← WHERE (LOCATE + allowlist filter)
        ├─ COUNT(*)            ← total
        ├─ clamp page          ← page ≤ ceil(total/limit)
        └─ SELECT … LIMIT/OFFSET
        │
        ▼
 { rows, total, page }  →  <Pagination> & <Table>
```
