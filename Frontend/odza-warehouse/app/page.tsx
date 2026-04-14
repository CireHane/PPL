"use client";
import { useState, useEffect } from "react";
import Topbar from "@/components/Topbar";
import MetricCard from "@/components/MetricCard";
import TopSellingChart from "@/components/TopSellingChart";
import RecentActivity from "@/components/RecentActivity";

export default function Home() {
  const [showAlert, setShowAlert] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation after mount
    setIsMounted(true);
  }, []);

  return (
    <>
      <Topbar />
      <main className={`flex-1 overflow-y-auto p-5 grid grid-cols-[1fr_240px] gap-4 items-start transition-opacity duration-700 ${
        isMounted ? 'opacity-100' : 'opacity-0'
      }`}>

        {/* Left column */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-base font-medium text-gray-900">Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">Odza Classic Warehouse System Management</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Daily Inbound"  value="91"  unit="unit"     type="sparkline" />
            <MetricCard label="Daily Outbound" value="62"  unit="unit"     type="sparkline" />
            <MetricCard label="Active Racks"   value="84%" unit="capacity" type="progress" progress={84} />
          </div>
          <TopSellingChart />
          <RecentActivity />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Urgent Alerts — banner kecil saja */}
          {showAlert && (
            <div className="flex items-center justify-between bg-gray-100 border border-gray-200 rounded-xl px-4 py-3">
              <p className="text-sm font-medium text-gray-700">Urgent Alerts Notification</p>
              <button
                onClick={() => setShowAlert(false)}
                className="text-gray-400 hover:text-gray-700 text-xs ml-3"
              >
                ✕
              </button>
            </div>
          )}

          {/* New Inbound & Stock — tombol terpisah */}
          <div className="flex flex-col gap-2">
            <button className="w-full bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium py-3 rounded-xl transition-colors">
              New Inbound
            </button>
            <button className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 text-sm py-3 rounded-xl transition-colors">
              Stock
            </button>
          </div>

          {/* Quick Tasks */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-900 mb-3">Quick Tasks</p>
            {["Inbound", "Outbound", "Re-Rack", "Products"].map((task) => (
              <button
                key={task}
                className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-100 rounded-lg mb-2 text-sm text-gray-800 hover:bg-gray-50 transition-colors last:mb-0"
              >
                {task}
                <span className="text-gray-400 text-base">›</span>
              </button>
            ))}
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                Operator Tip
              </p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Use Alt + S to instantly trigger the barcode scanner from any screen.
              </p>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}