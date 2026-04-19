import type { Metadata } from "next";
// 1. Impor font Inter dari next/font/google
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";

// 2. Konfigurasi font (subsets latin adalah standar)
const inter = Inter({ 
  subsets: ["latin"],
  display: "swap", // Menghindari pergeseran tata letak saat muat
});

export const metadata: Metadata = {
  title: "Odza Classic WMS",
  description: "Warehouse Management System — Odza Classic",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      {/* 3. Terapkan className inter ke body */}
      <body className={`${inter.className} antialiased`}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}