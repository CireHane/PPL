"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, RotateCcw, X, AlertTriangle, ChevronRight, 
  ChevronLeft, MoreHorizontal
} from 'lucide-react';

// ─── TYPES ───
interface Transaction {
  id: string;
  timestamp: string;
  sku: string;
  rack: string;
  qty: number;
  action: 'Inbound' | 'Outbound' | 'Return' | 'Reject' | 'Adjustment';
  operator: string;
  description: string;
  isReverted: boolean;
}

// ─── DUMMY DATA GENERATOR (65 Data untuk test Pagination) ───
const actions: Transaction['action'][] = ['Inbound', 'Outbound', 'Return', 'Reject', 'Adjustment'];
const racks = ['A-12-03', 'B-08-15', 'C-05-22', 'D-11-19', 'Q-1-1'];

const initialTransactions: Transaction[] = Array.from({ length: 65 }).map((_, i) => {
  const day = 20 - Math.floor(i / 15); // Tanggal berkurang setiap 15 item
  const hour = 16 - (i % 10);
  const min = 59 - (i % 59);
  const isOut = i % 2 !== 0 || i % 5 === 0; // Logika agar qty ada yang minus
  
  return {
    id: `${i + 1}`,
    timestamp: `${day} Apr 2026, ${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:05`,
    sku: `SKU-${1000 + i}-BLK`,
    rack: racks[i % racks.length],
    qty: isOut ? -(Math.floor(Math.random() * 10) + 1) : Math.floor(Math.random() * 20) + 5,
    action: actions[i % actions.length],
    operator: `User ${1 + (i % 5)}`, // Konsisten User 1 - User 5
    description: i % 7 === 0 ? 'Discrepancy / Cacat' : 'System Default',
    isReverted: i === 5 || i === 12,
  };
});

const ITEMS_PER_PAGE = 20;

export default function AuditTrailPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('All');
  const [sortTime, setSortTime] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [localTransactions, setLocalTransactions] = useState(initialTransactions);

  // ─── LOGIKA SEARCH, FILTER, SORT ───
  const processedTransactions = useMemo(() => {
    // 1. Search Logic
    let result = localTransactions.filter(t => {
      const q = searchQuery.toLowerCase();
      return (
        t.sku.toLowerCase().includes(q) ||
        t.operator.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.rack.toLowerCase().includes(q)
      );
    });

    // 2. Filter Logic (Action)
    if (filterAction !== 'All') {
      result = result.filter(t => t.action === filterAction);
    }

    // 3. Sort Logic (Time)
    result.sort((a, b) => {
      const timeA = new Date(a.timestamp.replace(',', '')).getTime();
      const timeB = new Date(b.timestamp.replace(',', '')).getTime();
      return sortTime === 'oldest' ? timeA - timeB : timeB - timeA; 
    });

    return result;
  }, [localTransactions, searchQuery, filterAction, sortTime]);

  // Reset ke halaman 1 jika user melakukan pencarian atau filter
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, filterAction, sortTime]);

  // ─── LOGIKA PAGINATION ───
  const totalPages = Math.ceil(processedTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTransactions = processedTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // ─── ACTION HANDLERS ───
  const handleRevertClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleConfirmRevert = () => {
    if (selectedTransaction) {
      setLocalTransactions(prev =>
        prev.map(t =>
          t.id === selectedTransaction.id ? { ...t, isReverted: true, description: `${t.description} (Reverted)` } : t
        )
      );
    }
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  const getActionBadgeClass = (action: Transaction['action']) => {
    switch (action) {
      case 'Inbound': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Outbound': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Return': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Reject': return 'bg-red-50 text-red-700 border-red-200';
      case 'Adjustment': return 'bg-[#F0F0EC] text-[#555] border-[#CDCDC9]';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      
      {/* ── BREADCRUMB + TITLE ── */}
      <div className="shrink-0 mb-6">
        <div className="flex flex-col gap-1.5">
          <nav className="flex items-center gap-1.5 text-[13px] font-bold text-[#888] mb-1">
            <Link href="/" className="hover:text-[#1A1A1A] transition-colors">Home</Link>
            <ChevronRight size={14} />
            <span className="text-[#1A1A1A]">Audit Trail</span>
          </nav>
          <div>
            <h1 className="text-[24px] font-black text-[#1A1A1A] tracking-tight mb-1">Audit Trail</h1>
            <p className="text-[14px] text-[#888] font-medium">View and manage historical system activities and transactions.</p>
          </div>
        </div>
      </div>

      {/* ── SEARCH + DUAL SORT BAR ── */}
      <div className="shrink-0 flex items-center justify-between gap-4 mb-6 bg-white p-3 rounded-2xl border border-[#E8E8E4] shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#ABABAB]" strokeWidth={2.5} />
          <input
            type="text"
            placeholder="Search SKU, Rack, Operator, or Reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-[#FAFAF8] border border-[#E8E8E4] rounded-xl text-[14px] font-medium text-[#1A1A1A] focus:outline-none focus:border-[#CDCDC9] focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ABABAB] hover:text-[#555] transition-colors">
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Dropdown 1: Filter by Action */}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="appearance-none px-4 py-2 bg-[#FAFAF8] border border-[#E8E8E4] rounded-xl text-[13px] font-bold text-[#555] cursor-pointer hover:bg-[#F0F0EC] outline-none min-w-[150px]"
          >
            <option value="All">All Actions</option>
            <option value="Inbound">Inbound</option>
            <option value="Outbound">Outbound</option>
            <option value="Return">Return</option>
            <option value="Reject">Reject</option>
            <option value="Adjustment">Adjustment</option>
          </select>

          {/* Dropdown 2: Sort by Time */}
          <select
            value={sortTime}
            onChange={(e) => setSortTime(e.target.value)}
            className="appearance-none px-4 py-2 bg-[#FAFAF8] border border-[#E8E8E4] rounded-xl text-[13px] font-bold text-[#555] cursor-pointer hover:bg-[#F0F0EC] outline-none min-w-[150px]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-2xl border border-[#E8E8E4] shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden relative mb-1">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-20 bg-[#FAFAF8] shadow-[0_1px_0_0_#E8E8E4]">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#888] uppercase whitespace-nowrap">TIMESTAMP</th>
                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#888] uppercase">SKU</th>
                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#888] uppercase">RACK</th>
                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#888] uppercase text-center">QTY</th>
                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#888] uppercase">ACTION</th>
                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#888] uppercase">OPERATOR</th>
                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#888] uppercase">DESCRIPTION</th>
                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#888] uppercase text-right">REVERT</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F0F0EC]">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center">
                    <p className="text-[15px] font-bold text-[#888]">No transactions found</p>
                    <p className="text-[13px] text-[#ABABAB] mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((t) => (
                  <tr key={t.id} className={`hover:bg-[#FAFAF8] transition-colors group ${t.isReverted ? 'opacity-50 grayscale-[50%]' : ''}`}>
                    <td className="px-6 py-3.5 text-[13px] font-medium text-[#555] whitespace-nowrap">
                      {t.timestamp}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`text-[14px] font-bold font-mono ${t.isReverted ? 'line-through text-[#888]' : 'text-blue-600'}`}>
                        {t.sku}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-[13px] font-bold text-[#1A1A1A] bg-[#F0F0EC] px-2.5 py-1 rounded-md border border-[#E8E8E4] font-mono whitespace-nowrap">
                        {t.rack}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`text-[15px] font-black ${t.qty > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {t.qty > 0 ? '+' : ''}{t.qty}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold border whitespace-nowrap ${getActionBadgeClass(t.action)}`}>
                        {t.action}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-[13px] font-bold text-[#1A1A1A] whitespace-nowrap">
                      {t.operator}
                    </td>
                    <td className="px-6 py-3.5 text-[13px] text-[#555] max-w-[200px] truncate" title={t.description}>
                      <span className={t.description.includes('System Default') ? 'italic text-[#ABABAB]' : ''}>
                        {t.description}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {t.isReverted ? (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-[12px] font-bold bg-[#E8E8E4] text-[#888] cursor-not-allowed">
                          Reverted
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRevertClick(t)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#CDCDC9] rounded-lg text-[12px] font-bold text-[#555] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm bg-white shrink-0"
                        >
                          <RotateCcw size={14} /> Revert
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION FOOTER ── */}
        <div className="shrink-0 px-6 py-4 border-t border-[#F0F0EC] bg-[#FAFAF8] flex items-center justify-between">
          <p className="text-[13px] font-medium text-[#888]">
            Showing <span className="font-bold text-[#1A1A1A]">{processedTransactions.length === 0 ? 0 : startIndex + 1}</span> to{' '}
            <span className="font-bold text-[#1A1A1A]">{Math.min(startIndex + ITEMS_PER_PAGE, processedTransactions.length)}</span> of{' '}
            <span className="font-bold text-[#1A1A1A]">{processedTransactions.length}</span> entries
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-[13px] font-bold text-[#555] border border-[#E8E8E4] rounded-lg bg-white hover:bg-[#F0F0EC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <ChevronLeft size={14} /> Prev
              </button>

              <div className="flex items-center gap-1 px-2">
                {/* Logika Simple Render Angka Halaman (Max 3 tombol) */}
                {Array.from({ length: Math.min(3, totalPages) }).map((_, idx) => {
                  let pageNum = idx + 1;
                  // Jika di halaman tengah/akhir, geser angkanya
                  if (currentPage > 2 && totalPages > 3) {
                    pageNum = currentPage === totalPages ? totalPages - 2 + idx : currentPage - 1 + idx;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-bold transition-colors shadow-sm
                        ${currentPage === pageNum 
                          ? 'bg-[#1A1A1A] text-white border border-[#1A1A1A]' 
                          : 'bg-white text-[#555] border border-[#E8E8E4] hover:bg-[#F0F0EC]'
                        }
                      `}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 3 && currentPage < totalPages - 1 && (
                  <span className="flex items-center justify-center w-8 h-8 text-[#ABABAB]"><MoreHorizontal size={16} /></span>
                )}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-[13px] font-bold text-[#555] border border-[#E8E8E4] rounded-lg bg-white hover:bg-[#F0F0EC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── REVERT CONFIRMATION MODAL ── */}
      {isModalOpen && selectedTransaction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-[18px] font-black text-[#1A1A1A] mb-2">Revert Transaction</h3>
            <p className="text-[14px] font-medium text-[#555] mb-8 leading-relaxed">
              Are you sure you want to undo this <span className="font-bold text-[#1A1A1A]">{selectedTransaction.action}</span> for SKU <span className="font-bold text-blue-600 font-mono">{selectedTransaction.sku}</span>? 
              <br/>This will automatically adjust the stock backwards.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-[14px] font-bold text-[#555] border border-[#E8E8E4] bg-white hover:bg-[#F0F0EC] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmRevert}
                className="flex-1 px-4 py-2.5 rounded-xl text-[14px] font-bold transition-colors shadow-md bg-red-600 hover:bg-red-700 text-white"
              >
                Yes, Revert It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}