"use client";
import { useState } from "react";
import Topbar from "@/components/Topbar";
import { Trash2, Save } from "lucide-react";

const scannedItems = [
  { id: 1, name: "Batik Kemeja Coklat Motif Kawung Size L", sku: "BT-023-BRW-L", qty: 4 },
  { id: 2, name: "Batik Kemeja Navy Motif Mega Mendung Size M", sku: "BT-024-NVY-M", qty: 1 },
  { id: 3, name: "Batik Kemeja Hitam Motif Parang Size XL", sku: "BT-025-BLK-XL", qty: 7 },
];

export default function InboundPage() {
  const [showAlert, setShowAlert] = useState(true);
  const [items, setItems] = useState(scannedItems);

  const updateQty = (id: number, delta: number) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
    ));
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <>
      <Topbar />
      <main className="flex-1 overflow-y-auto p-5">

        {/* Header row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-base font-medium text-gray-900">Inbound Processing</h1>
            <p className="text-xs text-gray-400 mt-0.5">Register new stock into the warehouse system</p>
          </div>
          {showAlert && (
            <div className="flex items-center gap-3 bg-gray-100 border border-gray-200 rounded-xl px-4 py-3">
              <span className="text-sm font-medium text-gray-700">Urgent Alerts Notification</span>
              <button onClick={() => setShowAlert(false)}
                className="text-gray-400 hover:text-gray-700 text-xs font-medium">✕</button>
            </div>
          )}
        </div>

        {/* 2 column layout */}
        <div className="grid grid-cols-[1fr_340px] gap-4">

          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-4">

            {/* Scan barcode button */}
            <button className="w-fit bg-gray-700 hover:bg-gray-800 text-white text-xs font-semibold tracking-widest px-6 py-3 rounded-lg transition-colors">
              SCAN BARCODE
            </button>

            {/* Barcode input */}
            <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-3">
              <span className="text-gray-400 font-mono text-sm font-bold">&lt;/&gt;</span>
              <input
                type="text"
                placeholder="Tap here, then scan barcode (Auto-enter)"
                className="flex-1 text-sm text-gray-500 outline-none placeholder:text-gray-400 bg-transparent"
                autoFocus
              />
            </div>

            {/* Last scanned product card */}
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-3">
                Last Scanned Product
              </p>
              <div className="flex gap-4">
                {/* Product image */}
                <div className="w-28 h-28 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <path d="M8 14h32v24H8z" fill="#d1d5db"/>
                    <path d="M16 14c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#9ca3af" strokeWidth="2" fill="none"/>
                  </svg>
                </div>
                {/* Product info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] text-gray-400 mb-0.5">SKU: HD-009-WHT-M</p>
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Batik Kemeja Putih Motif Parang Size M
                    </p>
                    <p className="text-[11px] text-gray-500">RAK: A-1</p>
                    <p className="text-[11px] text-gray-500">QUANTITY: 57</p>
                  </div>
                  {/* Destination rack dropdown */}
                  <div className="mt-3">
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-xs text-gray-500 outline-none">
                      <option value="">DESTINATION RACK</option>
                      <option value="A-1">Rack A-1</option>
                      <option value="A-2">Rack A-2</option>
                      <option value="B-1">Rack B-1</option>
                      <option value="B-2">Rack B-2</option>
                      <option value="C-1">Rack C-1</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col bg-white border border-gray-100 rounded-xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-900">Current Session Scanned Items</span>
              <span className="bg-gray-700 text-white text-[10px] font-medium px-2.5 py-1 rounded-full">
                {items.length * 4} Items
              </span>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 leading-snug">{item.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{item.sku}</p>
                  </div>
                  {/* Qty adjuster */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => updateQty(item.id, -1)}
                      className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-xs font-bold text-gray-700 flex items-center justify-center transition-colors">
                      −
                    </button>
                    <span className="text-xs font-semibold text-gray-900 w-5 text-center">
                      {String(item.qty).padStart(2, "0")}
                    </span>
                    <button onClick={() => updateQty(item.id, 1)}
                      className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-xs font-bold text-gray-700 flex items-center justify-center transition-colors">
                      +
                    </button>
                  </div>
                  {/* Delete */}
                  <button onClick={() => removeItem(item.id)}
                    className="w-7 h-7 bg-gray-100 hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
                    <Trash2 size={13} className="text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-4 pt-3 pb-4">
              <p className="text-[11px] text-gray-400 italic mb-3">
                Draft automatically saved at 14:02
              </p>
              <button className="w-full bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
                <Save size={15} />
                SAVE TO WAREHOUSE
              </button>
              <p className="text-[10px] text-gray-400 text-center mt-1.5">Last saved: 12 minutes ago</p>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}