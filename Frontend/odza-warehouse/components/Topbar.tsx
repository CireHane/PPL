"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Bell, ChevronDown, RefreshCw, LogOut, Package,
  ArrowLeft, Check, AlertTriangle, X
} from "lucide-react";
import { logout } from "@/lib/tokenAssistant";

const frequentSKUs = ["ZW24081-M", "ZS241201B-L", "BW00021", "A-1-2 (Rak)", "Q-1-1 (Rak)"];

function useClickOutside(refs: React.RefObject<HTMLElement | null>[], handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (refs.every(r => !r.current || !r.current.contains(target))) handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [handler]); 
}

export default function Topbar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery]   = useState("");
  const [searchOpen, setSearchOpen]     = useState(false);
  const [notifOpen, setNotifOpen]       = useState(false);
  const [profileOpen, setProfileOpen]   = useState(false);
  const [profileView, setProfileView]   = useState<"main" | "switch">("main");

  const [notifications, setNotifications] = useState([
    { id: 1, sku: "ZW24081-M", rack: "Q-1-1", qty: 3, time: "Baru saja" },
    { id: 2, sku: "BW00021", rack: "A-1-2", qty: 5, time: "2 jam lalu" }
  ]);

  const searchRef  = useRef<HTMLDivElement>(null);
  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleLogout = useCallback(() => { logout(); router.push("/login"); }, [router]);

  const closeAll = useCallback(() => {
    setSearchOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
    setTimeout(() => setProfileView("main"), 200);
  }, []);

  useClickOutside([searchRef, notifRef, profileRef], closeAll);

  const handleOpenSearch = () => { setSearchOpen(true); setNotifOpen(false); setProfileOpen(false); };
  const handleToggleNotif = () => { setNotifOpen(v => !v); setSearchOpen(false); setProfileOpen(false); };
  const handleToggleProfile = () => { setProfileOpen(v => !v); setSearchOpen(false); setNotifOpen(false); };

  const handleDismissNotif = (id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const handleCheckInventory = (sku: string) => {
    setNotifOpen(false);
    router.push(`/inventory?search=${encodeURIComponent(sku)}`); // SUDAH DIKEMBALIKAN KE /inventory
  };

  const filteredSKUs = searchQuery.trim()
    ? frequentSKUs.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    : frequentSKUs.slice(0, 5);

  // Format rak: huruf kapital, diikuti 2 segmen angka, contoh: A-1-1, Q-3-2, Z-10-5
  const RACK_PATTERN = /^[A-Z]-\d+-\d+$/i;

  const triggerSearch = (query: string) => {
    const q = query.trim();
    if (!q) return;
    if (RACK_PATTERN.test(q)) {
      router.push(`/racks?search=${encodeURIComponent(q)}`);
    } else {
      router.push(`/inventory?search=${encodeURIComponent(q)}`);
    }
    setSearchQuery("");
    setSearchOpen(false);
  };

  const dateStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <header className="relative flex items-center h-[72px] px-5 gap-5 shrink-0 z-[60] w-full shadow-md text-white border-none">

      <div aria-hidden className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none" style={{ backgroundImage: "url('/batik-pattern.png')" }} />
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundColor: "rgba(43, 29, 16, 0.85)" }} />

      <Link href="/" className="relative z-10 flex items-center shrink-0 cursor-pointer ml-2">
        <img src="/logo.png" alt="Odza Classic" className="h-[45px] w-auto object-contain filter brightness-0 invert" />
      </Link>

      <div ref={searchRef} className="relative z-10 flex-1 max-w-[480px] ml-4">
        <div className={`flex items-center gap-2 px-3 h-10 rounded-md transition-all duration-200 cursor-text shadow-sm border-none
          ${searchOpen ? "bg-[#856D5B]" : "bg-[#745E4F] hover:bg-[#856D5B]"}`}
        >
          <Search size={16} className={`shrink-0 transition-colors ${searchOpen ? "text-[#D4AF37]" : "text-white/60"}`} />
          <input
            type="text"
            placeholder="Cari SKU atau Rak (Tekan Enter)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={handleOpenSearch}
            onKeyDown={e => { if (e.key === "Enter") triggerSearch(searchQuery); }}
            className="flex-1 bg-transparent text-[14px] font-medium text-white placeholder:text-white/70 outline-none border-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-white/50 hover:text-white cursor-pointer transition-colors border-none"><X size={13} /></button>
          )}
        </div>

        <div className={`absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-md shadow-2xl overflow-hidden z-[200] text-[#1A1A1A] origin-top transition-all duration-200 ease-out border-none ${searchOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 -translate-y-2 pointer-events-none"}`}>
          <div className="px-3 py-2 bg-[#4E342E] border-none">
            <span className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">Pencarian Cepat</span>
          </div>
          <ul className="max-h-[240px] overflow-y-auto py-1">
            {filteredSKUs.length > 0 ? (
              filteredSKUs.map(sku => (
                <li key={sku}>
                  <button onClick={() => triggerSearch(sku)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#EFEBE9] transition-colors group cursor-pointer border-none">
                    <Package size={14} className="text-[#888] group-hover:text-[#4E342E] shrink-0" />
                    <span className="text-[13px] font-bold text-[#1A1A1A] font-mono group-hover:text-[#4E342E]">{sku}</span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-4 text-center text-[13px] text-[#888] font-medium border-none">Tekan Enter untuk mencari &ldquo;{searchQuery}&rdquo;</li>
            )}
          </ul>
        </div>
      </div>

      <div className="relative z-10 flex-1" />

      <span className="relative z-10 hidden md:block text-[13px] text-white/80 font-bold select-none whitespace-nowrap">{dateStr}</span>

      <div ref={notifRef} className="relative z-10 ml-2">
        <button onClick={handleToggleNotif} className="relative p-2 rounded-md text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer border-none">
          <Bell size={20} strokeWidth={1.8} />
          {notifications.length > 0 && <span className="absolute top-1.5 right-2 w-2.5 h-2.5 rounded-full bg-red-500 border-none shadow-sm" />}
        </button>

        <div className={`absolute right-0 top-[calc(100%+16px)] w-[360px] bg-white rounded-xl shadow-2xl z-[200] text-[#1A1A1A] origin-top-right transition-all duration-300 ease-out border-none ${notifOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 -translate-y-4 pointer-events-none"}`}>
          <div className="flex items-center justify-between px-4 py-3 bg-[#4E342E] rounded-t-xl border-none">
            <span className="text-[12px] font-bold tracking-widest text-[#D4AF37] uppercase">Pusat Notifikasi</span>
            <button onClick={() => setNotifOpen(false)} className="text-[#D7CCC8] hover:text-white transition-colors cursor-pointer border-none"><X size={16} /></button>
          </div>

          <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto p-2 bg-[#FAFAF8] rounded-b-xl border-none">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div key={notif.id} className="bg-white rounded-lg p-3.5 shadow-md transition-colors cursor-default border-none">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-amber-100 p-1.5 rounded-md"><AlertTriangle size={14} className="text-amber-600" /></div>
                      <span className="text-[13px] font-bold text-[#1A1A1A]">Peringatan Stok</span>
                    </div>
                    <span className="text-[11px] font-medium text-[#888]">{notif.time}</span>
                  </div>
                  <p className="text-[13px] font-medium leading-relaxed mt-2 text-[#555]">
                    SKU <span className="font-bold font-mono text-[#1A1A1A]">{notif.sku}</span> tersisa <span className="font-bold text-red-500">{notif.qty} pcs</span> di rak {notif.rack}.
                  </p>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => handleDismissNotif(notif.id)} className="flex-1 bg-[#F0F0EC] hover:bg-[#E8E8E4] py-2 rounded-md text-[12px] font-bold text-[#555] transition-colors cursor-pointer border-none shadow-sm">Abaikan</button>
                    <button onClick={() => handleCheckInventory(notif.sku)} className="flex-1 bg-[#D4AF37] text-[#3E2723] hover:bg-[#C29B27] py-2 rounded-md text-[12px] font-bold transition-colors cursor-pointer border-none shadow-sm">Cek Inventaris</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-[13px] font-medium text-[#888] border-none">Tidak ada notifikasi baru.</div>
            )}
          </div>
        </div>
      </div>

      <div ref={profileRef} className="relative z-10 pl-5 ml-1">
        <button onClick={handleToggleProfile} className="flex items-center gap-3 p-1 pr-2 rounded-md hover:bg-white/20 transition-colors cursor-pointer border-none">
          <div className="w-9 h-9 rounded-md bg-[#3E2723] flex items-center justify-center shrink-0 border-none shadow-inner"><span className="text-[13px] font-bold text-[#D4AF37]">U1</span></div>
          <div className="hidden md:flex flex-col items-start leading-none">
            <span className="text-[13px] font-bold text-white">User 1</span>
            <span className="text-[11px] text-[#D7CCC8] font-medium mt-1">Operator</span>
          </div>
          <ChevronDown size={14} className={`hidden md:block text-white/70 transition-transform duration-200 ml-1 ${profileOpen ? "rotate-180" : ""}`} />
        </button>

        <div className={`absolute right-0 top-[calc(100%+12px)] w-[260px] bg-white rounded-lg shadow-2xl overflow-hidden z-[200] text-[#1A1A1A] origin-top-right transition-all duration-200 ease-out border-none ${profileOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 -translate-y-2 pointer-events-none"}`}>
          <div className={profileView === "main" ? "block" : "hidden"}>
            <div className="px-5 py-4 bg-[#4E342E] text-white border-none">
              <p className="text-[14px] font-bold text-[#D4AF37]">User 1</p>
              <p className="text-[12px] text-[#D7CCC8] mt-0.5">Operator · Odza Classic</p>
            </div>
            <ul className="py-2 bg-[#FAFAF8] border-none">
              <li>
                <button onClick={() => setProfileView("switch")} className="w-full flex items-center gap-3 px-5 py-3 text-left text-[13px] font-bold text-[#4E342E] hover:bg-[#EFEBE9] transition-colors cursor-pointer border-none"><RefreshCw size={16} className="text-[#888]" /> Ganti Akun</button>
              </li>
              <li>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-3 text-left text-[13px] font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer border-none"><LogOut size={16} className="text-red-500" /> Keluar</button>
              </li>
            </ul>
          </div>
          <div className={profileView === "switch" ? "block" : "hidden"}>
            <div className="flex items-center gap-3 px-4 py-3.5 bg-[#4E342E] text-white border-none">
              <button onClick={() => setProfileView("main")} className="p-1 rounded-md text-[#D7CCC8] hover:bg-white/20 hover:text-white transition-colors cursor-pointer border-none"><ArrowLeft size={16} strokeWidth={2.5} /></button>
              <span className="text-[14px] font-bold text-[#D4AF37]">Pilih Akun</span>
            </div>
            <div className="flex items-center justify-between px-5 py-4 bg-white hover:bg-[#EFEBE9] cursor-pointer transition-colors border-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-[#3E2723] flex items-center justify-center shrink-0 border-none shadow-inner"><span className="text-[13px] font-bold text-[#D4AF37]">U1</span></div>
                <div className="flex flex-col"><span className="text-[13px] font-bold text-[#4E342E]">User 1</span><span className="text-[11px] text-[#888] font-medium">Operator</span></div>
              </div>
              <Check size={18} strokeWidth={3} className="text-[#4E342E]" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}