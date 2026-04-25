"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Trash2, 
  Lock,
  Undo2,
  Redo2,
  PackageCheck,
  Minus,
  Plus,
  Loader2,
  CheckCircle2,
  Settings2
} from "lucide-react";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";

interface ReturnItem {
  id: string;
  channel: string;
  invoice: string;
  sku: string;
  qty: number | string;
  reason: string;
  status: "none" | "return" | "reject";
  rack: string;
}

export default function ReturnRejectPage() {
  const { isLoading } = useProtectedRoute();
  const [lastSaved, setLastSaved] = useState<string>("Baru saja");

  // ─── STATE TABEL (Top-Scan Workflow) ───
  const [activeInput, setActiveInput] = useState<ReturnItem>({ 
    id: "active-row", channel: "", invoice: "", sku: "", qty: 1, status: "none", reason: "", rack: "" 
  });
  const [scannedItems, setScannedItems] = useState<ReturnItem[]>([]);

  // ─── STATE GMAIL-STYLE UNDO TOAST ───
  const [toast, setToast] = useState<{ visible: boolean; type: 'saving' | 'success'; backupData: ReturnItem[] | null }>({
    visible: false, type: 'saving', backupData: null
  });

  const channelInputRef = useRef<HTMLInputElement>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const skuInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const statusInputRef = useRef<HTMLSelectElement>(null);
  const reasonInputRef = useRef<HTMLInputElement>(null);
  const rackInputRef = useRef<HTMLInputElement>(null);

  // ─── STATE UNDO & REDO (MANUAL) ───
  const [past, setPast] = useState<ReturnItem[][]>([]);
  const [future, setFuture] = useState<ReturnItem[][]>([]);

  const updateItemsWithHistory = useCallback((newItems: ReturnItem[]) => {
    setPast(prev => [...prev, scannedItems]);
    setScannedItems(newItems);
    setFuture([]); 
  }, [scannedItems]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast(prev => prev.slice(0, -1));
    setFuture(prev => [scannedItems, ...prev]);
    setScannedItems(previous);
  }, [past, scannedItems]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture(prev => prev.slice(1));
    setPast(prev => [...prev, scannedItems]);
    setScannedItems(next);
  }, [future, scannedItems]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const now = new Date();
      setLastSaved(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearTimeout(timer);
  }, [scannedItems]);

  // Global Shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.code === 'KeyS') {
        e.preventDefault();
        channelInputRef.current?.focus();
      } 
      else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo(); 
      } 
      else if (e.code === 'Escape') {
        (document.activeElement as HTMLElement)?.blur();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [undo, redo]);

  // ─── QTY Handlers ───
  const handleQtyInput = (value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ''));
    setActiveInput(prev => ({ ...prev, qty: isNaN(num) ? "" : num }));
  };

  const handleQtyStepper = (currentQty: number | string, operation: 'add' | 'sub') => {
    let num = Number(currentQty) || 1;
    if (operation === 'add') num += 1;
    if (operation === 'sub') num = Math.max(1, num - 1);
    setActiveInput(prev => ({ ...prev, qty: num }));
  };

  // ─── LOGIKA OTOMATIS R-KARANTINA ───
  useEffect(() => {
    if (activeInput.status === "reject") {
      setActiveInput(prev => ({ ...prev, rack: "R-KARANTINA" }));
    } else if (activeInput.status === "return" && activeInput.rack === "R-KARANTINA") {
      setActiveInput(prev => ({ ...prev, rack: "" }));
    }
  }, [activeInput.status]);

  // ─── LOGIKA ENTER & TOP-SCAN ───
  const submitToHistory = () => {
    const newItem: ReturnItem = { ...activeInput, id: Date.now().toString() };
    updateItemsWithHistory([newItem, ...scannedItems]);
    
    // Reset baris input atas
    setActiveInput({ id: "active-row", channel: "", invoice: "", sku: "", qty: 1, status: "none", reason: "", rack: "" });
    setTimeout(() => channelInputRef.current?.focus(), 50);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLElement>, field: keyof ReturnItem) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "channel" && activeInput.channel) invoiceInputRef.current?.focus();
      else if (field === "invoice" && activeInput.invoice) skuInputRef.current?.focus();
      else if (field === "sku" && activeInput.sku) statusInputRef.current?.focus(); // Langsung ke Action, asumsi QTY 1
      else if (field === "qty") statusInputRef.current?.focus();
      else if (field === "status" && activeInput.status !== "none") reasonInputRef.current?.focus();
      else if (field === "reason") {
        if (activeInput.status === "reject") {
          // Reject otomatis Rak ke-isi R-KARANTINA, jadi langsung simpan
          submitToHistory(); 
        } else {
          // Kalau Return, wajib isi Rak
          rackInputRef.current?.focus();
        }
      }
      else if (field === "rack" && activeInput.rack) {
        submitToHistory();
      }
    }
  };

  const deleteItem = (id: string) => {
    updateItemsWithHistory(scannedItems.filter(item => item.id !== id));
  };

  // ─── TOAST NOTIFICATION ───
  const handleProcess = () => {
    if (scannedItems.length === 0) return;
    const currentData = [...scannedItems];
    
    setScannedItems([]); 
    setActiveInput({ id: "active-row", channel: "", invoice: "", sku: "", qty: 1, status: "none", reason: "", rack: "" });
    
    setToast({ visible: true, type: 'saving', backupData: currentData });
    const timer = setTimeout(() => {
      setToast(prev => prev.visible ? { ...prev, type: 'success' } : prev);
      setTimeout(() => setToast({ visible: false, type: 'saving', backupData: null }), 2500);
    }, 5000);
    (window as any).undoReturnTimer = timer;
  };

  const handleUndoProcess = () => {
    clearTimeout((window as any).undoReturnTimer);
    if (toast.backupData) {
      setScannedItems(toast.backupData);
      setTimeout(() => channelInputRef.current?.focus(), 100);
    }
    setToast({ visible: false, type: 'saving', backupData: null });
  };

  const totalItems = scannedItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  
  if (isLoading) return null;

  return (
    <div className="flex flex-col gap-5 h-full relative animate-in fade-in duration-500">
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between shrink-0">
        <div className="flex flex-col gap-1.5">
          <nav className="flex items-center gap-1.5 text-[13px] font-bold text-[#888]">
            <Link href="/" className="hover:text-[#1A1A1A] transition-colors cursor-pointer">Home</Link>
            <ChevronRight size={14} />
            <span className="text-[#1A1A1A]">Return & Reject</span>
          </nav>
          <div className="flex items-center gap-4">
            <h1 className="text-[24px] font-black text-[#1A1A1A] tracking-tight">Proses Return & Reject</h1>
            <div className="flex items-center bg-white border border-[#E8E8E4] p-0.5 rounded-md shadow-sm ml-2">
              <button onClick={undo} disabled={past.length === 0} className="p-1.5 px-2 rounded-sm text-[#555] hover:bg-[#F0F0EC] hover:text-[#1A1A1A] disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"><Undo2 size={16} strokeWidth={2.5} /></button>
              <div className="w-[1px] h-4 bg-[#E8E8E4]"></div>
              <button onClick={redo} disabled={future.length === 0} className="p-1.5 px-2 rounded-sm text-[#555] hover:bg-[#F0F0EC] hover:text-[#1A1A1A] disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"><Redo2 size={16} strokeWidth={2.5} /></button>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-3 px-4 py-3 bg-[#EFEBE9] border border-[#D7CCC8] rounded-md text-[12px] font-medium text-[#4E342E] shadow-sm mt-2">
          <Settings2 size={14} className="text-[#D4AF37] shrink-0" strokeWidth={2.5} />
          <span>
            <strong className="font-bold mr-1.5">Pintasan:</strong>
            Tekan <kbd className="bg-white border border-[#D7CCC8] px-1.5 py-[2px] rounded text-[11px] font-bold cursor-pointer shadow-sm mx-1">Alt + S</kbd> untuk fokus ke baris scan.
          </span>
        </div>
      </div>

      {/* ── MAIN CONTENT (TABLE AREA) ── */}
      <div className="bg-white rounded-md border border-[#E8E8E4] shadow-sm flex flex-col overflow-hidden mb-1 flex-1 min-h-0 mt-2">
        <div className="shrink-0">
          <div className="bg-[#FAFAF8] px-8 py-5 flex items-center justify-between border-b border-[#E8E8E4]">
            <h2 className="text-[16px] font-bold text-[#1A1A1A]">Daftar Scan Sesi Ini</h2>
            <div className="bg-[#EFEBE9] text-[#4E342E] border border-[#D7CCC8] px-4 py-1.5 rounded-full text-[13px] font-bold">{totalItems} Pcs</div>
          </div>

          <div className="grid grid-cols-[1.2fr_1.5fr_1.5fr_100px_120px_2fr_1fr_40px] gap-4 px-8 py-4 bg-white border-b border-[#F0F0EC] shadow-[0_4px_10px_-10px_rgba(0,0,0,0.1)] z-10 relative">
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">Channel</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">No. Pemesanan</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">SKU Barang</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase text-center">QTY</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase text-center">Aksi</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">Penjelasan</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">Rak</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase text-right"></span>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-[#F7F7F5] overflow-y-auto flex-1 min-h-[250px] p-2">
          
          {/* ── BARIS INPUT AKTIF (DI ATAS) ── */}
          <div className="grid grid-cols-[1.2fr_1.5fr_1.5fr_100px_120px_2fr_1fr_40px] gap-4 px-6 py-3 items-center bg-[#F5F2F0] rounded-md border border-[#E8E5E1] mb-2 shadow-sm">
            <input 
              ref={channelInputRef} type="text" value={activeInput.channel} 
              onChange={(e) => setActiveInput({...activeInput, channel: e.target.value.toUpperCase()})} 
              onKeyDown={(e) => handleKey(e, "channel")} 
              placeholder="Channel..." 
              className="w-full bg-white px-3 py-2.5 border border-[#D7CCC8] rounded-md text-[13px] font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all cursor-text"
            />
            <input 
              ref={invoiceInputRef} type="text" value={activeInput.invoice} 
              onChange={(e) => setActiveInput({...activeInput, invoice: e.target.value.toUpperCase()})} 
              onKeyDown={(e) => handleKey(e, "invoice")} disabled={!activeInput.channel}
              placeholder="No. Pemesanan..." 
              className={`w-full bg-white px-3 py-2.5 border border-[#D7CCC8] rounded-md text-[13px] font-bold font-mono outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all cursor-text ${!activeInput.channel && 'opacity-50'}`}
            />
            <input 
              ref={skuInputRef} type="text" value={activeInput.sku} 
              onChange={(e) => setActiveInput({...activeInput, sku: e.target.value.toUpperCase()})} 
              onKeyDown={(e) => handleKey(e, "sku")} disabled={!activeInput.invoice}
              placeholder="SKU Barang..." 
              className={`w-full bg-white px-3 py-2.5 border border-[#D7CCC8] rounded-md text-[13px] font-bold font-mono outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all cursor-text ${!activeInput.invoice && 'opacity-50'}`}
            />
            
            {/* QTY STEPPER */}
            <div className={`flex items-center gap-1 bg-white border border-[#D7CCC8] p-1 rounded-md w-max mx-auto transition-opacity ${!activeInput.sku ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <button onClick={() => handleQtyStepper(activeInput.qty, 'sub')} className="w-6 h-6 flex items-center justify-center bg-[#F0F0EC] rounded-md hover:bg-[#E8E8E4] cursor-pointer"><Minus size={12} strokeWidth={3} /></button>
              <input ref={qtyInputRef} type="text" value={activeInput.qty} onChange={(e) => handleQtyInput(e.target.value)} onKeyDown={(e) => handleKey(e, "qty")} className="w-8 text-center bg-transparent text-[13px] font-black outline-none cursor-text" />
              <button onClick={() => handleQtyStepper(activeInput.qty, 'add')} className="w-6 h-6 flex items-center justify-center bg-[#888] text-white rounded-md hover:bg-[#555] cursor-pointer"><Plus size={12} strokeWidth={3} /></button>
            </div>

            <select
              ref={statusInputRef} value={activeInput.status}
              onChange={(e) => setActiveInput({...activeInput, status: e.target.value as any})}
              onKeyDown={(e) => handleKey(e as any, "status")}
              disabled={!activeInput.sku}
              className={`w-full text-[12px] font-bold px-2 py-3 rounded-md outline-none cursor-pointer text-center transition-colors border
                ${!activeInput.sku ? 'opacity-50 border-[#D7CCC8] bg-white' :
                  activeInput.status === 'return' ? 'bg-[#FFF8E1] text-[#F57F17] border-[#FFECB3]' : 
                  activeInput.status === 'reject' ? 'bg-rose-50 text-rose-700 border-rose-300' : 
                  'bg-white text-[#555] border-[#D7CCC8] focus:ring-2 focus:ring-[#D4AF37]/40'}
              `}
            >
              <option value="none">PILIH</option>
              <option value="return">RETURN</option>
              <option value="reject">REJECT</option>
            </select>

            <input 
              ref={reasonInputRef} type="text" value={activeInput.reason} 
              onChange={(e) => setActiveInput({...activeInput, reason: e.target.value})} 
              onKeyDown={(e) => handleKey(e, "reason")} disabled={activeInput.status === "none"}
              placeholder="Ketik penjelasan..." 
              className={`w-full bg-white px-3 py-2.5 border border-[#D7CCC8] rounded-md text-[13px] font-medium outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all cursor-text ${activeInput.status === "none" && 'opacity-50'}`}
            />

            <div className="relative">
              {activeInput.status === "reject" && <Lock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500" />}
              <input 
                ref={rackInputRef} type="text" value={activeInput.rack} 
                onChange={(e) => setActiveInput({...activeInput, rack: e.target.value.toUpperCase()})} 
                onKeyDown={(e) => handleKey(e, "rack")} 
                disabled={activeInput.status === "none" || activeInput.status === "reject"}
                placeholder="Rak..." 
                className={`w-full bg-white py-2.5 border border-[#D7CCC8] rounded-md text-[13px] font-bold font-mono outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all cursor-text 
                  ${activeInput.status === "none" ? 'opacity-50 pl-3' : activeInput.status === "reject" ? 'pl-8 bg-rose-50 text-rose-700 border-rose-200 shadow-inner' : 'pl-3 text-[#1A1A1A]'}
                `}
              />
            </div>
            <div></div>
          </div>

          {/* ── BARIS HISTORY (DI BAWAH) ── */}
          {scannedItems.map((item) => (
            <div key={item.id} className="group grid grid-cols-[1.2fr_1.5fr_1.5fr_100px_120px_2fr_1fr_40px] gap-4 px-6 py-3 items-center hover:bg-[#FAFAF8] transition-colors rounded-md">
              <span className="text-[13px] font-bold text-[#1A1A1A] pl-3">{item.channel}</span>
              <span className="text-[13px] font-bold font-mono text-[#555]">{item.invoice}</span>
              <span className="text-[13px] font-bold font-mono text-blue-600">{item.sku}</span>
              <div className="flex justify-center"><span className="text-[14px] font-black text-[#1A1A1A]">{item.qty} Pcs</span></div>
              
              <div className="flex justify-center">
                <span className={`text-[11px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider border ${item.status === 'return' ? 'bg-[#FFF8E1] text-[#F57F17] border-[#FFECB3]' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                  {item.status}
                </span>
              </div>
              
              <span className="text-[12px] font-medium text-[#555] italic truncate" title={item.reason}>{item.reason || "-"}</span>
              
              <div>
                <span className={`text-[12px] font-bold px-2.5 py-1.5 rounded-md font-mono border ${item.status === 'reject' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-[#EFEBE9] text-[#4E342E] border-[#D7CCC8]'}`}>
                  {item.rack}
                </span>
              </div>

              <div className="flex justify-end pr-2">
                <button onClick={() => deleteItem(item.id)} className="p-1.5 text-[#CDCDC9] hover:text-red-500 rounded-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
          {scannedItems.length === 0 && (
             <div className="py-12 text-center text-[#ABABAB] text-[14px] font-medium italic">Mulai catat barang retur/reject di baris atas.</div>
          )}
        </div>
      </div>

      {/* ── BOTTOM ACTIONS ── */}
      <div className="shrink-0 pt-3 pb-4 mt-auto flex justify-between items-center gap-4">
        <p className="text-[12px] font-medium text-[#888] bg-[#F0F0EC] px-4 py-2 rounded-md border border-[#E8E8E4] shadow-sm">Draft otomatis tersimpan pukul <span className="font-bold text-[#555] ml-1">{lastSaved}</span></p>
        <button 
          onClick={handleProcess}
          disabled={scannedItems.length === 0}
          className="flex items-center gap-2 bg-[#4E342E] hover:bg-[#3E2723] text-white px-8 py-4 rounded-md text-[15px] font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PackageCheck size={18} /> PROSES ITEM
        </button>
      </div>

      {/* ── GMAIL STYLE TOAST NOTIFICATION ── */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        {toast.type === 'saving' ? (
          <div className="bg-[#3E2723] text-white px-5 py-3 rounded-md shadow-2xl flex items-center gap-6 border border-[#2C221A]">
            <div className="flex items-center gap-3">
              <Loader2 size={16} className="animate-spin text-[#D4AF37]" />
              <span className="text-[14px] font-medium">Memproses {toast.backupData?.length} barang...</span>
            </div>
            <button onClick={handleUndoProcess} className="text-[#D4AF37] font-bold text-[14px] hover:brightness-125 transition-colors cursor-pointer uppercase tracking-wider">
              Batal (Undo)
            </button>
          </div>
        ) : (
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-md shadow-2xl flex items-center gap-3">
             <CheckCircle2 size={18} />
             <span className="text-[14px] font-bold">Data berhasil disimpan!</span>
          </div>
        )}
      </div>

    </div>
  );
}