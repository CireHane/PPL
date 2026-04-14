"use client";
import { useState } from "react";
import Topbar from "@/components/Topbar";
import { AlertTriangle, Printer, QrCode } from "lucide-react";

const orderItems = [
  {
    id: 1,
    sku: "BT-023-BRW-L",
    name: "Batik Kemeja Coklat Motif Kawung Size L",
    rack: "Rack A1",
    confirmed: true,
  },
  {
    id: 2,
    sku: "BT-025-BLK-XL",
    name: "Batik Kemeja Hitam Motif Parang Size XL",
    rack: "Rack A1",
    confirmed: false,
  },
];

export default function OutboundPage() {
  const [showAlert, setShowAlert] = useState(true);
  const [items, setItems] = useState(orderItems);

  const confirmedCount = items.filter((i) => i.confirmed).length;
  const allConfirmed = confirmedCount === items.length;

  const toggleConfirm = (id: number) => {
    setItems(items.map((item) =>
      item.id === id ? { ...item, confirmed: !item.confirmed } : item
    ));
  };

  return (
    <>
      <Topbar />
      <main className="flex-1 overflow-y-auto p-5">

        {/* Header row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-base font-medium text-gray-900">Outbound Processing</h1>
            <p className="text-xs text-gray-400 mt-0.5">Prepare and validate stock for outbound shipment</p>
          </div>
          {showAlert && (
            <div className="flex items-center gap-3 bg-gray-100 border border-gray-200 rounded-xl px-4 py-3">
              <span className="text-sm font-medium text-gray-700">Urgent Alerts Notification</span>
              <button
                onClick={() => setShowAlert(false)}
                className="text-gray-400 hover:text-gray-700 text-xs"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* 2 column layout */}
        <div className="grid grid-cols-[1fr_340px] gap-4">

          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-4">

            {/* Step 1 — Scan receipt */}
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Step 1: Scan Order Receipt / Resi Here
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <QrCode size={20} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Tap here, then scan barcode (Auto-enter)"
                  className="flex-1 text-sm text-gray-500 outline-none placeholder:text-gray-400 bg-transparent"
                  autoFocus
                />
              </div>
            </div>

            {/* Order Information */}
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] text-blue-600 font-bold">i</span>
                </div>
                <p className="text-sm font-medium text-gray-800">Order Information</p>
              </div>

              {/* Order ID + Customer */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Order ID</p>
                  <p className="text-sm font-bold text-gray-900">INV-99823</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Customer</p>
                  <p className="text-sm font-bold text-gray-900">Rafelixa R.I</p>
                </div>
              </div>

              {/* Warning alert */}
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-0.5">
                    Customer Notes / Cancellation Alert
                  </p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    "Fragile handling required. Please double-wrap the jacket. Customer requested no plastic hangers."
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 — Validate barcode */}
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Step 2: Input Product Barcode to Validate
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-3">
                <span className="text-gray-400 font-mono text-sm font-bold">&lt;/&gt;</span>
                <input
                  type="text"
                  placeholder="Input SKU Barcode.."
                  className="flex-1 text-sm text-gray-500 outline-none placeholder:text-gray-400 bg-transparent"
                />
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col bg-white border border-gray-100 rounded-xl overflow-hidden">

            {/* Header */}
            <div className="flex items-start justify-between px-4 py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Items Required for this Order</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Total Items: {items.length}</p>
              </div>
              <span className="bg-gray-800 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                IN PROGRESS
              </span>
            </div>

            {/* Item cards */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50 p-3 flex flex-col gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl border p-3 flex items-center gap-3 transition-colors
                    ${item.confirmed
                      ? "bg-white border-gray-100"
                      : "bg-gray-50 border-gray-100"
                    }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleConfirm(item.id)}
                    className={`w-7 h-7 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                      ${item.confirmed
                        ? "bg-gray-800 border-gray-800"
                        : "bg-white border-gray-300"
                      }`}
                  >
                    {item.confirmed && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>

                  {/* Product image */}
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                      <path d="M8 14h32v24H8z" fill="#d1d5db"/>
                      <path d="M16 14c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#9ca3af" strokeWidth="2" fill="none"/>
                    </svg>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 mb-0.5">{item.sku}</p>
                    <p className="text-xs font-semibold text-gray-900 leading-snug">{item.name}</p>
                    <span className="inline-block mt-1 bg-gray-800 text-white text-[9px] font-medium px-2 py-0.5 rounded">
                      {item.rack}
                    </span>
                  </div>

                  {/* Status pill */}
                  <div className="flex-shrink-0">
                    {item.confirmed ? (
                      <span className="bg-gray-800 text-white text-[9px] font-semibold px-2 py-1 rounded-full">
                        CONFIRMED
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-400 text-[9px] font-semibold px-2 py-1 rounded-full">
                        PENDING SCAN
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Empty placeholder */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl h-16" />
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                  Items Validated
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {confirmedCount}/{items.length}
                </p>
              </div>
              <button
                disabled={!allConfirmed}
                className={`flex items-center gap-2 bg-gray-800 text-white text-xs font-semibold px-4 py-3 rounded-xl transition-colors
                  ${allConfirmed
                    ? "hover:bg-gray-700 cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                  }`}
              >
                <Printer size={13} />
                Complete & Print Shipping Label
              </button>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}