export const PROGRAMS = [
  {
    id: "english-master",
    name: "English Master",
    duration: "3 Bulan",
    price: 2500000,
    description: "Program intensif untuk menguasai English speaking, grammar, dan pronunciation.",
  },
  {
    id: "speaking-intensive",
    name: "Speaking Intensive",
    duration: "1 Bulan",
    price: 1200000,
    description: "Fokus meningkatkan kemampuan berbicara bahasa Inggris dengan percaya diri.",
  },
  {
    id: "toefl-preparation",
    name: "TOEFL Preparation",
    duration: "2 Bulan",
    price: 1800000,
    description: "Persiapan tes TOEFL dengan strategi dan latihan soal intensif.",
  },
  {
    id: "ielts-preparation",
    name: "IELTS Preparation",
    duration: "2 Bulan",
    price: 2000000,
    description: "Program khusus persiapan IELTS dengan target skor tinggi.",
  },
];

export const ADMIN_WA_NUMBER = process.env.NEXT_PUBLIC_ADMIN_WA_NUMBER || "6281234567890";

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
