import { describe, expect, it } from "vitest";
import { PRICE_MAP, VALID_LEVELS, sanitize } from "./route";

describe("sanitize", () => {
  it("membuang tanda kurung siku", () => {
    expect(sanitize("<b>Budi</b>")).toBe("bBudi/b");
    expect(sanitize("<script>alert(1)</script>")).toBe("scriptalert(1)/script");
    expect(sanitize("tanpa tag")).toBe("tanpa tag");
  });

  it("mentrims whitespace di awal dan akhir", () => {
    expect(sanitize("  Budi  ")).toBe("Budi");
    expect(sanitize("\n\tBudi\t\n")).toBe("Budi");
  });

  it("membatasi maksimal 500 karakter", () => {
    expect(sanitize("x".repeat(600))).toHaveLength(500);
    expect(sanitize("x".repeat(500))).toHaveLength(500);
    expect(sanitize("x".repeat(499))).toHaveLength(499);
  });

  it("memotong SETELAH strip dan trim", () => {
    const padded = " ".repeat(10) + "x".repeat(600);
    expect(sanitize(padded)).toHaveLength(500);
  });

  it("mengembalikan string kosong untuk input kosong", () => {
    expect(sanitize("")).toBe("");
  });
});

describe("PRICE_MAP", () => {
  it("memuat enam kombinasi program dengan dua titik harga", () => {
    expect(Object.keys(PRICE_MAP)).toHaveLength(6);
    expect(PRICE_MAP["Kids / Month"]).toBe(250000);
    expect(PRICE_MAP["Teenager / Month"]).toBe(250000);
    expect(PRICE_MAP["Adult / Month"]).toBe(250000);
    expect(PRICE_MAP["Kids / 2 Weeks"]).toBe(165000);
    expect(PRICE_MAP["Teenager / 2 Weeks"]).toBe(165000);
    expect(PRICE_MAP["Adult / 2 Weeks"]).toBe(165000);
  });

  it("tidak memuat program di luar daftar", () => {
    expect(PRICE_MAP["Corporate / Month"]).toBeUndefined();
    expect(PRICE_MAP["Kids / Year"]).toBeUndefined();
  });
});

describe("VALID_LEVELS", () => {
  it("memuat tepat empat level yang dikenali", () => {
    expect(VALID_LEVELS).toEqual(["Pre basic", "Basic", "Intermediate", "Advance"]);
  });
});
