"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Trash2, 
  Plus, 
  Minus, 
  Image as ImageIcon, 
  Save, 
  UploadCloud,
  X,
  CheckCircle2,
  Lock,
  Lightbulb,
  Undo2,
  Redo2
} from "lucide-react";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { createSession, submitScan } from "@/lib/barcScanService";

interface ScannedItem {
  id: string;
  sku: string;
  rack: string;
  qty: number;
  hasImage: boolean;
}

const initialItems: ScannedItem[] = [
  { id: "1", sku: "SS1326C*XL", rack: "B-4-1", qty: 4, hasImage: false },
  { id: "2", sku: "ZW260121A-M", rack: "Q-1-1", qty: 1, hasImage: false },
  { id: "3", sku: "RLK251208-L", rack: "A-2-3", qty: 12, hasImage: true },
  { id: "4", sku: "PRG9901-S", rack: "C-1-2", qty: 6, hasImage: false },
  { id: "5", sku: "JKT1920-XL", rack: "D-2-4", qty: 2, hasImage: false },
  { id: "template-initial", sku: "", rack: "", qty: 1, hasImage: false },
];

export default function InboundPage() {
  // All hooks must be called BEFORE the early return check
  const { isLoading } = useProtectedRoute();
  const [items, setItems] = useState<ScannedItem[]>(initialItems);
  const [lastSaved, setLastSaved] = useState<string>("Just now");
  const [uploadModalOpen, setUploadModalOpen] = useState<string | null>(null);

  // ─── BARCODE SCANNING STATE ───
  const [sessionId, setSessionId] = useState<string>("");
  const [scanFeedback, setScanFeedback] = useState<{ type: "success" | "error"; message: string; itemId: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [autoSubmitTimers, setAutoSubmitTimers] = useState<{ [key: string]: NodeJS.Timeout }>({});

  // ─── STATE UNTUK UNDO & REDO ───
  const [past, setPast] = useState<ScannedItem[][]>([]);
  const [future, setFuture] = useState<ScannedItem[][]>([]);

  const updateItemsWithHistory = useCallback((newItems: ScannedItem[]) => {
    setPast(prev => [...prev, items]);
    setItems(newItems);
    setFuture([]); 
  }, [items]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast(prev => prev.slice(0, -1));
    setFuture(prev => [items, ...prev]);
    setItems(previous);
  }, [past, items]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture(prev => prev.slice(1));
    setPast(prev => [...prev, items]);
    setItems(next);
  }, [future, items]);

  // ─── Simulasi Auto-Save Draft ───
  useEffect(() => {
    const timer = setTimeout(() => {
      const now = new Date();
      setLastSaved(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearTimeout(timer);
  }, [items]);

  // ─── Global Shortcut (Alt/Option+S, Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Esc) ───
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.code === 'KeyS') {
        e.preventDefault();
        const skuInputs = document.querySelectorAll('input[id^="sku-"]');
        if (skuInputs.length > 0) {
          (skuInputs[skuInputs.length - 1] as HTMLElement).focus();
        }
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
        const session = await createSession("inbound");
        setSessionId(session.sessionId);
      } catch (error) {
        console.error("Failed to create scanning session:", error);
      }
    };
    initSession();
  }, []);

  if (isLoading) {
    return null; // Redirecting to login
  }

  // ─── Generate New Session on Focus (Ephemeral Per-Scan Sessions) ───
  const generateNewSession = async () => {
    try {
      const session = await createSession("inbound");
      setSessionId(session.sessionId);
      console.log(`🆕 New session generated on focus:`, session.sessionId);
    } catch (error) {
      console.error("Failed to generate new session:", error);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);

  // ─── FUNGSI-FUNGSI TABEL ───
  const updateQtyButton = (id: string, delta: number) => {
    updateItemsWithHistory(items.map(item => {
      if (item.id === id) return { ...item, qty: Math.max(1, item.qty + delta) };
      return item;
    }));
  };

  const handleQtyManualInput = (id: string, value: string) => {
    const numericVal = value.replace(/\D/g, '');
    updateItemsWithHistory(items.map(item => item.id === id ? { ...item, qty: numericVal === '' ? 0 : parseInt(numericVal) } : item));
  };

  const handleQtyBlur = (id: string) => {
    updateItemsWithHistory(items.map(item => item.id === id ? { ...item, qty: Math.max(1, item.qty) } : item));
  };

  const deleteItem = (id: string) => {
    let newItems = items.filter(item => item.id !== id);
    if (newItems.length === 0) {
      newItems = [{ id: Date.now().toString(), sku: "", rack: "", qty: 1, hasImage: false }];
    } else if (newItems[newItems.length - 1].sku !== "") {
      newItems.push({ id: Date.now().toString(), sku: "", rack: "", qty: 1, hasImage: false });
    }
    updateItemsWithHistory(newItems);
  };

  const updateField = (id: string, field: "sku" | "rack", value: string) => {
    updateItemsWithHistory(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // ─── Pattern Validation Functions ───
const validateSKUPattern = (barcode: string): boolean => {
  // SKU must have format: BASE*SIZE or BASE-SIZE (e.g., SS1326C*XL, ZW260121A-M) (size must be S, M, L, XL, XXL)
  // XXXL is literally a refrigerator build, should I add it as well or nah
  const skuPattern = /^[A-Z0-9]+[\*\-](S|M|L|XL|XXL)$/;
  return skuPattern.test(barcode) && barcode.length >= 3 && barcode.length <= 50;
};

  const validateRAKPattern = (barcode: string): boolean => {
    const rakPattern = /^[A-Z]-\d+-\d+$/;
    return rakPattern.test(barcode);
  };

  // ─── Core SKU Validation Logic (Used by both event handler and auto-submit) ───
  const submitSKUValidation = async (id: string, skuValue: string) => {
    if (!skuValue) {
      setScanFeedback({ type: "error", message: "SKU cannot be empty", itemId: id });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    if (!validateSKUPattern(skuValue)) {
      setScanFeedback({ type: "error", message: "✗ Invalid SKU format", itemId: id });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    if (!sessionId) {
      setScanFeedback({ type: "error", message: "Session not initialized", itemId: id });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    setIsScanning(true);
    setScanFeedback({ type: "success", message: "⏳ Validating SKU...", itemId: id });

    try {
      const response = await submitScan(sessionId, skuValue, "inbound");
      console.log("✓ SKU validation response:", response);
      
      if (response.success) {
        setScanFeedback({ type: "success", message: "✓ SKU valid", itemId: id });
        updateField(id, "sku", skuValue);
        
        setTimeout(() => {
          setScanFeedback(null);
          document.getElementById(`rack-${id}`)?.focus();
        }, 1200);
      } else {
        setScanFeedback({ type: "error", message: `✗ ${response.error || "Invalid SKU"}`, itemId: id });
        setTimeout(() => setScanFeedback(null), 3000);
      }
    } catch (error) {
      console.error("✗ SKU scan error:", error);
      setScanFeedback({ type: "error", message: "Scan failed", itemId: id });
      setTimeout(() => setScanFeedback(null), 3000);
    } finally {
      setIsScanning(false);
    }
  };

  // ─── Core RAK Validation Logic (Used by both event handler and auto-submit) ───
  const submitRAKValidation = async (id: string, rakValue: string) => {
    const itemIndex = items.findIndex(i => i.id === id);
    const currentItem = items[itemIndex];

    if (!currentItem.sku) {
      setScanFeedback({ type: "error", message: "Fill SKU first", itemId: id });
      setTimeout(() => setScanFeedback(null), 2000);
      return;
    }

    if (!rakValue) {
      setScanFeedback({ type: "error", message: "RAK cannot be empty", itemId: id });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    if (!validateRAKPattern(rakValue)) {
      setScanFeedback({ type: "error", message: "✗ Invalid RAK format", itemId: id });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    if (!sessionId) {
      setScanFeedback({ type: "error", message: "Session not initialized", itemId: id });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    setIsScanning(true);
    setScanFeedback({ type: "success", message: "⏳ Validating RAK...", itemId: id });

    try {
      const response = await submitScan(sessionId, rakValue, "inbound");
      console.log("✓ RAK validation response:", response);
      
      if (response.success) {
        setScanFeedback({ type: "success", message: "✓ RAK valid", itemId: id });
        updateField(id, "rack", rakValue);
        
        setTimeout(() => {
          setScanFeedback(null);
          // Create new row for next scan
          const newId = Date.now().toString();
          const newItems = [...items];
          newItems[itemIndex] = { ...currentItem, rack: rakValue };
          newItems.push({ id: newId, sku: "", rack: "", qty: 1, hasImage: false });
          setItems(newItems);
          
          // Focus new SKU field
          setTimeout(() => {
            document.getElementById(`sku-${newId}`)?.focus();
          }, 100);
        }, 1200);
      } else {
        setScanFeedback({ type: "error", message: `✗ ${response.error || "Invalid RAK"}`, itemId: id });
        setTimeout(() => setScanFeedback(null), 3000);
      }
    } catch (error) {
      console.error("✗ RAK scan error:", error);
      setScanFeedback({ type: "error", message: "Scan failed", itemId: id });
      setTimeout(() => setScanFeedback(null), 3000);
    } finally {
      setIsScanning(false);
    }
  };

  // ─── Auto-Submit Trigger Functions ───
  const triggerSKUValidation = (id: string) => {
    const skuInput = document.getElementById(`sku-${id}`) as HTMLInputElement;
    if (skuInput?.value.trim()) {
      submitSKUValidation(id, skuInput.value.trim().toUpperCase());
    }
  };

  const triggerRAKValidation = (id: string) => {
    const rakInput = document.getElementById(`rack-${id}`) as HTMLInputElement;
    if (rakInput?.value.trim()) {
      submitRAKValidation(id, rakInput.value.trim().toUpperCase());
    }
  };

  // ─── Handle SKU Field Validation ───
  const handleSKUKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === "Tab") {
      e.preventDefault();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const skuValue = (e.currentTarget).value.trim().toUpperCase();
      console.log("✓ SKU Enter pressed:", skuValue);
      submitSKUValidation(id, skuValue);
    }
  };

  // ─── Handle RAK Field Validation ───
  const handleRAKKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === "Tab") {
      e.preventDefault();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const rakValue = (e.currentTarget).value.trim().toUpperCase();
      console.log("✓ RAK Enter pressed:", rakValue);
      submitRAKValidation(id, rakValue);
    }
  };

  return (
    <div className="flex flex-col gap-5 h-full relative">
      
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between shrink-0">
        {/* Kiri: Navigasi, Judul, Undo/Redo */}
        <div className="flex flex-col gap-1.5">
          <nav className="flex items-center gap-1.5 text-[13px] font-bold text-[#888]">
            <Link href="/" className="hover:text-[#1A1A1A] transition-colors">Home</Link>
            <ChevronRight size={14} />
            <span className="text-[#1A1A1A]">Inbound</span>
          </nav>
          <div className="flex items-center gap-4">
            <h1 className="text-[24px] font-black text-[#1A1A1A] tracking-tight">
              Inbound Process
            </h1>
            
            {/* Tombol Undo/Redo */}
            <div className="flex items-center bg-white border border-[#CDCDC9] p-0.5 rounded-lg shadow-sm ml-2">
              <button 
                onClick={undo} disabled={past.length === 0}
                className="p-1.5 px-2 rounded-md text-[#555] hover:bg-[#F0F0EC] hover:text-[#1A1A1A] disabled:opacity-30 disabled:hover:bg-transparent transition-all" title="Undo (Ctrl+Z / Cmd+Z)"
              >
                <Undo2 size={16} strokeWidth={2.5} />
              </button>
              <div className="w-[1px] h-4 bg-[#E8E8E4]"></div>
              <button 
                onClick={redo} disabled={future.length === 0}
                className="p-1.5 px-2 rounded-md text-[#555] hover:bg-[#F0F0EC] hover:text-[#1A1A1A] disabled:opacity-30 disabled:hover:bg-transparent transition-all" title="Redo (Ctrl+Shift+Z / Cmd+Shift+Z)"
              >
                <Redo2 size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Kanan: Session Badge + Pro Tips*/}
        <div className="flex items-center gap-3">
          {/* Session ID Badge */}
          {sessionId && (
            <div 
              className="group relative flex items-center gap-2 bg-[#1A1A1A] px-4 py-2.5 rounded-lg shadow-lg cursor-pointer hover:bg-[#2A2A2A] transition-all"
              onClick={() => {
                navigator.clipboard.writeText(sessionId);
                // Show brief feedback
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
              {/* Tooltip */}
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[#333] text-white text-[11px] px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-semibold">
                Click to copy
              </div>
            </div>
          )}
          
          {/* Pro Tips*/}
          <div className="flex items-center gap-2.5 bg-sky-50 border border-sky-200 px-4 py-2 rounded-xl shadow-sm w-fit">
              <Lightbulb size={16} className="text-sky-600 shrink-0" strokeWidth={2.5} />
              <p className="text-[13px] text-sky-800">
                <strong className="font-bold mr-1.5">Pro Tip!</strong>
                Scan or type SKU/RAK then press <kbd className="bg-white border border-sky-200 px-1.5 py-[2px] rounded text-[11px] font-bold font-sans shadow-sm mx-1 text-sky-800">Enter</kbd>.
              </p>
          </div>
        </div>
      </div>



      {/* ── MAIN CONTENT (TABLE AREA) ── */}
      <div className="bg-white rounded-[24px] border border-[#E8E8E4] shadow-sm flex flex-col overflow-hidden mb-1 flex-1 min-h-0 mt-2">
        
        <div className="shrink-0">
            <div className="bg-[#FAFAF8] px-8 py-5 flex items-center justify-between border-b border-[#E8E8E4]">
            <h2 className="text-[16px] font-bold text-[#1A1A1A]">Current Session Scanned Items</h2>
            <div className="bg-[#E8E8E4] text-[#1A1A1A] px-4 py-1.5 rounded-full text-[13px] font-bold">
                {totalItems} Items
            </div>
            </div>

            <div className="grid grid-cols-[60px_2.5fr_1.5fr_150px_60px] gap-6 px-8 py-4 bg-white border-b border-[#F0F0EC] shadow-[0_4px_10px_-10px_rgba(0,0,0,0.1)] z-10 relative">
            <div></div> 
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">SKU</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">Rack</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase text-center">QTY</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase text-right">Action</span>
            </div>
        </div>

        <div className="flex flex-col divide-y divide-[#F7F7F5] overflow-y-auto flex-1 min-h-[250px]">
          {items.map((item, index) => {
            const isTemplate = item.sku === "" && item.rack === "";
            const rackLocked = item.sku.trim() === ""; 

            return (
              <div 
                key={item.id} 
                className={`group grid grid-cols-[60px_2.5fr_1.5fr_150px_60px] gap-6 px-8 py-3.5 items-center transition-colors
                  ${isTemplate ? "bg-[#FAFAF8]" : "hover:bg-[#FAFAF8] bg-white"}
                `}
              >
                <div>
                  <button 
                    onClick={() => { if (!isTemplate) setUploadModalOpen(item.id); }}
                    disabled={isTemplate}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
                      item.hasImage 
                      ? "bg-sky-50 border-sky-200 text-sky-600" 
                      : isTemplate
                        ? "bg-transparent border-transparent text-[#E8E8E4] cursor-default"
                        : "bg-white border-[#E8E8E4] text-[#ABABAB] hover:border-[#888] hover:text-[#555]"
                    }`}
                  >
                    {item.hasImage ? <CheckCircle2 size={20} /> : <ImageIcon size={20} strokeWidth={1.5} />}
                  </button>
                </div>

                <div>
                  <div className="flex flex-col gap-1">
                    <input
                      id={`sku-${item.id}`}
                      type="text"
                      value={item.sku}
                      onFocus={() => generateNewSession()}
                      onChange={(e) => {
                        updateField(item.id, "sku", e.target.value.toUpperCase());
                        
                        // Clear existing timer
                        if (autoSubmitTimers[`sku-${item.id}`]) {
                          clearTimeout(autoSubmitTimers[`sku-${item.id}`]);
                        }
                        
                        // Set new timer - auto-submit after 800ms of no input
                        const timer = setTimeout(() => {
                          triggerSKUValidation(item.id);
                        }, 800);
                        
                        setAutoSubmitTimers(prev => ({
                          ...prev,
                          [`sku-${item.id}`]: timer
                        }));
                      }}
                      onKeyDown={(e) => handleSKUKeyDown(e, item.id)}
                      placeholder="Scan or type SKU..."
                      className={`w-full bg-transparent text-[16px] font-bold font-mono outline-none placeholder:font-sans placeholder:italic transition-all
                        ${isTemplate ? "text-[#1A1A1A] placeholder:text-[#ABABAB]" : "text-[#1A1A1A] focus:bg-blue-50/30 focus:ring-1 focus:ring-blue-200/50"}
                      `}
                    />
                    {scanFeedback?.itemId === item.id && (
                      <div className={`text-[11px] font-bold px-2 py-1 rounded transition-all ${
                        scanFeedback.type === "success"
                          ? "text-green-600 bg-green-50/60"
                          : "text-red-600 bg-red-50/60"
                      }`}>
                        {scanFeedback.message}
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative flex items-center">
                  {rackLocked && <Lock size={14} className="absolute left-0 text-[#CDCDC9]" />}
                  <div className="flex flex-col gap-1 w-full">
                    <input
                      id={`rack-${item.id}`}
                      type="text"
                      value={item.rack}
                      onChange={(e) => {
                        updateField(item.id, "rack", e.target.value.toUpperCase());
                        
                        // Clear existing timer
                        if (autoSubmitTimers[`rack-${item.id}`]) {
                          clearTimeout(autoSubmitTimers[`rack-${item.id}`]);
                        }
                        
                        // Set new timer - auto-submit after 800ms of no input
                        const timer = setTimeout(() => {
                          triggerRAKValidation(item.id);
                        }, 800);
                        
                        setAutoSubmitTimers(prev => ({
                          ...prev,
                          [`rack-${item.id}`]: timer
                        }));
                      }}
                      onKeyDown={(e) => handleRAKKeyDown(e, item.id)}
                      disabled={rackLocked}
                      placeholder="Scan rack..."
                      className={`w-full bg-transparent text-[16px] font-bold outline-none placeholder:italic transition-all
                        ${rackLocked ? "pl-5 text-[#CDCDC9] placeholder:text-[#E8E8E4] cursor-not-allowed" : `pl-0 text-[#555] placeholder:text-[#CDCDC9] focus:bg-green-50/30 focus:ring-1 focus:ring-green-200/50`}
                      `}
                    />
                    {scanFeedback?.itemId === item.id && item.rack !== "" && (
                      <div className={`text-[11px] font-bold px-2 py-1 rounded transition-all ${
                        scanFeedback.type === "success"
                          ? "text-green-600 bg-green-50/60"
                          : "text-red-600 bg-red-50/60"
                      }`}>
                        {scanFeedback.message}
                      </div>
                    )}
                  </div>
                </div>

                <div className={`flex items-center justify-center gap-2 ${isTemplate ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                  <button 
                    onClick={() => updateQtyButton(item.id, -1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F0F0EC] text-[#555] hover:bg-[#E8E8E4] hover:text-[#1A1A1A]"
                  >
                    <Minus size={14} strokeWidth={3} />
                  </button>
                  <input 
                    type="text"
                    value={item.qty > 0 ? item.qty.toString().padStart(2, '0') : ""}
                    onChange={(e) => handleQtyManualInput(item.id, e.target.value)}
                    onBlur={() => handleQtyBlur(item.id)}
                    className="w-10 text-center text-[15px] font-bold text-[#1A1A1A] bg-transparent outline-none focus:bg-[#F0F0EC] focus:rounded-md"
                  />
                  <button 
                    onClick={() => updateQtyButton(item.id, 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#888] text-white hover:bg-[#555]"
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={() => deleteItem(item.id)}
                    className={`p-2 text-[#CDCDC9] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all
                      ${isTemplate && index === items.length - 1 ? 'opacity-0 cursor-default' : 'opacity-0 group-hover:opacity-100'}
                    `}
                  >
                    <Trash2 size={20} strokeWidth={2} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BOTTOM ACTIONS (Sticky) ── */}
      <div className="shrink-0 pt-3 pb-4 mt-auto">
        <div className="flex justify-between items-center gap-4">
          
          {/* Kiri: Teks Autosave dipindahkan ke sini */}
          <div className="flex items-center">
            <p className="text-[12px] font-medium text-[#888] bg-[#F0F0EC] px-4 py-2 rounded-xl border border-[#E8E8E4] shadow-sm">
              Draft automatically saved at <span className="font-bold text-[#555] ml-1">{lastSaved}</span>
            </p>
          </div>

          {/* Kanan: Tombol Save */}
          <button className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#333] text-white px-8 py-4 rounded-xl text-[15px] font-bold transition-all shadow-md">
            <Save size={18} />
            SAVE TO WAREHOUSE
          </button>
          
        </div>
      </div>

      {/* ── MODAL UPLOAD IMAGE ── */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-[500px] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0EC]">
              <h3 className="text-[16px] font-bold text-[#1A1A1A]">Upload Product Image</h3>
              <button onClick={() => setUploadModalOpen(null)} className="p-1.5 text-[#888] hover:bg-[#F0F0EC] hover:text-[#1A1A1A] rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-8">
              <div className="border-2 border-dashed border-[#CDCDC9] rounded-2xl bg-[#FAFAF8] hover:bg-[#F0F0EC] hover:border-[#888] transition-colors flex flex-col items-center justify-center py-12 cursor-pointer group">
                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud size={28} className="text-sky-500" />
                </div>
                <p className="text-[15px] font-bold text-[#1A1A1A] mb-1">Drag and drop file here</p>
                <p className="text-[13px] text-[#888]">or click to browse your computer</p>
                <button className="mt-6 bg-white border border-[#E8E8E4] text-[#333] text-[13px] font-bold px-6 py-2.5 rounded-lg hover:border-[#888] shadow-sm">
                  Browse Files
                </button>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#F0F0EC] bg-[#FAFAF8] flex justify-end gap-3">
              <button onClick={() => setUploadModalOpen(null)} className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-[#555] hover:bg-[#E8E8E4]">
                Cancel
              </button>
              <button 
                onClick={() => {
                  updateItemsWithHistory(items.map(item => item.id === uploadModalOpen ? { ...item, hasImage: true } : item));
                  setUploadModalOpen(null);
                }}
                className="px-6 py-2.5 rounded-xl text-[13px] font-bold text-white bg-sky-500 hover:bg-sky-600 shadow-sm"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}