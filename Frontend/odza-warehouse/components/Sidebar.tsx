"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ArrowUp, ArrowDown,
  RotateCcw, Warehouse, Clock, HelpCircle,
} from "lucide-react";

const navItems = [
  { label: "Home",            icon: LayoutDashboard, href: "/" },
  { label: "Products",        icon: Package,         href: "/products" },
  { label: "Inbound",         icon: ArrowUp,         href: "/inbound" },
  { label: "Outbound",        icon: ArrowDown,       href: "/outbound" },
  { label: "Return & Reject", icon: RotateCcw,       href: "/returns" },
  { label: "Warehouse Mgmt",  icon: Warehouse,       href: "/warehouse" },
  { label: "Audit Trail",     icon: Clock,           href: "/audit" },
  { label: "Help Guide",      icon: HelpCircle,      href: "/help" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-48 bg-white border-r border-gray-100 flex flex-col h-screen flex-shrink-0">
      <div className="px-4 py-4 border-b border-gray-100">
        <p className="text-lg font-semibold tracking-tight text-gray-900">ODZA</p>
        <p className="text-[9px] tracking-widest text-gray-400 uppercase mt-0.5">Classic Warehouse</p>
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map(({ label, icon: Icon, href }) => (
          <Link key={href} href={href}
            className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors
              ${pathname === href
                ? "bg-gray-50 text-gray-900 font-medium"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
            <Icon size={14} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">U</div>
        <div>
          <p className="text-xs font-medium text-gray-900">User</p>
          <p className="text-[11px] text-gray-400">Admin</p>
        </div>
      </div>
    </aside>
  );
}