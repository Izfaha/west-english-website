import { describe, expect, it } from "vitest";
import { generateCode, validExpiry } from "./route";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

describe("generateCode", () => {
  it("berformat WEST- diikuti 8 karakter", () => {
    for (let i = 0; i < 100; i++) {
      expect(generateCode()).toMatch(/^WEST-[A-Z0-9]{8}$/);
    }
  });

  it("hanya memakai alfabet tanpa karakter ambigu", () => {
    for (const code of Array.from({ length: 200 }, generateCode)) {
      const body = code.slice("WEST-".length);
      for (const char of body) expect(ALPHABET).toContain(char);
      expect(body).not.toMatch(/[O0I1]/);
    }
  });

  it("memproduksi kode unik dalam volume besar", () => {
    const codes = new Set(Array.from({ length: 500 }, generateCode));
    expect(codes.size).toBe(500);
  });

  it("memakai seluruh panjang alfabet 32 karakter", () => {
    expect(ALPHABET).toHaveLength(32);
    expect(new Set(ALPHABET).size).toBe(32);
  });
});

describe("validExpiry — validasi expires_at", () => {
  it("menerima format YYYY-MM-DD HH:mm:ss yang valid", () => {
    expect(validExpiry("2026-12-31 23:59:59")).toBe(true);
    expect(validExpiry("2026-01-01 00:00:00")).toBe(true);
    expect(validExpiry("2026-02-28 12:00:00")).toBe(true);
  });

  it("menolak null dan undefined (berarti tanpa kedaluwarsa)", () => {
    expect(validExpiry(null)).toBe(false);
    expect(validExpiry(undefined)).toBe(false);
  });

  it("menolak tipe selain string", () => {
    expect(validExpiry(20261231)).toBe(false);
    expect(validExpiry(true)).toBe(false);
    expect(validExpiry({})).toBe(false);
  });

  it("menolak format yang salah", () => {
    expect(validExpiry("")).toBe(false);
    expect(validExpiry("2026-12-31")).toBe(false); // tanpa waktu
    expect(validExpiry("2026-12-31T23:59:59")).toBe(false); // pakai T, bukan spasi
    expect(validExpiry("31-12-2026 23:59:59")).toBe(false); // urutan salah
    expect(validExpiry("2026/12/31 23:59:59")).toBe(false); // pemisah salah
    expect(validExpiry("2026-12-31 23:59")).toBe(false); // tanpa detik
  });

  it("menolak tanggal yang tidak nyata", () => {
    expect(validExpiry("2026-13-01 00:00:00")).toBe(false); // bulan 13
    expect(validExpiry("2026-00-01 00:00:00")).toBe(false); // bulan 0
    expect(validExpiry("2026-02-30 00:00:00")).toBe(false); // Februari 30
    expect(validExpiry("2026-12-31 24:00:00")).toBe(false); // jam 24
    expect(validExpiry("2026-12-31 23:60:00")).toBe(false); // menit 60
    expect(validExpiry("2026-12-31 23:59:60")).toBe(false); // detik 60
  });

  it("menolak tahun di bawah 1000", () => {
    expect(validExpiry("0999-12-31 23:59:59")).toBe(false);
    expect(validExpiry("1000-12-31 23:59:59")).toBe(true);
  });
});
