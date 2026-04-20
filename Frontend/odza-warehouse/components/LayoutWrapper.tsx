"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    setIsMounted(true);
    const savedState = localStorage.getItem("odza-sidebar-state");
    if (savedState !== null) {
      setSidebarOpen(savedState === "true");
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const newState = !prev;
      localStorage.setItem("odza-sidebar-state", String(newState));
      return newState;
    });
  };

  if (!isMounted) return null;

  // ─── LOGIKA TRICKY: JIKA HALAMAN LOGIN/REGISTER, SEMBUNYIKAN NAVIGASI ───
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-6">
        {children}
      </div>
    );
  }

  // ─── JIKA HALAMAN BIASA (DASHBOARD DLL), TAMPILKAN NORMAL ───
  return (
    <div className="flex flex-col h-screen bg-[#F7F7F5] overflow-hidden">
      <Topbar onToggleSidebar={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}