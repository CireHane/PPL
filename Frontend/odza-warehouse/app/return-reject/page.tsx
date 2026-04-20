"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Trash2, 
  Lock,
  Lightbulb,
  Undo2,
  Redo2,
  PackageCheck
} from "lucide-react";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";

interface ReturnItem {
  id: string;
  channel: string;
  invoice: string;
  sku: string;
  rack: string;
  qty: number;
  reason: string;
  status: "none" | "return" | "reject";
}

const initialItems: ReturnItem[] = [
  { id: "1", channel: "SHOPEE", invoice: "2512247RUR5N", sku: "ZL20305B-L", rack: "O-6-1", qty: 1, reason: "Rusak digigit kucing", status: "return" },
  { id: "2", channel: "TIKTOK", invoice: "1733461758448", sku: "BW25102B", rack: "B-5-1", qty: 1, reason: "Dimakan anjing", status: "reject" },
  { id: "template-initial", channel: "", invoice: "", sku: "", rack: "", qty: 1, reason: "", status: "none" },
];

export default function ReturnRejectPage() {
  const { isLoading } = useProtectedRoute();
  const [items, setItems] = useState<ReturnItem[]>(initialItems);
  const [lastSaved, setLastSaved] = useState<string>("Just now");

  const [past, setPast] = useState<ReturnItem[][]>([]);
  const [future, setFuture] = useState<ReturnItem[][]>([]);

  const updateItemsWithHistory = useCallback((newItems: ReturnItem[]) => {
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

  useEffect(() => {
    const timer = setTimeout(() => {
      const now = new Date();
      setLastSaved(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearTimeout(timer);
  }, [items]);

  // ─── Global Shortcut (Alt/Option+S, Ctrl/Cmd+Z, dll) ───
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
        if (e.shiftKey) redo(); 
        else undo(); 
      } 
      else if (e.code === 'Escape') {
        (document.activeElement as HTMLElement)?.blur();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [undo, redo]);

  const totalItems = items.filter(item => item.channel.trim() !== "").length;

  const deleteItem = (id: string) => {
    let newItems = items.filter(item => item.id !== id);
    if (newItems.length === 0) {
      newItems = [{ id: Date.now().toString(), channel: "", invoice: "", sku: "", rack: "", qty: 1, reason: "", status: "none" }];
    } else if (newItems[newItems.length - 1].channel !== "" || newItems[newItems.length - 1].sku !== "") {
      newItems.push({ id: Date.now().toString(), channel: "", invoice: "", sku: "", rack: "", qty: 1, reason: "", status: "none" });
    }
    updateItemsWithHistory(newItems);
  };

  const updateField = (id: string, field: keyof ReturnItem, value: string) => {
    updateItemsWithHistory(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string, field: keyof ReturnItem) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "channel") {
        document.getElementById(`invoice-${id}`)?.focus();
      } else if (field === "invoice") {
        document.getElementById(`sku-${id}`)?.focus();
      } else if (field === "sku") {
        document.getElementById(`rack-${id}`)?.focus();
      } else if (field === "rack") {
        document.getElementById(`reason-${id}`)?.focus();
      } else if (field === "reason") {
        const isLastRow = items[items.length - 1].id === id;
        if (isLastRow) {
          const newId = Date.now().toString();
          updateItemsWithHistory([...items, { id: newId, channel: "", invoice: "", sku: "", rack: "", qty: 1, reason: "", status: "none" }]);
          setTimeout(() => { 
            const newChannelInput = document.getElementById(`channel-${newId}`);
            if(newChannelInput) {
                newChannelInput.focus();
                newChannelInput.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 50);
        } else {
          const currentIndex = items.findIndex(i => i.id === id);
          const nextId = items[currentIndex + 1]?.id;
          if (nextId) document.getElementById(`channel-${nextId}`)?.focus();
        }
      }
    }
  };

  if (isLoading) {
    return null; // Redirecting to login
  }

  return (
    <div className="flex flex-col gap-5 h-full relative">
      
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between shrink-0">
        <div className="flex flex-col gap-1.5">
          <nav className="flex items-center gap-1.5 text-[13px] font-bold text-[#888]">
            <Link href="/" className="hover:text-[#1A1A1A] transition-colors">Home</Link>
            <ChevronRight size={14} />
            <span className="text-[#1A1A1A]">Return & Reject</span>
          </nav>
          <div className="flex items-center gap-4">
            <h1 className="text-[24px] font-black text-[#1A1A1A] tracking-tight">
              Return & Reject Process
            </h1>
            
            <div className="flex items-center bg-white border border-[#CDCDC9] p-0.5 rounded-lg shadow-sm ml-2">
              <button onClick={undo} disabled={past.length === 0} className="p-1.5 px-2 rounded-md text-[#555] hover:bg-[#F0F0EC] hover:text-[#1A1A1A] disabled:opacity-30 disabled:hover:bg-transparent transition-all" title="Undo (Ctrl+Z / Cmd+Z)">
                <Undo2 size={16} strokeWidth={2.5} />
              </button>
              <div className="w-[1px] h-4 bg-[#E8E8E4]"></div>
              <button onClick={redo} disabled={future.length === 0} className="p-1.5 px-2 rounded-md text-[#555] hover:bg-[#F0F0EC] hover:text-[#1A1A1A] disabled:opacity-30 disabled:hover:bg-transparent transition-all" title="Redo (Ctrl+Shift+Z / Cmd+Shift+Z)">
                <Redo2 size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 bg-sky-50 border border-sky-200 px-4 py-2 rounded-xl shadow-sm w-fit mt-2">
          <Lightbulb size={16} className="text-sky-600 shrink-0" strokeWidth={2.5} />
          <p className="text-[13px] text-sky-800">
            <strong className="font-bold mr-1.5">Pro Tip!</strong>
            Gunakan <kbd className="bg-white border border-sky-200 px-1.5 py-[2px] rounded text-[11px] font-bold font-sans shadow-sm mx-1 text-sky-800">Alt / Option + S</kbd> untuk lompat ke baris baru & mulai <span className="italic font-medium ml-0.5">scan</span>.
          </p>
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

            <div className="grid grid-cols-[1.2fr_2fr_2fr_1fr_60px_2.5fr_100px_40px] gap-4 px-8 py-4 bg-white border-b border-[#F0F0EC] shadow-[0_4px_10px_-10px_rgba(0,0,0,0.1)] z-10 relative">
              <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">Channel</span>
              <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">Nomor Invoice</span>
              <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">SKU Code</span>
              <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">Rak</span>
              <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase text-center">QTY</span>
              <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">Penjelasan</span>
              <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase text-center">Action</span>
              <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase text-right"></span>
            </div>
        </div>

        <div className="flex flex-col divide-y divide-[#F7F7F5] overflow-y-auto flex-1 min-h-[250px]">
          {items.map((item, index) => {
            const isTemplate = item.channel === "" && item.invoice === "" && item.sku === "" && item.rack === "";
 
            const invoiceLocked = item.channel.trim() === ""; 
            const skuLocked = item.invoice.trim() === ""; 
            const rackLocked = item.sku.trim() === ""; 
            const reasonLocked = item.rack.trim() === "";

            return (
              <div 
                key={item.id} 
                className={`group grid grid-cols-[1.2fr_2fr_2fr_1fr_60px_2.5fr_100px_40px] gap-4 px-8 py-3.5 items-center transition-colors
                  ${isTemplate ? "bg-[#FAFAF8]" : "hover:bg-[#FAFAF8] bg-white"}
                `}
              >
                {/* CHANNEL Input */}
                <div>
                  <input
                    id={`channel-${item.id}`}
                    type="text"
                    value={item.channel}
                    onChange={(e) => updateField(item.id, "channel", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, item.id, "channel")}
                    placeholder="Channel..."
                    className={`w-full bg-transparent text-[15px] font-bold outline-none placeholder:font-sans placeholder:italic transition-all
                      ${isTemplate ? "text-[#1A1A1A] placeholder:text-[#ABABAB]" : "text-[#1A1A1A]"}
                    `}
                  />
                </div>

                {/* NOMOR INVOICE Input */}
                <div className="relative flex items-center">
                  {invoiceLocked && <Lock size={14} className="absolute left-0 text-[#CDCDC9]" />}
                  <input
                    id={`invoice-${item.id}`}
                    type="text"
                    value={item.invoice}
                    onChange={(e) => updateField(item.id, "invoice", e.target.value.toUpperCase())}
                    onKeyDown={(e) => handleKeyDown(e, item.id, "invoice")}
                    disabled={invoiceLocked}
                    placeholder="Nomor invoice..."
                    className={`w-full bg-transparent text-[15px] font-bold font-mono tracking-tight outline-none placeholder:font-sans placeholder:italic
                      ${invoiceLocked ? "pl-5 text-[#CDCDC9] placeholder:text-[#E8E8E4] cursor-not-allowed" : "pl-0 text-[#1A1A1A] placeholder:text-[#CDCDC9]"}
                    `}
                  />
                </div>

                {/* SKU CODE Input */}
                <div className="relative flex items-center">
                  {skuLocked && <Lock size={14} className="absolute left-0 text-[#CDCDC9]" />}
                  <input
                    id={`sku-${item.id}`}
                    type="text"
                    value={item.sku}
                    onChange={(e) => updateField(item.id, "sku", e.target.value.toUpperCase())}
                    onKeyDown={(e) => handleKeyDown(e, item.id, "sku")}
                    disabled={skuLocked}
                    placeholder="SKU Code..."
                    className={`w-full bg-transparent text-[15px] font-bold font-mono tracking-tight outline-none placeholder:font-sans placeholder:italic transition-all
                      ${skuLocked ? "pl-5 text-[#CDCDC9] placeholder:text-[#E8E8E4] cursor-not-allowed" : "pl-0 text-[#1A1A1A] placeholder:text-[#CDCDC9]"}
                    `}
                  />
                </div>

                {/* RAK Input */}
                <div className="relative flex items-center">
                  {rackLocked && <Lock size={14} className="absolute left-0 text-[#CDCDC9]" />}
                  <input
                    id={`rack-${item.id}`}
                    type="text"
                    value={item.rack}
                    onChange={(e) => updateField(item.id, "rack", e.target.value.toUpperCase())}
                    onKeyDown={(e) => handleKeyDown(e, item.id, "rack")}
                    disabled={rackLocked}
                    placeholder="Rak..."
                    className={`w-full bg-transparent text-[15px] font-bold outline-none placeholder:font-sans placeholder:italic transition-all
                      ${rackLocked ? "pl-5 text-[#CDCDC9] placeholder:text-[#E8E8E4] cursor-not-allowed" : "pl-0 text-[#555] placeholder:text-[#CDCDC9]"}
                    `}
                  />
                </div>

                {/* QTY (Always 1 - Disabled) */}
                <div className={`flex items-center justify-center bg-[#F0F0EC] rounded-lg py-1.5 border border-[#E8E8E4]
                  ${isTemplate ? 'opacity-30' : 'opacity-100'}
                `}>
                  <span className="text-[14px] font-bold text-[#888]">1</span>
                </div>

                <div className="relative flex items-center bg-[#F7F7F5] rounded-lg px-3 py-2 border border-[#E8E8E4] focus-within:border-[#CDCDC9] focus-within:bg-white transition-colors">
                  {reasonLocked && <Lock size={14} className="absolute left-3 text-[#CDCDC9]" />}
                  <input
                    id={`reason-${item.id}`}
                    type="text"
                    value={item.reason}
                    onChange={(e) => updateField(item.id, "reason", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, item.id, "reason")}
                    disabled={reasonLocked}
                    placeholder="Ketik penjelasan retur..."
                    className={`w-full bg-transparent text-[13px] font-medium outline-none placeholder:italic transition-all
                      ${reasonLocked ? "pl-6 text-[#CDCDC9] placeholder:text-[#E8E8E4] cursor-not-allowed" : "pl-0 text-[#1A1A1A] placeholder:text-[#ABABAB]"}
                    `}
                  />
                </div>

                {/* ACTION Dropdown */}
                <div className={`transition-opacity ${isTemplate ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                  <select
                    value={item.status}
                    onChange={(e) => updateField(item.id, "status", e.target.value)}
                    className={`appearance-none font-bold text-[12px] px-3 py-2 rounded-lg outline-none cursor-pointer text-center w-full transition-colors border
                      ${item.status === 'return' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' : 
                        item.status === 'reject' ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' : 
                        'bg-[#E8E8E4] text-[#555] border-[#CDCDC9] hover:bg-[#CDCDC9]'}
                    `}
                  >
                    <option value="none">None</option>
                    <option value="return">Return</option>
                    <option value="reject">Reject</option>
                  </select>
                </div>

                {/* Delete Action */}
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
          
          <div className="flex items-center">
            <p className="text-[12px] font-medium text-[#888] bg-[#F0F0EC] px-4 py-2 rounded-xl border border-[#E8E8E4] shadow-sm">
              Draft automatically saved at <span className="font-bold text-[#555] ml-1">{lastSaved}</span>
            </p>
          </div>

          <button className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#333] text-white px-8 py-4 rounded-xl text-[15px] font-bold transition-all shadow-md">
            <PackageCheck size={18} />
            PROCESS ITEM
          </button>
          
        </div>
      </div>

    </div>
  );
}