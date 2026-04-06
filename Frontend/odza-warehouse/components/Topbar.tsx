import { Search, Bell } from "lucide-react";

export default function Topbar() {
  return (
    <header className="h-12 bg-white border-b border-gray-100 px-5 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 w-80">
        <Search size={13} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search SKU, Rack Location, or Order ID..."
          className="bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400 w-full"
        />
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span>Monday, 19 January 2026</span>
        <button className="w-7 h-7 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
          <Bell size={13} className="text-gray-500" />
        </button>
        <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-xs font-medium text-blue-700">U</div>
      </div>
    </header>
  );
}