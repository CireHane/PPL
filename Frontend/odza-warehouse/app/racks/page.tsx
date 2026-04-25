"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Search,
  ArrowUpDown,
  Eye,
  X,
  Package,
  ArrowRight,
  ChevronDown,
  Layers,
  BarChart2,
  ExternalLink,
  Inbox,
  Settings2,
  ImageIcon
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────
interface RackSku {
  skuCode: string;
  name: string;
  qty: number;
  image: string; 
  category: string;
}

interface Rack {
  id: string;
  location: string;   
  totalUniqueSku: number;
  totalStock: number;
  skus: RackSku[];
}

type SortOption = "default" | "most" | "least";

// ─── Dummy Data (Format A-1-1 s/d Z-5-3) ──────────────────────────────────
const DUMMY_RACKS: Rack[] = [
  {
    id: "rack-01",
    location: "A-1-1",
    totalUniqueSku: 2,
    totalStock: 105,
    skus: [
      { skuCode: "ZW24081-M", name: "Kemeja Batik Parang Espresso", qty: 47, image: "https://p16-oec-sg.ibyteimg.com/tos-alisg-i-aphluv4xwc-sg/2fb77797a53f44488c7fede03e5b9d2c~tplv-aphluv4xwc-origin-jpeg.jpeg", category: "Kemeja Pria" },
      { skuCode: "ZW24081-L", name: "Kemeja Batik Parang Espresso", qty: 58, image: "", category: "Kemeja Pria" },
    ],
  },
  {
    id: "rack-02",
    location: "A-1-2",
    totalUniqueSku: 1,
    totalStock: 32,
    skus: [
      { skuCode: "ZS241201B-L", name: "Dress Batik Kawung Gold", qty: 32, image: "", category: "Wanita" },
    ],
  },
  {
    id: "rack-03",
    location: "B-2-1",
    totalUniqueSku: 3,
    totalStock: 156,
    skus: [
      { skuCode: "ZB25012-XL", name: "Kemeja Batik Keris Hitam", qty: 71, image: "", category: "Kemeja Pria" },
      { skuCode: "ZB25012-L",  name: "Kemeja Batik Keris Hitam", qty: 50, image: "", category: "Kemeja Pria" },
      { skuCode: "ZB25012-M",  name: "Kemeja Batik Keris Hitam", qty: 35, image: "", category: "Kemeja Pria" },
    ],
  },
  {
    id: "rack-04",
    location: "B-3-3",
    totalUniqueSku: 2,
    totalStock: 65,
    skus: [
      { skuCode: "BW00021-M", name: "Kemeja Batik Mega Mendung", qty: 25, image: "", category: "Kemeja Pria" },
      { skuCode: "BW00021-L", name: "Kemeja Batik Mega Mendung", qty: 40, image: "", category: "Kemeja Pria" },
    ],
  },
  {
    id: "rack-05",
    location: "C-1-1",
    totalUniqueSku: 1,
    totalStock: 18,
    skus: [
      { skuCode: "ZW24081-XL", name: "Kemeja Batik Parang Espresso", qty: 18, image: "", category: "Kemeja Pria" },
    ],
  },
  {
    id: "rack-06",
    location: "Q-1-1",
    totalUniqueSku: 2,
    totalStock: 81,
    skus: [
      { skuCode: "BW00022-S", name: "Kemeja Batik Sogan", qty: 44, image: "", category: "Kemeja Pria" },
      { skuCode: "BW00022-M", name: "Kemeja Batik Sogan", qty: 37, image: "", category: "Kemeja Pria" },
    ],
  }
];

// ─── Sort Dropdown ──────────────────────────────────────────────────────────
const sortLabels: Record<SortOption, string> = {
  default: "Default (A–Z)",
  most: "Stok Terbanyak",
  least: "Stok Tersedikit",
};

function SortDropdown({ value, onChange }: { value: SortOption; onChange: (v: SortOption) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E8E8E4] rounded-md text-[13px] font-bold text-[#1A1A1A] hover:border-[#D7CCC8] hover:bg-[#FAFAF8] transition-colors cursor-pointer select-none shadow-sm"
      >
        <ArrowUpDown size={14} className="text-[#888]" />
        {sortLabels[value]}
        <ChevronDown size={13} className={`text-[#888] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] w-[200px] bg-white border border-[#E8E8E4] shadow-2xl rounded-md z-40 py-1 overflow-hidden">
          {(Object.keys(sortLabels) as SortOption[]).map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors cursor-pointer border-none ${
                value === opt
                  ? "font-bold text-[#4E342E] bg-[#EFEBE9]"
                  : "font-medium text-[#555] hover:bg-[#FAFAF8]"
              }`}
            >
              {sortLabels[opt]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function RacksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [racksData, setRacksData] = useState<Rack[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get('search') ?? "");
  const [sort, setSort] = useState<SortOption>("default");
  const [selectedRack, setSelectedRack] = useState<Rack | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // ── Simulate API fetch ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setRacksData(DUMMY_RACKS);
      setLoading(false);
    }, 420);
    return () => clearTimeout(timer);
  }, []);

  // ── Sync search dari URL & auto-open drawer jika ada exact match ──
  useEffect(() => {
    if (loading || racksData.length === 0) return;
    const q = searchParams.get('search') ?? '';
    if (!q) return;
    setSearch(q);
    // Jika query persis cocok dengan satu lokasi rak, langsung buka drawer-nya
    const exactMatch = racksData.find(
      r => r.location.toLowerCase() === q.toLowerCase()
    );
    if (exactMatch) {
      openDrawer(exactMatch);
    }
  // openDrawer sengaja tidak di-include agar tidak loop — fungsinya stabil via useCallback
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, racksData, searchParams]);

  // ── Drawer animation ──
  const openDrawer = useCallback((rack: Rack) => {
    setSelectedRack(rack);
    setDrawerOpen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setDrawerVisible(true));
    });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerVisible(false);
    setTimeout(() => {
      setDrawerOpen(false);
      setSelectedRack(null);
    }, 280);
  }, []);

  // ── Close drawer on outside click ──
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) closeDrawer();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [drawerOpen, closeDrawer]);

  // ── ESC to close ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeDrawer(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [closeDrawer]);

  // ── Filter + Sort ──
  const processed = racksData
    .filter(r => r.location.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "most") return b.totalStock - a.totalStock;
      if (sort === "least") return a.totalStock - b.totalStock;
      return a.location.localeCompare(b.location);
    });

  const totalRacks = racksData.length;
  const totalSkus = racksData.reduce((s, r) => s + r.totalUniqueSku, 0);
  const totalStock = racksData.reduce((s, r) => s + r.totalStock, 0);

  return (
    <>
      {/* ── Overlay ── */}
      {drawerOpen && (
        <div
          className={`fixed inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm z-40 transition-opacity duration-280 ${drawerVisible ? "opacity-100" : "opacity-0"}`}
          aria-hidden="true"
        />
      )}

      <div className="flex flex-col gap-6 animate-in fade-in duration-500">

        {/* ── HEADER ── */}
        <div className="flex flex-col gap-1.5">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[13px] font-bold text-[#888] mb-1">
            <Link href="/" className="hover:text-[#1A1A1A] transition-colors cursor-pointer">Home</Link>
            <ChevronRight size={14} />
            <span className="text-[#1A1A1A]">Racks</span>
          </nav>

          {/* Title + Pro Tip */}
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-[24px] font-black text-[#1A1A1A] tracking-tight">Manajemen Rak</h1>
              <p className="text-[14px] font-medium text-[#888] mt-0.5">Kelola dan pantau isi setiap rak gudang secara presisi.</p>
            </div>
            
            {/* Pro Tip box */}
            <div className="shrink-0 flex items-center gap-3 px-4 py-3 bg-[#EFEBE9] border border-[#D7CCC8] rounded-md text-[12px] font-medium text-[#4E342E] shadow-sm">
              <Settings2 size={14} className="text-[#D4AF37] shrink-0" />
              <span>
                <strong className="font-bold mr-1.5">Pintasan:</strong> Klik nama rak untuk melihat isi,{" "}
                <kbd className="px-1.5 py-0.5 bg-white border border-[#D7CCC8] rounded text-[11px] font-mono shadow-sm mx-1 cursor-pointer">Esc</kbd> untuk tutup panel.
              </span>
            </div>
          </div>
        </div>

        {/* ── SUMMARY STATS ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: <Layers size={18} className="text-[#4E342E]" />, value: totalRacks, label: "Total Rak Aktif", bg: "bg-[#EFEBE9] border-[#D7CCC8]" },
            { icon: <Package size={18} className="text-[#D4AF37]" />, value: totalSkus, label: "Total Jenis SKU", bg: "bg-[#FFF8E1] border-[#FFECB3]" },
            { icon: <BarChart2 size={18} className="text-emerald-700" />, value: totalStock.toLocaleString("id-ID"), label: "Total Stok Fisik (Pcs)", bg: "bg-emerald-50 border-emerald-200" },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-[#E8E8E4] rounded-md px-5 py-4 flex items-center gap-4 shadow-sm">
              <div className={`w-11 h-11 rounded-md border flex items-center justify-center shrink-0 ${s.bg}`}>{s.icon}</div>
              <div>
                <p className="text-[22px] font-black text-[#1A1A1A] leading-none">{s.value}</p>
                <p className="text-[12px] font-bold text-[#888] mt-1 uppercase tracking-wider">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── SEARCH & SORT ── */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-md border border-[#E8E8E4] shadow-sm">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#ABABAB] pointer-events-none" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama rak..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAFAF8] border border-[#E8E8E4] rounded-md text-[13px] text-[#1A1A1A] placeholder:text-[#ABABAB] font-medium focus:outline-none focus:border-[#D4AF37] focus:bg-white transition-colors cursor-text"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#ABABAB] hover:text-[#4E342E] transition-colors cursor-pointer">
                <X size={15} />
              </button>
            )}
          </div>
          <SortDropdown value={sort} onChange={setSort} />
        </div>

        {/* ── TABLE ── */}
        <div className="bg-white border border-[#E8E8E4] rounded-md overflow-hidden shadow-sm flex flex-col flex-1 min-h-0">

          {/* Table Head */}
          <div className="grid grid-cols-[2fr_1.5fr_1.5fr_140px] px-6 py-4 bg-[#FAFAF8] border-b border-[#E8E8E4]">
            {["NAMA RAK", "TOTAL JENIS SKU", "TOTAL STOK FISIK", "AKSI"].map(col => (
              <span key={col} className={`text-[11px] font-bold tracking-widest text-[#888] uppercase ${col === "AKSI" ? 'text-center' : ''}`}>{col}</span>
            ))}
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="divide-y divide-[#F7F7F5]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[2fr_1.5fr_1.5fr_140px] px-6 py-5 items-center animate-pulse">
                  <div className="h-5 bg-[#F0F0EC] rounded-md w-20" />
                  <div className="h-5 bg-[#F0F0EC] rounded-md w-16" />
                  <div className="h-5 bg-[#F0F0EC] rounded-md w-24" />
                  <div className="h-8 bg-[#F0F0EC] rounded-md w-28 mx-auto" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && processed.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-md bg-[#FAFAF8] border border-[#E8E8E4] flex items-center justify-center shadow-sm">
                <Inbox size={28} className="text-[#CDCDC9]" />
              </div>
              <div className="text-center">
                <p className="text-[15px] font-bold text-[#1A1A1A]">Tidak ada rak ditemukan</p>
                <p className="text-[13px] font-medium text-[#888] mt-1">
                  {search ? `Tidak ada nama rak yang cocok dengan "${search}"` : "Belum ada data rak tersedia."}
                </p>
              </div>
            </div>
          )}

          {/* Rows */}
          {!loading && processed.length > 0 && (
            <div className="divide-y divide-[#F0F0EC] overflow-y-auto flex-1">
              {processed.map(rack => (
                <div key={rack.id} className="grid grid-cols-[2fr_1.5fr_1.5fr_140px] px-6 py-4 items-center hover:bg-[#FAFAF8] transition-colors group cursor-default">
                  
                  {/* Nama Rak */}
                  <button
                    onClick={() => openDrawer(rack)}
                    className="font-mono text-[15px] font-bold text-[#1A1A1A] hover:text-[#D4AF37] transition-colors cursor-pointer w-fit text-left"
                  >
                    {rack.location}
                  </button>

                  {/* Total Jenis SKU */}
                  <span className="text-[15px] font-black text-[#1A1A1A]">
                    {rack.totalUniqueSku} <span className="text-[11px] font-bold text-[#888] ml-1">SKU</span>
                  </span>

                  {/* Total Stock */}
                  <span className="text-[15px] font-black text-[#1A1A1A]">
                    {rack.totalStock.toLocaleString("id-ID")} <span className="text-[11px] font-bold text-[#888] ml-1">Pcs</span>
                  </span>

                  {/* Aksi */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => openDrawer(rack)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#E8E8E4] rounded-md text-[12px] font-bold text-[#4E342E] hover:bg-[#EFEBE9] hover:border-[#D7CCC8] transition-colors cursor-pointer w-full shadow-sm"
                    >
                      <Eye size={13} /> Lihat Isi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer count */}
          {!loading && processed.length > 0 && (
            <div className="px-6 py-3.5 border-t border-[#F0F0EC] bg-[#FAFAF8] flex items-center justify-between shrink-0">
              <span className="text-[12px] font-bold text-[#888]">
                Menampilkan <span className="text-[#1A1A1A]">{processed.length}</span> rak
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          DRAWER — ISI RAK
      ══════════════════════════════════════════════════════════ */}
      {drawerOpen && (
        <div
          ref={drawerRef}
          className={`
            fixed top-0 right-0 h-full w-[420px] bg-white z-50 flex flex-col
            border-l border-[#E8E8E4] shadow-2xl
            transition-transform duration-280 ease-out
            ${drawerVisible ? "translate-x-0" : "translate-x-full"}
          `}
        >
          {selectedRack && (
            <>
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-[#E8E8E4] flex items-center justify-between bg-[#FAFAF8] shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-medium text-[#888]">Isi dari Rak:</span>
                  <span className="font-mono text-[18px] font-black text-[#D4AF37] bg-[#FFF8E1] px-2 py-0.5 rounded-md border border-[#FFECB3]">{selectedRack.location}</span>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-1.5 rounded-md hover:bg-[#E8E8E4] text-[#888] hover:text-[#1A1A1A] transition-colors cursor-pointer border-none"
                >
                  <X size={18} />
                </button>
              </div>

              {/* SKU Count Badge */}
              <div className="px-6 py-3.5 border-b border-[#F0F0EC] bg-white flex items-center justify-between shrink-0">
                <span className="text-[12px] font-bold text-[#888] uppercase tracking-wider">Daftar SKU</span>
                <span className="text-[12px] font-bold text-[#4E342E] bg-[#EFEBE9] border border-[#D7CCC8] px-3 py-1 rounded-md">
                  {selectedRack.skus.length} Jenis SKU
                </span>
              </div>

              {/* SKU List */}
              <div className="flex-1 overflow-y-auto bg-[#FAFAF8] p-4 flex flex-col gap-3">
                {selectedRack.skus.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-12 h-12 rounded-md bg-white border border-[#E8E8E4] flex items-center justify-center shadow-sm">
                      <Inbox size={22} className="text-[#CDCDC9]" />
                    </div>
                    <p className="text-[13px] font-bold text-[#888]">Rak ini kosong</p>
                  </div>
                ) : (
                  selectedRack.skus.map((sku, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-md border border-[#E8E8E4] shadow-sm flex items-center gap-4 hover:border-[#D4AF37] transition-all cursor-default group"
                    >
                      <div className={`w-12 h-12 rounded-md border flex items-center justify-center shrink-0 ${sku.image ? 'bg-white border-[#E8E8E4] overflow-hidden' : 'bg-[#F7F7F5] border-transparent'}`}>
                        {sku.image ? <img src={sku.image} alt="SKU" className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-[#CDCDC9]" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-[14px] font-black text-[#1A1A1A] truncate">{sku.skuCode}</p>
                        <p className="text-[12px] font-medium text-[#888] truncate mt-0.5">{sku.name}</p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-[11px] font-bold text-[#4E342E] bg-[#EFEBE9] px-2 py-0.5 rounded-md border border-[#D7CCC8]">
                            {sku.qty.toLocaleString("id-ID")} Pcs
                          </span>
                        </div>
                      </div>

                      {/* Tombol Cek Inventory */}
                      <button
                        onClick={() => router.push(`/inventory?search=${encodeURIComponent(sku.skuCode)}`)}
                        title="Cek di Inventori"
                        className="shrink-0 p-2.5 text-[#888] bg-[#FAFAF8] border border-[#E8E8E4] rounded-md hover:border-[#D7CCC8] hover:bg-[#EFEBE9] hover:text-[#4E342E] transition-colors cursor-pointer opacity-0 group-hover:opacity-100 shadow-sm"
                      >
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}