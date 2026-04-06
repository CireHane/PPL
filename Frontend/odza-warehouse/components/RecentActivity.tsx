const activities = [
  { time: "Today, 14:22", txn: "TXN-98210", action: "Stock Inbound — SKU: TS-001-BLK-L",    operator: "User 1" },
  { time: "Today, 13:45", txn: "TXN-98209", action: "Stock Outbound — SKU: HD-002-GRY-XL",  operator: "User 2" },
  { time: "Today, 12:10", txn: "TXN-98208", action: "Stock Transfer — Rack A1 to B4",        operator: "User 3" },
  { time: "Today, 11:30", txn: "TXN-98207", action: "Return Processed — SKU: HD-022-GRY",    operator: "User 4" },
];

export default function RecentActivity() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-900">Recent Activity</h2>
        <button className="text-xs text-gray-400 hover:text-gray-600">View Full Audit →</button>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-100">
            <th className="text-left pb-2 font-medium">Timestamp</th>
            <th className="text-left pb-2 font-medium">Transaction ID</th>
            <th className="text-left pb-2 font-medium">Action</th>
            <th className="text-left pb-2 font-medium">Operator</th>
            <th className="text-left pb-2 font-medium">Status</th>
            <th className="text-left pb-2 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((a) => (
            <tr key={a.txn} className="border-b border-gray-50 last:border-0">
              <td className="py-2.5 text-gray-400">{a.time}</td>
              <td className="py-2.5 text-gray-400">{a.txn}</td>
              <td className="py-2.5 text-gray-700">{a.action}</td>
              <td className="py-2.5 text-gray-400">{a.operator}</td>
              <td className="py-2.5">
                <span className="bg-green-50 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-medium">
                  Completed
                </span>
              </td>
              <td className="py-2.5 flex gap-2">
                <button className="text-gray-400 hover:text-gray-700">Revert</button>
                <button className="text-gray-400 hover:text-gray-700">Detail</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}