"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Package,
  Grid3x3,
  Clock,
  HelpCircle,
} from "lucide-react";

const navItems = [
  { label: "Home",            icon: LayoutDashboard, href: "/" },
  { label: "Inbound",         icon: ArrowUp,         href: "/inbound" },
  { label: "Outbound",        icon: ArrowDown,       href: "/outbound" },
  { label: "Return & Reject", icon: RotateCcw,       href: "/returns" },
  { label: "All Products",    icon: Package,         href: "/products" },
  { label: "Rack Table",      icon: Grid3x3,         href: "/rack" },
  { label: "Audit Trail",     icon: Clock,           href: "/audit" },
  { label: "Help Guide",      icon: HelpCircle,      href: "/help" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-48 bg-white border-r border-gray-100 flex flex-col h-screen flex-shrink-0">

      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-100">
        <p className="text-lg font-semibold tracking-tight text-gray-900">ODZA</p>
        <p className="text-[9px] tracking-widest text-gray-400 uppercase mt-0.5">
          Classic Warehouse
        </p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map(({ label, icon: Icon, href }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors
              ${pathname === href
                ? "bg-gray-50 text-gray-900 font-medium"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
          >
            <Icon size={14} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Current Operator + User */}
      <div className="px-4 pb-4 pt-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 mb-2">Current Operator</p>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
            U
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900">User</p>
            <p className="text-[11px] text-gray-400">Admin</p>
          </div>
        </div>
      </div>

    </aside>
  );
}