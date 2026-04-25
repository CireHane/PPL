"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, X, ChevronRight, ChevronLeft, MoreHorizontal,
} from 'lucide-react';
import { logs } from '@/lib/firebase';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

// ─── TYPES ───
interface Transaction {
  id: string;
  timestamp: string;
  sku: string;
  rack: string;
  rackTotal: number;
  qty: number;
  action: 'Inbound' | 'Outbound' | 'Return' | 'Reject' | 'Adjustment';
  operator: string;
  description: string;
  isReverted: boolean;
  channel: string;
  orderNumber: string;
  resi: string;
}

// ─── CONSTANTS ───
const ITEMS_PER_PAGE = 20;
const LOW_STOCK_THRESHOLD = 20;

// ─── DUMMY DATA ───
const actionsList: Transaction['action'][] = ['Inbound', 'Outbound', 'Return', 'Reject', 'Adjustment'];
const racksList = ['A-12-03', 'B-08-15', 'C-05-22', 'D-11-19', 'Q-1-1'];
const channels = ['Tokopedia', 'Shopee', 'Lazada', 'TikTok Shop', 'WhatsApp'];

const generateOrderNumber = (i: number) => `ORD-2026-${String(10000 + i).padStart(5, '0')}`;
const generateResi = (channel: string, i: number) => {
  const prefixes: Record<string, string> = {
    Tokopedia: 'TKP', Shopee: 'SPE', Lazada: 'LZD', 'TikTok Shop': 'TTK', WhatsApp: 'WA',
  };
  return `${prefixes[channel] ?? 'RSI'}${String(20000 + i).padStart(8, '0')}`;
};

const initialTransactions: Transaction[] = Array.from({ length: 65 }).map((_, i) => {
  const day = 20 - Math.floor(i / 15);
  const hour = 16 - (i % 10);
  const min = 59 - (i % 59);
  const isOut = i % 2 !== 0 || i % 5 === 0;
  const action = actionsList[i % actionsList.length];
  const needsChannel = action === 'Outbound' || action === 'Return' || action === 'Reject';
  const channel = needsChannel ? channels[i % channels.length] : '';
  const orderNumber = needsChannel ? generateOrderNumber(i) : '';
  const resi = needsChannel ? generateResi(channel, i) : '';

  return {
    id: `${i + 1}`,
    timestamp: `${day} Apr 2026, ${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:05`,
    sku: `ZSB${1100 + i}-XL`,
    rack: racksList[i % racksList.length],
    rackTotal: i % 8 === 0 ? 0 : Math.floor((i * 13 + 7) % 145) + 5,
    qty: isOut ? -(((i * 7 + 3) % 10) + 1) : ((i * 11 + 5) % 20) + 5,
    action,
    operator: `User ${1 + (i % 5)}`,
    description: i % 7 === 0 ? 'Discrepancy / Cacat' : 'System Default',
    isReverted: i === 5 || i === 12,
    channel,
    orderNumber,
    resi,
  };
});

// ─── HELPERS ───
function getActionBadgeClass(action: Transaction['action']) {
  switch (action) {
    case 'Inbound':    return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Outbound':   return 'bg-[#FFF8E1] text-[#F57F17] border-[#FFECB3]';
    case 'Return':     return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Reject':     return 'bg-red-50 text-red-700 border-red-200';
    case 'Adjustment': return 'bg-[#F0F0EC] text-[#555] border-[#CDCDC9]';
    default:           return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-[#FFF8E1] text-[#F57F17] rounded px-0.5 not-italic font-bold">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function EmptyCell() {
  return <span className="italic text-[#CDCDC9] text-[12px] select-none">—</span>;
}

// ─── MAIN PAGE ───
export default function AuditTrailPage() {
  const { isLoading } = useProtectedRoute();
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterAction, setFilterAction] = useState('All');
  const [sortTime, setSortTime]         = useState('newest');
  const [currentPage, setCurrentPage]   = useState(1);
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (isLoading) return;

    let isMounted = true;

    logs()
      .then((data) => {
        if (isMounted) {
          setLocalTransactions(data);
        }
      })
      .catch((error) => {
        console.error("Failed to load audit logs:", error);
      });

    return () => {
      isMounted = false;
    };
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  // ─── LOGIKA SEARCH, FILTER, SORT ───
  const processedTransactions = useMemo(() => {
    const src = localTransactions.length > 0 ? localTransactions : initialTransactions;
    let result = src.filter(t => {
      const q = searchQuery.toLowerCase();
      return (
        t.sku.toLowerCase().includes(q) ||
        t.operator.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.rack.toLowerCase().includes(q) ||
        t.channel.toLowerCase().includes(q) ||
        t.orderNumber.toLowerCase().includes(q) ||
        t.resi.toLowerCase().includes(q)
      );
    });

    if (filterAction !== 'All') {
      result = result.filter(t => t.action === filterAction);
    }

    result.sort((a, b) => {
      const tA = new Date(a.timestamp.replace(',', '')).getTime();
      const tB = new Date(b.timestamp.replace(',', '')).getTime();
      return sortTime === 'oldest' ? tA - tB : tB - tA;
    });

    return result;
  }, [localTransactions, searchQuery, filterAction, sortTime]);

  // Reset ke halaman 1 jika user melakukan pencarian atau filter
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, filterAction, sortTime]);

  const totalPages = Math.max(1, Math.ceil(processedTransactions.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated  = processedTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getPageNumbers = (current: number, total: number) => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, 4, '...', total];
    if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  return (
    <div className="flex flex-col h-full relative">

      {/* ── BREADCRUMB + JUDUL ── */}
      <div className="shrink-0 mb-6">
        <nav className="flex items-center gap-1.5 text-[13px] font-bold text-[#888] mb-2">
          <Link href="/" className="hover:text-[#4E342E] transition-colors cursor-pointer">Home</Link>
          <ChevronRight size={14} className="text-[#CDCDC9]" />
          <span className="text-[#1A1A1A]">Audit Trail</span>
        </nav>
        <h1 className="text-[24px] font-black text-[#1A1A1A] tracking-tight mb-0.5">Audit Trail</h1>
        <p className="text-[14px] text-[#888] font-medium">Riwayat lengkap aktivitas dan transaksi sistem gudang.</p>
      </div>

      {/* ── SEARCH + FILTER BAR ── */}
      <div className="shrink-0 flex items-center justify-between gap-4 mb-6 bg-white p-3 rounded-md border border-[#E8E8E4] shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#ABABAB]" strokeWidth={2.5} />
          <input
            type="text"
            placeholder="Cari SKU, Rak, Operator, No. Pesanan, Resi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-[#FAFAF8] border border-[#E8E8E4] rounded-md text-[13px] font-medium text-[#1A1A1A] placeholder:text-[#ABABAB] focus:outline-none focus:border-[#D7CCC8] focus:bg-white transition-colors cursor-text"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ABABAB] hover:text-[#555] transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {searchQuery && (
            <span className="text-[12px] font-bold text-[#888] bg-[#F0F0EC] px-3 py-1.5 rounded-md whitespace-nowrap">
              {processedTransactions.length} hasil
            </span>
          )}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="appearance-none px-4 py-2 bg-[#FAFAF8] border border-[#E8E8E4] rounded-md text-[13px] font-bold text-[#555] cursor-pointer hover:bg-[#F0F0EC] hover:border-[#D7CCC8] outline-none min-w-[150px] transition-colors"
          >
            <option value="All">Semua Aksi</option>
            <option value="Inbound">Inbound</option>
            <option value="Outbound">Outbound</option>
            <option value="Return">Return</option>
            <option value="Reject">Reject</option>
            <option value="Adjustment">Adjustment</option>
          </select>
          <select
            value={sortTime}
            onChange={(e) => setSortTime(e.target.value)}
            className="appearance-none px-4 py-2 bg-[#FAFAF8] border border-[#E8E8E4] rounded-md text-[13px] font-bold text-[#555] cursor-pointer hover:bg-[#F0F0EC] hover:border-[#D7CCC8] outline-none min-w-[140px] transition-colors"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
          </select>
        </div>
      </div>

      {/* ── TABEL ── */}
      <div className="bg-white rounded-md border border-[#E8E8E4] shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden relative mb-1">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse relative" style={{ minWidth: '1100px' }}>
            <thead className="sticky top-0 z-20 bg-[#FAFAF8] shadow-[0_1px_0_0_#E8E8E4]">
              <tr>
                <th className="px-5 py-4 text-[11px] font-black tracking-widest text-[#ABABAB] uppercase whitespace-nowrap">WAKTU</th>
                <th className="px-5 py-4 text-[11px] font-black tracking-widest text-[#ABABAB] uppercase">SKU</th>
                <th className="px-5 py-4 text-[11px] font-black tracking-widest text-[#ABABAB] uppercase whitespace-nowrap">LOKASI RAK</th>
                <th className="px-5 py-4 text-[11px] font-black tracking-widest text-[#ABABAB] uppercase whitespace-nowrap text-center">PERUBAHAN STOK</th>
                <th className="px-5 py-4 text-[11px] font-black tracking-widest text-[#ABABAB] uppercase">CHANNEL</th>
                <th className="px-5 py-4 text-[11px] font-black tracking-widest text-[#ABABAB] uppercase whitespace-nowrap">NO. PEMESANAN</th>
                <th className="px-5 py-4 text-[11px] font-black tracking-widest text-[#ABABAB] uppercase whitespace-nowrap">NO. RESI</th>
                <th className="px-5 py-4 text-[11px] font-black tracking-widest text-[#ABABAB] uppercase">AKSI</th>
                <th className="px-5 py-4 text-[11px] font-black tracking-widest text-[#ABABAB] uppercase">OPERATOR</th>
                <th className="px-5 py-4 text-[11px] font-black tracking-widest text-[#ABABAB] uppercase">KETERANGAN</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F0F0EC]">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-20 text-center">
                    <p className="text-[15px] font-bold text-[#888]">Tidak ada transaksi ditemukan</p>
                    <p className="text-[13px] text-[#ABABAB] mt-1">Coba ubah kata kunci pencarian atau filter.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((t) => {
                  const isRackMatch  = !!searchQuery && t.rack.toLowerCase().includes(searchQuery.toLowerCase());
                  const isOutOfStock = t.rackTotal === 0;
                  const isLowStock   = t.rackTotal > 0 && t.rackTotal <= LOW_STOCK_THRESHOLD;

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-[#FAFAF8] transition-colors ${t.isReverted ? 'opacity-50 grayscale-[50%]' : ''}`}
                    >
                      <td className="px-5 py-3.5 text-[12px] font-medium text-[#888] whitespace-nowrap">{t.timestamp}</td>

                      <td className="px-5 py-3.5">
                        <span className={`text-[13px] font-bold font-mono ${t.isReverted ? 'line-through text-[#888]' : 'text-blue-600'}`}>
                          <HighlightText text={t.sku} query={searchQuery} />
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold font-mono border whitespace-nowrap transition-colors
                          ${isRackMatch
                            ? 'bg-[#FFF8E1] border-[#FFECB3] text-[#F57F17] ring-1 ring-[#FFECB3]'
                            : 'bg-[#F0F0EC] border-[#CDCDC9] text-[#555]'
                          }`}
                        >
                          {t.rack}
                          <span className={`text-[11px] font-bold px-1 py-0.5 rounded-md
                            ${isRackMatch   ? 'text-[#F57F17]'
                            : isOutOfStock  ? 'text-red-500'
                            : isLowStock    ? 'text-amber-600'
                            : 'text-[#ABABAB]'}`}
                          >
                            {t.rackTotal}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span className={`text-[15px] font-black ${t.qty > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {t.qty > 0 ? '+' : ''}{t.qty}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        {t.channel
                          ? <span className="text-[12px] font-bold text-[#4E342E] bg-[#EFEBE9] border border-[#D7CCC8] px-2 py-0.5 rounded-md whitespace-nowrap">
                              <HighlightText text={t.channel} query={searchQuery} />
                            </span>
                          : <EmptyCell />
                        }
                      </td>

                      <td className="px-5 py-3.5 text-[12px] font-mono font-bold text-[#555] whitespace-nowrap">
                        {t.orderNumber ? <HighlightText text={t.orderNumber} query={searchQuery} /> : <EmptyCell />}
                      </td>

                      <td className="px-5 py-3.5 text-[12px] font-mono font-bold text-[#555] whitespace-nowrap">
                        {t.resi ? <HighlightText text={t.resi} query={searchQuery} /> : <EmptyCell />}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border whitespace-nowrap ${getActionBadgeClass(t.action)}`}>
                          {t.action}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-[13px] font-bold text-[#1A1A1A] whitespace-nowrap">
                        <HighlightText text={t.operator} query={searchQuery} />
                      </td>

                      <td className="px-5 py-3.5 text-[13px] text-[#555] max-w-[180px] truncate" title={t.description}>
                        <span className={t.description === 'System Default' ? 'italic text-[#ABABAB]' : ''}>
                          <HighlightText text={t.description} query={searchQuery} />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION FOOTER ── */}
        <div className="shrink-0 px-6 py-4 border-t border-[#F0F0EC] bg-[#FAFAF8] flex items-center justify-between">
          <p className="text-[13px] font-medium text-[#888]">
            Menampilkan{' '}
            <span className="font-bold text-[#1A1A1A]">{processedTransactions.length === 0 ? 0 : startIndex + 1}</span>
            {' '}–{' '}
            <span className="font-bold text-[#1A1A1A]">{Math.min(startIndex + ITEMS_PER_PAGE, processedTransactions.length)}</span>
            {' '}dari{' '}
            <span className="font-bold text-[#1A1A1A]">{processedTransactions.length}</span> entri
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-[13px] font-bold text-[#555] border border-[#E8E8E4] rounded-md bg-white hover:bg-[#F0F0EC] hover:border-[#D7CCC8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
              >
                <ChevronLeft size={14} /> Sebelumnya
              </button>

              <div className="flex items-center gap-1 px-2">
                {getPageNumbers(currentPage, totalPages).map((page, idx) => {
                  if (page === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className="flex items-center justify-center w-8 h-8 text-[#ABABAB]">
                        <MoreHorizontal size={16} />
                      </span>
                    );
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page as number)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md text-[13px] font-bold transition-colors shadow-sm cursor-pointer
                        ${currentPage === page
                          ? 'bg-[#4E342E] text-white border border-[#4E342E]'
                          : 'bg-white text-[#555] border border-[#E8E8E4] hover:bg-[#F0F0EC] hover:border-[#D7CCC8]'
                        }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-[13px] font-bold text-[#555] border border-[#E8E8E4] rounded-md bg-white hover:bg-[#F0F0EC] hover:border-[#D7CCC8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
              >
                Selanjutnya <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}