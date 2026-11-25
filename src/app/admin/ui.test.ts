import { describe, expect, it } from "vitest";
import { filterUrl, formatCount, formatDate, formatDateTime, formatMoney } from "./ui";

const baseFilters = { limit: 10, page: 1, query: "", filter: "" };

describe("formatCount", () => {
  it("memakai pemisah ribuan Indonesia", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(199000)).toBe("199.000");
    expect(formatCount(1234567)).toBe("1.234.567");
  });
});

describe("formatMoney", () => {
  it("menambahkan prefix Rp dan pemisah ribuan", () => {
    expect(formatMoney(0)).toBe("Rp0");
    expect(formatMoney(165000)).toBe("Rp165.000");
    expect(formatMoney(250000)).toBe("Rp250.000");
  });
});

describe("formatDate", () => {
  it("mengembalikan em-dash untuk null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("memformat tanggal sesuai zona Asia/Jakarta", () => {
    expect(formatDate(new Date("2026-01-01T17:00:00.000Z"))).toBe("2 Jan 2026");
    expect(formatDate(new Date("2025-12-31T17:00:00.000Z"))).toBe("1 Jan 2026");
  });
});

describe("formatDateTime", () => {
  it("memuat tahun dan bulan", () => {
    const value = formatDateTime(new Date("2026-06-15T03:30:00.000Z"));
    expect(value).toContain("2026");
    expect(value).toContain("Jun");
  });
});

describe("filterUrl", () => {
  it("selalu menyertakan q, filter, limit", () => {
    expect(filterUrl("/admin/pendaftaran", baseFilters)).toBe(
      "/admin/pendaftaran?q=&filter=&limit=10",
    );
  });

  it("menambahkan page hanya bila diberikan", () => {
    expect(filterUrl("/admin/kupon", baseFilters, 3)).toBe("/admin/kupon?q=&filter=&limit=10&page=3");
    expect(filterUrl("/admin/kupon", baseFilters)).not.toContain("page=");
  });

  it("mempertahankan filter yang sedang aktif", () => {
    const filters = { limit: 25, page: 2, query: "budi", filter: "Kids" };
    expect(filterUrl("/admin/pendaftaran", filters, 3)).toBe(
      "/admin/pendaftaran?q=budi&filter=Kids&limit=25&page=3",
    );
  });

  it("melakukan encoding pada karakter khusus", () => {
    const filters = { limit: 10, page: 1, query: "a & b?c=d", filter: "" };
    expect(filterUrl("/admin/pendaftaran", filters)).toBe(
      "/admin/pendaftaran?q=a+%26+b%3Fc%3Dd&filter=&limit=10",
    );
  });
});
