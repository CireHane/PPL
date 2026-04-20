"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Settings, 
  X, 
  Barcode, 
  AlertTriangle, 
  Plus,
  Trash2,
  MoreVertical,
  Minus,
  UploadCloud
} from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  images: string[]; 
  totalStock: number;
  isLowStock?: boolean;
  racks: { location: string; quantity: number }[];
}

const mockProducts: Product[] = [
  {
    id: '1', sku: 'ZS241201B', name: 'Kemeja Pria Lengan Pendek Batik Solo Modern Slimfit Merah Maroon Celagen', totalStock: 76,
    images: [
      'https://odzaclassic.com/cdn/shop/files/id-11134207-7rasi-m5fdrxybq0t4d0_1ade8f4e-71c0-4c23-be77-203575a4485f.jpg?v=1738312704&width=600',
      'https://odzaclassic.com/cdn/shop/files/id-11134207-7rasi-m5fdrxybu8igba.jpg?v=1738312630&width=600',
      'https://odzaclassic.com/cdn/shop/files/id-11134207-7ras9-m5fdrxybx1nc94.jpg?v=1738312636&width=600'
    ],
    racks: [{ location: 'F-1-2', quantity: 66 }, { location: 'G-U-6-2', quantity: 10 }],
  },
  {
    id: '2', sku: 'ZW24081', name: 'Baju Outer Luaran Batik Rompi Couple Pesta Wanita Bolak Balik Panggenan Abu Coklat', totalStock: 13, isLowStock: true,
    images: [
      'https://odzaclassic.com/cdn/shop/files/ZW24081.jpg?v=1727237714&width=600',
      'https://odzaclassic.com/cdn/shop/files/ZW24081_1_5a084c32-e94e-46d9-adee-e5d368054e81.jpg?v=1727237732&width=600'
    ],
    racks: [{ location: 'G-6-U-2', quantity: 13 }],
  },
  {
    id: '3', sku: 'ZW260121A', name: 'Atasan Blouse Batik Modern Etnik Wanita Lengan Pendek Kimono Trikot Furing Merah Pink', totalStock: 142,
    images: [
      'https://odzaclassic.com/cdn/shop/files/01ff30cc7e3542749fa2e301cbd7f667_tplv-o3syd03w52-origin-jpeg_ec2c114d-b2c1-4c7d-9a50-4932600638fc.jpg?v=1769229913&width=600',
      'https://odzaclassic.com/cdn/shop/files/29b6c2d867404ed48ec663f34035a775_tplv-o3syd03w52-origin-jpeg.jpg?v=1769229838&width=600'
    ],
    racks: [{ location: 'W-4-1', quantity: 95 }, { location: 'T-1-2', quantity: 47 }],
  },
  {
    id: '4', sku: 'ZS25802B', name: 'Kemeja Batik Pria Lengan Pendek Slim Fit Regular Jumbo Modern Azmatex', totalStock: 234,
    images: [
      'https://odzaclassic.com/cdn/shop/files/id-11134207-81ztm-mf2acpv0ho260b.jpg?v=1760512223&width=600',
      'https://odzaclassic.com/cdn/shop/files/id-11134207-81ztm-mf2acpv07u325b.jpg?v=1760512201&width=600',
      'https://odzaclassic.com/cdn/shop/files/id-11134207-81ztq-mf2acpv0an7yd5.jpg?v=1760512208&width=600'
    ],
    racks: [{ location: 'W-4-1', quantity: 150 }, { location: 'T-1-2', quantity: 84 }],
  },
  {
    id: '5', sku: 'ZL25803B', name: 'Kemeja Batik Pria Salena Lengan Panjang Slim Fit Jumbo Modern Coklat', totalStock: 300,
    images: [
      'https://odzaclassic.com/cdn/shop/files/4721fbf647b44c48a89a22864182d851_tplv-o3syd03w52-origin-jpeg_9e8de6ee-36ab-42ca-b7e5-006e06bbf776.jpg?v=1759304117&width=600',
      'https://odzaclassic.com/cdn/shop/files/eb7f353401ae472ba121dccafa35ddfa_tplv-o3syd03w52-origin-jpeg.jpg?v=1759304100&width=600',
      'https://odzaclassic.com/cdn/shop/files/5890bde22dcd4baa967916ef2f612f93_tplv-o3syd03w52-origin-jpeg.jpg?v=1759304103&width=600',
      'https://odzaclassic.com/cdn/shop/files/5bea5b970a584d838c7b8a2e58d08a45_tplv-o3syd03w52-origin-jpeg.jpg?v=1759304107&width=600'
    ],
    racks: [{ location: 'T-1-2', quantity: 100 }, { location: 'C-1-2', quantity: 100 }, { location: 'C-2-1', quantity: 50 }, { location: 'D-4-5', quantity: 50 }],
  },
  {
    id: '6', sku: 'ZW25703', name: 'Baju Outer Luaran Atasan Motif Batik Kombinasi Rompi Katun Pesta Wanita Cantik Bolak Balik Panggenan Biru', totalStock: 76,
    images: [
      'https://odzaclassic.com/cdn/shop/files/5a17584c1d1441af96ff63003f1a5484_tplv-aphluv4xwc-origin-jpeg.jpg?v=1757743142&width=600',
      'https://odzaclassic.com/cdn/shop/files/d1fb48b0e54c4fabb30b9fbe509f6cfd_tplv-aphluv4xwc-origin-jpeg.jpg?v=1757743146&width=600',
      'https://odzaclassic.com/cdn/shop/files/93d47c9f20944ed0a7b6e43c9c636bf8_tplv-aphluv4xwc-origin-jpeg.jpg?v=1757743151&width=600'
    ],
    racks: [{ location: 'T-1-1', quantity: 66 }, { location: 'L-2-3', quantity: 10 }],
  },
  {
    id: '7', sku: 'BW00021', name: 'Bawahan Rok Lilit Batik Tradisional Kebaya Wanita Free Ring Navy Hanusa', totalStock: 76,
    images: [
      'https://odzaclassic.com/cdn/shop/files/id-11134207-7ra0t-mc9fphnxwlw911.jpg?v=1752737077&width=600',
      'https://odzaclassic.com/cdn/shop/files/id-11134207-7ra0h-mc9ftzfddr2a20.jpg?v=1752737080&width=600',
      'https://odzaclassic.com/cdn/shop/files/id-11134207-7ra0k-mc9ftzfd9jcy54.jpg?v=1752737084&width=600',
      'https://odzaclassic.com/cdn/shop/files/id-11134207-7ra0l-mc9ftzfdaxxee3.jpg?v=1752737092&width=600',
      'https://odzaclassic.com/cdn/shop/files/id-11134207-7ra0l-mc9ftzfd84si1e.jpg?v=1752737101&width=600',
      'https://odzaclassic.com/cdn/shop/files/id-11134207-7ra0s-mc9ftzfdcchu7b.jpg?v=1752737105&width=600'
    ],
    racks: [{ location: 'L-2-3', quantity: 66 }, { location: 'Q-1-1', quantity: 10 }],
  }
];

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent'); 
  
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0); 
  
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
  const [adjMode, setAdjMode] = useState<'add' | 'remove'>('add'); 
  const [adjRack, setAdjRack] = useState(''); 
  const [adjQty, setAdjQty] = useState('1');
  const [adjReason, setAdjReason] = useState(''); 

  const handleSKUClick = (product: Product) => {
    setSelectedProduct(product);
    setActiveImageIdx(0); 
    setIsDrawerOpen(true);
  };

  const handleDeleteImageClick = () => {
    setConfirmDialog({
      isOpen: true, title: "Delete Image", message: "Are you sure you want to delete this image? This action cannot be undone.", confirmText: "Delete", confirmColor: "bg-red-600 hover:bg-red-700 text-white",
      onConfirm: () => { console.log("Image deleted"); setConfirmDialog(prev => ({ ...prev, isOpen: false })); }
    });
  };

  const handleDeleteSKUClick = (product: Product) => {
    setOpenDropdownId(null); 
    setConfirmDialog({
      isOpen: true, title: "Deactivate SKU", message: `Are you sure you want to remove ${product.sku} from the active catalog? Past transaction records will be retained.`, confirmText: "Deactivate", confirmColor: "bg-red-600 hover:bg-red-700 text-white",
      onConfirm: () => { console.log("SKU Deactivated:", product.sku); setConfirmDialog(prev => ({ ...prev, isOpen: false })); }
    });
  };

  const handleAdjustClick = (product: Product) => {
    setAdjustingProduct(product);
    if (product.racks.length > 0) {
      setFromRack(product.racks[0].location);
      setAdjRack(product.racks[0].location);
    }
    setTransferQty('1');
    setAdjQty('1');
    setIsAdjustModalOpen(true);
  };

  const handlePreSubmitAdjustment = () => {
    setConfirmDialog({
      isOpen: true, title: "Confirm Adjustment", message: "Are you sure you want to process this stock adjustment?", confirmText: "Submit", confirmColor: "bg-[#1A1A1A] hover:bg-[#333] text-white",
      onConfirm: () => {
        setIsAdjustModalOpen(false);
        setFromRack(''); setToRack(''); setTransferQty('1'); setTransferReason('');
        setAdjRack(''); setAdjQty('1'); setAdjReason('');
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleNumberInput = (setter: (val: string) => void, value: string) => {
    const onlyNumbers = value.replace(/[^0-9]/g, '');
    setter(onlyNumbers);
  };

  const handleStepper = (setter: (val: string) => void, currentValue: string, operation: 'add' | 'sub') => {
    let num = parseInt(currentValue) || 0;
    if (operation === 'add') num += 1;
    if (operation === 'sub') num = Math.max(1, num - 1); 
    setter(num.toString());
  };

  return (
    <div className="flex flex-col h-full relative" onClick={() => setOpenDropdownId(null)}>
      
      {/* ── TOP SECTION ── */}
      <div className="shrink-0 mb-6">
        <h1 className="text-[24px] font-black text-[#1A1A1A] tracking-tight mb-1">Product Catalog</h1>
        <p className="text-[14px] text-[#888] font-medium">Manage and view all warehouse products</p>
      </div>

      <div className="shrink-0 flex items-center justify-between gap-4 mb-6 bg-white p-3 rounded-2xl border border-[#E8E8E4] shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#ABABAB]" strokeWidth={2.5} />
          <input
            type="text"
            placeholder="Search SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAFAF8] border border-[#E8E8E4] rounded-xl text-[14px] font-medium text-[#1A1A1A] focus:outline-none focus:border-[#CDCDC9] focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none px-4 py-2 bg-[#FAFAF8] border border-[#E8E8E4] rounded-xl text-[13px] font-bold text-[#555] cursor-pointer hover:bg-[#F0F0EC] outline-none min-w-[160px]"
          >
            <option value="recent">Recently Added</option>
            <option value="lowest">Lowest Stock</option>
            <option value="highest">Highest Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* ── THE DATA TABLE (STICKY HEADER) ── */}
      <div className="bg-white rounded-2xl border border-[#E8E8E4] shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden relative">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-20 bg-[#FAFAF8] shadow-[0_1px_0_0_#E8E8E4]">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#888] uppercase w-[80px]">IMAGE</th>
                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#888] uppercase w-[25%]">SKU-CODE</th>
                {/* ── LEBAR RACK & STOCK DISESUAIKAN AGAR TIDAK TURUN BARIS ── */}
                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#888] uppercase w-[34%]">RACK LOCATION</th>
                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#888] uppercase w-[16%]">TOTAL STOCK</th>
                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-[#888] uppercase text-right w-[15%]">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0EC]">
              {mockProducts.map((product) => (
                <tr key={product.id} className="hover:bg-[#FAFAF8] transition-colors group">
                  
                  <td className="px-6 py-4">
                    <div className="relative w-14 h-14 bg-[#F0F0EC] rounded-xl border border-[#E8E8E4] overflow-hidden shadow-sm group-hover:shadow transition-shadow">
                      <img src={product.images[0]} alt="product" className="w-full h-full object-cover" />
                      {product.images.length > 1 && (
                        <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                          +{product.images.length - 1}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSKUClick(product); }}
                      className="text-[15px] font-bold text-blue-600 hover:text-blue-800 hover:underline tracking-tight transition-colors font-mono text-left"
                    >
                      {product.sku}
                    </button>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {product.racks.map(rack => (
                        <Link 
                          key={rack.location} href={`/racks-table?rack=${rack.location}`}
                          className="inline-flex items-center px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-md text-[13px] font-bold text-indigo-700 font-mono hover:bg-indigo-100 transition-colors whitespace-nowrap"
                        >
                          {rack.location}
                        </Link>
                      ))}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {product.isLowStock ? (
                      /* ── KUNCI PERBAIKAN: whitespace-nowrap dan shrink-0 ── */
                      <div className="flex items-center gap-1.5 text-red-600 bg-red-50 w-fit px-3 py-1 rounded-lg border border-red-100 whitespace-nowrap">
                        <AlertTriangle size={14} strokeWidth={2.5} className="shrink-0" />
                        <span className="font-bold text-[14px] whitespace-nowrap">{product.totalStock} Pcs</span>
                        <span className="text-[12px] font-medium italic ml-1 whitespace-nowrap">(Menipis)</span>
                      </div>
                    ) : (
                      <div className="font-bold text-[15px] text-[#1A1A1A] px-3 py-1 whitespace-nowrap">{product.totalStock} Pcs</div>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAdjustClick(product); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-[#CDCDC9] rounded-lg text-[13px] font-bold text-[#555] hover:bg-[#F0F0EC] hover:text-[#1A1A1A] transition-colors shadow-sm bg-white shrink-0"
                      >
                        <Settings size={14} /> Adjust
                      </button>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === product.id ? null : product.id); }}
                        className="p-1.5 border border-transparent rounded-lg text-[#888] hover:bg-[#E8E8E4] transition-colors shrink-0"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openDropdownId === product.id && (
                        <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] border border-[#E8E8E4] py-1.5 z-[25] overflow-hidden">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteSKUClick(product); }}
                            className="w-full text-left px-4 py-2 text-[13px] font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 size={14} /> Delete SKU
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PRODUCT DETAILS DRAWER ── */}
      {isDrawerOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={() => setIsDrawerOpen(false)} />
          
          <div className="relative w-[400px] bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300 border-l border-[#E8E8E4]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0EC]">
              <h3 className="text-[15px] font-bold text-[#888]">SKU Details</h3>
              <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 text-[#888] hover:bg-[#F0F0EC] hover:text-[#1A1A1A] rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              
              <div className="w-full aspect-square bg-[#F7F7F5] rounded-2xl border border-[#E8E8E4] overflow-hidden mb-4 shadow-sm transition-all duration-300">
                <img src={selectedProduct.images[activeImageIdx]} alt="Primary" className="w-full h-full object-cover" />
              </div>

              <div className="flex gap-2.5 mb-6 overflow-x-auto pb-2 scrollbar-hide items-center">
                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="shrink-0 w-16 h-16 flex flex-col items-center justify-center bg-[#FAFAF8] border-2 border-dashed border-[#CDCDC9] hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 text-[#888] rounded-xl transition-all"
                >
                  <Plus size={20} />
                </button>
                {selectedProduct.images.map((imgSrc, i) => (
                  <div 
                    key={i} 
                    onClick={() => setActiveImageIdx(i)}
                    className={`group relative shrink-0 w-16 h-16 bg-[#F7F7F5] rounded-xl border-2 overflow-hidden cursor-pointer transition-all
                      ${activeImageIdx === i ? 'border-blue-500 shadow-sm' : 'border-transparent hover:border-[#CDCDC9]'}
                    `}
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
                <h2 className="text-[28px] font-black text-[#1A1A1A] tracking-tight font-mono mb-4">{selectedProduct.sku}</h2>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[#888] uppercase">Description / Name</label>
                  <textarea 
                    rows={2} 
                    defaultValue={selectedProduct.name}
                    placeholder="Enter product description..."
                    className="w-full px-3 py-2 bg-[#FAFAF8] border border-[#E8E8E4] rounded-lg text-[13px] font-medium text-[#1A1A1A] outline-none focus:border-[#CDCDC9] focus:bg-white transition-all resize-none"
                  />
                </div>
              </div>

              <div className="mb-6 p-5 bg-blue-50 rounded-2xl border border-blue-200 flex flex-col">
                <span className="text-[13px] font-bold text-blue-700 mb-1">Total Stock</span>
                <span className="text-[32px] font-black text-blue-900 leading-none">{selectedProduct.totalStock} <span className="text-[16px] font-medium">Pcs</span></span>
              </div>

              <div>
                <h3 className="text-[14px] font-bold text-[#1A1A1A] mb-3">Stock by Rack Location</h3>
                <div className="flex flex-col gap-2.5">
                  {selectedProduct.racks.map((rack, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white border border-[#E8E8E4] shadow-sm rounded-xl hover:border-[#CDCDC9] transition-colors">
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
      )}

      {/* ── IMAGE UPLOAD MODAL ── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsUploadModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0EC]">
              <h2 className="text-[18px] font-black text-[#1A1A1A]">Upload Product Image</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-1.5 text-[#888] hover:bg-[#E8E8E4] rounded-lg transition-colors">
                <X size={20} />
              </button>
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
              <button onClick={() => setIsAdjustModalOpen(false)} className="p-1.5 text-[#888] hover:bg-[#E8E8E4] rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex bg-[#F0F0EC] p-1 rounded-xl mb-6">
                <button onClick={() => setAdjustmentTab('transfer')} className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all ${adjustmentTab === 'transfer' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#888] hover:text-[#555]'}`}>
                  Transfer Rack
                </button>
                <button onClick={() => setAdjustmentTab('quantity')} className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all ${adjustmentTab === 'quantity' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#888] hover:text-[#555]'}`}>
                  Quantity Adjustment
                </button>
              </div>

              {/* ── TRANSFER RACK ── */}
              {adjustmentTab === 'transfer' && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#1A1A1A]">From Rack</label>
                    <select value={fromRack} onChange={(e) => setFromRack(e.target.value)} className="w-full px-4 py-2.5 bg-[#FAFAF8] border border-[#E8E8E4] rounded-xl text-[14px] font-bold text-[#555] outline-none hover:bg-[#F0F0EC] cursor-pointer">
                      <option value="" disabled>Select origin rack...</option>
                      {adjustingProduct.racks.map(rack => (
                        <option key={rack.location} value={rack.location}>{rack.location}</option>
                      ))}
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
                      <button 
                        onClick={() => handleStepper(setTransferQty, transferQty, 'sub')}
                        className="w-10 h-10 flex items-center justify-center bg-[#F0F0EC] text-[#555] rounded-lg hover:bg-[#E8E8E4] transition-colors"
                      >
                        <Minus size={18} strokeWidth={2.5} />
                      </button>
                      <input 
                        type="text" 
                        value={transferQty} 
                        onChange={(e) => handleNumberInput(setTransferQty, e.target.value)} 
                        className="w-16 text-center bg-transparent text-[16px] font-black text-[#1A1A1A] outline-none"
                      />
                      <button 
                        onClick={() => handleStepper(setTransferQty, transferQty, 'add')}
                        className="w-10 h-10 flex items-center justify-center bg-[#888] text-white rounded-lg hover:bg-[#555] transition-colors"
                      >
                        <Plus size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#1A1A1A]">Reason <span className="text-[#888] font-normal">(Manual Input)</span></label>
                    <input type="text" value={transferReason} onChange={(e) => setTransferReason(e.target.value)} placeholder="Ketik alasan pindah rak..." className="w-full px-4 py-2.5 bg-[#FAFAF8] border border-[#E8E8E4] rounded-xl text-[14px] font-medium text-[#1A1A1A] outline-none focus:border-[#CDCDC9] focus:bg-white" />
                  </div>
                </div>
              )}

              {/* ── QUANTITY ADJUSTMENT ── */}
              {adjustmentTab === 'quantity' && (
                <div className="flex flex-col gap-5">
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#1A1A1A]">Select Rack to Adjust</label>
                    <select value={adjRack} onChange={(e) => setAdjRack(e.target.value)} className="w-full px-4 py-2.5 bg-[#FAFAF8] border border-[#E8E8E4] rounded-xl text-[14px] font-bold text-[#555] outline-none hover:bg-[#F0F0EC] cursor-pointer">
                      <option value="" disabled>Select rack...</option>
                      {adjustingProduct.racks.map(rack => (
                        <option key={rack.location} value={rack.location}>{rack.location} (Current: {rack.quantity} Pcs)</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#1A1A1A]">Adjustment Action</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setAdjMode('remove')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${adjMode === 'remove' ? 'bg-red-50 border-red-500 text-red-700 font-black shadow-sm' : 'bg-white border-[#E8E8E4] text-[#888] font-bold hover:bg-[#FAFAF8]'}`}
                      >
                        <Minus size={18} strokeWidth={3} /> Remove Stock
                      </button>
                      <button 
                        onClick={() => setAdjMode('add')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${adjMode === 'add' ? 'bg-green-50 border-green-500 text-green-700 font-black shadow-sm' : 'bg-white border-[#E8E8E4] text-[#888] font-bold hover:bg-[#FAFAF8]'}`}
                      >
                        <Plus size={18} strokeWidth={3} /> Add Stock
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[#1A1A1A]">Quantity to {adjMode === 'add' ? 'Add' : 'Remove'}</label>
                    <div className="flex items-center gap-3 bg-[#FAFAF8] border border-[#E8E8E4] p-1.5 rounded-xl w-max">
                      <button 
                        onClick={() => handleStepper(setAdjQty, adjQty, 'sub')}
                        className="w-10 h-10 flex items-center justify-center bg-[#F0F0EC] text-[#555] rounded-lg hover:bg-[#E8E8E4] transition-colors"
                      >
                        <Minus size={18} strokeWidth={2.5} />
                      </button>
                      <input 
                        type="text" 
                        value={adjQty} 
                        onChange={(e) => handleNumberInput(setAdjQty, e.target.value)} 
                        className={`w-16 text-center bg-transparent text-[16px] font-black outline-none ${adjMode === 'add' ? 'text-green-700' : 'text-red-700'}`}
                      />
                      <button 
                        onClick={() => handleStepper(setAdjQty, adjQty, 'add')}
                        className="w-10 h-10 flex items-center justify-center bg-[#888] text-white rounded-lg hover:bg-[#555] transition-colors"
                      >
                        <Plus size={18} strokeWidth={2.5} />
                      </button>
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
              <button onClick={handlePreSubmitAdjustment} className="px-6 py-2.5 rounded-xl text-[14px] font-bold text-white bg-[#1A1A1A] hover:bg-[#333] shadow-md transition-all">Submit Adjustment</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOM CONFIRMATION POP-UP (GLOBAL) ── */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDialog(prev => ({...prev, isOpen: false}))} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-[18px] font-black text-[#1A1A1A] mb-2">{confirmDialog.title}</h3>
            <p className="text-[14px] font-medium text-[#555] mb-8">{confirmDialog.message}</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setConfirmDialog(prev => ({...prev, isOpen: false}))}
                className="flex-1 px-4 py-2.5 rounded-xl text-[14px] font-bold text-[#555] border border-[#E8E8E4] bg-white hover:bg-[#F0F0EC] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDialog.onConfirm}
                className={`flex-1 px-4 py-2.5 rounded-xl text-[14px] font-bold transition-colors shadow-md ${confirmDialog.confirmColor}`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}