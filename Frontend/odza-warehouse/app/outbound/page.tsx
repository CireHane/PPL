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
  ImageIcon,
  Loader2,
  CheckCircle2,
  Settings2
} from "lucide-react";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { createSession, submitScan } from "@/lib/barcScanService";
import { Console } from "console";
import { OutboundAdds } from "@/lib/firebase";

interface OutboundItem {
  id: string;
  channel: string;
  resi: string;
  sku: string;
  qty: number;
  rack: string;
  imageUrl?: string;
}

export default function OutboundPage() {
  const { isLoading } = useProtectedRoute();
  const [lastSaved, setLastSaved] = useState<string>("Baru saja");

  // ─── STATE TABEL (Top-Scan Workflow) ───
  const [activeInput, setActiveInput] = useState<OutboundItem>({ 
    id: "active-row", channel: "", resi: "", sku: "", rack: "", qty: 1 
  });
  const [scannedItems, setScannedItems] = useState<OutboundItem[]>([]);

  // ─── STATE GMAIL-STYLE UNDO TOAST ───
  const [toast, setToast] = useState<{ visible: boolean; type: 'saving' | 'success'; backupData: OutboundItem[] | null }>({
    visible: false, type: 'saving', backupData: null
  });

  // ─── BARCODE SCANNING STATE ───
  const [sessionId, setSessionId] = useState<string>("");
  const [scanFeedback, setScanFeedback] = useState<{ type: "success" | "error"; message: string; field: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [autoSubmitTimers, setAutoSubmitTimers] = useState<{ [key: string]: NodeJS.Timeout }>({});
  const [outboundStep, setOutboundStep] = useState<0 | 1 | 2 | 3>(0);

  const channelInputRef = useRef<HTMLInputElement>(null);
  const resiInputRef = useRef<HTMLInputElement>(null);
  const skuInputRef = useRef<HTMLInputElement>(null);
  const rackInputRef = useRef<HTMLInputElement>(null);

  // ─── STATE UNTUK UNDO & REDO (MANUAL) ───
  const [past, setPast] = useState<OutboundItem[][]>([]);
  const [future, setFuture] = useState<OutboundItem[][]>([]);

  const updateItemsWithHistory = useCallback((newItems: OutboundItem[]) => {
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

  // ─── Simulasi Auto-Save Draft ───
  useEffect(() => {
    const timer = setTimeout(() => {
      const now = new Date();
      setLastSaved(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearTimeout(timer);
  }, [scannedItems]);

  // ─── Global Shortcut (Alt/Option+S, Ctrl/Cmd+Z, Esc) ───
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.code === 'KeyS') {
        e.preventDefault();
        channelInputRef.current?.focus();
      } 
      else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
        e.preventDefault();
        if (e.shiftKey) {
          redo(); 
        } else {
          undo(); 
        }
      } 
      else if (e.code === 'Escape') {
        (document.activeElement as HTMLElement)?.blur();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [undo, redo]);

  // ─── Initialize Barcode Session on Page Load ───
  useEffect(() => {
    const initSession = async () => {
      try {
        const session = await createSession("outbound");
        setSessionId(session.sessionId);
      } catch (error) {
        console.error("Failed to create scanning session:", error);
      }
    };
    initSession();
  }, []);

  const generateNewSession = async () => {
    try {
      const session = await createSession("outbound");
      setSessionId(session.sessionId);
      console.log(`🆕 New session generated on focus:`, session.sessionId);
    } catch (error) {
      console.error("Failed to generate new session:", error);
    }
  };

  const totalItems = scannedItems.length;

  // ─── FUNGSI-FUNGSI TABEL ───
  const deleteItem = (id: string) => {
    updateItemsWithHistory(scannedItems.filter(item => item.id !== id));
  };

  // ─── Pattern Validation Functions ───
  const validateChannelPattern = (barcode: string): boolean => {
    const channelPattern = /^[A-Z]{2,}$/;
    return channelPattern.test(barcode) && barcode.length >= 2 && barcode.length <= 20;
  };

  const validateResiPattern = (barcode: string): boolean => {
    const resiPattern = /^[A-Z0-9]{6,}$/;
    return resiPattern.test(barcode);
  };

  const validateSKUPattern = (barcode: string): boolean => {
    const skuPattern = /^[A-Z0-9]+([-*](S|M|L|XL|XXL|XXXL))?$/;
    return skuPattern.test(barcode) && barcode.length >= 3 && barcode.length <= 50;
  };

  const validateRackPattern = (barcode: string): boolean => {
    const rackPattern = /^[A-Z]-\d+-\d+$/;
    return rackPattern.test(barcode);
  };

  // ─── Core Validation Logic ───
  const submitChannelValidation = async (channelValue: string) => {
    if (!channelValue) {
      setScanFeedback({ type: "error", message: "Channel tidak boleh kosong", field: "channel" });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }
    if (!validateChannelPattern(channelValue)) {
      setScanFeedback({ type: "error", message: "✗ Format Channel tidak valid", field: "channel" });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }
    if (!sessionId) {
      setScanFeedback({ type: "error", message: "Session belum diinisialisasi", field: "channel" });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    setIsScanning(true);
    setScanFeedback({ type: "success", message: "⏳ Memvalidasi Channel...", field: "channel" });

    try {
      const response = await submitScan(sessionId, channelValue, "outbound");
      if (response.success) {
        setScanFeedback({ type: "success", message: "✓ Channel valid", field: "channel" });
        setActiveInput(prev => ({ ...prev, channel: channelValue }));
        setOutboundStep(1);
        setTimeout(() => {
          setScanFeedback(null);
          resiInputRef.current?.focus();
        }, 800);
      } else {
        setScanFeedback({ type: "error", message: `✗ ${response.error || "Channel tidak valid"}`, field: "channel" });
        setTimeout(() => setScanFeedback(null), 3000);
      }
    } catch (error) {
      setScanFeedback({ type: "error", message: "Gagal terhubung", field: "channel" });
      setTimeout(() => setScanFeedback(null), 3000);
    } finally {
      setIsScanning(false);
    }
  };

  const submitResiValidation = async (resiValue: string) => {
    if (!activeInput.channel) {
      setScanFeedback({ type: "error", message: "Isi Channel terlebih dahulu", field: "resi" });
      setTimeout(() => setScanFeedback(null), 2000);
      return;
    }
    if (!resiValue) {
      setScanFeedback({ type: "error", message: "Resi tidak boleh kosong", field: "resi" });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }
    if (!validateResiPattern(resiValue)) {
      setScanFeedback({ type: "error", message: "✗ Format Resi tidak valid", field: "resi" });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }
    if (!sessionId) {
      setScanFeedback({ type: "error", message: "Session belum diinisialisasi", field: "resi" });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    setIsScanning(true);
    setScanFeedback({ type: "success", message: "⏳ Memvalidasi Resi...", field: "resi" });

    try {
      const response = await submitScan(sessionId, resiValue, "outbound");
      if (response.success) {
        setScanFeedback({ type: "success", message: "✓ Resi valid", field: "resi" });
        setActiveInput(prev => ({ ...prev, resi: resiValue }));
        setOutboundStep(2);
        setTimeout(() => {
          setScanFeedback(null);
          skuInputRef.current?.focus();
        }, 800);
      } else {
        setScanFeedback({ type: "error", message: `✗ ${response.error || "Resi tidak valid"}`, field: "resi" });
        setTimeout(() => setScanFeedback(null), 3000);
      }
    } catch (error) {
      setScanFeedback({ type: "error", message: "Gagal terhubung", field: "resi" });
      setTimeout(() => setScanFeedback(null), 3000);
    } finally {
      setIsScanning(false);
    }
  };

  const submitSKUValidation = async (skuValue: string) => {
    if (!activeInput.resi) {
      setScanFeedback({ type: "error", message: "Isi Resi terlebih dahulu", field: "sku" });
      setTimeout(() => setScanFeedback(null), 2000);
      return;
    }
    if (!skuValue) {
      setScanFeedback({ type: "error", message: "SKU tidak boleh kosong", field: "sku" });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }
    if (!validateSKUPattern(skuValue)) {
      setScanFeedback({ type: "error", message: "✗ Format SKU tidak valid", field: "sku" });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }
    if (!sessionId) {
      setScanFeedback({ type: "error", message: "Session belum diinisialisasi", field: "sku" });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    setIsScanning(true);
    setScanFeedback({ type: "success", message: "⏳ Memvalidasi SKU...", field: "sku" });

    try {
      const response = await submitScan(sessionId, skuValue, "outbound");
      if (response.success) {
        setScanFeedback({ type: "success", message: "✓ SKU valid", field: "sku" });
        setActiveInput(prev => ({ 
          ...prev, 
          sku: skuValue,
          imageUrl: "https://p16-oec-sg.ibyteimg.com/tos-alisg-i-aphluv4xwc-sg/2fb77797a53f44488c7fede03e5b9d2c~tplv-aphluv4xwc-origin-jpeg.jpeg" 
        }));
        setOutboundStep(3);
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

  const submitRackValidation = async (rackValue: string) => {
    if (!activeInput.sku) {
      setScanFeedback({ type: "error", message: "Isi SKU terlebih dahulu", field: "rack" });
      setTimeout(() => setScanFeedback(null), 2000);
      return;
    }
    if (!rackValue) {
      setScanFeedback({ type: "error", message: "Rak tidak boleh kosong", field: "rack" });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }
    if (!validateRackPattern(rackValue)) {
      setScanFeedback({ type: "error", message: "✗ Format Rak tidak valid", field: "rack" });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }
    if (!sessionId) {
      setScanFeedback({ type: "error", message: "Session belum diinisialisasi", field: "rack" });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    setIsScanning(true);
    setScanFeedback({ type: "success", message: "⏳ Memvalidasi Rak...", field: "rack" });

    try {
      const response = await submitScan(sessionId, rackValue, "outbound");
      if (response.success) {
        setScanFeedback({ type: "success", message: "✓ Rak valid", field: "rack" });
        setTimeout(() => {
          setScanFeedback(null);
          const newItem: OutboundItem = { ...activeInput, rack: rackValue, id: Date.now().toString() };
          updateItemsWithHistory([newItem, ...scannedItems]);
          setActiveInput({ id: "active-row", channel: "", resi: "", sku: "", rack: "", qty: 1, imageUrl: undefined });
          setOutboundStep(0);
          channelInputRef.current?.focus();
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

  // ─── Keyboard Handlers ───
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>, field: "channel" | "resi" | "sku" | "rack") => {
    if (e.key === "Tab") {
      e.preventDefault();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (autoSubmitTimers[field]) {
        clearTimeout(autoSubmitTimers[field]);
      }
      const val = (e.currentTarget).value.trim().toUpperCase();
      if (field === "channel") submitChannelValidation(val);
      else if (field === "resi") submitResiValidation(val);
      else if (field === "sku") submitSKUValidation(val);
      else if (field === "rack") submitRackValidation(val);
    }
  };

  // ─── TOAST NOTIFICATION LOGIC ───
  const handleProcess = () => {
    if (scannedItems.length === 0) return;
    const currentData = [...scannedItems];

    OutboundAdds(currentData);
    
    setScannedItems([]); 
    setActiveInput({ id: "active-row", channel: "", resi: "", sku: "", rack: "", qty: 1 });
    setOutboundStep(0);
    
    setToast({ visible: true, type: 'saving', backupData: currentData });

    const timer = setTimeout(() => {
      setToast(prev => prev.visible ? { ...prev, type: 'success' } : prev);
      setTimeout(() => setToast({ visible: false, type: 'saving', backupData: null }), 2500);
    }, 5000);

    (window as any).undoOutboundTimer = timer;
  };

  const handleUndoProcess = () => {
    clearTimeout((window as any).undoOutboundTimer);
    if (toast.backupData) {
      setScannedItems(toast.backupData);
      setTimeout(() => channelInputRef.current?.focus(), 100);
    }
    setToast({ visible: false, type: 'saving', backupData: null });
  };

  if (isLoading) return null;

  return (
    <div className="flex flex-col gap-5 h-full relative animate-in fade-in duration-500">
      
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between shrink-0">
        <div className="flex flex-col gap-1.5">
          <nav className="flex items-center gap-1.5 text-[13px] font-bold text-[#888]">
            <Link href="/" className="hover:text-[#1A1A1A] transition-colors cursor-pointer">Dashboard</Link>
            <ChevronRight size={14} />
            <span className="text-[#1A1A1A]">Outbound</span>
          </nav>
          <div className="flex items-center gap-4">
            <h1 className="text-[24px] font-black text-[#1A1A1A] tracking-tight">Proses Outbound</h1>
            <div className="flex items-center bg-white border border-[#E8E8E4] p-0.5 rounded-md shadow-sm ml-2">
              <button onClick={undo} disabled={past.length === 0} className="p-1.5 px-2 rounded-sm text-[#555] hover:bg-[#F0F0EC] hover:text-[#1A1A1A] disabled:opacity-30 transition-all cursor-pointer"><Undo2 size={16} strokeWidth={2.5} /></button>
              <div className="w-[1px] h-4 bg-[#E8E8E4]"></div>
              <button onClick={redo} disabled={future.length === 0} className="p-1.5 px-2 rounded-sm text-[#555] hover:bg-[#F0F0EC] hover:text-[#1A1A1A] disabled:opacity-30 transition-all cursor-pointer"><Redo2 size={16} strokeWidth={2.5} /></button>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-3 mt-2">
          {sessionId && (
            <div
              className="group relative flex items-center gap-2 bg-[#1A1A1A] px-4 py-2.5 rounded-lg shadow-lg cursor-pointer hover:bg-[#2A2A2A] transition-all"
              onClick={() => {
                navigator.clipboard.writeText(sessionId);
                const badge = document.querySelector('[data-session-badge-outbound]');
                if (badge) {
                  const originalHTML = badge.innerHTML;
                  (badge as HTMLElement).innerHTML = '<span class="text-sm">✓ Copied!</span>';
                  setTimeout(() => {
                    (badge as HTMLElement).innerHTML = originalHTML;
                  }, 1500);
                }
              }}
              data-session-badge-outbound
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
          <div className="flex items-center gap-3 px-4 py-3 bg-[#EFEBE9] border border-[#D7CCC8] rounded-md text-[12px] font-medium text-[#4E342E] shadow-sm">
            <Settings2 size={14} className="text-[#D4AF37] shrink-0" />
            <span>
              <strong className="font-bold mr-1.5">Pintasan:</strong>
              Tekan <kbd className="bg-white border border-[#D7CCC8] px-1.5 py-[2px] rounded text-[11px] font-mono shadow-sm mx-1 cursor-pointer">Alt/option + S</kbd> untuk mulai scan.
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT (TABLE AREA) ── */}
      <div className="bg-white rounded-md border border-[#E8E8E4] shadow-sm flex flex-col overflow-hidden mb-1 flex-1 min-h-0 mt-2">
        <div className="shrink-0">
          <div className="bg-[#FAFAF8] px-8 py-5 flex items-center justify-between border-b border-[#E8E8E4]">
            <h2 className="text-[16px] font-bold text-[#1A1A1A]">Daftar Scan Sesi Ini</h2>
            <div className="bg-[#EFEBE9] text-[#4E342E] px-4 py-1.5 rounded-full text-[13px] font-bold border border-[#D7CCC8]">{totalItems} Items</div>
          </div>

          <div className="grid grid-cols-[1.5fr_2fr_2.5fr_1.5fr_60px_60px] gap-6 px-8 py-4 bg-white border-b border-[#F0F0EC] shadow-[0_4px_10px_-10px_rgba(0,0,0,0.1)] z-10 relative">
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">Channel</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">No. Resi</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">SKU Barang</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">Rak Asal</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase text-center">QTY</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase text-right">Aksi</span>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-[#F7F7F5] overflow-y-auto flex-1 min-h-[250px] p-2">
          
          {/* ── BARIS INPUT AKTIF (DI ATAS) ── */}
          <div className="grid grid-cols-[1.5fr_2fr_2.5fr_1.5fr_60px_60px] gap-6 px-6 py-3 items-center bg-[#F5F2F0] rounded-md border border-[#E8E5E1] mb-2 shadow-sm">
            
            {/* Channel Input */}
            <div className="relative flex flex-col w-full">
              <input 
                ref={channelInputRef} type="text" value={activeInput.channel} 
                onFocus={generateNewSession}
                onChange={(e) => {
                  const channelValue = e.target.value.toUpperCase();
                  setActiveInput({...activeInput, channel: channelValue});

                  if (autoSubmitTimers.channel) {
                    clearTimeout(autoSubmitTimers.channel);
                  }

                  const timer = setTimeout(() => {
                    const trimmed = channelValue.trim();
                    if (trimmed && outboundStep === 0) {
                      submitChannelValidation(trimmed);
                    }
                  }, 800);

                  setAutoSubmitTimers(prev => ({ ...prev, channel: timer }));
                }} 
                onKeyDown={(e) => handleKey(e, "channel")} 
                placeholder="Scan Channel..." 
                className="w-full bg-white px-3 py-2.5 border border-[#D7CCC8] rounded-md text-[14px] font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all cursor-text"
              />
              {scanFeedback?.field === "channel" && (
                <div className={`absolute top-full left-0 mt-1 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10 w-max ${scanFeedback.type === "success" ? "text-emerald-700 bg-emerald-100" : "text-red-700 bg-red-100"}`}>
                  {scanFeedback.message}
                </div>
              )}
            </div>

            <div className="relative flex items-center w-full">
              {outboundStep < 1 && <Lock size={14} className="absolute left-3 text-[#CDCDC9]" />}
              <div className="relative flex flex-col w-full">
                <input 
                  ref={resiInputRef} type="text" value={activeInput.resi} 
                  onChange={(e) => {
                    const resiValue = e.target.value.toUpperCase();
                    setActiveInput({...activeInput, resi: resiValue});

                    if (autoSubmitTimers.resi) {
                      clearTimeout(autoSubmitTimers.resi);
                    }

                    const timer = setTimeout(() => {
                      const trimmed = resiValue.trim();
                      if (trimmed && outboundStep === 1) {
                        submitResiValidation(trimmed);
                      }
                    }, 800);

                    setAutoSubmitTimers(prev => ({ ...prev, resi: timer }));
                  }} 
                  onKeyDown={(e) => handleKey(e, "resi")} 
                  disabled={outboundStep < 1}
                  placeholder="Scan Resi..." 
                  className={`w-full bg-white py-2.5 border border-[#D7CCC8] rounded-md text-[14px] font-bold font-mono outline-none transition-all cursor-text ${outboundStep < 1 ? 'opacity-50 pl-8' : 'pl-3 focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]'}`}
                />
                {scanFeedback?.field === "resi" && (
                  <div className={`absolute top-full left-0 mt-1 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10 w-max ${scanFeedback.type === "success" ? "text-emerald-700 bg-emerald-100" : "text-red-700 bg-red-100"}`}>
                    {scanFeedback.message}
                  </div>
                )}
              </div>
            </div>

            <div className="relative flex items-center w-full">
              {outboundStep < 2 && <Lock size={14} className="absolute left-3 text-[#CDCDC9]" />}
              <div className="relative flex flex-col w-full">
                <input 
                  ref={skuInputRef} type="text" value={activeInput.sku} 
                  onChange={(e) => {
                    const skuValue = e.target.value.toUpperCase();
                    setActiveInput({...activeInput, sku: skuValue});

                    if (autoSubmitTimers.sku) {
                      clearTimeout(autoSubmitTimers.sku);
                    }

                    const timer = setTimeout(() => {
                      const trimmed = skuValue.trim();
                      if (trimmed && outboundStep === 2) {
                        submitSKUValidation(trimmed);
                      }
                    }, 800);

                    setAutoSubmitTimers(prev => ({ ...prev, sku: timer }));
                  }} 
                  onKeyDown={(e) => handleKey(e, "sku")} 
                  disabled={outboundStep < 2}
                  placeholder="Scan SKU..." 
                  className={`w-full bg-white py-2.5 border border-[#D7CCC8] rounded-md text-[14px] font-bold font-mono outline-none transition-all cursor-text ${outboundStep < 2 ? 'opacity-50 pl-8' : 'pl-3 focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]'}`}
                />
                {scanFeedback?.field === "sku" && (
                  <div className={`absolute top-full left-0 mt-1 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10 w-max ${scanFeedback.type === "success" ? "text-emerald-700 bg-emerald-100" : "text-red-700 bg-red-100"}`}>
                    {scanFeedback.message}
                  </div>
                )}
              </div>
            </div>

            <div className="relative flex items-center w-full">
              {outboundStep < 3 && <Lock size={14} className="absolute left-3 text-[#CDCDC9]" />}
              <div className="relative flex flex-col w-full">
                <input 
                  ref={rackInputRef} type="text" value={activeInput.rack} 
                  onChange={(e) => {
                    const rackValue = e.target.value.toUpperCase();
                    setActiveInput({...activeInput, rack: rackValue});

                    if (autoSubmitTimers.rack) {
                      clearTimeout(autoSubmitTimers.rack);
                    }

                    const timer = setTimeout(() => {
                      const trimmed = rackValue.trim();
                      if (trimmed && outboundStep === 3) {
                        submitRackValidation(trimmed);
                      }
                    }, 800);

                    setAutoSubmitTimers(prev => ({ ...prev, rack: timer }));
                  }} 
                  onKeyDown={(e) => handleKey(e, "rack")} 
                  disabled={outboundStep < 3}
                  placeholder="Scan Rak..." 
                  className={`w-full bg-white py-2.5 border border-[#D7CCC8] rounded-md text-[14px] font-bold font-mono outline-none transition-all cursor-text ${outboundStep < 3 ? 'opacity-50 pl-8' : 'pl-3 focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]'}`}
                />
                {scanFeedback?.field === "rack" && (
                  <div className={`absolute top-full left-0 mt-1 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10 w-max ${scanFeedback.type === "success" ? "text-emerald-700 bg-emerald-100" : "text-red-700 bg-red-100"}`}>
                    {scanFeedback.message}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center mt-1">
              <span className="bg-white border border-[#D7CCC8] px-4 py-1.5 rounded-md text-[14px] font-black text-[#888] shadow-sm">1</span>
            </div>
            <div></div>
          </div>

          {/* ── BARIS HISTORY (DI BAWAH) ── */}
          {scannedItems.map((item) => (
            <div key={item.id} className="group grid grid-cols-[1.5fr_2fr_2.5fr_1.5fr_60px_60px] gap-6 px-6 py-3 items-center hover:bg-[#FAFAF8] transition-colors rounded-md">
              <span className="text-[14px] font-bold text-[#1A1A1A]">{item.channel}</span>
              <span className="text-[13px] font-bold font-mono text-[#555]">{item.resi}</span>
              
              <div className="flex items-center gap-3">
                <div className={`w-40 h-40 rounded-md border flex items-center justify-center shrink-0 ${item.imageUrl ? 'bg-white border-[#E8E8E4] overflow-hidden' : 'bg-[#F7F7F5] border-transparent'}`}>
                  {item.imageUrl ? <img src={item.imageUrl} alt="SKU" className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-[#CDCDC9]" />}
                </div>
                <span className="text-[14px] font-bold font-mono text-blue-600">{item.sku}</span>
              </div>
              
              <div><span className="text-[13px] font-bold text-[#4E342E] bg-[#EFEBE9] border border-[#D7CCC8] px-2.5 py-1 rounded-md font-mono">{item.rack}</span></div>
              <div className="flex justify-center"><span className="text-[15px] font-black text-[#1A1A1A]">{item.qty}</span></div>
              <div className="flex justify-end pr-2">
                <button onClick={() => deleteItem(item.id)} className="p-2 text-[#CDCDC9] hover:text-red-500 rounded-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
          {scannedItems.length === 0 && (
             <div className="py-12 text-center text-[#ABABAB] text-[14px] font-medium italic">Silakan mulai scan barang di kolom atas.</div>
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
          <PackageCheck size={18} /> PROSES BARANG KELUAR
        </button>
      </div>

      {/* ── TOAS NOTIFICATION ── */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        {toast.type === 'saving' ? (
          <div className="bg-[#3E2723] text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-6 border border-[#2C221A]">
            <div className="flex items-center gap-3">
              <Loader2 size={16} className="animate-spin text-[#D4AF37]" />
              <span className="text-[14px] font-medium">Memproses {toast.backupData?.length} barang keluar...</span>
            </div>
            <button onClick={handleUndoProcess} className="text-[#D4AF37] font-bold text-[14px] hover:brightness-125 transition-colors cursor-pointer uppercase tracking-wider">
              Batal (Undo)
            </button>
          </div>
        ) : (
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3">
             <CheckCircle2 size={18} />
             <span className="text-[14px] font-bold">Data Outbound berhasil disimpan!</span>
          </div>
        )}
      </div>

    </div>
  );
}