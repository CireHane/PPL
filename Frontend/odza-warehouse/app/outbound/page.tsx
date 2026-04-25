"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Trash2, 
  Lock,
  Lightbulb,
  Undo2,
  Redo2,
  Save,
  X,
  CheckCircle2,
  UploadCloud,
  ImageIcon
} from "lucide-react";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { createSession, submitScan } from "@/lib/barcScanService";
import { Console } from "console";

interface OutboundItem {
  id: string;
  channel: string;
  resi: string;
  sku: string;
  qty: number;
  rack: string;
  imageUrl?: string;
}

const initialItems: OutboundItem[] = [
  { 
    id: "1", 
    channel: "SHOPEE", 
    resi: "SPXID066237503871", 
    sku: "SS1326C*XL",
    qty: 1, 
    rack: "B-4-1",
    imageUrl: "https://down-id.img.susercontent.com/file/513fb903ad28c9f5f1933afd2b4f10b6" 
  },
  { 
    id: "2", 
    channel: "SHOPEE", 
    resi: "SPXID066237503871", 
    sku: "ZW260121A-M", 
    qty: 1,
    rack: "Q-1-1",
    imageUrl: "https://odzaclassic.com/cdn/shop/files/37b05171d2d54c1878662d744f4a7d8b_1dd6adf2-5550-4e1b-bd84-e8effdae0a84.jpg?v=1745468866&width=1646"
  },
  { id: "3", channel: "TOKOPEDIA", resi: "TKPD0987654321", sku: "RLK251208-L", qty: 1, rack: "A-2-3", imageUrl: "https://p16-oec-sg.ibyteimg.com/tos-alisg-i-aphluv4xwc-sg/2fb77797a53f44488c7fede03e5b9d2c~tplv-aphluv4xwc-origin-jpeg.jpeg" },
  { id: "4", channel: "LAZADA", resi: "LAZ123456789", sku: "PRG9901-S", qty: 1, rack: "C-1-2", imageUrl: undefined },
  { id: "5", channel: "SHOPEE", resi: "SPXID066237503872", sku: "JKT1920-XL", qty: 1, rack: "D-2-4", imageUrl: undefined },
  { id: "template-initial", channel: "", resi: "", sku: "", qty: 1, rack: "", imageUrl: undefined },
];

export default function OutboundPage() {
  // All hooks must be called BEFORE the early return check
  const { isLoading } = useProtectedRoute();
  const [items, setItems] = useState<OutboundItem[]>(initialItems);
  const [lastSaved, setLastSaved] = useState<string>("Just now");
  const [uploadModalOpen, setUploadModalOpen] = useState<string | null>(null);

  // ─── BARCODE SCANNING STATE ───
  const [sessionId, setSessionId] = useState<string>("");
  const [scanFeedback, setScanFeedback] = useState<{ type: "success" | "error"; message: string; itemId: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [autoSubmitTimers, setAutoSubmitTimers] = useState<{ [key: string]: NodeJS.Timeout }>({});

  // ─── STATE UNTUK UNDO & REDO ───
  const [past, setPast] = useState<OutboundItem[][]>([]);
  const [future, setFuture] = useState<OutboundItem[][]>([]);

  const updateItemsWithHistory = useCallback((newItems: OutboundItem[]) => {
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
        const channelInputs = document.querySelectorAll('input[id^="channel-"]');
        if (channelInputs.length > 0) {
          (channelInputs[channelInputs.length - 1] as HTMLElement).focus();
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
        const session = await createSession("outbound");
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
      const session = await createSession("outbound");
      setSessionId(session.sessionId);
      console.log(`🆕 New session generated on focus:`, session.sessionId);
    } catch (error) {
      console.error("Failed to generate new session:", error);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + (item.channel ? 1 : 0), 0);

  // ─── FUNGSI-FUNGSI TABEL ───
  const deleteItem = (id: string) => {
    let newItems = items.filter(item => item.id !== id);
    if (newItems.length === 0) {
      newItems = [{ id: Date.now().toString(), channel: "", resi: "", sku: "", qty: 1, rack: "", imageUrl: undefined }];
    } else if (newItems[newItems.length - 1].channel !== "") {
      newItems.push({ id: Date.now().toString(), channel: "", resi: "", sku: "", qty: 1, rack: "", imageUrl: undefined });
    }
    updateItemsWithHistory(newItems);
  };

  const updateField = (id: string, field: "channel" | "resi" | "sku" | "rack", value: string) => {
    updateItemsWithHistory(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // ─── Pattern Validation Functions ───
  const validateChannelPattern = (barcode: string): boolean => {
    // Channel: Uppercase letters (SHOPEE, TOKOPEDIA, LAZADA, etc.)
    const channelPattern = /^[A-Z]{2,}$/;
    return channelPattern.test(barcode) && barcode.length >= 2 && barcode.length <= 20;
  };

  const validateResiPattern = (barcode: string): boolean => {
    // Resi: Alphanumeric (e.g., SPXID066237503871, TKPD0987654321)
    const resiPattern = /^[A-Z0-9]{6,}$/;
    return resiPattern.test(barcode);
  };

  const validateSKUPattern = (barcode: string): boolean => {
    // SKU format: BASE (parent) or BASE-SIZE / BASE*SIZE (child)
    // Examples: ZW260121A (parent), SS1326C*XL (child), ZW260121A-M (child)
    const skuPattern = /^[A-Z0-9]+([-*](S|M|L|XL|XXL|XXXL))?$/;
    return skuPattern.test(barcode) && barcode.length >= 3 && barcode.length <= 50;
  };

  const validateRackPattern = (barcode: string): boolean => {
    // Rack: A-1-1 format
    const rackPattern = /^[A-Z]-\d+-\d+$/;
    return rackPattern.test(barcode);
  };

  // ─── Core Channel Validation Logic ───
  const submitChannelValidation = async (id: string, channelValue: string) => {
    if (!channelValue) {
      setScanFeedback({ type: "error", message: "Channel cannot be empty", itemId: id });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    if (!validateChannelPattern(channelValue)) {
      setScanFeedback({ type: "error", message: "✗ Invalid channel format", itemId: id });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    if (!sessionId) {
      setScanFeedback({ type: "error", message: "Session not initialized", itemId: id });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    setIsScanning(true);
    setScanFeedback({ type: "success", message: "⏳ Validating Channel...", itemId: id });

    try {
      const response = await submitScan(sessionId, channelValue, "outbound");
      console.log("✓ Channel validation response:", response);
      
      if (response.success) {
        setScanFeedback({ type: "success", message: "✓ Channel valid", itemId: id });
        updateField(id, "channel", channelValue);
        
        setTimeout(() => {
          setScanFeedback(null);
          document.getElementById(`resi-${id}`)?.focus();
        }, 1200);
      } else {
        setScanFeedback({ type: "error", message: `✗ ${response.error || "Invalid channel"}`, itemId: id });
        setTimeout(() => setScanFeedback(null), 3000);
      }
    } catch (error) {
      console.error("✗ Channel scan error:", error);
      setScanFeedback({ type: "error", message: "Scan failed", itemId: id });
      setTimeout(() => setScanFeedback(null), 3000);
    } finally {
      setIsScanning(false);
    }
  };

  // ─── Core Resi Validation Logic ───
  const submitResiValidation = async (id: string, resiValue: string) => {
    const itemIndex = items.findIndex(i => i.id === id);
    const currentItem = items[itemIndex];

    if (!currentItem.channel) {
      setScanFeedback({ type: "error", message: "Fill channel first", itemId: id });
      setTimeout(() => setScanFeedback(null), 2000);
      return;
    }

    if (!resiValue) {
      setScanFeedback({ type: "error", message: "Resi cannot be empty", itemId: id });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    if (!validateResiPattern(resiValue)) {
      setScanFeedback({ type: "error", message: "✗ Invalid resi format", itemId: id });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    if (!sessionId) {
      setScanFeedback({ type: "error", message: "Session not initialized", itemId: id });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    setIsScanning(true);
    setScanFeedback({ type: "success", message: "⏳ Validating Resi...", itemId: id });

    try {
      const response = await submitScan(sessionId, resiValue, "outbound");
      console.log("✓ Resi validation response:", response);
      
      if (response.success) {
        setScanFeedback({ type: "success", message: "✓ Resi valid", itemId: id });
        updateField(id, "resi", resiValue);
        
        setTimeout(() => {
          setScanFeedback(null);
          document.getElementById(`sku-${id}`)?.focus();
        }, 1200);
      } else {
        setScanFeedback({ type: "error", message: `✗ ${response.error || "Invalid resi"}`, itemId: id });
        setTimeout(() => setScanFeedback(null), 3000);
      }
    } catch (error) {
      console.error("✗ Resi scan error:", error);
      setScanFeedback({ type: "error", message: "Scan failed", itemId: id });
      setTimeout(() => setScanFeedback(null), 3000);
    } finally {
      setIsScanning(false);
    }
  };

  // ─── Core SKU Validation Logic ───
  const submitSKUValidation = async (id: string, skuValue: string) => {
    const itemIndex = items.findIndex(i => i.id === id);
    const currentItem = items[itemIndex];

    if (!currentItem.resi) {
      setScanFeedback({ type: "error", message: "Fill resi first", itemId: id });
      setTimeout(() => setScanFeedback(null), 2000);
      return;
    }

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
      const response = await submitScan(sessionId, skuValue, "outbound");
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

  // ─── Core Rack Validation Logic ───
  const submitRackValidation = async (id: string, rackValue: string) => {
    const itemIndex = items.findIndex(i => i.id === id);
    const currentItem = items[itemIndex];

    if (!currentItem.sku) {
      setScanFeedback({ type: "error", message: "Fill SKU first", itemId: id });
      setTimeout(() => setScanFeedback(null), 2000);
      return;
    }

    if (!rackValue) {
      setScanFeedback({ type: "error", message: "Rack cannot be empty", itemId: id });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    if (!validateRackPattern(rackValue)) {
      setScanFeedback({ type: "error", message: "✗ Invalid rack format", itemId: id });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    if (!sessionId) {
      setScanFeedback({ type: "error", message: "Session not initialized", itemId: id });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    setIsScanning(true);
    setScanFeedback({ type: "success", message: "⏳ Validating Rack...", itemId: id });

    try {
      const response = await submitScan(sessionId, rackValue, "outbound");
      console.log("✓ Rack validation response:", response);
      
      if (response.success) {
        setScanFeedback({ type: "success", message: "✓ Rack valid", itemId: id });
        updateField(id, "rack", rackValue);
        
        setTimeout(() => {
          setScanFeedback(null);
          // Create new row for next scan
          const newId = Date.now().toString();
          const newItems = [...items];
          newItems[itemIndex] = { ...currentItem, rack: rackValue };
          newItems.push({ id: newId, channel: "", resi: "", sku: "", qty: 1, rack: "", imageUrl: undefined });
          setItems(newItems);
          
          // Focus new channel field
          setTimeout(() => {
            document.getElementById(`channel-${newId}`)?.focus();
          }, 100);
        }, 1200);
      } else {
        setScanFeedback({ type: "error", message: `✗ ${response.error || "Invalid rack"}`, itemId: id });
        setTimeout(() => setScanFeedback(null), 3000);
      }
    } catch (error) {
      console.error("✗ Rack scan error:", error);
      setScanFeedback({ type: "error", message: "Scan failed", itemId: id });
      setTimeout(() => setScanFeedback(null), 3000);
    } finally {
      setIsScanning(false);
    }
  };

  // ─── Auto-Submit Trigger Functions ───
  const triggerChannelValidation = (id: string) => {
    const channelInput = document.getElementById(`channel-${id}`) as HTMLInputElement;
    if (channelInput?.value.trim()) {
      submitChannelValidation(id, channelInput.value.trim().toUpperCase());
    }
  };

  const triggerResiValidation = (id: string) => {
    const resiInput = document.getElementById(`resi-${id}`) as HTMLInputElement;
    if (resiInput?.value.trim()) {
      submitResiValidation(id, resiInput.value.trim().toUpperCase());
    }
  };

  const triggerSKUValidation = (id: string) => {
    const skuInput = document.getElementById(`sku-${id}`) as HTMLInputElement;
    if (skuInput?.value.trim()) {
      submitSKUValidation(id, skuInput.value.trim().toUpperCase());
    }
  };

  const triggerRackValidation = (id: string) => {
    const rackInput = document.getElementById(`rack-${id}`) as HTMLInputElement;
    if (rackInput?.value.trim()) {
      submitRackValidation(id, rackInput.value.trim().toUpperCase());
    }
  };

  // ─── Keyboard Handlers ───
  const handleChannelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === "Tab") {
      e.preventDefault();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const channelValue = (e.currentTarget).value.trim().toUpperCase();
      console.log("✓ Channel Enter pressed:", channelValue);
      submitChannelValidation(id, channelValue);
    }
  };

  const handleResiKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === "Tab") {
      e.preventDefault();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const resiValue = (e.currentTarget).value.trim().toUpperCase();
      console.log("✓ Resi Enter pressed:", resiValue);
      submitResiValidation(id, resiValue);
    }
  };

  const handleSKUKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
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

  const handleRackKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === "Tab") {
      e.preventDefault();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const rackValue = (e.currentTarget).value.trim().toUpperCase();
      console.log("✓ Rack Enter pressed:", rackValue);
      submitRackValidation(id, rackValue);
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
            <span className="text-[#1A1A1A]">Outbound</span>
          </nav>
          <div className="flex items-center gap-4">
            <h1 className="text-[24px] font-black text-[#1A1A1A] tracking-tight">
              Outbound Process
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
          
          {/* Pro Tips*/}
          <div className="flex items-center gap-2.5 bg-sky-50 border border-sky-200 px-4 py-2 rounded-xl shadow-sm w-fit">
              <Lightbulb size={16} className="text-sky-600 shrink-0" strokeWidth={2.5} />
              <p className="text-[13px] text-sky-800">
                <strong className="font-bold mr-1.5">Pro Tip!</strong>
                Scan Channel→Resi→SKU→Rack then press <kbd className="bg-white border border-sky-200 px-1.5 py-[2px] rounded text-[11px] font-bold font-sans shadow-sm mx-1 text-sky-800">Enter</kbd>.
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

            <div className="grid grid-cols-[1.5fr_2fr_2.5fr_60px_1.5fr_60px] gap-6 px-8 py-4 bg-white border-b border-[#F0F0EC] shadow-[0_4px_10px_-10px_rgba(0,0,0,0.1)] z-10 relative">
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">Channel</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">Resi</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">Product SKU</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase text-center">QTY</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">Rack</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase text-right"></span>
            </div>
        </div>

        <div className="flex flex-col divide-y divide-[#F7F7F5] overflow-y-auto flex-1 min-h-[250px]">
          {items.map((item, index) => {
            const isTemplate = item.channel === "" && item.resi === "" && item.sku === "" && item.rack === "";
            const resiLocked = item.channel.trim() === "";
            const skuLocked = item.resi.trim() === "";
            const rackLocked = item.sku.trim() === "";

            return (
              <div 
                key={item.id} 
                className={`group grid grid-cols-[1.5fr_2fr_2.5fr_60px_1.5fr_60px] gap-6 px-8 py-3.5 items-center transition-colors
                  ${isTemplate ? "bg-[#FAFAF8]" : "hover:bg-[#FAFAF8] bg-white"}
                `}
              >
                {/* Channel Input */}
                <div>
                  <div className="flex flex-col gap-1">
                    <input
                      id={`channel-${item.id}`}
                      type="text"
                      value={item.channel}
                      onFocus={() => generateNewSession()}
                      onChange={(e) => {
                        updateField(item.id, "channel", e.target.value.toUpperCase());
                        
                        if (autoSubmitTimers[`channel-${item.id}`]) {
                          clearTimeout(autoSubmitTimers[`channel-${item.id}`]);
                        }
                        
                        const timer = setTimeout(() => {
                          triggerChannelValidation(item.id);
                        }, 800);
                        
                        setAutoSubmitTimers(prev => ({
                          ...prev,
                          [`channel-${item.id}`]: timer
                        }));
                      }}
                      onKeyDown={(e) => handleChannelKeyDown(e, item.id)}
                      placeholder="Scan channel..."
                      className={`w-full bg-transparent text-[16px] font-bold outline-none placeholder:font-sans placeholder:italic transition-all
                        ${isTemplate ? "text-[#1A1A1A] placeholder:text-[#ABABAB]" : "text-[#1A1A1A] focus:bg-blue-50/30 focus:ring-1 focus:ring-blue-200/50"}
                      `}
                    />
                    {scanFeedback?.itemId === item.id && item.resi === "" && (
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

                {/* Resi Input */}
                <div className="relative flex items-center">
                  {resiLocked && <Lock size={14} className="absolute left-0 text-[#CDCDC9]" />}
                  <div className="flex flex-col gap-1 w-full">
                    <input
                      id={`resi-${item.id}`}
                      type="text"
                      value={item.resi}
                      onChange={(e) => {
                        updateField(item.id, "resi", e.target.value.toUpperCase());
                        
                        if (autoSubmitTimers[`resi-${item.id}`]) {
                          clearTimeout(autoSubmitTimers[`resi-${item.id}`]);
                        }
                        
                        const timer = setTimeout(() => {
                          triggerResiValidation(item.id);
                        }, 800);
                        
                        setAutoSubmitTimers(prev => ({
                          ...prev,
                          [`resi-${item.id}`]: timer
                        }));
                      }}
                      onKeyDown={(e) => handleResiKeyDown(e, item.id)}
                      disabled={resiLocked}
                      placeholder="Scan resi..."
                      className={`w-full bg-transparent text-[16px] font-bold font-mono outline-none placeholder:italic transition-all
                        ${resiLocked ? "pl-5 text-[#CDCDC9] placeholder:text-[#E8E8E4] cursor-not-allowed" : `pl-0 text-[#555] placeholder:text-[#CDCDC9] focus:bg-green-50/30 focus:ring-1 focus:ring-green-200/50`}
                      `}
                    />
                    {scanFeedback?.itemId === item.id && item.sku === "" && item.resi !== "" && (
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

                {/* SKU Input with Image Thumbnail */}
                <div className="relative flex items-center gap-3">
                  {skuLocked && <Lock size={14} className="absolute left-0 text-[#CDCDC9]" />}
                  <div className={`w-40 h-40 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                    item.imageUrl ? 'bg-white border-[#E8E8E4] shadow-sm overflow-hidden' : 'bg-[#F7F7F5] border-transparent'
                  }`}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="SKU" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={18} className="text-[#CDCDC9]" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1 w-full">
                    <input
                      id={`sku-${item.id}`}
                      type="text"
                      value={item.sku}
                      onChange={(e) => {
                        updateField(item.id, "sku", e.target.value.toUpperCase());
                        
                        if (autoSubmitTimers[`sku-${item.id}`]) {
                          clearTimeout(autoSubmitTimers[`sku-${item.id}`]);
                        }
                        
                        const timer = setTimeout(() => {
                          triggerSKUValidation(item.id);
                        }, 800);
                        
                        setAutoSubmitTimers(prev => ({
                          ...prev,
                          [`sku-${item.id}`]: timer
                        }));
                      }}
                      onKeyDown={(e) => handleSKUKeyDown(e, item.id)}
                      disabled={skuLocked}
                      placeholder="Scan SKU..."
                      className={`w-full bg-transparent text-[16px] font-bold font-mono outline-none placeholder:italic transition-all
                        ${skuLocked ? "pl-5 text-[#CDCDC9] placeholder:text-[#E8E8E4] cursor-not-allowed" : `pl-0 text-[#555] placeholder:text-[#CDCDC9] focus:bg-green-50/30 focus:ring-1 focus:ring-green-200/50`}
                      `}
                    />
                    {scanFeedback?.itemId === item.id && item.rack === "" && item.sku !== "" && (
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

                {/* QTY Display (Fixed to 1) */}
                <div className={`flex items-center justify-center bg-[#F0F0EC] rounded-lg py-1.5 border border-[#E8E8E4]
                  ${isTemplate ? 'opacity-30' : 'opacity-100'}
                `}>
                  <span className="text-[14px] font-bold text-[#888]">1</span>
                </div>

                {/* Rack Input */}
                <div className="relative flex items-center">
                  {rackLocked && <Lock size={14} className="absolute left-0 text-[#CDCDC9]" />}
                  <div className="flex flex-col gap-1 w-full">
                    <input
                      id={`rack-${item.id}`}
                      type="text"
                      value={item.rack}
                      onChange={(e) => {
                        updateField(item.id, "rack", e.target.value.toUpperCase());
                        
                        if (autoSubmitTimers[`rack-${item.id}`]) {
                          clearTimeout(autoSubmitTimers[`rack-${item.id}`]);
                        }
                        
                        const timer = setTimeout(() => {
                          triggerRackValidation(item.id);
                        }, 800);
                        
                        setAutoSubmitTimers(prev => ({
                          ...prev,
                          [`rack-${item.id}`]: timer
                        }));
                      }}
                      onKeyDown={(e) => handleRackKeyDown(e, item.id)}
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
          
          {/* Kiri: Teks Autosave */}
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
    </div>
  );
}