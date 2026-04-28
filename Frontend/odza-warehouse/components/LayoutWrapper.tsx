"use client";

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { HelpCircle, X, ChevronDown } from 'lucide-react';

const faqData = [
  { q: "Bagaimana cara menambahkan data barang masuk (inbound)?", a: "Masuk ke menu Inbound, ketik Nomor Surat Jalan, klik 'Mulai Scan', lalu scan SKU dan Rak. Sistem otomatis mengisi QTY 1. Klik 'Simpan ke Warehouse' jika selesai." },
  { q: "Apa yang harus dilakukan jika terjadi kesalahan input inbound?", a: "Selama belum klik 'Simpan ke Warehouse', klik icon tempat sampah di baris tersebut untuk menghapus. Jika sudah terlanjur disimpan, lakukan 'Request Adjustment' di menu Inventory atau hubungi Admin." },
  { q: "Apakah data inbound bisa diedit atau dihapus?", a: "Jika sudah disimpan, data tidak bisa diedit/dihapus mandiri. Silakan hubungi Admin Gudang untuk request cancel action." },
  { q: "Bagaimana cara mencatat barang keluar (outbound)?", a: "Buka menu Outbound. Secara berurutan, scan Channel, Resi, SKU, dan Rak. Pastikan data benar lalu klik 'Process Item'." },
  { q: "Apakah data outbound bisa diperbaiki setelah disimpan?", a: "Sama seperti Inbound, data yang sudah terproses tidak bisa diedit sendiri. Segera lapor ke Admin untuk perbaikan data." },
  { q: "Bagaimana cara melihat jumlah stok barang saat ini?", a: "Buka menu Inventory. Anda bisa melihat total stok fisik secara keseluruhan dan lokasinya di masing-masing rak." },
  { q: "Bagaimana cara mencari data barang tertentu?", a: "Gunakan kotak pencarian (Search Bar) di atas. Ketik SKU Code untuk mencari barang, atau ketik nama Rak (harus menggunakan tanda strip, misal A-1-2) untuk mengecek rak." },
  { q: "Apa perbedaan proses return & reject di sistem WMS ini?", a: "'Return' digunakan untuk barang retur normal yang bisa masuk stok kembali. 'Reject' digunakan untuk barang cacat/rusak yang harus dipisah (misal ke Rak Karantina)." },
  { q: "Bagaimana cara melakukan reject/return di sistem?", a: "Masuk menu Return & Reject. Ketik 'RET' untuk Return atau 'REJ' untuk Reject pada kolom Action. Lengkapi sisa form scan, berikan penjelasan singkat, lalu proses." }
];

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  
  // ─── FIX HYDRATION ERROR & MENCEGAH SIDEBAR BERKEDIP ───
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    setIsMounted(true); // Tandai bahwa komponen sudah berjalan di Browser
    const savedState = localStorage.getItem('sidebarState');
    if (savedState !== null) {
      setIsSidebarOpen(JSON.parse(savedState));
    }
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarState', JSON.stringify(newState));
      return newState;
    });
  };

  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (faqRef.current && !faqRef.current.contains(event.target as Node)) {
        setIsFaqOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Always render but with opacity for smooth transitions
  if (isLoginPage) return <>{children}</>;

  return (
    <div className="flex h-screen bg-[#F7F7F5] overflow-hidden text-[#1A1A1A] selection:bg-[#EFEBE9] font-sans">
      <Sidebar isOpen={isSidebarOpen} onToggleSidebar={handleToggleSidebar} />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>

      <div ref={faqRef} className="fixed bottom-6 left-6 z-50">
        <div className={`absolute bottom-16 left-0 w-80 bg-white rounded-xl shadow-2xl origin-bottom-left transition-all duration-300 ease-out border-none ${isFaqOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4 pointer-events-none'}`}>
          <div className="flex items-center justify-between p-4 bg-[#4E342E] rounded-t-xl border-none">
            <h3 className="text-[14px] font-bold text-[#D4AF37]">Bantuan & FAQ WMS</h3>
            <button onClick={() => setIsFaqOpen(false)} className="text-[#D7CCC8] hover:text-white transition-colors cursor-pointer"><X size={18} /></button>
          </div>
          <div className="max-h-[350px] overflow-y-auto p-2">
            {faqData.map((faq, i) => (
              <div key={i} className="mb-1">
                <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full text-left px-3 py-2.5 flex items-start justify-between hover:bg-[#FAFAF8] rounded-md transition-colors cursor-pointer gap-2 border-none">
                  <span className="text-[13px] font-bold text-[#3E2723] mt-0.5 leading-snug">{faq.q}</span>
                  <ChevronDown size={14} className={`text-[#888] shrink-0 mt-1 transition-transform ${activeFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${activeFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-3 pb-3 pt-1 text-[13px] text-[#555] leading-relaxed bg-[#FAFAF8] rounded-b-md mx-1 border-none">
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => setIsFaqOpen(!isFaqOpen)} className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-110 border-none ${isFaqOpen ? 'bg-[#4E342E] text-[#D4AF37]' : 'bg-white text-[#4E342E] hover:bg-[#FAFAF8]'}`}>
          <HelpCircle size={24} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}