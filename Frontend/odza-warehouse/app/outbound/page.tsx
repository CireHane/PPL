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
  PackageCheck,
  ImageIcon
} from "lucide-react";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";

interface OutboundItem {
  id: string;
  channel: string;
  resi: string;
  sku: string;
  qty: number;
  rack: string;
  imageUrl?: string;
}

// Data Dummy Outbound
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
  { id: "template-initial", channel: "", resi: "", sku: "", qty: 1, rack: "" },
];

export default function OutboundPage() {
  const { isLoading } = useProtectedRoute();
  const [items, setItems] = useState<OutboundItem[]>(initialItems);
  const [lastSaved, setLastSaved] = useState<string>("Just now");

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

  useEffect(() => {
    const timer = setTimeout(() => {
      const now = new Date();
      setLastSaved(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearTimeout(timer);
  }, [items]);

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
      newItems = [{ id: Date.now().toString(), channel: "", resi: "", sku: "", qty: 1, rack: "" }];
    } else if (newItems[newItems.length - 1].channel !== "" || newItems[newItems.length - 1].sku !== "") {
      newItems.push({ id: Date.now().toString(), channel: "", resi: "", sku: "", qty: 1, rack: "" });
    }
    updateItemsWithHistory(newItems);
  };

  const updateField = (id: string, field: keyof OutboundItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Simulasi Thumbnail
        if (field === "sku" && typeof value === 'string') {
           if (value.trim() !== "") {
               updatedItem.imageUrl = "https://p16-oec-sg.ibyteimg.com/tos-alisg-i-aphluv4xwc-sg/2fb77797a53f44488c7fede03e5b9d2c~tplv-aphluv4xwc-origin-jpeg.jpeg?dr=15568&t=555f072d&ps=933b5bde&shp=1c65f68b&shcp=9b759fb9&idc=my2&from=476444299";
           } else {
               updatedItem.imageUrl = undefined;
           }
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string, field: keyof OutboundItem) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "channel") {
        document.getElementById(`resi-${id}`)?.focus();
      } else if (field === "resi") {
        document.getElementById(`sku-${id}`)?.focus();
      } else if (field === "sku") {
        document.getElementById(`rack-${id}`)?.focus();
      } else if (field === "rack") {
        const isLastRow = items[items.length - 1].id === id;
        if (isLastRow) {
          const newId = Date.now().toString();
          updateItemsWithHistory([...items, { id: newId, channel: "", resi: "", sku: "", qty: 1, rack: "" }]);
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
            <span className="text-[#1A1A1A]">Outbound</span>
          </nav>
          <div className="flex items-center gap-4">
            <h1 className="text-[24px] font-black text-[#1A1A1A] tracking-tight">
              Outbound Process
            </h1>
            <div className="flex items-center bg-white border border-[#CDCDC9] p-0.5 rounded-lg shadow-sm ml-2">
              <button onClick={undo} disabled={past.length === 0} className="p-1.5 px-2 rounded-md text-[#555] hover:bg-[#F0F0EC] disabled:opacity-30 transition-all"><Undo2 size={16} strokeWidth={2.5} /></button>
              <div className="w-[1px] h-4 bg-[#E8E8E4]"></div>
              <button onClick={redo} disabled={future.length === 0} className="p-1.5 px-2 rounded-md text-[#555] hover:bg-[#F0F0EC] disabled:opacity-30 transition-all"><Redo2 size={16} strokeWidth={2.5} /></button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 bg-sky-50 border border-sky-200 px-4 py-2 rounded-xl shadow-sm w-fit mt-2">
          <Lightbulb size={16} className="text-sky-600 shrink-0" strokeWidth={2.5} />
          <p className="text-[13px] text-sky-800">
            <strong className="font-bold mr-1.5">Pro Tip!</strong>
            Gunakan <kbd className="bg-white border border-sky-200 px-1.5 py-[2px] rounded text-[11px] font-bold shadow-sm mx-1">Alt / Option + S</kbd> untuk lompat ke baris baru & mulai <span className="italic font-medium ml-0.5">scan</span>.
          </p>
        </div>
      </div>

      {/* ── MAIN CONTENT (TABLE AREA) ── */}
      <div className="bg-white rounded-[24px] border border-[#E8E8E4] shadow-sm flex flex-col overflow-hidden mb-1 flex-1 min-h-0 mt-2">
        <div className="shrink-0">
          <div className="bg-[#FAFAF8] px-8 py-5 flex items-center justify-between border-b border-[#E8E8E4]">
            <h2 className="text-[16px] font-bold text-[#1A1A1A]">Current Session Scanned Items</h2>
            <div className="bg-[#E8E8E4] text-[#1A1A1A] px-4 py-1.5 rounded-full text-[13px] font-bold">{totalItems} Items</div>
          </div>

          {/* Grid diperbarui: Posisi kolom diubah (Channel, Resi, SKU, RACK, QTY) */}
          <div className="grid grid-cols-[1.5fr_2fr_2.5fr_1.5fr_60px_60px] gap-6 px-8 py-4 bg-white border-b border-[#F0F0EC] shadow-[0_4px_10px_-10px_rgba(0,0,0,0.1)] z-10 relative">
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">Channel</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">Resi</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">Product SKU</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase">Rack</span>
            <span className="text-[12px] font-bold tracking-widest text-[#888] uppercase text-center">QTY</span>
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
              <div key={item.id} className={`group grid grid-cols-[1.5fr_2fr_2.5fr_1.5fr_60px_60px] gap-6 px-8 py-4 items-center transition-colors ${isTemplate ? "bg-[#FAFAF8]" : "hover:bg-[#FAFAF8] bg-white"}`}>
                
                {/* Channel Input */}
                <input 
                  id={`channel-${item.id}`} 
                  type="text" 
                  value={item.channel} 
                  onChange={(e) => updateField(item.id, "channel", e.target.value.toUpperCase())} 
                  onKeyDown={(e) => handleKeyDown(e, item.id, "channel")} 
                  placeholder="Scan channel..." 
                  className={`w-full bg-transparent text-[16px] font-bold outline-none placeholder:font-sans placeholder:italic transition-all
                    ${isTemplate ? "text-[#1A1A1A] placeholder:text-[#ABABAB]" : "text-[#1A1A1A]"}
                  `} 
                />
                
                {/* Resi Input */}
                <div className="relative flex items-center">
                  {resiLocked && <Lock size={14} className="absolute left-0 text-[#CDCDC9]" />}
                  <input id={`resi-${item.id}`} type="text" value={item.resi} onChange={(e) => updateField(item.id, "resi", e.target.value.toUpperCase())} onKeyDown={(e) => handleKeyDown(e, item.id, "resi")} disabled={resiLocked} placeholder="Scan resi..." className={`w-full bg-transparent text-[15px] font-bold font-mono outline-none ${resiLocked ? "pl-5 text-[#CDCDC9] placeholder:text-[#E8E8E4] cursor-not-allowed" : "pl-0 text-[#1A1A1A] placeholder:text-[#CDCDC9]"}`} />
                </div>

                {/* SKU + Visual Verification (Thumbnail) */}
                <div className="relative flex items-center gap-3">
                  {skuLocked && <Lock size={14} className="absolute left-0 text-[#CDCDC9]" />}
                  <div className={`w-40 h-40 rounded-lg border flex items-center justify-center shrink-0 transition-all ${item.imageUrl ? 'bg-white border-[#E8E8E4] shadow-sm overflow-hidden' : 'bg-[#F7F7F5] border-transparent'}`}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="SKU" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={18} className="text-[#CDCDC9]" />
                    )}
                  </div>
                  <input id={`sku-${item.id}`} type="text" value={item.sku} onChange={(e) => updateField(item.id, "sku", e.target.value.toUpperCase())} onKeyDown={(e) => handleKeyDown(e, item.id, "sku")} disabled={skuLocked} placeholder="Scan SKU..." className={`w-full bg-transparent text-[15px] font-bold font-mono outline-none ${skuLocked ? "pl-5 text-[#CDCDC9] placeholder:text-[#E8E8E4] cursor-not-allowed" : "pl-0 text-[#1A1A1A] placeholder:text-[#CDCDC9]"}`} />
                </div>

                {/* Rack Input (DIPINDAH KE SINI) */}
                <div className="relative flex items-center">
                  {rackLocked && <Lock size={14} className="absolute left-0 text-[#CDCDC9]" />}
                  <input id={`rack-${item.id}`} type="text" value={item.rack} onChange={(e) => updateField(item.id, "rack", e.target.value.toUpperCase())} onKeyDown={(e) => handleKeyDown(e, item.id, "rack")} disabled={rackLocked} placeholder="Scan rack..." className={`w-full bg-transparent text-[15px] font-bold outline-none ${rackLocked ? "pl-5 text-[#CDCDC9] placeholder:text-[#E8E8E4] cursor-not-allowed" : "pl-0 text-[#555] placeholder:text-[#CDCDC9]"}`} />
                </div>

                {/* QTY (Always 1 - Disabled) (DIPINDAH KE SINI) */}
                <div className={`flex items-center justify-center bg-[#F0F0EC] rounded-lg py-1.5 border border-[#E8E8E4]
                  ${isTemplate ? 'opacity-30' : 'opacity-100'}
                `}>
                  <span className="text-[14px] font-bold text-[#888]">1</span>
                </div>

                {/* Action / Trash */}
                <div className="flex justify-end">
                  <button onClick={() => deleteItem(item.id)} className={`p-2 text-[#CDCDC9] hover:text-red-500 rounded-lg transition-all ${isTemplate && index === items.length - 1 ? 'opacity-0 cursor-default' : 'opacity-0 group-hover:opacity-100'}`}><Trash2 size={20} /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 pt-3 pb-4 mt-auto flex justify-between items-center gap-4">
        <p className="text-[12px] font-medium text-[#888] bg-[#F0F0EC] px-4 py-2 rounded-xl border border-[#E8E8E4] shadow-sm">Draft automatically saved at <span className="font-bold text-[#555] ml-1">{lastSaved}</span></p>
        <button className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#333] text-white px-8 py-4 rounded-xl text-[15px] font-bold shadow-md transition-all"><PackageCheck size={18} /> PROCESS ITEM</button>
      </div>
    </div>
  );
}