import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";

// ===== Global Font =====
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WEST Kampung Inggris",
  description: "Belajar Bahasa Inggris di Kampung Inggris bersama WEST",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${poppins.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body">
        {children}
      </body>
    </html>
  );
}
