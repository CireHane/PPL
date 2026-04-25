"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCcw,
  Package,
  ListTree,
  History,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggleSidebar: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: "Dashboard",       href: "/dashboard",     icon: LayoutDashboard  },
  { label: "Inbound",         href: "/inbound",       icon: ArrowDownToLine  },
  { label: "Outbound",        href: "/outbound",      icon: ArrowUpFromLine  },
  { label: "Return & Reject", href: "/return-reject", icon: RefreshCcw       },
  { label: "Inventory",       href: "/inventory",     icon: Package          }, // SUDAH DIKEMBALIKAN KE /inventory
  { label: "Racks",           href: "/racks",         icon: ListTree         },
  { label: "Audit Trail",     href: "/audit-trail",   icon: History          },
];

export default function Sidebar({ isOpen, onToggleSidebar }: SidebarProps) {
  const pathname = usePathname();

  const isPathActive = (href: string) => {
    if (href === "/dashboard" && (pathname === "/" || pathname === "/dashboard")) return true;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`
        relative flex-col shrink-0 h-full border-none shadow-2xl
        transition-all duration-300 ease-in-out z-50 flex
        ${isOpen ? "w-[210px]" : "w-[64px]"}
      `}
    >
      <div aria-hidden className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none" style={{ backgroundImage: "url('/batik-pattern copy.png')" }} />
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundColor: "rgba(43, 29, 16, 0.85)" }} />

      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        
        <div className="flex items-center shrink-0 h-[72px] w-[64px] justify-center border-none">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-150 cursor-pointer shrink-0 border-none"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 py-4 flex-1 px-3 overflow-y-auto overflow-x-hidden">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = isPathActive(href);
            return (
              <Link
                key={href}
                href={href}
                title={!isOpen ? label : undefined}
                className={`
                  flex items-center rounded-md cursor-pointer transition-colors duration-150 relative border-none py-2.5
                  ${isActive ? "bg-black/40 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}
                `}
              >
                {isActive && <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-[#D4AF37] shadow-[2px_0_8px_rgba(212,175,55,0.5)]" />}
                <span className="w-[40px] flex items-center justify-center shrink-0">
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} className={`transition-colors ${isActive ? "text-[#D4AF37]" : ""}`} />
                </span>
                <span className={`
                  text-[13px] font-semibold whitespace-nowrap tracking-wide
                  transition-all duration-300 ease-in-out overflow-hidden
                  ${isOpen ? "opacity-100 max-w-[130px]" : "opacity-0 max-w-0"}
                `}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className={`transition-all duration-300 ease-in-out border-none overflow-hidden ${isOpen ? "h-[50px] opacity-100" : "h-0 opacity-0"}`}>
           <div className="px-5 py-3.5 whitespace-nowrap">
             <p className="text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase">Odza WMS v2.0.0</p>
           </div>
        </div>

      </div>
    </aside>
  );
}