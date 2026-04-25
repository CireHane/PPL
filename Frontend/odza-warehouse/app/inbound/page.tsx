"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle2,
  Lightbulb,
  Undo2,
  Redo2,
  Loader2,
  ArrowDownToLine,
  Edit2,
  PackageCheck,
  Save
} from "lucide-react";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { createSession, submitScan } from "@/lib/barcScanService";
import { inboundAdds } from "@/lib/firebase";

interface ScannedItem {
  id: string;
  sku: string;
  rack: string;
  qty: number;
}

export default function InboundPage() {
  const { isLoading } = useProtectedRoute();
  const [lastSaved, setLastSaved] = useState<string>("Baru saja");

  // ─── STATE WORKFLOW SURAT JALAN ───
  const [suratJalan, setSuratJalan] = useState("");
  const [isScanningMode, setIsScanningMode] = useState(false);

  // ─── STATE TABEL (Top-Scan Workflow) ───
  const [activeInput, setActiveInput] = useState<ScannedItem>({ id: "active-row", sku: "", rack: "", qty: 1 });
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);

  // ─── DERIVED: totalItems dihitung dari scannedItems ───
  const totalItems = scannedItems.reduce((sum, item) => sum + item.qty, 0);

  // ─── STATE GMAIL-STYLE UNDO TOAST ───
  const [toast, setToast] = useState<{ visible: boolean; type: 'saving' | 'success'; backupData: ScannedItem[] | null; backupSJ: string }>({
    visible: false, type: 'saving', backupData: null, backupSJ: ""
  });

  // ─── BARCODE SCANNING STATE ───
  const [sessionId, setSessionId] = useState<string>("");
  const [scanFeedback, setScanFeedback] = useState<{ type: "success" | "error"; message: string; field: "sku" | "rack" } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [autoSubmitTimers, setAutoSubmitTimers] = useState<{ [key: string]: NodeJS.Timeout }>({});

  const sjInputRef = useRef<HTMLInputElement>(null);
  const skuInputRef = useRef<HTMLInputElement>(null);
  const rackInputRef = useRef<HTMLInputElement>(null);

  // ─── STATE UNTUK UNDO & REDO (MANUAL) ───
  const [past, setPast] = useState<ScannedItem[][]>([]);
  const [future, setFuture] = useState<ScannedItem[][]>([]);

  const updateItemsWithHistory = useCallback((newItems: ScannedItem[]) => {
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

  // ─── HELPERS: QTY & DELETE ───
  const updateQtyButton = useCallback((id: string, delta: number) => {
    updateItemsWithHistory(
      scannedItems.map(item =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
      )
    );
  }, [scannedItems, updateItemsWithHistory]);

  const handleQtyManualInput = useCallback((id: string, value: string) => {
    const parsed = parseInt(value, 10);
    setScannedItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, qty: isNaN(parsed) ? 0 : parsed } : item
      )
    );
  }, []);

  const handleQtyBlur = useCallback((id: string) => {
    setScannedItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty || 1) } : item
      )
    );
  }, []);

  const deleteItem = useCallback((id: string) => {
    updateItemsWithHistory(scannedItems.filter(item => item.id !== id));
  }, [scannedItems, updateItemsWithHistory]);

  // ─── HANDLER: UNDO SAVE PROCESS ───
  const handleUndoProcess = useCallback(() => {
    if (!toast.backupData) return;
    setScannedItems(toast.backupData);
    setSuratJalan(toast.backupSJ);
    setToast(prev => ({ ...prev, visible: false }));
  }, [toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const now = new Date();
      setLastSaved(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearTimeout(timer);
  }, [scannedItems]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.code === 'KeyS') {
        e.preventDefault();
        if (isScanningMode) skuInputRef.current?.focus();
        else sjInputRef.current?.focus();
      } 
      else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } 
      else if (e.code === 'Escape') {
        (document.activeElement as HTMLElement)?.blur();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [undo, redo, isScanningMode]);

  useEffect(() => {
    const initSession = async () => {
      try {
        const session = await createSession("inbound");
        setSessionId(session.sessionId);
      } catch (error) {
        console.error("Failed to create scanning session:", error);
      }
    };
    initSession();
  }, []);

  const generateNewSession = async () => {
    try {
      const session = await createSession("inbound");
      setSessionId(session.sessionId);
    } catch (error) {
      console.error("Failed to generate new session:", error);
    }
  };

  // ─── Pattern Validation Functions ───
const validateSKUPattern = (barcode: string): boolean => {
  // SKU format: BASE (parent) or BASE-SIZE / BASE*SIZE (child)
  const skuPattern = /^[A-Z0-9]+([-*](S|M|L|XL|XXL|XXXL))?$/;
  return skuPattern.test(barcode) && barcode.length >= 3 && barcode.length <= 50;
};

  const validateRAKPattern = (barcode: string): boolean => {
    const rakPattern = /^[A-Z]-\d+-\d+$/;
    return rakPattern.test(barcode);
  };

  const submitSKUValidation = async (skuValue: string) => {
    if (!skuValue) return;
    if (!validateSKUPattern(skuValue)) {
      setScanFeedback({ type: "error", message: "Format SKU tidak valid", field: "sku" });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }
    setIsScanning(true);
    setScanFeedback({ type: "success", message: "Memvalidasi SKU...", field: "sku" });

    try {
      const response = await submitScan(sessionId, skuValue, "inbound");
      if (response.success) {
        setScanFeedback({ type: "success", message: "✓ SKU valid", field: "sku" });
        setActiveInput(prev => ({ ...prev, sku: skuValue }));
        setTimeout(() => {
          setScanFeedback(null);
          rackInputRef.current?.focus();
        }, 800);
      } else {
        setScanFeedback({ type: "error", message: `✗ ${response.error || "SKU tidak ditemukan"}`, field: "sku" });
        setTimeout(() => setScanFeedback(null), 3000);
      }
    } catch (error) {
      setScanFeedback({ type: "error", message: "Gagal terhubung", field: "sku" });
      setTimeout(() => setScanFeedback(null), 3000);
    } finally {
      setIsScanning(false);
    }
  };

  const submitRAKValidation = async (rakValue: string) => {
    if (!activeInput.sku) {
      setScanFeedback({ type: "error", message: "Isi SKU terlebih dahulu", field: "rack" });
      setTimeout(() => setScanFeedback(null), 2000);
      return;
    }
    if (!validateRAKPattern(rakValue)) {
      setScanFeedback({ type: "error", message: "Format Rak tidak valid", field: "rack" });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }
    setIsScanning(true);
    setScanFeedback({ type: "success", message: "Memvalidasi Rak...", field: "rack" });

    try {
      const response = await submitScan(sessionId, rakValue, "inbound");
      if (response.success) {
        setScanFeedback({ type: "success", message: "✓ Rak valid", field: "rack" });
        
        setTimeout(() => {
          setScanFeedback(null);
          const newItem: ScannedItem = { ...activeInput, rack: rakValue, id: Date.now().toString() };
          updateItemsWithHistory([newItem, ...scannedItems]);
          
          setActiveInput({ id: "active-row", sku: "", rack: "", qty: 1 });
          skuInputRef.current?.focus();
        }, 800);
      } else {
        setScanFeedback({ type: "error", message: `✗ ${response.error || "Rak tidak valid"}`, field: "rack" });
        setTimeout(() => setScanFeedback(null), 3000);
      }
    } catch (error) {
      setScanFeedback({ type: "error", message: "Gagal terhubung", field: "rack" });
      setTimeout(() => setScanFeedback(null), 3000);
    } finally {
      setIsScanning(false);
    }
  };

  const handleActiveSKUKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (autoSubmitTimers.sku) {
        clearTimeout(autoSubmitTimers.sku);
      }
      submitSKUValidation(activeInput.sku.trim().toUpperCase());
    }
  };

  const handleActiveRAKKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (autoSubmitTimers.rack) {
        clearTimeout(autoSubmitTimers.rack);
      }
      const rakValue = e.currentTarget.value.trim().toUpperCase();
      submitRAKValidation(rakValue);
    }
  };

  // ─── SAVE TO WAREHOUSE ───
  const handleSave = async () => {
    if (scannedItems.length === 0 || !suratJalan.trim()) return;

    const backupData = [...scannedItems];
    const backupSJ = suratJalan;
    const inboundPayload = scannedItems.map(item => ({
      ...item,
      hasImage: false,
    }));

    setToast({ visible: true, type: 'saving', backupData, backupSJ });

    try {
      await inboundAdds(inboundPayload);
      setScannedItems([]);
      setSuratJalan("");
      setIsScanningMode(false);
      setToast({ visible: true, type: 'success', backupData: null, backupSJ: "" });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      setToast(prev => ({ ...prev, visible: false }));
    }
  };

  return (
    <div className="flex flex-col gap-5 h-full relative animate-in fade-in duration-500">
      
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between shrink-0">
        <div className="flex flex-col gap-1.5">
          <nav className="flex items-center gap-1.5 text-[13px] font-bold text-[#888]">
            <Link href="/" className="hover:text-[#1A1A1A] transition-colors cursor-pointer">Home</Link>
            <ChevronRight size={14} />
            <span className="text-[#1A1A1A]">Inbound</span>
          </nav>
          <div className="flex items-center gap-4">
            <h1 className="text-[24px] font-black text-[#1A1A1A] tracking-tight">Proses Inbound</h1>
            <div className="flex items-center bg-white border border-[#E8E8E4] p-0.5 rounded-md shadow-sm ml-2">
              <button onClick={undo} disabled={past.length === 0} className="p-1.5 px-2 rounded-sm text-[#555] hover:bg-[#F0F0EC] hover:text-[#1A1A1A] disabled:opacity-30 transition-all cursor-pointer"><Undo2 size={16} strokeWidth={2.5} /></button>
              <div className="w-[1px] h-4 bg-[#E8E8E4]"></div>
              <button onClick={redo} disabled={future.length === 0} className="p-1.5 px-2 rounded-sm text-[#555] hover:bg-[#F0F0EC] hover:text-[#1A1A1A] disabled:opacity-30 transition-all cursor-pointer"><Redo2 size={16} strokeWidth={2.5} /></button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {sessionId && (
            <div
              className="group relative flex items-center gap-2 bg-[#1A1A1A] px-4 py-2.5 rounded-lg shadow-lg cursor-pointer hover:bg-[#2A2A2A] transition-all"
              onClick={() => {
                navigator.clipboard.writeText(sessionId);
                const badge = document.querySelector('[data-session-badge]');
                if (badge) {
                  const originalHTML = badge.innerHTML;
                  (badge as HTMLElement).innerHTML = '<span class="text-sm">✓ Copied!</span>';
                  setTimeout(() => {
                    (badge as HTMLElement).innerHTML = originalHTML;
                  }, 1500);
                }
              }}
              data-session-badge
              title={`Full Session ID: ${sessionId}`}
            >
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-[12px] font-mono font-bold text-white">
                {sessionId.substring(0, 10)}...
              </span>
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[#333] text-white text-[11px] px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-semibold">
                Click to copy
              </div>
            </div>
          )}
          <div className="flex items-center gap-2.5 bg-[#EFEBE9] border border-[#D7CCC8] px-4 py-2 rounded-md shadow-sm w-fit">
              <Lightbulb size={16} className="text-[#4E342E] shrink-0" strokeWidth={2.5} />
              <p className="text-[13px] text-[#4E342E]">
                <strong className="font-bold mr-1.5">Pro Tip!</strong>
                Scan atau ketik SKU/Rak lalu tekan <kbd className="bg-white border border-[#D7CCC8] px-1.5 py-[2px] rounded text-[11px] font-bold shadow-sm mx-1 cursor-pointer">Enter</kbd>.
              </p>
          </div>
        </div>
      </div>

      {/* ── STEP 1: KOTAK SURAT JALAN ── */}
      <div className="bg-white p-5 rounded-md border border-[#E8E8E4] shadow-sm flex items-end gap-4 shrink-0">
        <div className="flex-1 flex flex-col gap-2">
          <label className="text-[12px] font-bold text-[#1A1A1A] uppercase tracking-wider">Nomor Surat Jalan</label>
          <input 
            ref={sjInputRef}
            type="text" 
            value={suratJalan}
            onChange={(e) => setSuratJalan(e.target.value.toUpperCase())}
            disabled={isScanningMode}
            onKeyDown={(e) => {
              if (e.key === "Enter" && suratJalan.trim()) {
                e.preventDefault();
                setIsScanningMode(true);
                setTimeout(() => skuInputRef.current?.focus(), 100);
              }
            }}
            placeholder="Cth: 2026/04..."
            className="w-full bg-[#FAFAF8] border border-[#E8E8E4] px-4 py-3 rounded-md text-[15px] font-bold font-mono outline-none focus:bg-white focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all disabled:opacity-50 cursor-text"
          />
        </div>
        
        {isScanningMode ? (
          <button 
            onClick={() => {
              setIsScanningMode(false);
              setTimeout(() => sjInputRef.current?.focus(), 100);
            }}
            className="h-[46px] px-6 bg-[#FFF8E1] hover:bg-[#FFECB3] text-[#F57F17] rounded-md text-[14px] font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2 border border-[#FFECB3]"
          >
            <Edit2 size={18} /> UBAH SURAT JALAN
          </button>
        ) : (
          <button 
            onClick={() => {
              if(suratJalan.trim()) {
                setIsScanningMode(true);
                setTimeout(() => skuInputRef.current?.focus(), 100);
              }
            }}
            disabled={!suratJalan.trim()}
            className="h-[46px] px-6 bg-[#4E342E] hover:bg-[#3E2723] text-white rounded-md text-[14px] font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            <ArrowDownToLine size={18} /> MULAI SCAN BARANG
          </button>
        )}
      </div>

      {/* ── STEP 2: TABEL SCAN BARANG ── */}
      <div className={`bg-white rounded-md border border-[#E8E8E4] shadow-sm flex flex-col overflow-hidden mb-1 flex-1 min-h-0 transition-opacity duration-300 ${isScanningMode ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        
        <div className="shrink-0">
            <div className="bg-[#FAFAF8] px-8 py-5 flex items-center justify-between border-b border-[#E8E8E4]">
              <h2 className="text-[16px] font-bold text-[#1A1A1A]">
                Barang untuk: <span className="text-[#4E342E] font-mono ml-1">{suratJalan || "..."}</span>
              </h2>
              <div className="bg-[#EFEBE9] text-[#4E342E] px-4 py-1.5 rounded-full text-[13px] font-bold border border-[#D7CCC8]">
                  {totalItems} Items
              </div>
            </div>

            <div className="grid grid-cols-[3fr_2fr_1fr_60px] gap-6 px-8 py-4 bg-white border-b border-[#F0F0EC] shadow-[0_4px_10px_-10px_rgba(0,0,0,0.1)] z-10 relative">
              <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">SKU Barang</span>
              <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">Rak Tujuan</span>
              <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase text-center">QTY</span>
              <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase text-right">Aksi</span>
            </div>
        </div>

        <div className="flex flex-col divide-y divide-[#F7F7F5] overflow-y-auto flex-1 min-h-[250px] p-2">
          
          {/* BARIS INPUT AKTIF */}
          <div className="grid grid-cols-[3fr_2fr_1fr_60px] gap-6 px-6 py-3 items-start bg-[#F5F2F0] rounded-md border border-[#E8E5E1] mb-2 shadow-sm">
            <div className="relative flex flex-col gap-1 w-full">
              <input
                ref={skuInputRef}
                type="text"
                value={activeInput.sku}
                onFocus={generateNewSession}
                onChange={(e) => {
                  const skuValue = e.target.value.toUpperCase();
                  setActiveInput({ ...activeInput, sku: skuValue });

                  if (autoSubmitTimers.sku) {
                    clearTimeout(autoSubmitTimers.sku);
                  }

                  const timer = setTimeout(() => {
                    const trimmed = skuValue.trim();
                    if (trimmed) {
                      submitSKUValidation(trimmed);
                    }
                  }, 800);

                  setAutoSubmitTimers(prev => ({ ...prev, sku: timer }));
                }}
                onKeyDown={handleActiveSKUKeyDown}
                placeholder="Scan atau ketik SKU..."
                className="w-full bg-white px-3 py-2.5 border border-[#D7CCC8] rounded-md text-[15px] font-bold font-mono outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all cursor-text"
              />
              {scanFeedback?.field === "sku" && (
                <div className={`absolute top-full left-0 mt-1 text-[10px] font-bold px-2 py-0.5 rounded transition-all w-max z-10 shadow-sm ${scanFeedback.type === "success" ? "text-emerald-700 bg-emerald-100" : "text-red-700 bg-red-100"}`}>
                  {scanFeedback.message}
                </div>
              )}
            </div>

            <div className="relative flex flex-col gap-1 w-full">
              <input
                ref={rackInputRef}
                type="text"
                value={activeInput.rack}
                onChange={(e) => {
                  const rackValue = e.target.value.toUpperCase();
                  setActiveInput({ ...activeInput, rack: rackValue });

                  if (autoSubmitTimers.rack) {
                    clearTimeout(autoSubmitTimers.rack);
                  }

                  const timer = setTimeout(() => {
                    const trimmed = rackValue.trim();
                    if (trimmed) {
                      submitRAKValidation(trimmed);
                    }
                  }, 800);

                  setAutoSubmitTimers(prev => ({ ...prev, rack: timer }));
                }}
                onKeyDown={handleActiveRAKKeyDown}
                placeholder="Scan Rak..."
                className="w-full bg-white px-3 py-2.5 border border-[#D7CCC8] rounded-md text-[15px] font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all cursor-text"
              />
              {scanFeedback?.field === "rack" && (
                <div className={`absolute top-full left-0 mt-1 text-[10px] font-bold px-2 py-0.5 rounded transition-all w-max z-10 shadow-sm ${scanFeedback.type === "success" ? "text-emerald-700 bg-emerald-100" : "text-red-700 bg-red-100"}`}>
                  {scanFeedback.message}
                </div>
              )}
            </div>

            <div className="flex justify-center mt-1">
              <span className="bg-white border border-[#D7CCC8] px-6 py-2 rounded-md text-[15px] font-black text-[#888] shadow-sm">1</span>
            </div>
            <div></div>
          </div>

          {/* BARIS HISTORY */}
          {scannedItems.map((item) => (
            <div key={item.id} className="group grid grid-cols-[3fr_2fr_1fr_60px] gap-6 px-6 py-3 items-center hover:bg-[#FAFAF8] transition-colors rounded-md">
              <span className="text-[15px] font-bold text-[#1A1A1A] font-mono pl-3">{item.sku}</span>
              
              <div className="flex items-center">
                <span className="text-[14px] font-bold text-[#4E342E] bg-[#EFEBE9] border border-[#D7CCC8] px-3 py-1 rounded-md">
                  {item.rack}
                </span>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button 
                  onClick={() => updateQtyButton(item.id, -1)}
                  disabled={item.qty <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-[#F0F0EC] text-[#555] hover:bg-[#E8E8E4] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus size={14} strokeWidth={3} />
                </button>
                <input 
                  type="text"
                  value={item.qty > 0 ? item.qty.toString().padStart(2, '0') : ""}
                  onChange={(e) => handleQtyManualInput(item.id, e.target.value)}
                  onBlur={() => handleQtyBlur(item.id)}
                  className="w-10 text-center text-[15px] font-black text-[#1A1A1A] bg-transparent outline-none focus:bg-[#F0F0EC] focus:rounded-md cursor-text"
                />
                <button 
                  onClick={() => updateQtyButton(item.id, 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-[#888] text-white hover:bg-[#555] cursor-pointer"
                >
                  <Plus size={14} strokeWidth={3} />
                </button>
              </div>

              <div className="flex justify-end pr-2">
                <button 
                  onClick={() => deleteItem(item.id)}
                  className="p-2 text-[#CDCDC9] hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <Trash2 size={20} strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
          {scannedItems.length === 0 && (
             <div className="py-12 text-center text-[#ABABAB] text-[14px] font-medium italic">Belum ada barang yang discan ke dalam surat jalan ini.</div>
          )}
        </div>
      </div>

      {/* ── BOTTOM ACTIONS (Sticky) ── */}
      <div className="shrink-0 pt-3 pb-4 mt-auto">
        <div className="flex justify-between items-center gap-4">
          
          <div className="flex items-center">
            <p className="text-[12px] font-medium text-[#888] bg-[#F0F0EC] px-4 py-2 rounded-xl border border-[#E8E8E4] shadow-sm">
              Draft automatically saved at <span className="font-bold text-[#555] ml-1">{lastSaved}</span>
            </p>
          </div>

          <button 
            className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#333] text-white px-8 py-4 rounded-xl text-[15px] font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            disabled={scannedItems.length === 0 || !suratJalan.trim()}
            onClick={handleSave}
          >
            <Save size={18} />
            SAVE TO WAREHOUSE
          </button>
          
        </div>
      </div>

      {/* ── TOAST NOTIF ── */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        {toast.type === 'saving' ? (
          <div className="bg-[#3E2723] text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-6 border border-[#2C221A]">
            <div className="flex items-center gap-3">
              <Loader2 size={16} className="animate-spin text-[#D4AF37]" />
              <span className="text-[14px] font-medium">Menyimpan {toast.backupData?.length} barang (SJ: {toast.backupSJ}) ke database...</span>
            </div>
            <button onClick={handleUndoProcess} className="text-[#D4AF37] font-bold text-[14px] hover:brightness-125 transition-colors cursor-pointer uppercase tracking-wider">
              Batal (Undo)
            </button>
          </div>
        ) : (
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3">
             <CheckCircle2 size={18} />
             <span className="text-[14px] font-bold">Data Inbound berhasil disimpan!</span>
          </div>
        )}
      </div>

    </div>
  );
}