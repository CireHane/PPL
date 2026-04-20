"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { recentActivity, type ActionType } from "@/lib/mock-data";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";

// ─── Custom Hook for Click Outside ───
function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

// ─── Action Badge ──────────────────────────────────────────────────
const actionBadge: Record<ActionType, { label: string; className: string }> = {
  Inbound: { label: "Inbound", className: "bg-sky-100 text-sky-700 border border-sky-200" },
  Outbound: { label: "Outbound", className: "bg-amber-100 text-amber-700 border border-amber-200" },
  Adjustment: { label: "Adjustment", className: "bg-[#F0F0F0EC] text-[#555] border border-[#E0E0DC]" },
  Canceled: { label: "Canceled", className: "bg-red-100 text-red-600 border border-red-200" },
  Return: { label: "Return", className: "bg-purple-100 text-purple-700 border border-purple-200" },
  Reject: { label: "Reject", className: "bg-rose-100 text-rose-700 border border-rose-200" },
};

// ─── Metric Card Component ───────────
interface MetricCardProps {
  icon: React.ReactNode;
  iconBg: string;
  value: number;
  label: string;
  change: number;
  changePositive?: boolean;
}

function MetricCard({ icon, iconBg, value, label, change, changePositive = true }: MetricCardProps) {
  const isGoodTrend = changePositive ? change >= 0 : change < 0;
  const badgeBg = isGoodTrend ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600";
  const changeText = change > 0 ? `+${change}` : change.toString();

  return (
    <div className="flex-1 min-w-0 bg-white rounded-2xl border border-[#E8E8E4] px-5 py-5 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md shrink-0 ${badgeBg}`}>
          {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {changeText}
        </span>
      </div>
      <div>
        <p className="text-[26px] font-black text-[#1A1A1A] leading-none mb-1.5">
          {value.toLocaleString()}
          <span className="text-[14px] font-medium text-[#888] ml-1.5">unit</span>
        </p>
        <p className="text-[13px] font-medium text-[#888]">{label}</p>
      </div>
    </div>
  );
}

// ─── Mock Data Sinkronisasi Filter Global & Change Badges ──────────
type PeriodType = "Today" | "This Week" | "This Month" | "This Year";

const periodData: Record<PeriodType, { 
  metrics: { 
    sku: number, skuChange: number, 
    in: number, inChange: number, 
    out: number, outChange: number, 
    low: number, lowChange: number 
  }, 
  chart: { label: string, in: number, out: number }[] 
}> = {
  "Today": {
    metrics: { sku: 4821, skuChange: 2, in: 18, inChange: 15, out: 21, outChange: 11, low: 8, lowChange: -2 },
    chart: [
      { label: "08:00", in: 5, out: 2 },
      { label: "10:00", in: 8, out: 5 },
      { label: "12:00", in: 3, out: 10 },
      { label: "14:00", in: 2, out: 4 },
      { label: "16:00", in: 0, out: 0 },
    ]
  },
  "This Week": {
    metrics: { sku: 4821, skuChange: 12, in: 145, inChange: 35, out: 120, outChange: -10, low: 8, lowChange: 3 },
    chart: [
      { label: "Mon", in: 30, out: 20 },
      { label: "Tue", in: 40, out: 25 },
      { label: "Wed", in: 25, out: 35 },
      { label: "Thu", in: 35, out: 25 },
      { label: "Fri", in: 15, out: 15 },
    ]
  },
  "This Month": {
    metrics: { sku: 4821, skuChange: 45, in: 620, inChange: 120, out: 580, outChange: 80, low: 8, lowChange: -5 },
    chart: [
      { label: "Week 1", in: 150, out: 120 },
      { label: "Week 2", in: 180, out: 160 },
      { label: "Week 3", in: 140, out: 170 },
      { label: "Week 4", in: 150, out: 130 },
    ]
  },
  "This Year": {
    metrics: { sku: 4821, skuChange: 320, in: 7500, inChange: 1500, out: 7100, outChange: 1800, low: 8, lowChange: -15 },
    chart: [
      { label: "Q1", in: 1800, out: 1700 },
      { label: "Q2", in: 2100, out: 1900 },
      { label: "Q3", in: 1900, out: 2000 },
      { label: "Q4", in: 1700, out: 1500 },
    ]
  }
};

// ─── Page Component ────────────────────────────────────────────────
export default function DashboardPage() {
  // All hooks must be called BEFORE the early return check
  const { isLoading } = useProtectedRoute();
  const [period, setPeriod] = useState<PeriodType>("Today");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ Add fade-in state
  const [isVisible, setIsVisible] = useState(false);

  useClickOutside(dropdownRef, () => setDropdownOpen(false));

  // ✅ Trigger fade-in after loading
  useEffect(() => {
    if (!isLoading) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (isLoading) {
    return null; // Redirecting to login
  }
  
  const activity = recentActivity.slice(0, 8);

  const activeData = periodData[period];
  const maxChartValue = Math.max(...activeData.chart.map(d => Math.max(d.in, d.out)));

  return (
    <div className={`flex flex-col gap-6 relative transition-opacity duration-750 ${
     isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      
      {/* ── HEADER FULL WIDTH ── */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1.5">
          <nav className="flex items-center gap-1.5 text-[12px] font-bold">
            <Link href="/" className="text-[#1A1A1A] hover:underline underline-offset-4 transition-all">
              Dashboard
            </Link>
          </nav>
          <h1 className="text-[22px] font-black text-[#1A1A1A] tracking-tight">
            Odza Classic Warehouse System Management
          </h1>
        </div>

        {/* Global Period Filter */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-[#E8E8E4] text-[13px] font-bold text-[#1A1A1A] hover:bg-[#F7F7F5] transition-colors shadow-sm"
          >
            <Calendar size={14} className="text-[#888]" />
            {period}
            <ChevronDown size={14} className="text-[#888] ml-1" />
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-40 bg-white border border-[#E8E8E4] rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-[#F0F0EC] bg-[#FAFAF8]">
                <span className="text-[10px] font-bold text-[#888] uppercase tracking-widest">Filter Data</span>
              </div>
              {(["Today", "This Week", "This Month", "This Year"] as PeriodType[]).map((p) => (
                <button
                  key={p}
                  onClick={() => { setPeriod(p); setDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-[13px] font-bold hover:bg-[#F7F7F5] transition-colors ${period === p ? "text-[#1A1A1A] bg-[#FAFAF8]" : "text-[#555]"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT GRID ── */}
      <div className="flex gap-6 items-start">
        
        {/* ── Left / Main Column ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          
          {/* Metric Cards */}
          <div className="flex gap-4">
            <MetricCard
              icon={<Package size={22} className="text-stone-600" />}
              iconBg="bg-stone-100"
              value={activeData.metrics.sku}
              label="Total SKUs"
              change={activeData.metrics.skuChange}
              changePositive={true}
            />
            <MetricCard
              icon={<ArrowDownToLine size={22} className="text-sky-600" />}
              iconBg="bg-sky-100"
              value={activeData.metrics.in}
              label={`Inbound ${period}`}
              change={activeData.metrics.inChange}
              changePositive={true}
            />
            <MetricCard
              icon={<ArrowUpFromLine size={22} className="text-amber-600" />}
              iconBg="bg-amber-100"
              value={activeData.metrics.out}
              label={`Outbound ${period}`}
              change={activeData.metrics.outChange}
              changePositive={true}
            />
            <MetricCard
              icon={<AlertTriangle size={22} className="text-red-500" />}
              iconBg="bg-red-50"
              value={activeData.metrics.low}
              label="Low Stock Alerts!"
              change={activeData.metrics.lowChange}
              changePositive={false}
            />
          </div>

          {/* Volume Overview Chart */}
          <div className="bg-white rounded-2xl border border-[#E8E8E4] px-6 py-6 flex flex-col mb-2 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col gap-1">
                <h2 className="text-[15px] font-bold text-[#1A1A1A]">Movement Volume</h2>
                <p className="text-[12px] font-medium text-[#888]">Overview for {period}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-sky-500"></span>
                  <span className="text-[12px] font-bold text-[#555]">Inbound</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                  <span className="text-[12px] font-bold text-[#555]">Outbound</span>
                </div>
              </div>
            </div>

            <div className="relative h-[220px] w-full border-b border-[#F0F0EC] flex items-end justify-between px-4">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-full border-t border-dashed border-[#E8E8E4] h-0"></div>
                ))}
              </div>

              {activeData.chart.map((data, idx) => {
                const inHeight = maxChartValue > 0 ? Math.max((data.in / maxChartValue) * 100, 2) : 0;
                const outHeight = maxChartValue > 0 ? Math.max((data.out / maxChartValue) * 100, 2) : 0;
                
                return (
                  <div key={idx} className="relative flex flex-col items-center group z-10 w-full h-full justify-end">
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1A1A1A] text-white text-[11px] font-bold px-3 py-2 rounded-lg pointer-events-none whitespace-nowrap shadow-lg z-20">
                      <span className="text-sky-300">In: {data.in}</span> <span className="mx-1 text-[#555]">|</span> <span className="text-amber-300">Out: {data.out}</span>
                    </div>

                    <div className="flex items-end gap-1.5 w-full justify-center h-full pb-0">
                      <div 
                        className="w-full max-w-[28px] bg-sky-500 rounded-t-md hover:brightness-110 transition-all duration-700 ease-out"
                        style={{ height: `${inHeight}%` }}
                      ></div>
                      <div 
                        className="w-full max-w-[28px] bg-amber-400 rounded-t-md hover:brightness-110 transition-all duration-700 ease-out"
                        style={{ height: `${outHeight}%` }}
                      ></div>
                    </div>
                    <span className="absolute -bottom-7 text-[12px] font-bold text-[#888]">{data.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="h-7"></div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-white rounded-2xl border border-[#E8E8E4] overflow-hidden flex flex-col mb-10 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0EC] bg-white">
              <h2 className="text-[15px] font-bold text-[#1A1A1A]">Recent Activity</h2>
              <Link
                href="/audit-trail"
                className="flex items-center gap-1.5 text-[13px] font-bold text-sky-600 hover:text-sky-700 transition-colors"
              >
                View All
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-[2fr_1.2fr_1fr_1.2fr] px-6 py-3.5 bg-[#FAFAF8] border-b border-[#F0F0EC]">
              {["SKU", "OPERATOR", "ACTIONS", "TIME STAMPS"].map((col) => (
                <span key={col} className="text-[11px] font-bold tracking-widest text-[#ABABAB] uppercase">
                  {col}
                </span>
              ))}
            </div>

            <div className="divide-y divide-[#F7F7F5]">
              {activity.map((item) => {
                const badge = actionBadge[item.action];
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[2fr_1.2fr_1fr_1.2fr] px-6 py-4 hover:bg-[#FAFAF8] transition-colors items-center"
                  >
                    <span className="text-[14px] font-bold text-[#1A1A1A] font-mono tracking-tight">
                      {item.sku}
                    </span>
                    <span className="text-[14px] font-semibold text-[#333]">{item.operator}</span>
                    <span>
                      <span className={`inline-block text-[12px] font-bold px-3 py-1.5 rounded-md ${badge.className}`}>
                        {badge.label}
                      </span>
                    </span>
                    <span className="text-[13px] font-medium text-[#888]">{item.timestamp}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ── Right / Quick Actions Column (Sticky & Disederhanakan) ── */}
        <div className="w-[200px] shrink-0 flex flex-col gap-3 sticky top-0 pb-10">
          <Link
            href="/inbound"
            className="flex items-center justify-center h-12 rounded-xl bg-sky-600 text-white text-[14px] font-bold hover:bg-sky-700 transition-colors shadow-sm"
          >
            Inbound
          </Link>
          <Link
            href="/outbound"
            className="flex items-center justify-center h-12 rounded-xl bg-amber-400 text-[#1A1A1A] text-[14px] font-bold hover:bg-amber-500 transition-colors shadow-sm"
          >
            Outbound
          </Link>
        </div>

      </div>
    </div>
  );
}
