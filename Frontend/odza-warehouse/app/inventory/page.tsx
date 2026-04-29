"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, Settings, X, Barcode, AlertTriangle, Plus, Trash2,
  Minus, UploadCloud, ChevronRight, ChevronLeft, MoreHorizontal
} from 'lucide-react';
import { stock } from '@/lib/firebase'
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

interface Product {
  id: string;
  sku: string;
  name: string;
  images: string[]; 
  totalStock: number;
  isLowStock?: boolean;
  racks: { location: string; quantity: number }[];
}

const LOW_STOCK_THRESHOLD = 20;
const ITEMS_PER_PAGE = 20;

// ─── DATA DUMMY ASLI SUDAH DI-COMMENT OLEH BACKEND (Baris 26-64) ───
// Karena data ini di-comment, tampilan akan mengandalkan data dari Firebase (stock)

export default function AllProductsPage(){
  const { isLoading } = useProtectedRoute();
  const searchParams = useSearchParams();
  const [mockProducts, setMockProduct] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') ?? '');
  const [sortBy, setSortBy]           = useState('recent'); 
  const [currentPage, setCurrentPage] = useState(1);

  // Sync searchQuery jika URL ?search= berubah (misal dari notifikasi atau topbar)
  useEffect(() => {
    const q = searchParams.get('search') ?? '';
    setSearchQuery(q);
    setCurrentPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  // Drawer — SKU detail
  const [isDrawerOpen, setIsDrawerOpen]     = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0); 

  // Drawer — Rack contents
  const [activeRackForDrawer, setActiveRackForDrawer] = useState<string | null>(null);
  
  // Modals State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); 
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustmentTab, setAdjustmentTab] = useState<'quantity' | 'transfer'>('transfer');
  
  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, message: string, confirmText: string, confirmColor: string, onConfirm: () => void}>({
    isOpen: false, title: '', message: '', confirmText: 'Confirm', confirmColor: 'bg-[#4E342E] hover:bg-[#3E2723]', onConfirm: () => {}
  });

  // Transfer Form States
  const [fromRack, setFromRack] = useState('');
  const [toRack, setToRack] = useState('');
  const [transferQty, setTransferQty] = useState('1');
  const [transferReason, setTransferReason] = useState(''); 

  // Quantity Form States
  const [adjRack, setAdjRack] = useState(''); 
  const [adjQty, setAdjQty] = useState('0');
  const [adjReason, setAdjReason] = useState(''); 

  // ─── Derived: isLowStock dihitung ulang dari threshold ───────
  const productsWithLowStock = (product:Product[]) =>
    product.map(p => ({
      ...p,
      isLowStock: p.totalStock > 0 && p.totalStock <= LOW_STOCK_THRESHOLD,
      isOutOfStock: p.totalStock === 0,
    }));

  // ─── LOGIKA PAGINATION & FETCH API FIREBASE ───
  const [totalPages, setTotalPages] = useState(0);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  
  let [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  useEffect(() => {
    let q = searchQuery.trim();
    if(!q) q = '';
    stock(startIndex, q, sortBy).then((data)=>{
      console.log(data);
      setMockProduct(data.data);
      setDisplayedProducts(productsWithLowStock(data.data));
      setTotalPages(Math.ceil(data.max/ITEMS_PER_PAGE));
    }).catch(err => {
      console.error("Gagal menarik data dari Firebase:", err);
    });
  }, [searchQuery, sortBy, startIndex]);

  // Reset page when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  if (isLoading) {
    return null;
  }

  const getPageNumbers = (current: number, total: number) => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, 4, '...', total];
    if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  // ─── Helpers ─────────────────────────────────────────────────
  const handleSKUClick = (product: Product) => {
    setSelectedProduct(product); setActiveImageIdx(0); setIsDrawerOpen(true);
  };

  const handleSKUClickFromRackDrawer = (skuString: string) => {
    const productToOpen = mockProducts.find(p => p.sku === skuString);
    if (productToOpen) {
      setActiveRackForDrawer(null); 
      setTimeout(() => { 
          handleSKUClick(productToOpen); 
      }, 150);
    }
  };

  const handleDeleteImageClick = () => {
    setConfirmDialog({
      isOpen: true, title: 'Hapus Gambar',
      message: 'Apakah Anda yakin ingin menghapus gambar ini? Tindakan ini tidak bisa dibatalkan.',
      confirmText: 'Hapus', confirmColor: 'bg-red-600 hover:bg-red-700 text-white',
      onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
    });
  };

  const handleAdjustClick = (product: Product) => {
    setAdjustingProduct(product);
    if (product.racks.length > 0) {
      setFromRack(product.racks[0].location);
      setAdjRack(product.racks[0].location);
    }
    setTransferQty('1'); 
    setAdjQty('0');
    setAdjustmentTab('transfer');
    setIsAdjustModalOpen(true);
  };

  // FIX: Menggunakan pesan spesifik Odza untuk Request Adjustment
  const handlePreSubmitAdjustment = () => {
    let actionText = '';

    if (adjustmentTab === 'quantity') {
      const numQty = parseInt(adjQty) || 0;
      if (numQty === 0) return; 
      actionText = `${numQty < 0 ? 'mengurangi' : 'menambah'} ${Math.abs(numQty)} Pcs untuk SKU ${adjustingProduct?.sku} di Rak ${adjRack}`;
    } else {
      if (!toRack) return; 
      actionText = `memindahkan ${transferQty} Pcs SKU ${adjustingProduct?.sku} dari Rak ${fromRack} ke Rak ${toRack}`;
    }

    setConfirmDialog({
      isOpen: true, title: 'Konfirmasi Adjustment',
      message: `Request akan disubmit pada admin pusat untuk: ${actionText}. Apakah Anda yakin?`,
      confirmText: 'Kirim Request', confirmColor: 'bg-[#4E342E] hover:bg-[#3E2723] text-white',
      onConfirm: () => {
        setIsAdjustModalOpen(false);
        setFromRack(''); setToRack(''); setTransferQty('1'); setTransferReason('');
        setAdjRack(''); setAdjQty('0'); setAdjReason('');
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleTransferNumberInput = (setter: (v: string) => void, value: string) =>
    setter(value.replace(/[^0-9]/g, ''));

  const handleTransferStepper = (setter: (v: string) => void, current: string, op: 'add' | 'sub') => {
    let n = parseInt(current) || 0;
    setter(op === 'add' ? (n + 1).toString() : Math.max(1, n - 1).toString());
  };

  const handleAdjNumberInput = (value: string) => {
    let val = value.replace(/[^0-9-]/g, '');
    const hasMinus = val.startsWith('-');
    val = val.replace(/-/g, '');
    if (hasMinus) val = '-' + val;
    setAdjQty(val);
  };

  const handleAdjStepper = (current: string, op: 'add' | 'sub') => {
    let n = parseInt(current) || 0;
    setAdjQty(op === 'add' ? (n + 1).toString() : (n - 1).toString());
  };

  const getRackContents = (rackLocation: string) =>
    mockProducts
      .filter(p => p.racks.some(r => r.location === rackLocation))
      .map(p => ({
        sku: p.sku, name: p.name, image: p.images[0],
        qty: p.racks.find(r => r.location === rackLocation)?.quantity ?? 0,
      }));

  const numAdjQty = parseInt(adjQty) || 0;
  const isNegative = numAdjQty < 0;
  const isPositive = numAdjQty > 0;

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full relative animate-in fade-in duration-500">
      
      {/* ── BREADCRUMB + TITLE ── */}
      <div className="shrink-0 mb-6">
        <div className="flex flex-col gap-1.5">
          <nav className="flex items-center gap-1.5 text-[13px] font-bold text-[#888] mb-1">
            <Link href="/" className="hover:text-[#1A1A1A] transition-colors cursor-pointer">Dashboard</Link>
            <ChevronRight size={14} />
            <span className="text-[#1A1A1A]">Inventory</span>
          </nav>
          <div>
            <h1 className="text-[24px] font-black text-[#1A1A1A] tracking-tight mb-1">Katalog Produk</h1>
            <p className="text-[14px] text-[#888] font-medium">Kelola dan pantau seluruh data Produk Odza.</p>
          </div>
        </div>
      </div>

      {/* ── SEARCH + SORT BAR ── */}
      <div className="shrink-0 flex items-center justify-between gap-4 mb-6 bg-white p-3 rounded-md border border-[#E8E8E4] shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#ABABAB]" strokeWidth={2.5} />
          <input
            type="text"
            placeholder="Cari SKU, nama, atau rak (cth. F-1-2)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-[#FAFAF8] border border-[#E8E8E4] rounded-md text-[14px] font-medium text-[#1A1A1A] focus:outline-none focus:border-[#D4AF37] focus:bg-white transition-colors cursor-text"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ABABAB] hover:text-[#4E342E] transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {searchQuery && (
            <span className="text-[12px] font-bold text-[#888] bg-[#F0F0EC] px-3 py-1.5 rounded-md whitespace-nowrap">
              {displayedProducts.length} Hasil
            </span>
          )}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none px-4 py-2 bg-[#FAFAF8] border border-[#E8E8E4] rounded-md text-[13px] font-bold text-[#555] cursor-pointer hover:bg-[#F0F0EC] outline-none focus:border-[#D4AF37] min-w-[170px]"
          >
            <option value="recent">Terbaru Ditambahkan</option>
            <option value="highest">Stok Terbanyak</option>
            <option value="lowest">Stok Paling Sedikit</option>
            <option value="out">Habis (Out of Stock)</option>
          </select>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-md border border-[#E8E8E4] shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden relative">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-20 bg-[#FAFAF8] shadow-[0_1px_0_0_#E8E8E4]">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#888] uppercase w-[100px]">GAMBAR</th>
                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#888] uppercase w-[25%]">KODE SKU</th>
                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#888] uppercase w-[34%]">LOKASI RAK</th>
                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#888] uppercase w-[16%]">TOTAL STOK</th>
                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#888] uppercase text-right w-[15%]">AKSI</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F0F0EC]">
              {displayedProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <p className="text-[15px] font-bold text-[#888]">Produk tidak ditemukan</p>
                    <p className="text-[13px] text-[#ABABAB] mt-1">
                      Coba cari dengan nama SKU atau Rak yang berbeda, atau pastikan database Anda sudah terhubung.
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-4 px-4 py-2 text-[13px] font-bold text-[#555] border border-[#E8E8E4] rounded-md hover:bg-[#F0F0EC] transition-colors cursor-pointer"
                    >
                      Bersihkan pencarian
                    </button>
                  </td>
                </tr>
              ) : (
                displayedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-[#FAFAF8] transition-colors group">

                    <td className="px-6 py-4">
                      <div 
                        onClick={(e) => { e.stopPropagation(); handleSKUClick(product); }}
                        className="relative w-40 h-40 bg-[#F0F0EC] rounded-md border border-[#E8E8E4] overflow-hidden shadow-sm group-hover:shadow transition-shadow shrink-0 cursor-pointer"
                      >
                        <img src={product.images[0]} alt="product" className="w-full h-full object-cover" />
                        {product.images.length > 1 && (
                          <div className="absolute bottom-1 right-1 bg-[#1A1A1A]/80 backdrop-blur-sm text-[#D4AF37] text-[11px] font-bold px-1.5 py-0.5 rounded-md">
                            +{product.images.length - 1}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSKUClick(product); }}
                        className="text-[15px] font-bold text-[#4E342E] hover:text-[#D4AF37] tracking-tight transition-colors font-mono text-left cursor-pointer"
                      >
                        {searchQuery && product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ? (
                          <HighlightText text={product.sku} query={searchQuery} />
                        ) : product.sku}
                      </button>
                      <p className="text-[12px] text-[#888] font-medium mt-1 line-clamp-2 max-w-[250px] leading-relaxed">
                        {product.name}
                      </p>
                    </td>

                    {/* RACK LOCATION */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {product.racks.map(rack => (
                          <button
                            key={rack.location}
                            onClick={(e) => { e.stopPropagation(); setActiveRackForDrawer(rack.location); }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] font-bold font-mono border whitespace-nowrap cursor-pointer transition-colors
                              ${searchQuery && rack.location.toLowerCase().includes(searchQuery.toLowerCase())
                                ? 'bg-[#FFF8E1] border-[#FFECB3] text-[#F57F17] ring-1 ring-[#FFECB3]'
                                : 'bg-[#EFEBE9] border-[#D7CCC8] text-[#4E342E] hover:bg-[#E8E5E1]'
                              }`}
                          >
                            {rack.location}
                            <span className={`text-[11px] font-bold px-1 py-0.5 rounded-md
                              ${rack.quantity === 0
                                ? 'text-red-400'
                                : rack.quantity <= LOW_STOCK_THRESHOLD
                                ? 'text-amber-600'
                                : 'text-[#8B7C6E]'
                              }`}
                            >
                              {rack.quantity}
                            </span>
                          </button>
                        ))}
                      </div>
                    </td>

                    {/* TOTAL STOCK */}
                    <td className="px-6 py-4">
                      {product.totalStock === 0 ? (
                        <div className="flex items-center gap-1.5 text-red-700 bg-red-50 w-fit px-3 py-1 rounded-md border border-red-200 whitespace-nowrap">
                          <span className="font-bold text-[13px]">Habis (Kosong)</span>
                        </div>
                      ) : product.isLowStock ? (
                        <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 w-fit px-3 py-1. rounded-md border border-amber-200 whitespace-nowrap">
                          <AlertTriangle size={14} strokeWidth={2.5} className="shrink-0" />
                          <span className="font-bold text-[14px]">{product.totalStock} Pcs</span>
                          <span className="text-[12px] font-medium italic ml-1 whitespace-nowrap">(Menipis)</span>
                        </div>
                      ) : (
                        <div className="font-bold text-[15px] text-[#1A1A1A] px-3 py-1 whitespace-nowrap">
                          {product.totalStock} Pcs
                        </div>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAdjustClick(product); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#CDCDC9] rounded-md text-[13px] font-bold text-[#555] hover:bg-[#F0F0EC] hover:border-[#4E342E] hover:text-[#4E342E] transition-colors shadow-sm bg-white shrink-0 cursor-pointer"
                      >
                        <Settings size={14} /> Adjust
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION FOOTER ── */}
        <div className="shrink-0 px-6 py-4 border-t border-[#F0F0EC] bg-[#FAFAF8] flex items-center justify-between">
          <p className="text-[13px] font-medium text-[#888]">
            Menampilkan <span className="font-bold text-[#1A1A1A]">{displayedProducts.length === 0 ? 0 : startIndex + 1}</span> -{' '}
            <span className="font-bold text-[#1A1A1A]">{Math.min(startIndex + ITEMS_PER_PAGE, displayedProducts.length)}</span> dari{' '}
            <span className="font-bold text-[#1A1A1A]">{displayedProducts.length}</span> produk
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-[13px] font-bold text-[#555] border border-[#E8E8E4] rounded-md bg-white hover:bg-[#F0F0EC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
              >
                <ChevronLeft size={14} /> Prev
              </button>

              <div className="flex items-center gap-1 px-2">
                {getPageNumbers(currentPage, totalPages).map((page, idx) => {
                  if (page === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className="flex items-center justify-center w-8 h-8 text-[#ABABAB]">
                        <MoreHorizontal size={16} />
                      </span>
                    );
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page as number)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md text-[13px] font-bold transition-colors shadow-sm cursor-pointer
                        ${currentPage === page 
                          ? 'bg-[#4E342E] text-[#D4AF37] border border-[#4E342E]' 
                          : 'bg-white text-[#555] border border-[#E8E8E4] hover:bg-[#F0F0EC]'
                        }
                      `}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-[13px] font-bold text-[#555] border border-[#E8E8E4] rounded-md bg-white hover:bg-[#F0F0EC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── PRODUCT DETAILS DRAWER ── */}
      <div className={`fixed inset-0 z-[100] flex justify-end transition-all duration-300 ease-in-out ${isDrawerOpen ? 'visible' : 'invisible delay-300'}`}>
        <div className={`absolute inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm transition-opacity duration-300 cursor-pointer ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsDrawerOpen(false)} />
        <div className={`relative w-[400px] bg-white shadow-2xl h-full flex flex-col border-l border-[#E8E8E4] transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0EC] bg-[#FAFAF8]">
            <h3 className="text-[14px] font-bold text-[#888] tracking-wider uppercase">Detail SKU</h3>
            <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 text-[#888] hover:bg-[#E8E8E4] hover:text-[#1A1A1A] rounded-md transition-colors cursor-pointer">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="w-full aspect-square bg-[#F7F7F5] rounded-md border border-[#E8E8E4] overflow-hidden mb-4 shadow-sm transition-all duration-300">
              <img src={selectedProduct?.images[activeImageIdx]} alt="Primary" className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-2.5 mb-6 overflow-x-auto pb-2 items-center">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="shrink-0 w-16 h-16 flex items-center justify-center bg-[#FAFAF8] border-2 border-dashed border-[#CDCDC9] hover:border-[#D4AF37] hover:bg-[#FFF8E1] hover:text-[#D4AF37] text-[#888] rounded-md transition-all cursor-pointer"
              >
                <Plus size={20} />
              </button>
              {selectedProduct?.images.map((imgSrc, i) => (
                <div
                  key={i}
                  onClick={() => setActiveImageIdx(i)}
                  className={`group relative shrink-0 w-16 h-16 bg-[#F7F7F5] rounded-md border-2 overflow-hidden cursor-pointer transition-all
                    ${activeImageIdx === i ? 'border-[#D4AF37] shadow-sm' : 'border-transparent hover:border-[#CDCDC9]'}`}
                >
                  <img src={imgSrc} alt="Thumb" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-[#1A1A1A]/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteImageClick(); }}
                      className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 hover:scale-110 transition-all shadow-lg cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mb-6">
              <div className="text-[12px] font-bold tracking-widest text-[#888] uppercase mb-1">Kode SKU</div>
              <h2 className="text-[28px] font-black text-[#4E342E] tracking-tight font-mono mb-4">{selectedProduct?.sku}</h2>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-[#888] uppercase">Nama / Deskripsi</label>
                <textarea rows={3} defaultValue={selectedProduct?.name} className="w-full px-3 py-2 bg-[#FAFAF8] border border-[#E8E8E4] rounded-md text-[13px] font-medium text-[#1A1A1A] outline-none focus:border-[#D4AF37] focus:bg-white transition-all resize-none cursor-text" />
              </div>
            </div>
            <div className="mb-6 p-5 bg-[#EFEBE9] rounded-md border border-[#D7CCC8]">
              <span className="text-[13px] font-bold text-[#4E342E] mb-1 block uppercase tracking-wider">Total Fisik Keseluruhan</span>
              <span className="text-[32px] font-black text-[#4E342E] leading-none">
                {selectedProduct?.totalStock} <span className="text-[16px] font-medium">Pcs</span>
              </span>
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-[#1A1A1A] mb-3 uppercase tracking-wider">Alokasi Stok di Rak</h3>
              <div className="flex flex-col gap-2.5">
                {selectedProduct?.racks.map((rack, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white border border-[#E8E8E4] shadow-sm rounded-md hover:border-[#D7CCC8] transition-colors">
                    <span className="text-[16px] font-bold text-[#4E342E] font-mono px-2">Rak {rack.location}</span>
                    <div className="flex flex-col items-end">
                      <span className="text-[20px] font-black text-[#1A1A1A]">{rack.quantity}</span>
                      <span className="text-[12px] font-bold text-[#888]">Pcs</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RACK CONTENTS DRAWER ── */}
      <div className={`fixed inset-0 z-[100] flex justify-end transition-all duration-300 ease-in-out ${activeRackForDrawer ? 'visible' : 'invisible delay-300'}`}>
        <div className={`absolute inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm transition-opacity duration-300 cursor-pointer ${activeRackForDrawer ? 'opacity-100' : 'opacity-0'}`} onClick={() => setActiveRackForDrawer(null)} />
        <div className={`relative w-[400px] bg-white shadow-2xl h-full flex flex-col border-l border-[#E8E8E4] transition-transform duration-300 ease-in-out ${activeRackForDrawer ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0F0EC] bg-[#FAFAF8]">
            <h3 className="text-[16px] font-black text-[#1A1A1A]">
              Isi dari Rak: <span className="font-mono text-[#D4AF37] ml-1">{activeRackForDrawer}</span>
            </h3>
            <button onClick={() => setActiveRackForDrawer(null)} className="p-1.5 text-[#888] hover:bg-[#E8E8E4] hover:text-[#1A1A1A] rounded-md transition-colors cursor-pointer">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[#FAFAF8]">
            {activeRackForDrawer && getRackContents(activeRackForDrawer).map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => handleSKUClickFromRackDrawer(item.sku)}
                className="bg-white p-4 rounded-md border border-[#E8E8E4] shadow-sm flex items-center gap-4 hover:border-[#D4AF37] transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 bg-[#F0F0EC] rounded-md border border-[#E8E8E4] overflow-hidden shrink-0 group-hover:shadow-md transition-shadow">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-black text-[#1A1A1A] font-mono truncate group-hover:text-[#D4AF37] transition-colors">{item.sku}</p>
                  <p className="text-[13px] font-medium text-[#888] truncate">{item.name}</p>
                </div>
                <div className="shrink-0 bg-[#EFEBE9] px-3 py-1.5 rounded-md border border-[#D7CCC8] transition-colors">
                  <p className="text-[13px] font-bold text-[#4E342E]">{item.qty} <span className="font-medium text-[#888] text-[11px]">Pcs</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── IMAGE UPLOAD MODAL ── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1A1A1A]/60 backdrop-blur-sm cursor-pointer" onClick={() => setIsUploadModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0EC] bg-[#FAFAF8]">
              <h2 className="text-[16px] font-black text-[#1A1A1A]">Upload Gambar Produk</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-1.5 text-[#888] hover:bg-[#E8E8E4] hover:text-[#1A1A1A] rounded-md transition-colors cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-6">
              <div className="border-2 border-dashed border-[#CDCDC9] rounded-md p-10 flex flex-col items-center justify-center bg-[#FAFAF8] hover:bg-[#FFF8E1] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors cursor-pointer group">
                <UploadCloud size={48} strokeWidth={1.5} className="text-[#ABABAB] group-hover:text-[#D4AF37] mb-4 transition-colors" />
                <p className="text-[15px] font-bold text-[#1A1A1A] group-hover:text-[#4E342E] mb-1">Klik atau seret gambar ke sini</p>
                <p className="text-[13px] text-[#888] font-medium">SVG, PNG, JPG or GIF (max. 5MB)</p>
              </div>
            </div>
            <div className="px-6 py-4 bg-[#FAFAF8] border-t border-[#F0F0EC] flex justify-end">
              <button onClick={() => setIsUploadModalOpen(false)} className="px-5 py-2.5 rounded-md text-[14px] font-bold text-white bg-[#4E342E] hover:bg-[#3E2723] shadow-md transition-all cursor-pointer">Selesai</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADJUSTMENT MODAL ── */}
      {isAdjustModalOpen && adjustingProduct && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1A1A1A]/60 backdrop-blur-sm cursor-pointer" onClick={() => setIsAdjustModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0EC] bg-[#FAFAF8]">
              <h2 className="text-[16px] font-black text-[#1A1A1A]">Sesuaikan Stok: <span className="font-mono text-[#D4AF37]">{adjustingProduct.sku}</span></h2>
              <button onClick={() => setIsAdjustModalOpen(false)} className="p-1.5 text-[#888] hover:bg-[#E8E8E4] hover:text-[#1A1A1A] rounded-md transition-colors cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-6">
              <div className="flex bg-[#F0F0EC] p-1 rounded-md mb-6">
                <button onClick={() => setAdjustmentTab('transfer')} className={`flex-1 py-2 text-[13px] font-bold rounded-md transition-all cursor-pointer ${adjustmentTab === 'transfer' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#888] hover:text-[#555]'}`}>Pindah Rak</button>
                <button onClick={() => setAdjustmentTab('quantity')} className={`flex-1 py-2 text-[13px] font-bold rounded-md transition-all cursor-pointer ${adjustmentTab === 'quantity' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#888] hover:text-[#555]'}`}>Tambah/Kurang Stok</button>
              </div>

              {/* TAB 1: TRANSFER RACK */}
              {adjustmentTab === 'transfer' && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#1A1A1A]">Rak Asal (Sumber)</label>
                    <select value={fromRack} onChange={(e) => setFromRack(e.target.value)} className="w-full px-4 py-2.5 bg-[#FAFAF8] border border-[#E8E8E4] rounded-md text-[14px] font-bold text-[#555] outline-none hover:bg-[#F0F0EC] focus:border-[#D4AF37] cursor-pointer">
                      <option value="" disabled>Pilih rak sumber...</option>
                      {adjustingProduct.racks.map(r => <option key={r.location} value={r.location}>{r.location} (Tersedia: {r.quantity} Pcs)</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#1A1A1A]">Rak Tujuan <span className="text-[#888] font-normal">(Scan Barcode)</span></label>
                    <div className="relative">
                      <Barcode className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
                      <input type="text" value={toRack} onChange={(e) => setToRack(e.target.value)} placeholder="Scan atau ketik kode rak..." className="w-full pl-10 pr-4 py-2.5 bg-[#FFF8E1] border border-[#FFECB3] rounded-md text-[14px] font-bold font-mono text-[#F57F17] outline-none focus:ring-2 focus:ring-[#FFECB3] cursor-text" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#1A1A1A]">Jumlah Dipindah</label>
                    <div className="flex items-center gap-3 bg-[#FAFAF8] border border-[#E8E8E4] p-1.5 rounded-md w-max">
                      <button onClick={() => handleTransferStepper(setTransferQty, transferQty, 'sub')} className="w-10 h-10 flex items-center justify-center bg-[#F0F0EC] text-[#555] rounded-md hover:bg-[#E8E8E4] transition-colors cursor-pointer"><Minus size={18} strokeWidth={2.5} /></button>
                      <input type="text" value={transferQty} onChange={(e) => handleTransferNumberInput(setTransferQty, e.target.value)} className="w-16 text-center bg-transparent text-[16px] font-black text-[#1A1A1A] outline-none cursor-text" />
                      <button onClick={() => handleTransferStepper(setTransferQty, transferQty, 'add')} className="w-10 h-10 flex items-center justify-center bg-[#4E342E] text-[#D4AF37] rounded-md hover:bg-[#3E2723] transition-colors cursor-pointer"><Plus size={18} strokeWidth={2.5} /></button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#1A1A1A]">Alasan Pindah Rak</label>
                    <input type="text" value={transferReason} onChange={(e) => setTransferReason(e.target.value)} placeholder="Ketik penjelasan singkat..." className="w-full px-4 py-2.5 bg-[#FAFAF8] border border-[#E8E8E4] rounded-md text-[14px] font-medium text-[#1A1A1A] outline-none focus:border-[#D4AF37] focus:bg-white cursor-text" />
                  </div>
                </div>
              )}

              {/* TAB 2: QUANTITY ADJUSTMENT (DINAMIS MINUS/PLUS) */}
              {adjustmentTab === 'quantity' && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#1A1A1A]">Pilih Rak Target</label>
                    <select value={adjRack} onChange={(e) => setAdjRack(e.target.value)} className="w-full px-4 py-2.5 bg-[#FAFAF8] border border-[#E8E8E4] rounded-md text-[14px] font-bold text-[#555] outline-none hover:bg-[#F0F0EC] focus:border-[#D4AF37] cursor-pointer">
                      <option value="" disabled>Pilih rak...</option>
                      {adjustingProduct.racks.map(r => <option key={r.location} value={r.location}>{r.location} (Stok Saat Ini: {r.quantity} Pcs)</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#1A1A1A]">Jumlah Penyesuaian (+ / -)</label>
                    <div className="flex items-center gap-4">
                      {/* Stepper Input dengan Warna Dinamis */}
                      <div className={`flex items-center gap-3 p-1.5 rounded-md border-2 transition-all duration-300
                        ${isNegative ? 'bg-red-50 border-red-200' : isPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-[#FAFAF8] border-[#E8E8E4]'}`}
                      >
                        <button onClick={() => handleAdjStepper(adjQty, 'sub')} className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors cursor-pointer ${isNegative ? 'bg-red-200 text-red-700 hover:bg-red-300' : 'bg-[#F0F0EC] text-[#555] hover:bg-[#E8E8E4]'}`}>
                          <Minus size={18} strokeWidth={2.5} />
                        </button>
                        
                        <input type="text" value={adjQty} onChange={(e) => handleAdjNumberInput(e.target.value)} className={`w-16 text-center bg-transparent text-[18px] font-black outline-none cursor-text ${isNegative ? 'text-red-700' : isPositive ? 'text-emerald-700' : 'text-[#1A1A1A]'}`} />
                        
                        <button onClick={() => handleAdjStepper(adjQty, 'add')} className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors cursor-pointer ${isPositive ? 'bg-emerald-200 text-emerald-700 hover:bg-emerald-300' : 'bg-[#4E342E] text-[#D4AF37] hover:bg-[#3E2723]'}`}>
                          <Plus size={18} strokeWidth={2.5} />
                        </button>
                      </div>
                      
                      {/* Indikator Teks Dinamis */}
                      <div className="flex flex-col">
                        {isNegative && <span className="text-[14px] font-black text-red-600 animate-in fade-in slide-in-from-left-2">Mengurangi {Math.abs(numAdjQty)} Pcs</span>}
                        {isPositive && <span className="text-[14px] font-black text-emerald-600 animate-in fade-in slide-in-from-left-2">Menambah {numAdjQty} Pcs</span>}
                        {!isNegative && !isPositive && <span className="text-[14px] font-bold text-[#888]">Tidak ada perubahan</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#1A1A1A]">Alasan (Wajib)</label>
                    <input type="text" value={adjReason} onChange={(e) => setAdjReason(e.target.value)} placeholder="Misal: Stok fisik rusak, dsb..." className="w-full px-4 py-2.5 bg-[#FAFAF8] border border-[#E8E8E4] rounded-md text-[14px] font-medium text-[#1A1A1A] outline-none focus:border-[#D4AF37] focus:bg-white cursor-text" />
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-[#FAFAF8] border-t border-[#F0F0EC] flex justify-end gap-3">
              <button onClick={() => setIsAdjustModalOpen(false)} className="px-5 py-2.5 rounded-md text-[14px] font-bold text-[#555] border border-[#E8E8E4] bg-white hover:bg-[#F0F0EC] transition-colors cursor-pointer">Batal</button>
              <button 
                onClick={handlePreSubmitAdjustment} 
                disabled={adjustmentTab === 'quantity' && numAdjQty === 0}
                className="px-6 py-2.5 rounded-md text-[14px] font-bold text-white bg-[#4E342E] hover:bg-[#3E2723] shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Kirim Request ke Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM DIALOG ── */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1A1A1A]/60 backdrop-blur-sm cursor-pointer" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} />
          <div className="relative bg-white w-full max-w-sm rounded-md shadow-2xl p-6 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-[#FFF8E1] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#FFECB3]">
              <AlertTriangle className="w-8 h-8 text-[#F57F17]" />
            </div>
            <h3 className="text-[18px] font-black text-[#1A1A1A] mb-2">{confirmDialog.title}</h3>
            <p className="text-[14px] font-medium text-[#555] mb-8 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} className="flex-1 px-4 py-2.5 rounded-md text-[14px] font-bold text-[#555] border border-[#E8E8E4] bg-white hover:bg-[#F0F0EC] transition-colors cursor-pointer">Batal</button>
              <button onClick={confirmDialog.onConfirm} className={`flex-1 px-4 py-2.5 rounded-md text-[14px] font-bold transition-colors shadow-md cursor-pointer ${confirmDialog.confirmColor}`}>{confirmDialog.confirmText}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper component: highlight matched text ─────────────────
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-[#D4AF37]/30 text-[#4E342E] rounded px-0.5 not-italic">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}