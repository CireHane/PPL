"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Menu, Search, Bell, ChevronDown, X, RefreshCw, LogOut, Package, 
  ArrowLeft, Check, UserPlus 
} from "lucide-react";
import { frequentSKUs, initialNotifications, type Notification } from "@/lib/mock-data";

function useClickOutside(refs: React.RefObject<HTMLElement | null>[], handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const isOutside = refs.every((ref) => !ref.current || !ref.current.contains(target));
      if (isOutside) handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [refs, handler]);
}

const notifTypeStyle: Record<Notification["type"], string> = {
  warning: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-600",
  success: "bg-emerald-100 text-emerald-700",
  info: "bg-sky-100 text-sky-700",
};

const notifDot: Record<Notification["type"], string> = {
  warning: "bg-amber-400",
  error: "bg-red-500",
  success: "bg-emerald-500",
  info: "bg-sky-400",
};

interface TopbarProps {
  onToggleSidebar: () => void;
}

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  
  // ─── STATE BARU UNTUK MODE DROPDOWN PROFIL ───
  // 'main' = Tampilan awal | 'switch' = Tampilan panel ganti akun
  const [profileView, setProfileView] = useState<'main' | 'switch'>('main');

  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const closeAll = useCallback(() => {
    setSearchOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
    // Reset view profil kembali ke utama jika tertutup
    setTimeout(() => setProfileView('main'), 200);
  }, []);

  useClickOutside([searchRef, notifRef, profileRef], closeAll);

  const filteredSKUs = searchQuery.trim()
    ? frequentSKUs.filter((sku) => sku.toLowerCase().includes(searchQuery.toLowerCase()))
    : frequentSKUs.slice(0, 8);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const dismissNotif = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="flex items-center h-[72px] px-5 gap-5 bg-white border-b border-[#E8E8E4] shrink-0 z-40 w-full shadow-sm">
      
      {/* Container Kiri: Hamburger + Logo */}
      <div className="flex items-center gap-4 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-md text-[#555] hover:bg-[#F0F0EC] hover:text-[#1A1A1A] transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={22} />
        </button>
        
        <Link href="/" className="flex items-center">
          <img 
            src="/logo.png" 
            alt="Odza Classic Warehouse" 
            className="h-[48px] w-auto object-contain"
          />
        </Link>
      </div>

      {/* Search Bar */}
      <div ref={searchRef} className="relative flex-1 max-w-[480px] ml-4">
        <div
          className={`
            flex items-center gap-2 px-3 h-10 rounded-xl border transition-all duration-150
            ${searchOpen
              ? "border-[#1A1A1A] bg-white shadow-sm"
              : "border-[#E8E8E4] bg-[#F7F7F5] hover:border-[#CDCDC9]"
            }
          `}
        >
          <Search size={16} className="text-[#ABABAB] shrink-0" />
          <input
            type="text"
            placeholder="Search SKU, Racks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            className="flex-1 bg-transparent text-[14px] text-[#1A1A1A] placeholder:text-[#ABABAB] outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-[#ABABAB] hover:text-[#555] transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search Dropdown */}
        {searchOpen && (
          <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-[#E8E8E4] rounded-xl shadow-xl overflow-hidden z-50">
            <div className="px-3 py-2 border-b border-[#F0F0EC]">
              <span className="text-[10px] font-semibold tracking-widest text-[#ABABAB] uppercase">
                {searchQuery ? "Results" : "Frequent SKUs"}
              </span>
            </div>
            <ul className="max-h-[240px] overflow-y-auto py-1">
              {filteredSKUs.length > 0 ? (
                filteredSKUs.map((sku) => (
                  <li key={sku}>
                    <button
                      onClick={() => {
                        setSearchQuery(sku);
                        setSearchOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#F7F7F5] transition-colors group"
                    >
                      <Package size={14} className="text-[#CDCDC9] group-hover:text-[#888] shrink-0" />
                      <span className="text-[13px] text-[#1A1A1A] font-mono">{sku}</span>
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-3 py-4 text-center text-[13px] text-[#ABABAB]">
                  No SKU found for "{searchQuery}"
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Date */}
      <span className="hidden md:block text-[13px] text-[#888] font-medium select-none whitespace-nowrap">
        {dateStr}
      </span>

      {/* Notification Bell */}
      <div ref={notifRef} className="relative ml-2">
        <button
          onClick={() => {
            setNotifOpen((v) => !v);
            setProfileOpen(false);
            setSearchOpen(false);
          }}
          className="relative p-2 rounded-full text-[#555] hover:bg-[#F0F0EC] hover:text-[#1A1A1A] transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0 -right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none border-2 border-white">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Notification Panel */}
        {notifOpen && (
          <div className="absolute right-0 top-[calc(100%+12px)] w-[360px] bg-white border border-[#E8E8E4] rounded-2xl shadow-2xl overflow-hidden z-50">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0EC]">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-[#1A1A1A]">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-[#1A1A1A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                onClick={markAllRead}
                className="text-[12px] text-[#888] hover:text-[#1A1A1A] transition-colors font-medium"
              >
                Mark all read
              </button>
            </div>
            <ul className="max-h-[320px] overflow-y-auto divide-y divide-[#F7F7F5]">
              {notifications.length === 0 ? (
                <li className="py-10 text-center text-[13px] text-[#ABABAB]">
                  All clear — no notifications
                </li>
              ) : (
                notifications.map((notif) => (
                  <li key={notif.id} className={`flex items-start gap-3 px-5 py-3.5 group transition-colors ${!notif.read ? "bg-[#FAFAF8]" : "bg-white hover:bg-[#F7F7F5]"}`}>
                    <div className="mt-1.5 shrink-0">
                      <span className={`block w-2 h-2 rounded-full ${notif.read ? "bg-[#E0E0DC]" : notifDot[notif.type]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${notifTypeStyle[notif.type]}`}>
                          {notif.type.toUpperCase()}
                        </span>
                        <span className="text-[12px] font-bold text-[#1A1A1A] truncate">{notif.title}</span>
                      </div>
                      <p className="text-[13px] text-[#666] leading-relaxed">{notif.message}</p>
                      <span className="text-[10px] text-[#ABABAB] mt-1.5 block">{notif.time}</span>
                    </div>
                    <button onClick={(e) => dismissNotif(notif.id, e)} className="shrink-0 mt-1 p-1 rounded-md text-[#CDCDC9] hover:text-[#555] hover:bg-[#F0F0EC] transition-colors opacity-0 group-hover:opacity-100">
                      <X size={14} />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {/* User Profile */}
      <div ref={profileRef} className="relative border-l border-[#E8E8E4] pl-5 ml-1">
        <button
          onClick={() => {
            setProfileOpen((v) => !v);
            if (!profileOpen) setProfileView('main');
            setNotifOpen(false);
            setSearchOpen(false);
          }}
          className="flex items-center gap-3 p-1 pr-2 rounded-xl hover:bg-[#F0F0EC] transition-colors group"
        >
          <div className="w-9 h-9 rounded-full bg-[#1A1A1A] flex items-center justify-center shrink-0">
            <span className="text-[13px] font-bold text-white">U1</span>
          </div>
          <div className="hidden md:flex flex-col items-start leading-none">
            <span className="text-[14px] font-bold text-[#1A1A1A]">User 1</span>
            <span className="text-[11px] text-[#888] font-medium mt-1">Operator</span>
          </div>
          <ChevronDown size={14} className={`hidden md:block text-[#888] transition-transform duration-200 ml-1 ${profileOpen ? "rotate-180" : ""}`} />
        </button>

        {/* ── DROPDOWN MULTI-VIEW ── */}
        {profileOpen && (
          <div className="absolute right-0 top-[calc(100%+12px)] w-[260px] bg-white border border-[#E8E8E4] rounded-2xl shadow-2xl overflow-hidden z-50">
            
            {/* VIEW 1: Main Dropdown */}
            {profileView === 'main' && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-200">
                <div className="px-5 py-4 border-b border-[#F0F0EC]">
                  <p className="text-[14px] font-bold text-[#1A1A1A]">User 1</p>
                  <p className="text-[12px] text-[#888] mt-0.5">Operator · Odza Classic</p>
                </div>
                <ul className="py-2">
                  <li>
                    <button
                      onClick={() => setProfileView('switch')}
                      className="w-full flex items-center gap-3 px-5 py-3 text-left text-[13px] font-medium text-[#333] hover:bg-[#F7F7F5] transition-colors"
                    >
                      <RefreshCw size={16} className="text-[#888]" />
                      Ganti Akun
                    </button>
                  </li>
                  <li>
                    <Link
                      href="/login"
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center gap-3 px-5 py-3 text-left text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} className="text-red-500" />
                      Keluar
                    </Link>
                  </li>
                </ul>
              </div>
            )}

            {/* VIEW 2: Switch Account Panel */}
            {profileView === 'switch' && (
              <div className="animate-in fade-in slide-in-from-right-2 duration-200">
                
                {/* Header: Back Button & Title */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#F0F0EC] bg-[#FAFAF8]">
                  <button 
                    onClick={() => setProfileView('main')} 
                    className="p-1 rounded-md text-[#888] hover:bg-[#E8E8E4] hover:text-[#1A1A1A] transition-colors"
                  >
                    <ArrowLeft size={16} strokeWidth={2.5} />
                  </button>
                  <span className="text-[14px] font-bold text-[#1A1A1A]">Akun</span>
                </div>

                {/* Active User (Besar & Paling Atas) */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0EC] bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#1A1A1A] flex items-center justify-center shrink-0">
                      <span className="text-[14px] font-bold text-white">U1</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-[#1A1A1A]">User 1</span>
                      <span className="text-[12px] text-[#888] font-medium">Operator</span>
                    </div>
                  </div>
                  <Check size={20} strokeWidth={3} className="text-[#1A1A1A]" />
                </div>

                {/* Subtitle: Akun Lain */}
                <div className="px-5 py-2.5 bg-[#FAFAF8] border-b border-[#F0F0EC]">
                  <span className="text-[11px] font-bold text-[#888] tracking-widest uppercase">Akun lain</span>
                </div>

                {/* List Akun Lain */}
                <div className="divide-y divide-[#F0F0EC]">
                  <button className="w-full flex items-center gap-3 px-5 py-3 bg-white hover:bg-[#F7F7F5] transition-colors text-left group">
                    <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center shrink-0 group-hover:bg-stone-300 transition-colors">
                      <span className="text-[12px] font-bold text-stone-500 group-hover:text-stone-700">U2</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-[#1A1A1A]">User 2</span>
                      <span className="text-[11px] text-[#888] font-medium">Operator</span>
                    </div>
                  </button>
                  
                  <button className="w-full flex items-center gap-3 px-5 py-3 bg-white hover:bg-[#F7F7F5] transition-colors text-left group">
                    <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center shrink-0 group-hover:bg-stone-300 transition-colors">
                      <span className="text-[12px] font-bold text-stone-500 group-hover:text-stone-700">U3</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-[#1A1A1A]">User 3</span>
                      <span className="text-[11px] text-[#888] font-medium">Admin Gudang</span>
                    </div>
                  </button>
                </div>

                {/* Bottom Actions */}
                <div className="py-2 bg-[#FAFAF8] border-t border-[#F0F0EC]">
                  <Link 
                    href="/login" 
                    onClick={() => setProfileOpen(false)}
                    className="w-full flex items-center gap-3 px-5 py-3 text-[13px] font-bold text-[#333] hover:text-[#1A1A1A] hover:bg-stone-100 transition-colors"
                  >
                    <UserPlus size={16} strokeWidth={2.5} className="text-[#888]" />
                    Tambahkan akun
                  </Link>
                  <Link 
                    href="/login" 
                    onClick={() => setProfileOpen(false)}
                    className="w-full flex items-center gap-3 px-5 py-3 text-[13px] font-bold text-[#333] hover:text-[#1A1A1A] hover:bg-stone-100 transition-colors"
                  >
                    <LogOut size={16} strokeWidth={2.5} className="text-[#888]" />
                    Logout
                  </Link>
                </div>

              </div>
            )}
            
          </div>
        )}
      </div>
    </header>
  );
}