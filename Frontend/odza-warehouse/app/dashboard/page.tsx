"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { logPreview } from "@/lib/firebase";

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

type ActionType = "Inbound" | "Outbound" | "Adjustment" | "Canceled" | "Return";

const actionBadge: Record<ActionType, { label: string; className: string }> = {
  Inbound: { label: "Inbound", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  Outbound: { label: "Outbound", className: "bg-amber-50 text-amber-700 border border-amber-200" },
  Adjustment: { label: "Adjustment", className: "bg-[#F0F0F0] text-[#555] border border-[#E0E0DC]" },
  Canceled: { label: "Canceled", className: "bg-stone-100 text-stone-600 border border-stone-200" },
  Return: { label: "Return", className: "bg-purple-50 text-purple-700 border border-purple-200" },
  // Reject: { label: "Reject", className: "bg-rose-50 text-rose-700 border border-rose-200" },
};

interface MetricCardProps {
  icon: React.ReactNode;
  iconBg: string;
  value: number;
  label: string;
  change: number;
  changePositive?: boolean;
}

interface ActivityLog {
  id: string;
  sku: string;
  operator: string;
  action: ActionType;
  timestamp: string;
  rack?: string;
  qty?: number;
}

function MetricCard({ icon, iconBg, value, label, change, changePositive = true }: MetricCardProps) {
  const isGoodTrend = changePositive ? change >= 0 : change < 0;
  const badgeBg = isGoodTrend ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100";
  const changeText = change > 0 ? `+${change}` : change.toString();

  return (
    <div className="flex-1 min-w-0 bg-white rounded-md border border-[#E8E8E4] px-5 py-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className={`w-12 h-12 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${iconBg}`}>
          {icon}
        </div>
        <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md shrink-0 ${badgeBg}`}>
          {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {changeText}
        </span>
      </div>
      <div>
        <p className="text-[26px] font-black text-[#1A1A1A] leading-none mb-1.5">
          {value.toLocaleString('id-ID')}
          <span className="text-[12px] font-bold text-[#888] ml-1.5 uppercase tracking-widest">Pcs</span>
        </p>
        <p className="text-[13px] font-bold text-[#888]">{label}</p>
      </div>
    </div>
  );
}

// ─── Date helpers ───────────────────────────────────────────────────────────
const TODAY = new Date(2026, 3, 25); // 25 April 2026

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDateID(d: Date) {
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  // 0=Sun, convert to Mon-first (0=Mon ... 6=Sun)
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7;
}

// ─── Seeded data generator per date range ─────────────────────────────────
function generateMetrics(startDate: Date, endDate: Date) {
  const days = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1);
  const seed = startDate.getDate() + startDate.getMonth() * 31;
  const rng = (base: number, variance: number) => base + Math.round(Math.sin(seed + base) * variance);

  const inbound = rng(days * 3, days * 2);
  const outbound = rng(days * 2, days * 2);
  return {
    sku: 4821,
    skuChange: rng(2, 15),
    in: Math.max(1, inbound),
    inChange: rng(5, 10),
    out: Math.max(1, outbound),
    outChange: rng(3, 8),
    low: Math.max(1, rng(8, 3)),
    lowChange: rng(-1, 3),
  };
}

function generateChartData(startDate: Date, endDate: Date) {
  const days = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1);
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  if (days === 1) {
    // Hourly
    return [8, 10, 12, 14, 16].map((h, i) => ({
      label: `${String(h).padStart(2, "0")}:00`,
      in: Math.max(0, Math.round(Math.sin(startDate.getDate() + i * 1.5) * 5 + 6)),
      out: Math.max(0, Math.round(Math.cos(startDate.getDate() + i * 1.2) * 4 + 5)),
    }));
  } else if (days <= 14) {
    // Daily
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const seed = d.getDate() + i;
      return {
        label: days <= 7 ? weekdays[(d.getDay() + 6) % 7] : `${d.getDate()} ${months[d.getMonth()]}`,
        in: Math.max(0, Math.round(Math.sin(seed * 0.8) * 8 + 12)),
        out: Math.max(0, Math.round(Math.cos(seed * 0.7) * 7 + 10)),
      };
    });
  } else if (days <= 60) {
    // Weekly
    const weeks = Math.ceil(days / 7);
    return Array.from({ length: weeks }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i * 7);
      return {
        label: `Mgg ${i + 1}`,
        in: Math.max(0, Math.round(Math.sin(i * 1.2 + startDate.getDate()) * 30 + 60)),
        out: Math.max(0, Math.round(Math.cos(i * 1.1 + startDate.getDate()) * 25 + 50)),
      };
    });
  } else if (days <= 400) {
    // Monthly
    const monthCount = Math.ceil(days / 30);
    return Array.from({ length: Math.min(monthCount, 12) }, (_, i) => {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + i);
      return {
        label: months[d.getMonth()],
        in: Math.max(0, Math.round(Math.sin(i * 0.9 + startDate.getMonth()) * 80 + 200)),
        out: Math.max(0, Math.round(Math.cos(i * 0.8 + startDate.getMonth()) * 70 + 170)),
      };
    });
  } else {
    // Quarterly / yearly
    return ["Q1", "Q2", "Q3", "Q4"].map((q, i) => ({
      label: q,
      in: Math.max(0, Math.round(Math.sin(i * 1.3) * 200 + 600)),
      out: Math.max(0, Math.round(Math.cos(i * 1.1) * 150 + 500)),
    }));
  }
}

// ─── Preset definitions ────────────────────────────────────────────────────
type PresetKey = "today" | "last7" | "thisMonth" | "thisYear" | "custom";

interface DateRange {
  start: Date;
  end: Date;
}

function getPresetRange(key: PresetKey): DateRange {
  const today = startOfDay(TODAY);
  switch (key) {
    case "today":
      return { start: today, end: today };
    case "last7": {
      const s = new Date(today);
      s.setDate(s.getDate() - 6);
      return { start: s, end: today };
    }
    case "thisMonth":
      return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: today };
    case "thisYear":
      return { start: new Date(today.getFullYear(), 0, 1), end: today };
    default:
      return { start: today, end: today };
  }
}

function presetLabel(key: PresetKey, range: DateRange): string {
  switch (key) {
    case "today": return "Hari Ini";
    case "last7": return "7 Hari Terakhir";
    case "thisMonth": return "Bulan Ini";
    case "thisYear": return "Tahun Ini";
    case "custom": return `${formatDateID(range.start)} – ${formatDateID(range.end)}`;
  }
}

const MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

// ─── Calendar Component ────────────────────────────────────────────────────
interface CalendarMonthProps {
  year: number;
  month: number;
  selecting: Date | null;
  range: DateRange | null;
  hoverDate: Date | null;
  onDateClick: (d: Date) => void;
  onDateHover: (d: Date) => void;
}

function CalendarMonth({ year, month, selecting, range, hoverDate, onDateClick, onDateHover }: CalendarMonthProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = startOfDay(TODAY);

  const effectiveEnd = selecting && hoverDate
    ? (hoverDate >= selecting ? hoverDate : selecting)
    : null;
  const effectiveStart = selecting && hoverDate
    ? (hoverDate >= selecting ? selecting : hoverDate)
    : null;

  const isInRange = (d: Date) => {
    if (selecting && effectiveStart && effectiveEnd) {
      return d > effectiveStart && d < effectiveEnd;
    }
    if (!selecting && range) {
      return d > range.start && d < range.end;
    }
    return false;
  };

  const isRangeStart = (d: Date) => {
    if (selecting && effectiveStart) return d.getTime() === effectiveStart.getTime();
    if (!selecting && range) return d.getTime() === range.start.getTime();
    return false;
  };

  const isRangeEnd = (d: Date) => {
    if (selecting && effectiveEnd) return d.getTime() === effectiveEnd.getTime();
    if (!selecting && range) return d.getTime() === range.end.getTime();
    return false;
  };

  const isFuture = (d: Date) => d > today;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(year, month, i));

  return (
    <div className="flex-1">
      <div className="text-[14px] font-bold text-[#1A1A1A] text-center mb-3">
        {MONTHS_ID[month]} {year}
      </div>
      <div className="grid grid-cols-7 gap-0 text-center mb-1.5">
        {WEEKDAYS.map(d => (
          <span key={d} className="text-[10px] font-bold text-[#ABABAB] uppercase py-1">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0 text-center">
        {cells.map((d, idx) => {
          if (!d) return <div key={`empty-${idx}`} />;

          const inRange = isInRange(d);
          const isStart = isRangeStart(d);
          const isEnd = isRangeEnd(d);
          const isToday = d.getTime() === today.getTime();
          const future = isFuture(d);
          const isSelected = isStart || isEnd;

          let cellClass = "text-[12px] py-1.5 rounded-md cursor-pointer transition-colors ";
          if (future) {
            cellClass += "text-[#CDCDC9] cursor-not-allowed";
          } else if (isSelected) {
            cellClass += "font-bold bg-[#4E342E] text-white rounded-md";
          } else if (inRange) {
            cellClass += "bg-[#EFEBE9] text-[#4E342E] font-medium rounded-none";
          } else if (isToday) {
            cellClass += "font-bold text-[#4E342E] border border-[#D7CCC8]";
          } else {
            cellClass += "text-[#555] hover:bg-[#F5F5F3]";
          }

          return (
            <div
              key={d.toISOString()}
              className={cellClass}
              onClick={() => !future && onDateClick(d)}
              onMouseEnter={() => !future && onDateHover(d)}
            >
              {d.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { isLoading } = useProtectedRoute();
  const [preset, setPreset] = useState<PresetKey>("today");
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [calOpen, setCalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month" | "custom">("day");
  const [activity, setActivity] = useState<ActivityLog[]>([]);

  // Calendar navigation state
  const today = startOfDay(TODAY);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // right calendar month
  const [selectingStart, setSelectingStart] = useState<Date | null>(null); // first click
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const calRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useClickOutside(calRef, () => {
    setCalOpen(false);
    setSelectingStart(null);
  });

  useEffect(() => {
    if (!isLoading) {
      setIsVisible(true);
    }
  }, [isLoading]);

  // Get logs from database
  useEffect(()=>{
    logPreview()
      .then((data) => {
        setActivity(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error('Failed to fetch activity logs:', error);
        setActivity([]);
      });
  },[])

  // Compute active range
  const activeRange: DateRange = preset === "custom" && customRange
    ? customRange
    : getPresetRange(preset);

  const activeMetrics = generateMetrics(activeRange.start, activeRange.end);
  const activeChart = generateChartData(activeRange.start, activeRange.end);
  const maxChartValue = Math.max(...activeChart.map(d => Math.max(d.in, d.out)), 1);

  const displayLabel = presetLabel(preset, activeRange);

  // Left calendar = month before right
  const rightYear = calYear;
  const rightMonth = calMonth;
  let leftMonth = calMonth - 1;
  let leftYear = calYear;
  if (leftMonth < 0) { leftMonth = 11; leftYear -= 1; }

  const handlePreset = (key: PresetKey) => {
    setPreset(key);
    if (key !== "custom") {
      setCalOpen(false);
      setSelectingStart(null);
    } else {
      // Open custom mode
      setViewMode("custom");
    }
  };

  const handleViewMode = (mode: "day" | "week" | "month" | "custom") => {
    setViewMode(mode);
    if (mode === "day") { handlePreset("today"); return; }
    if (mode === "week") { handlePreset("last7"); return; }
    if (mode === "month") { handlePreset("thisMonth"); return; }
    // custom — stay open
  };

  const handleDateClick = (d: Date) => {
    if (!selectingStart) {
      setSelectingStart(d);
    } else {
      // Second click — finalize range
      const start = d < selectingStart ? d : selectingStart;
      const end = d < selectingStart ? selectingStart : d;
      setCustomRange({ start, end });
      setPreset("custom");
      setSelectingStart(null);
      setCalOpen(false);
    }
  };

  const navLeft = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const navRight = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const presets: { key: PresetKey; label: string }[] = [
    { key: "today", label: "Hari Ini" },
    { key: "last7", label: "7 Hari Terakhir" },
    { key: "thisMonth", label: "Bulan Ini" },
    { key: "thisYear", label: "Tahun Ini" },
    { key: "custom", label: "Kustom" },
  ];

  return (
    <div className={`flex flex-col gap-6 relative transition-opacity duration-850 ${isVisible && !isLoading ? 'opacity-100' : 'opacity-0'}`}>

      {/* ── HEADER ── */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[24px] font-black text-[#1A1A1A] tracking-tight">
            Dashboard Odza Warehouse
          </h1>
        </div>

        {/* ── CALENDAR DROPDOWN ── */}
        <div className="relative" ref={calRef}>
          <button
            onClick={() => { setCalOpen(!calOpen); setSelectingStart(null); }}
            className="flex items-center gap-3 px-4 py-2 bg-white rounded-md border border-[#E8E8E4] hover:border-[#CDCDC9] transition-colors shadow-sm cursor-pointer"
          >
            <CalendarIcon size={16} className="text-[#555]" />
            <span className="text-[13px] font-bold text-[#1A1A1A]">{displayLabel}</span>
          </button>

          {calOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] bg-white border border-[#E8E8E4] rounded-md shadow-2xl z-50 flex overflow-hidden text-[#1A1A1A]"
              style={{ width: viewMode === "custom" ? "680px" : "240px" }}
            >
              {/* Left Pane */}
              <div className="w-[180px] shrink-0 bg-[#FAFAF8] border-r border-[#E8E8E4] p-3 flex flex-col gap-1">
                {presets.map(p => (
                  <button
                    key={p.key}
                    onClick={() => handlePreset(p.key)}
                    className={`px-3 py-2 text-left text-[13px] rounded-md transition-colors cursor-pointer ${
                      preset === p.key && !(p.key === "custom" && viewMode !== "custom")
                        ? "font-bold text-[#4E342E] bg-[#EFEBE9] border border-[#D7CCC8]"
                        : "font-medium text-[#555] hover:bg-[#E8E8E4] border border-transparent"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Right Pane — only show for custom */}
              {viewMode === "custom" && (
                <div className="flex-1 p-4 flex flex-col gap-4">
                  {/* View mode tabs */}
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-[#888]">
                      {selectingStart
                        ? `Pilih tanggal akhir`
                        : (customRange ? `${formatDateID(customRange.start)} – ${formatDateID(customRange.end)}` : "Pilih rentang tanggal")}
                    </span>
                    <div className="flex rounded-md border border-[#E8E8E4] overflow-hidden">
                      {(["day", "week", "month", "custom"] as const).map((m, i, arr) => (
                        <button
                          key={m}
                          onClick={() => handleViewMode(m)}
                          className={`px-3 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                            viewMode === m ? "bg-[#4E342E] text-white" : "bg-[#FAFAF8] text-[#555] hover:bg-[#F0F0EC]"
                          } ${i < arr.length - 1 ? "border-r border-[#E8E8E4]" : ""}`}
                        >
                          {m === "day" ? "Hari" : m === "week" ? "Minggu" : m === "month" ? "Bulan" : "Kustom"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Two-month calendar */}
                  <div className="flex gap-6">
                    {/* Nav left */}
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <button onClick={navLeft} className="p-1 rounded hover:bg-[#F0F0EC] text-[#555] cursor-pointer transition-colors">
                          <ChevronLeft size={15} />
                        </button>
                        <div className="w-4" />
                      </div>
                      <CalendarMonth
                        year={leftYear} month={leftMonth}
                        selecting={selectingStart} range={preset === "custom" ? customRange : null}
                        hoverDate={hoverDate}
                        onDateClick={handleDateClick}
                        onDateHover={setHoverDate}
                      />
                    </div>

                    <div className="w-px bg-[#E8E8E4]" />

                    {/* Nav right */}
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-4" />
                        <button onClick={navRight} className="p-1 rounded hover:bg-[#F0F0EC] text-[#555] cursor-pointer transition-colors">
                          <ChevronRight size={15} />
                        </button>
                      </div>
                      <CalendarMonth
                        year={rightYear} month={rightMonth}
                        selecting={selectingStart} range={preset === "custom" ? customRange : null}
                        hoverDate={hoverDate}
                        onDateClick={handleDateClick}
                        onDateHover={setHoverDate}
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-[#ABABAB]">
                    {selectingStart ? "Klik tanggal akhir untuk menentukan rentang" : "Klik tanggal mulai untuk memilih rentang"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT GRID ── */}
      <div className="flex gap-6 items-start">

        {/* ── Kiri: Main Column ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">

          {/* Metric Cards */}
          <div className="flex gap-4">
            <MetricCard
              icon={<Package size={22} className="text-stone-600" />}
              iconBg="bg-stone-100"
              value={activeMetrics.sku}
              label="Total Jenis SKU"
              change={activeMetrics.skuChange}
              changePositive={true}
            />
            <MetricCard
              icon={<ArrowDownToLine size={22} className="text-[#4E342E]" />}
              iconBg="bg-[#EFEBE9]"
              value={activeMetrics.in}
              label="Total Inbound"
              change={activeMetrics.inChange}
              changePositive={true}
            />
            <MetricCard
              icon={<ArrowUpFromLine size={22} className="text-[#F57F17]" />}
              iconBg="bg-[#FFF8E1]"
              value={activeMetrics.out}
              label="Total Outbound"
              change={activeMetrics.outChange}
              changePositive={true}
            />
            <MetricCard
              icon={<AlertTriangle size={22} className="text-red-600" />}
              iconBg="bg-red-50"
              value={activeMetrics.low}
              label="Peringatan Stok Menipis"
              change={activeMetrics.lowChange}
              changePositive={false}
            />
          </div>

          {/* Volume Chart */}
          <div className="bg-white rounded-md border border-[#E8E8E4] px-6 py-6 flex flex-col mb-2 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col gap-1">
                <h2 className="text-[16px] font-bold text-[#1A1A1A]">Volume Pergerakan Barang</h2>
                <p className="text-[13px] font-medium text-[#888]">Data untuk {displayLabel}</p>
              </div>
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-[3px] bg-[#4E342E]"></span>
                  <span className="text-[12px] font-bold text-[#555] uppercase tracking-wider">Inbound</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-[3px] bg-[#D4AF37]"></span>
                  <span className="text-[12px] font-bold text-[#555] uppercase tracking-wider">Outbound</span>
                </div>
              </div>
            </div>

            <div className="relative h-[240px] w-full border-b border-[#E8E8E4] flex items-end justify-between px-6">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-full border-t border-dashed border-[#E8E8E4] h-0 opacity-50"></div>
                ))}
              </div>

              {activeChart.map((data, idx) => {
                const inHeight = Math.max((data.in / maxChartValue) * 100, 2);
                const outHeight = Math.max((data.out / maxChartValue) * 100, 2);
                return (
                  <div key={idx} className="relative flex flex-col items-center group z-10 w-full h-full justify-end cursor-pointer">
                    <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1A1A1A] text-white text-[12px] font-bold px-3 py-2 rounded-md pointer-events-none whitespace-nowrap shadow-xl z-20">
                      <span className="text-[#D7CCC8]">In: {data.in}</span>
                      <span className="mx-1.5 text-[#555]">|</span>
                      <span className="text-[#FFECB3]">Out: {data.out}</span>
                    </div>
                    <div className="flex items-end gap-1.5 w-full justify-center h-full pb-0">
                      <div
                        className="w-full max-w-[24px] bg-[#4E342E] rounded-t-sm group-hover:opacity-90 transition-all duration-700 ease-out shadow-sm"
                        style={{ height: `${inHeight}%` }}
                      ></div>
                      <div
                        className="w-full max-w-[24px] bg-[#D4AF37] rounded-t-sm group-hover:opacity-90 transition-all duration-700 ease-out shadow-sm"
                        style={{ height: `${outHeight}%` }}
                      ></div>
                    </div>
                    <span className="absolute -bottom-8 text-[12px] font-bold text-[#888]">{data.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="h-8"></div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-white rounded-md border border-[#E8E8E4] overflow-hidden flex flex-col mb-10 shadow-sm">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0F0EC] bg-white">
              <h2 className="text-[16px] font-bold text-[#1A1A1A]">Aktivitas Terakhir</h2>
              <Link
                href="/audit-trail"
                className="flex items-center gap-1.5 text-[13px] font-bold text-[#4E342E] hover:text-[#3E2723] hover:underline underline-offset-4 transition-all cursor-pointer"
              >
                Lihat Semua Histori
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-[2fr_1.2fr_1fr_1.2fr] px-6 py-3.5 bg-[#FAFAF8] border-b border-[#F0F0EC]">
              {["SKU Barang", "Operator", "Tindakan", "Waktu"].map((col) => (
                <span key={col} className="text-[11px] font-bold tracking-widest text-[#ABABAB] uppercase">
                  {col}
                </span>
              ))}
            </div>

            <div className="divide-y divide-[#F7F7F5]">
              {activity && activity.length > 0 ? activity.map((item) => {
                const badge = actionBadge[item.action];
                if (!badge) return null;
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[2fr_1.2fr_1fr_1.2fr] px-6 py-4 hover:bg-[#FAFAF8] transition-colors items-center"
                  >
                    <span className="text-[14px] font-bold text-[#1A1A1A] font-mono tracking-tight">{item.sku}</span>
                    <span className="text-[13px] font-bold text-[#555]">{item.operator}</span>
                    <span>
                      <span className={`inline-block text-[11px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider ${badge.className}`}>
                        {badge.label}
                      </span>
                    </span>
                    <span className="text-[13px] font-medium text-[#888]">{item.timestamp}</span>
                  </div>
                );
              }) : <div className="px-6 py-4 text-[13px] text-[#888]">Tidak ada data aktivitas</div>}
            </div>
          </div>

        </div>

        {/* ── Kanan: Quick Actions ── */}
        <div className="w-[200px] shrink-0 flex flex-col gap-3 sticky top-0 pb-10">
          <Link
            href="/inbound"
            className="flex items-center justify-center gap-2 h-14 rounded-md bg-[#4E342E] text-white text-[14px] font-bold hover:bg-[#3E2723] transition-colors shadow-md cursor-pointer"
          >
            <ArrowDownToLine size={18} /> INBOUND
          </Link>
          <Link
            href="/outbound"
            className="flex items-center justify-center gap-2 h-14 rounded-md bg-[#D4AF37] text-[#3E2723] text-[14px] font-black hover:bg-[#C29B27] transition-colors shadow-md cursor-pointer"
          >
            <ArrowUpFromLine size={18} /> OUTBOUND
          </Link>
        </div>

      </div>
    </div>
  );
}