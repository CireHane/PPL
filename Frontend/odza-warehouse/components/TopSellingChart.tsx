const products = [
  { sku: "TS-014-WHT-M", sales: 85 },
  { sku: "JK-022-BLK-XL", sales: 65 },
  { sku: "HD-035-GRY-L", sales: 50 },
  { sku: "SW-047-NVY-M", sales: 44 },
  { sku: "PL-058-RED-S", sales: 32 },
  { sku: "TS-063-OLV-L", sales: 18 },
];

export default function TopSellingChart() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-900">Top Selling Product</h2>
        <button className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-md px-2.5 py-1">
          This Month ▾
        </button>
      </div>
      <div className="flex items-end gap-3 h-36 pl-6">
        {products.map((p) => (
          <div key={p.sku} className="flex flex-col items-center gap-1.5 flex-1">
            <div className="w-full bg-gray-800 rounded-t-sm hover:bg-gray-600 transition-colors"
              style={{ height: `${(p.sales / 100) * 120}px` }} />
            <span className="text-[9px] text-gray-400 text-center truncate w-full max-w-[60px]">
              {p.sku}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}