import Link from "next/link";
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { dashboardMetrics, recentActivity, type ActionType } from "@/lib/mock-data";

// ─── Action Badge ──────────────────────────────────────────────────
const actionBadge: Record<ActionType, { label: string; className: string }> = {
  Inbound: {
    label: "Inbound",
    className: "bg-sky-100 text-sky-700 border border-sky-200",
  },
  Outbound: {
    label: "Outbound",
    className: "bg-amber-100 text-amber-700 border border-amber-200",
  },
  Adjustment: {
    label: "Adjustment",
    className: "bg-[#F0F0EC] text-[#555] border border-[#E0E0DC]",
  },
  Canceled: {
    label: "Canceled",
    className: "bg-red-100 text-red-600 border border-red-200",
  },
  Return: {
    label: "Return",
    className: "bg-purple-100 text-purple-700 border border-purple-200",
  },
  Reject: {
    label: "Reject",
    className: "bg-rose-100 text-rose-700 border border-rose-200",
  },
};

// ─── Metric Card Component ─────────────────────────────────────────
interface MetricCardProps {
  icon: React.ReactNode;
  iconBg: string;
  value: number;
  label: string;
  change: number;
  changePositive?: boolean;
}

function MetricCard({ icon, iconBg, value, label, change, changePositive = true }: MetricCardProps) {
  const isPositive = changePositive ? change > 0 : change < 0;
  const badgeBg = changePositive
    ? change > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
    : change > 0 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700";

  return (
    <div className="flex-1 min-w-0 bg-white rounded-2xl border border-[#E8E8E4] px-5 py-5 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md shrink-0 ${badgeBg}`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          +{Math.abs(change)}
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

// ─── Page ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const activity = recentActivity.slice(0, 5);

  return (
    <div className="flex flex-col gap-6 h-full">
      
      {/* ── HEADER: Breadcrumb & Title (FULL WIDTH DI ATAS) ── */}
      <div className="flex flex-col gap-1.5">
        {/* Breadcrumb Navigasi */}
        <nav className="flex items-center gap-1.5 text-[12px] font-bold">
          <Link href="/" className="text-[#1A1A1A] hover:underline underline-offset-4 transition-all">
            Dashboard
          </Link>
          {/* Contoh jika nanti di page lain:
          <ChevronRight size={14} className="text-[#ABABAB]" />
          <span className="text-[#888]">Inbound</span>
          */}
        </nav>
        {/* Title Page */}
        <h1 className="text-[22px] font-black text-[#1A1A1A] tracking-tight">
          Odza Classic Warehouse System Management
        </h1>
      </div>

      {/* ── CONTENT GRID: Kiri (Main) & Kanan (Actions) ── */}
      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* ── Left / Main Column ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          
          {/* Metric Cards */}
          <div className="flex gap-4">
            <MetricCard
              icon={<Package size={22} className="text-stone-600" />}
              iconBg="bg-stone-100"
              value={dashboardMetrics.totalSKUs}
              label="Total SKUs"
              change={dashboardMetrics.skuChange}
              changePositive
            />
            <MetricCard
              icon={<ArrowDownToLine size={22} className="text-sky-600" />}
              iconBg="bg-sky-100"
              value={dashboardMetrics.inboundToday}
              label="Inbound Today"
              change={dashboardMetrics.inboundChange}
              changePositive
            />
            <MetricCard
              icon={<ArrowUpFromLine size={22} className="text-amber-600" />}
              iconBg="bg-amber-100"
              value={dashboardMetrics.outboundToday}
              label="Outbound Today"
              change={dashboardMetrics.outboundChange}
              changePositive
            />
            <MetricCard
              icon={<AlertTriangle size={22} className="text-red-500" />}
              iconBg="bg-red-50"
              value={dashboardMetrics.lowStockAlerts}
              label="Low Stock Alerts!"
              change={dashboardMetrics.lowStockChange}
              changePositive={false}
            />
          </div>

          {/* Recent Activity Table */}
          <div className="bg-white rounded-2xl border border-[#E8E8E4] overflow-hidden flex flex-col">
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

        {/* ── Right / Quick Actions Column ── */}
        {/* Catatan: pt-0 karena tombol sekarang sudah turun terdorong oleh Header di atasnya */}
        <div className="w-[200px] shrink-0 flex flex-col gap-3 pt-0">
          <Link
            href="/inbound"
            className="flex items-center justify-center h-12 rounded-xl bg-sky-600 text-white text-[14px] font-bold hover:bg-sky-700 transition-colors shadow-sm"
          >
            + Inbound
          </Link>
          <Link
            href="/outbound"
            className="flex items-center justify-center h-12 rounded-xl bg-amber-400 text-[#1A1A1A] text-[14px] font-bold hover:bg-amber-500 transition-colors shadow-sm"
          >
            + Outbound
          </Link>
          <Link
            href="/return-reject"
            className="flex items-center justify-center h-12 rounded-xl bg-white text-[#1A1A1A] text-[14px] font-bold border border-[#E8E8E4] hover:bg-[#F7F7F5] transition-colors mt-2"
          >
            Return & Reject
          </Link>
          <Link
            href="/racks"
            className="flex items-center justify-center h-12 rounded-xl bg-white text-[#1A1A1A] text-[14px] font-bold border border-[#E8E8E4] hover:bg-[#F7F7F5] transition-colors"
          >
            Racks Table
          </Link>
          <Link
            href="/products"
            className="flex items-center justify-center h-12 rounded-xl bg-white text-[#1A1A1A] text-[14px] font-bold border border-[#E8E8E4] hover:bg-[#F7F7F5] transition-colors"
          >
            All Products
          </Link>
        </div>

      </div>
    </div>
  );
}