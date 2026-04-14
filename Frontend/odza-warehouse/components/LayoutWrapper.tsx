"use client";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const noSidebar = ["/login", "/register"];
  const hideSidebar = noSidebar.includes(pathname);

  if (hideSidebar) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center">
        {children}
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </>
  );
}