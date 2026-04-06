import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Odza Warehouse",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}