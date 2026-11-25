# Dokumentasi Teknis WEST

Dokumentasi internal aplikasi **WEST — Wavi English School & Training**.
Semua isi ditulis berdasarkan pembacaan kode di repository ini; path relatif
dipakai agar mudah ditelusuri kembali.

| Dokumen | Isi | Sumber utama |
|:---|:---|:---|
| [database-design.md](database-design.md) | Desain database: tabel, relasi, index, migrasi | `database/init.sql`, `database/migrations/` |
| [models-and-schema.md](models-and-schema.md) | Model TypeScript & pemetaan skrip SQL → tipe | `src/lib/admin-data.ts`, `src/lib/admin-auth.ts` |
| [api.md](api.md) | Semua endpoint, request/response, kode status | `src/app/api/**/route.ts` |
| [auth.md](auth.md) | Autentikasi admin, sesi, hashing, alur redirect | `src/lib/admin-auth.ts`, `src/app/login/` |
| [throttling-pagination-filtering.md](throttling-pagination-filtering.md) | Throttling (rate limit), pagination, filtering | `src/lib/rate-limit.ts`, `src/lib/admin-data.ts` |
| [unit-testing.md](unit-testing.md) | Unit test (Vitest): perintah, konfigurasi, cakupan 62 test | `vitest.config.mts`, `src/**/*.test.ts` |

## Peta cepat

```
src/app/(public)/      halaman publik: /, /pendaftaran, /tutor
src/app/login/         /login  (server action login/logout)
src/app/admin/         /admin/*  (dilindungi requireAdmin)
src/app/api/           4 endpoint REST
src/lib/               db pool, auth, query admin, rate limit
database/              init.sql + migrasi
scripts/seed-demo.mjs  seed data demo & akun admin
```

## Prasyarat

- Package manager: **Yarn 1.22.22** (`package.json` → `packageManager`)
- Node 20 (Docker) / Node 22 (host)
- MariaDB 10.6

## Perintah

```bash
yarn install   # dependensi
yarn dev       # dev server
yarn build     # build produksi
yarn lint      # eslint — jalankan sebelum selesai
yarn test      # vitest run — 6 file / 62 test
```

> **Catatan penting:** di lingkungan dev saat ini port 3000 dilayani container
> `west-frontend` (compose prod). Perubahan rute baru butuh
> `docker compose -f docker-compose.prod.yml up -d --build`. Lihat `AGENTS.md`.
