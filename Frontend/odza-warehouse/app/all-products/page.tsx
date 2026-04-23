"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, Settings, X, Barcode, AlertTriangle, Plus, Trash2,
  Minus, UploadCloud, ChevronRight, ChevronLeft, MoreHorizontal
} from 'lucide-react';
import { stock } from '@/lib/firebase'
import { allProducts } from '@/lib/mock-data';
import { mock } from 'node:test';

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
const ITEMS_PER_PAGE = 2;

// // ─── DATA ASLI ───
// const baseProducts: Product[] = [
//   {
//     id: '1', sku: 'ZS241201B', name: 'Kemeja Pria Lengan Pendek Batik Solo Modern Slimfit Merah Maroon Celagen', totalStock: 76,
//     images: ['https://odzaclassic.com/cdn/shop/files/id-11134207-7rasi-m5fdrxybq0t4d0_1ade8f4e-71c0-4c23-be77-203575a4485f.jpg?v=1738312704&width=600','https://odzaclassic.com/cdn/shop/files/id-11134207-7rasi-m5fdrxybu8igba.jpg?v=1738312630&width=600','https://odzaclassic.com/cdn/shop/files/id-11134207-7ras9-m5fdrxybx1nc94.jpg?v=1738312636&width=600'],
//     racks: [{ location: 'F-1-2', quantity: 66 }, { location: 'G-U-6-2', quantity: 10 }],
//   },
//   {
//     id: '2', sku: 'ZW24081', name: 'Baju Outer Luaran Batik Rompi Couple Pesta Wanita Bolak Balik Panggenan Abu Coklat', totalStock: 13, isLowStock: true,
//     images: ['https://odzaclassic.com/cdn/shop/files/ZW24081.jpg?v=1727237714&width=600','https://odzaclassic.com/cdn/shop/files/ZW24081_1_5a084c32-e94e-46d9-adee-e5d368054e81.jpg?v=1727237732&width=600'],
//     racks: [{ location: 'G-U-6-2', quantity: 13 }],
//   },
//   {
//     id: '3', sku: 'ZW260121A', name: 'Atasan Blouse Batik Modern Etnik Wanita Lengan Pendek Kimono Trikot Furing Merah Pink', totalStock: 142,
//     images: ['https://odzaclassic.com/cdn/shop/files/01ff30cc7e3542749fa2e301cbd7f667_tplv-o3syd03w52-origin-jpeg_ec2c114d-b2c1-4c7d-9a50-4932600638fc.jpg?v=1769229913&width=600','https://odzaclassic.com/cdn/shop/files/29b6c2d867404ed48ec663f34035a775_tplv-o3syd03w52-origin-jpeg.jpg?v=1769229838&width=600'],
//     racks: [{ location: 'W-4-1', quantity: 95 }, { location: 'T-1-2', quantity: 47 }],
//   },
//   {
//     id: '4', sku: 'ZS25802B', name: 'Kemeja Batik Pria Lengan Pendek Slim Fit Regular Jumbo Modern Azmatex', totalStock: 234,
//     images: ['https://odzaclassic.com/cdn/shop/files/id-11134207-81ztm-mf2acpv0ho260b.jpg?v=1760512223&width=600','https://odzaclassic.com/cdn/shop/files/id-11134207-81ztm-mf2acpv07u325b.jpg?v=1760512201&width=600','https://odzaclassic.com/cdn/shop/files/id-11134207-81ztq-mf2acpv0an7yd5.jpg?v=1760512208&width=600'],
//     racks: [{ location: 'W-4-1', quantity: 150 }, { location: 'T-1-2', quantity: 84 }],
//   },
//   {
//     id: '5', sku: 'ZL25803B', name: 'Kemeja Batik Pria Salena Lengan Panjang Slim Fit Jumbo Modern Coklat', totalStock: 300,
//     images: ['https://odzaclassic.com/cdn/shop/files/4721fbf647b44c48a89a22864182d851_tplv-o3syd03w52-origin-jpeg_9e8de6ee-36ab-42ca-b7e5-006e06bbf776.jpg?v=1759304117&width=600','https://odzaclassic.com/cdn/shop/files/eb7f353401ae472ba121dccafa35ddfa_tplv-o3syd03w52-origin-jpeg.jpg?v=1759304100&width=600'],
//     racks: [{ location: 'T-1-2', quantity: 100 }, { location: 'C-1-2', quantity: 100 }, { location: 'C-2-1', quantity: 50 }, { location: 'D-4-5', quantity: 50 }],
//   },
//   {
//     id: '6', sku: 'ZW25703', name: 'Baju Outer Luaran Atasan Motif Batik Kombinasi Rompi Katun Pesta Wanita Cantik Bolak Balik Panggenan Biru', totalStock: 76,
//     images: ['https://odzaclassic.com/cdn/shop/files/5a17584c1d1441af96ff63003f1a5484_tplv-aphluv4xwc-origin-jpeg.jpg?v=1757743142&width=600','https://odzaclassic.com/cdn/shop/files/d1fb48b0e54c4fabb30b9fbe509f6cfd_tplv-aphluv4xwc-origin-jpeg.jpg?v=1757743146&width=600'],
//     racks: [{ location: 'T-1-1', quantity: 66 }, { location: 'L-2-3', quantity: 10 }],
//   },
//   {
//     id: '7', sku: 'BW00021', name: 'Bawahan Rok Lilit Batik Tradisional Kebaya Wanita Free Ring Navy Hanusa', totalStock: 0,
//     images: ['https://odzaclassic.com/cdn/shop/files/id-11134207-7ra0t-mc9fphnxwlw911.jpg?v=1752737077&width=600','https://odzaclassic.com/cdn/shop/files/id-11134207-7ra0h-mc9ftzfddr2a20.jpg?v=1752737080&width=600'],
//     racks: [{ location: 'L-2-3', quantity: 0 }, { location: 'Q-1-1', quantity: 0 }],
//   },
// ];

// // ─── DUMMY DATA GENERATOR (Untuk mencapai 60 item) ───
// const generatedProducts: Product[] = Array.from({ length: 53 }).map((_, i) => {
//   const stock = i % 8 === 0 ? 0 : Math.floor(Math.random() * 250) + 5;
//   return {
//     id: `${i + 8}`,
//     sku: `ZSU${1000 + i}`,
//     name: `Produk Reguler Odza Batch ${i + 1} Varian Random`,
//     images: ['https://odzaclassic.com/cdn/shop/files/id-11134207-7rasi-m5fdrxybq0t4d0_1ade8f4e-71c0-4c23-be77-203575a4485f.jpg?v=1738312704&width=600'],
//     totalStock: stock,
//     racks: stock > 0 ? [{ location: `R-${Math.floor(i / 10)}-${(i % 10) + 1}`, quantity: stock }] : [{ location: 'NONE', quantity: 0 }]
//   };
// });

// const mockProducts = [...baseProducts, ...generatedProducts];


export default function AllProductsPage(){
  const [mockProducts, setMockProduct] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy]           = useState('recent'); 
  const [currentPage, setCurrentPage] = useState(1);
  
  console.log(mockProducts);

  // useEffect(()=>{
  //   stock().then((data)=>{
  //     setMockProduct(data);
  //   })
  // });

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
    isOpen: false, title: '', message: '', confirmText: 'Confirm', confirmColor: 'bg-[#1A1A1A] hover:bg-[#333]', onConfirm: () => {}
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

  // ─── SORT ────────────────────────────────────────────────────

  
  // ─── LOGIKA PAGINATION ───
  const [totalPages, setTotalPages] = useState(0);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  // const paginatedProducts = displayedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  
  let [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  useEffect(() => {
    let q = searchQuery.trim();
    if(!q) q = '';
    stock(startIndex, q, sortBy).then((data)=>{
      console.log(data);
      setDisplayedProducts(productsWithLowStock(data.data));
      setTotalPages(Math.ceil(data.max/ITEMS_PER_PAGE));
    });
  });

  // Reset page when search or sort changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

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
      isOpen: true, title: 'Delete Image',
      message: 'Are you sure you want to delete this image? This action cannot be undone.',
      confirmText: 'Delete', confirmColor: 'bg-red-600 hover:bg-red-700 text-white',
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

  const handlePreSubmitAdjustment = () => {
    let actionText = '';

    if (adjustmentTab === 'quantity') {
      const numQty = parseInt(adjQty) || 0;
      if (numQty === 0) return; 
      actionText = `${numQty < 0 ? 'remove' : 'request addition of'} ${Math.abs(numQty)} Pcs of ${adjustingProduct?.sku} in Rack ${adjRack}`;
    } else {
      if (!toRack) return; 
      actionText = `transfer ${transferQty} Pcs of ${adjustingProduct?.sku} from Rack ${fromRack} to Rack ${toRack}`;
    }

    setConfirmDialog({
      isOpen: true, title: 'Confirm Adjustment',
      message: `Are you sure you want to ${actionText}?`,
      confirmText: 'Submit', confirmColor: 'bg-[#1A1A1A] hover:bg-[#333] text-white',
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
    <div className="flex flex-col h-full relative">
      
      {/* ── BREADCRUMB + TITLE ── */}
      <div className="shrink-0 mb-6">
        <div className="flex flex-col gap-1.5">
          <nav className="flex items-center gap-1.5 text-[13px] font-bold text-[#888] mb-1">
            <Link href="/" className="hover:text-[#1A1A1A] transition-colors">Home</Link>
            <ChevronRight size={14} />
            <span className="text-[#1A1A1A]">All Products</span>
          </nav>
          <div>
            <h1 className="text-[24px] font-black text-[#1A1A1A] tracking-tight mb-1">Product Catalog</h1>
            <p className="text-[14px] text-[#888] font-medium">Manage and view all warehouse products</p>
          </div>
        </div>
      </div>

      {/* ── SEARCH + SORT BAR ── */}
      <div className="shrink-0 flex items-center justify-between gap-4 mb-6 bg-white p-3 rounded-2xl border border-[#E8E8E4] shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#ABABAB]" strokeWidth={2.5} />
          <input
            type="text"
            placeholder="Search by SKU, name, or rack (e.g. F-1-2)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-[#FAFAF8] border border-[#E8E8E4] rounded-xl text-[14px] font-medium text-[#1A1A1A] focus:outline-none focus:border-[#CDCDC9] focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ABABAB] hover:text-[#555] transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {searchQuery && (
            <span className="text-[12px] font-bold text-[#888] bg-[#F0F0EC] px-3 py-1.5 rounded-lg whitespace-nowrap">
              {displayedProducts.length} result{displayedProducts.length !== 1 ? 's' : ''}
            </span>
          )}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none px-4 py-2 bg-[#FAFAF8] border border-[#E8E8E4] rounded-xl text-[13px] font-bold text-[#555] cursor-pointer hover:bg-[#F0F0EC] outline-none min-w-[170px]"
          >
            <option value="recent">Recently Added</option>
            <option value="highest">Highest Stock</option>
            <option value="lowest">Lowest Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-2xl border border-[#E8E8E4] shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden relative">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-20 bg-[#FAFAF8] shadow-[0_1px_0_0_#E8E8E4]">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#888] uppercase w-[100px]">IMAGE</th>
                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#888] uppercase w-[25%]">SKU-CODE</th>
                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#888] uppercase w-[34%]">RACK LOCATION</th>
                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#888] uppercase w-[16%]">TOTAL STOCK</th>
                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#888] uppercase text-right w-[15%]">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F0F0EC]">
              {displayedProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <p className="text-[15px] font-bold text-[#888]">No products found</p>
                    <p className="text-[13px] text-[#ABABAB] mt-1">
                      Try searching with a different SKU or rack name
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-4 px-4 py-2 text-[13px] font-bold text-[#555] border border-[#E8E8E4] rounded-xl hover:bg-[#F0F0EC] transition-colors"
                    >
                      Clear search
                    </button>
                  </td>
                </tr>
              ) : (
                displayedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-[#FAFAF8] transition-colors group">

                    {/* IMAGE - NOW CLICKABLE */}
                    <td className="px-6 py-4">
                      <div 
                        onClick={(e) => { e.stopPropagation(); handleSKUClick(product); }}
                        className="relative w-40 h-40 bg-[#F0F0EC] rounded-xl border border-[#E8E8E4] overflow-hidden shadow-sm group-hover:shadow transition-shadow shrink-0 cursor-pointer"
                      >
                        <img src={product.images[0]} alt="product" className="w-full h-full object-cover" />
                        {product.images.length > 1 && (
                          <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                            +{product.images.length - 1}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSKUClick(product); }}
                        className="text-[15px] font-bold text-blue-600 hover:text-blue-800 hover:underline tracking-tight transition-colors font-mono text-left"
                      >
                        {searchQuery && product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ? (
                          <HighlightText text={product.sku} query={searchQuery} />
                        ) : product.sku}
                      </button>
                      <p className="text-[12px] text-[#888] font-medium mt-0.5 line-clamp-1 max-w-[200px]">
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
                                ? 'bg-yellow-50 border-yellow-300 text-yellow-800 ring-1 ring-yellow-400'
                                : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                              }`}
                          >
                            {rack.location}
                            <span className={`text-[11px] font-medium px-1 py-0.5 rounded
                              ${rack.quantity === 0
                                ? 'text-red-400'
                                : rack.quantity <= LOW_STOCK_THRESHOLD
                                ? 'text-amber-600'
                                : 'text-indigo-400'
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
                        <div className="flex items-center gap-1.5 text-red-700 bg-red-50 w-fit px-3 py-1 rounded-lg border border-red-200 whitespace-nowrap">
                          <span className="font-bold text-[14px]">Out of Stock</span>
                        </div>
                      ) : product.isLowStock ? (
                        <div className="flex items-center gap-1.5 text-red-600 bg-red-50 w-fit px-3 py-1 rounded-lg border border-red-100 whitespace-nowrap">
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#CDCDC9] rounded-lg text-[13px] font-bold text-[#555] hover:bg-[#F0F0EC] hover:text-[#1A1A1A] transition-colors shadow-sm bg-white shrink-0"
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
            Showing <span className="font-bold text-[#1A1A1A]">{displayedProducts.length === 0 ? 0 : startIndex + 1}</span> to{' '}
            <span className="font-bold text-[#1A1A1A]">{Math.min(startIndex + ITEMS_PER_PAGE, displayedProducts.length)}</span> of{' '}
            <span className="font-bold text-[#1A1A1A]">{displayedProducts.length}</span> products
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-[13px] font-bold text-[#555] border border-[#E8E8E4] rounded-lg bg-white hover:bg-[#F0F0EC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
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
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-bold transition-colors shadow-sm
                        ${currentPage === page 
                          ? 'bg-[#1A1A1A] text-white border border-[#1A1A1A]' 
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
                className="flex items-center gap-1 px-3 py-1.5 text-[13px] font-bold text-[#555] border border-[#E8E8E4] rounded-lg bg-white hover:bg-[#F0F0EC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── PRODUCT DETAILS DRAWER ── */}
      <div className={`fixed inset-0 z-50 flex justify-end transition-all duration-300 ease-in-out ${isDrawerOpen ? 'visible' : 'invisible delay-300'}`}>
        <div className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsDrawerOpen(false)} />
        <div className={`relative w-[400px] bg-white shadow-2xl h-full flex flex-col border-l border-[#E8E8E4] transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0EC]">
            <h3 className="text-[15px] font-bold text-[#888]">SKU Details</h3>
            <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 text-[#888] hover:bg-[#F0F0EC] hover:text-[#1A1A1A] rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="w-full aspect-square bg-[#F7F7F5] rounded-2xl border border-[#E8E8E4] overflow-hidden mb-4 shadow-sm transition-all duration-300">
              <img src={selectedProduct?.images[activeImageIdx]} alt="Primary" className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-2.5 mb-6 overflow-x-auto pb-2 items-center">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="shrink-0 w-16 h-16 flex items-center justify-center bg-[#FAFAF8] border-2 border-dashed border-[#CDCDC9] hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 text-[#888] rounded-xl transition-all"
              >
                <Plus size={20} />
              </button>
              {selectedProduct?.images.map((imgSrc, i) => (
                <div
                  key={i}
                  onClick={() => setActiveImageIdx(i)}
                  className={`group relative shrink-0 w-16 h-16 bg-[#F7F7F5] rounded-xl border-2 overflow-hidden cursor-pointer transition-all
                    ${activeImageIdx === i ? 'border-blue-500 shadow-sm' : 'border-transparent hover:border-[#CDCDC9]'}`}
                >
                  <img src={imgSrc} alt="Thumb" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteImageClick(); }}
                      className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 hover:scale-110 transition-all shadow-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mb-6">
              <div className="text-[12px] font-bold tracking-widest text-[#888] uppercase mb-1">SKU Code</div>
              <h2 className="text-[28px] font-black text-[#1A1A1A] tracking-tight font-mono mb-4">{selectedProduct?.sku}</h2>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-[#888] uppercase">Description / Name</label>
                <textarea rows={2} defaultValue={selectedProduct?.name} className="w-full px-3 py-2 bg-[#FAFAF8] border border-[#E8E8E4] rounded-lg text-[13px] font-medium text-[#1A1A1A] outline-none focus:border-[#CDCDC9] focus:bg-white transition-all resize-none" />
              </div>
            </div>
            <div className="mb-6 p-5 bg-blue-50 rounded-2xl border border-blue-200">
              <span className="text-[13px] font-bold text-blue-700 mb-1 block">Total Stock</span>
              <span className="text-[32px] font-black text-blue-900 leading-none">
                {selectedProduct?.totalStock} <span className="text-[16px] font-medium">Pcs</span>
              </span>
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-[#1A1A1A] mb-3">Stock by Rack Location</h3>
              <div className="flex flex-col gap-2.5">
                {selectedProduct?.racks.map((rack, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white border border-[#E8E8E4] shadow-sm rounded-xl hover:border-[#CDCDC9] transition-colors">
                    <span className="text-[16px] font-bold text-[#1A1A1A] font-mono px-2">Rack {rack.location}</span>
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
      <div className={`fixed inset-0 z-[40] flex justify-end transition-all duration-300 ease-in-out ${activeRackForDrawer ? 'visible' : 'invisible delay-300'}`}>
        <div className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${activeRackForDrawer ? 'opacity-100' : 'opacity-0'}`} onClick={() => setActiveRackForDrawer(null)} />
        <div className={`relative w-[400px] bg-white shadow-2xl h-full flex flex-col border-l border-[#E8E8E4] transition-transform duration-300 ease-in-out ${activeRackForDrawer ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0F0EC]">
            <h3 className="text-[18px] font-black text-[#1A1A1A]">
              Contents of Rack: <span className="font-mono text-indigo-600">{activeRackForDrawer}</span>
            </h3>
            <button onClick={() => setActiveRackForDrawer(null)} className="p-1.5 text-[#888] hover:bg-[#F0F0EC] hover:text-[#1A1A1A] rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[#FAFAF8]">
            {activeRackForDrawer && getRackContents(activeRackForDrawer).map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => handleSKUClickFromRackDrawer(item.sku)}
                className="bg-white p-4 rounded-2xl border border-[#E8E8E4] shadow-sm flex items-center gap-4 hover:border-indigo-300 hover:ring-1 hover:ring-indigo-100 transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 bg-[#F0F0EC] rounded-xl border border-[#E8E8E4] overflow-hidden shrink-0 group-hover:shadow-md transition-shadow">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-black text-[#1A1A1A] font-mono truncate group-hover:text-indigo-600 transition-colors">{item.sku}</p>
                  <p className="text-[13px] font-medium text-[#888] truncate">{item.name}</p>
                </div>
                <div className="shrink-0 bg-[#F0F0EC] px-3 py-1.5 rounded-lg border border-[#E8E8E4] group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors">
                  <p className="text-[13px] font-bold text-[#1A1A1A] group-hover:text-indigo-800">{item.qty} <span className="font-medium text-[#888] group-hover:text-indigo-500 text-[11px]">Pcs</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── IMAGE UPLOAD MODAL ── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsUploadModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0EC]">
              <h2 className="text-[18px] font-black text-[#1A1A1A]">Upload Product Image</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-1.5 text-[#888] hover:bg-[#E8E8E4] rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6">
              <div className="border-2 border-dashed border-[#CDCDC9] rounded-2xl p-10 flex flex-col items-center justify-center bg-[#FAFAF8] hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors cursor-pointer group">
                <UploadCloud size={48} strokeWidth={1.5} className="text-[#ABABAB] group-hover:text-blue-500 mb-4 transition-colors" />
                <p className="text-[15px] font-bold text-[#1A1A1A] group-hover:text-blue-700 mb-1">Click or drag image to upload</p>
                <p className="text-[13px] text-[#888] font-medium">SVG, PNG, JPG or GIF (max. 5MB)</p>
              </div>
            </div>
            <div className="px-6 py-4 bg-[#FAFAF8] border-t border-[#F0F0EC] flex justify-end">
              <button onClick={() => setIsUploadModalOpen(false)} className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-white bg-[#1A1A1A] hover:bg-[#333] shadow-md transition-all">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADJUSTMENT MODAL ── */}
      {isAdjustModalOpen && adjustingProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAdjustModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0EC] bg-[#FAFAF8]">
              <h2 className="text-[18px] font-black text-[#1A1A1A]">Adjust Stock: <span className="font-mono text-blue-600">{adjustingProduct.sku}</span></h2>
              <button onClick={() => setIsAdjustModalOpen(false)} className="p-1.5 text-[#888] hover:bg-[#E8E8E4] rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6">
              <div className="flex bg-[#F0F0EC] p-1 rounded-xl mb-6">
                <button onClick={() => setAdjustmentTab('transfer')} className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all ${adjustmentTab === 'transfer' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#888] hover:text-[#555]'}`}>Transfer Rack</button>
                <button onClick={() => setAdjustmentTab('quantity')} className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all ${adjustmentTab === 'quantity' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#888] hover:text-[#555]'}`}>Quantity Adjustment</button>
              </div>

              {/* TAB 1: TRANSFER RACK */}
              {adjustmentTab === 'transfer' && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#1A1A1A]">From Rack</label>
                    <select value={fromRack} onChange={(e) => setFromRack(e.target.value)} className="w-full px-4 py-2.5 bg-[#FAFAF8] border border-[#E8E8E4] rounded-xl text-[14px] font-bold text-[#555] outline-none hover:bg-[#F0F0EC] cursor-pointer">
                      <option value="" disabled>Select origin rack...</option>
                      {adjustingProduct.racks.map(r => <option key={r.location} value={r.location}>{r.location} ({r.quantity} Pcs available)</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#1A1A1A]">To Rack <span className="text-[#888] font-normal">(Scan Barcode)</span></label>
                    <div className="relative">
                      <Barcode className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-yellow-600" />
                      <input type="text" value={toRack} onChange={(e) => setToRack(e.target.value)} placeholder="Scan or enter rack..." className="w-full pl-10 pr-4 py-2.5 bg-yellow-50 border border-yellow-300 rounded-xl text-[14px] font-bold font-mono text-yellow-900 outline-none focus:ring-2 focus:ring-yellow-400" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#1A1A1A]">Transfer Quantity</label>
                    <div className="flex items-center gap-3 bg-[#FAFAF8] border border-[#E8E8E4] p-1.5 rounded-xl w-max">
                      <button onClick={() => handleTransferStepper(setTransferQty, transferQty, 'sub')} className="w-10 h-10 flex items-center justify-center bg-[#F0F0EC] text-[#555] rounded-lg hover:bg-[#E8E8E4] transition-colors"><Minus size={18} strokeWidth={2.5} /></button>
                      <input type="text" value={transferQty} onChange={(e) => handleTransferNumberInput(setTransferQty, e.target.value)} className="w-16 text-center bg-transparent text-[16px] font-black text-[#1A1A1A] outline-none" />
                      <button onClick={() => handleTransferStepper(setTransferQty, transferQty, 'add')} className="w-10 h-10 flex items-center justify-center bg-[#888] text-white rounded-lg hover:bg-[#555] transition-colors"><Plus size={18} strokeWidth={2.5} /></button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#1A1A1A]">Reason</label>
                    <input type="text" value={transferReason} onChange={(e) => setTransferReason(e.target.value)} placeholder="Ketik alasan pindah rak..." className="w-full px-4 py-2.5 bg-[#FAFAF8] border border-[#E8E8E4] rounded-xl text-[14px] font-medium text-[#1A1A1A] outline-none focus:border-[#CDCDC9] focus:bg-white" />
                  </div>
                </div>
              )}

              {/* TAB 2: QUANTITY ADJUSTMENT (DINAMIS MINUS/PLUS) */}
              {adjustmentTab === 'quantity' && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#1A1A1A]">Select Rack to Adjust</label>
                    <select value={adjRack} onChange={(e) => setAdjRack(e.target.value)} className="w-full px-4 py-2.5 bg-[#FAFAF8] border border-[#E8E8E4] rounded-xl text-[14px] font-bold text-[#555] outline-none hover:bg-[#F0F0EC] cursor-pointer">
                      <option value="" disabled>Select rack...</option>
                      {adjustingProduct.racks.map(r => <option key={r.location} value={r.location}>{r.location} (Current: {r.quantity} Pcs)</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#1A1A1A]">Adjustment Quantity</label>
                    <div className="flex items-center gap-4">
                      {/* Stepper Input dengan Warna Dinamis */}
                      <div className={`flex items-center gap-3 p-1.5 rounded-xl w-max border-2 transition-all duration-300
                        ${isNegative ? 'bg-red-50 border-red-200' : isPositive ? 'bg-green-50 border-green-200' : 'bg-[#FAFAF8] border-[#E8E8E4]'}`}
                      >
                        <button onClick={() => handleAdjStepper(adjQty, 'sub')} className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${isNegative ? 'bg-red-200 text-red-700 hover:bg-red-300' : 'bg-[#F0F0EC] text-[#555] hover:bg-[#E8E8E4]'}`}>
                          <Minus size={18} strokeWidth={2.5} />
                        </button>
                        
                        <input type="text" value={adjQty} onChange={(e) => handleAdjNumberInput(e.target.value)} className={`w-16 text-center bg-transparent text-[18px] font-black outline-none ${isNegative ? 'text-red-700' : isPositive ? 'text-green-700' : 'text-[#1A1A1A]'}`} />
                        
                        <button onClick={() => handleAdjStepper(adjQty, 'add')} className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${isPositive ? 'bg-green-200 text-green-700 hover:bg-green-300' : 'bg-[#888] text-white hover:bg-[#555]'}`}>
                          <Plus size={18} strokeWidth={2.5} />
                        </button>
                      </div>
                      
                      {/* Indikator Teks Dinamis */}
                      <div className="flex flex-col">
                        {isNegative && <span className="text-[14px] font-black text-red-600 animate-in fade-in slide-in-from-left-2">Deducting {Math.abs(numAdjQty)} Pcs</span>}
                        {isPositive && <span className="text-[14px] font-black text-green-600 animate-in fade-in slide-in-from-left-2">Adding {numAdjQty} Pcs</span>}
                        {!isNegative && !isPositive && <span className="text-[14px] font-bold text-[#888]">No changes</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#1A1A1A]">Reason <span className="text-[#888] font-normal">(Manual Input)</span></label>
                    <input type="text" value={adjReason} onChange={(e) => setAdjReason(e.target.value)} placeholder="Ketik alasan penyesuaian..." className="w-full px-4 py-2.5 bg-[#FAFAF8] border border-[#E8E8E4] rounded-xl text-[14px] font-medium text-[#1A1A1A] outline-none focus:border-[#CDCDC9] focus:bg-white" />
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-[#FAFAF8] border-t border-[#F0F0EC] flex justify-end gap-3">
              <button onClick={() => setIsAdjustModalOpen(false)} className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-[#555] border border-[#E8E8E4] bg-white hover:bg-[#F0F0EC] transition-colors">Cancel</button>
              <button 
                onClick={handlePreSubmitAdjustment} 
                disabled={adjustmentTab === 'quantity' && numAdjQty === 0}
                className="px-6 py-2.5 rounded-xl text-[14px] font-bold text-white bg-[#1A1A1A] hover:bg-[#333] shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adjustmentTab === 'quantity' ? 'Request Adjustment' : 'Submit Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM DIALOG ── */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-[18px] font-black text-[#1A1A1A] mb-2">{confirmDialog.title}</h3>
            <p className="text-[14px] font-medium text-[#555] mb-8">{confirmDialog.message}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} className="flex-1 px-4 py-2.5 rounded-xl text-[14px] font-bold text-[#555] border border-[#E8E8E4] bg-white hover:bg-[#F0F0EC] transition-colors">Cancel</button>
              <button onClick={confirmDialog.onConfirm} className={`flex-1 px-4 py-2.5 rounded-xl text-[14px] font-bold transition-colors shadow-md ${confirmDialog.confirmColor}`}>{confirmDialog.confirmText}</button>
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
          <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5 not-italic">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}