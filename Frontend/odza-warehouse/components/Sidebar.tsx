"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCcw,
  Package,
  LayoutGrid,
  History,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "Home", href: "/", icon: <Home size={18} /> },
  { label: "Inbound", href: "/inbound", icon: <ArrowDownToLine size={18} /> },
  { label: "Outbound", href: "/outbound", icon: <ArrowUpFromLine size={18} /> },
  { label: "Return & Reject", href: "/return-reject", icon: <RefreshCcw size={18} /> },
  { label: "All Products", href: "/all-products", icon: <Package size={18} /> },
  { label: "Racks Table", href: "/racks", icon: <LayoutGrid size={18} /> },
  { label: "Audit Trail", href: "/audit-trail", icon: <History size={18} /> },
];

export default function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`
        flex flex-col shrink-0 h-full bg-white border-r border-[#E8E8E4]
        transition-all duration-300 ease-in-out overflow-hidden
        ${isOpen ? "w-[190px]" : "w-[64px]"}
      `}
    >
      {/* Nav Items */}
      <nav className="flex flex-col gap-1 py-4 flex-1 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!isOpen ? item.label : undefined}
              className={`
                flex items-center rounded-lg
                transition-all duration-150 group relative
                ${isOpen ? "gap-3 px-3 py-2.5" : "py-2.5 justify-center"}
                ${
                  isActive
                    ? "bg-[#1A1A1A] text-white shadow-sm"
                    : "text-[#555] hover:bg-[#F0F0EC] hover:text-[#1A1A1A]"
                }
              `}
            >
              <span className="shrink-0 flex items-center justify-center">
                {item.icon}
              </span>

              {/* Label — only when open */}
              <span
                className={`
                  text-[13px] font-medium whitespace-nowrap
                  transition-all duration-200
                  ${isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"}
                `}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Version */}
      {isOpen && (
        <div className="px-4 py-3 border-t border-[#E8E8E4]">
          <p className="text-[10px] text-[#ABABAB] tracking-wide uppercase">
            WMS v1.0.0
          </p>
        </div>
      )}
    </aside>
  );
}