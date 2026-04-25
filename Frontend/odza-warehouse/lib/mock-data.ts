export type ActionType = "Inbound" | "Outbound" | "Adjustment" | "Canceled" | "Return";

export interface ActivityLog {
  id: string;
  sku: string;
  operator: string;
  action: ActionType;
  timestamp: string;
  rack?: string;
  qty?: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "warning" | "info" | "success" | "error";
}

export interface Product {
  sku: string;
  name: string;
  category: string;
  totalQty: number;
  rack: string;
}

// ─── Recent Activity ─────────────────────────────────────────
export const recentActivity: ActivityLog[] = [
  { id: "1", sku: "RLK251208A-XL",  operator: "User 1", action: "Adjustment", timestamp: "1 minute ago",  rack: "R-A3", qty: 2  },
  { id: "2", sku: "RLK251208A-XXL", operator: "User 2", action: "Inbound",    timestamp: "5 minutes ago", rack: "R-B1", qty: 12 },
  { id: "3", sku: "RLK251210A-M",   operator: "User 2", action: "Outbound",   timestamp: "30 minutes ago",rack: "R-A2", qty: 5  },
  { id: "4", sku: "RLK251210B-M",   operator: "User 3", action: "Canceled",   timestamp: "1 hour ago",    rack: "R-C1", qty: 3  },
  { id: "5", sku: "RLK2251210B-XXL",operator: "User 1", action: "Canceled",   timestamp: "2 hours ago",   rack: "R-A1", qty: 1  },
  { id: "6", sku: "BTK240901C-S",   operator: "User 3", action: "Inbound",    timestamp: "3 hours ago",   rack: "R-D2", qty: 20 },
  { id: "7", sku: "BTK240901C-M",   operator: "User 2", action: "Outbound",   timestamp: "4 hours ago",   rack: "R-D2", qty: 8  },
  { id: "8", sku: "BTK240901C-L",   operator: "User 1", action: "Return",     timestamp: "5 hours ago",   rack: "R-E1", qty: 2  },
];

// ─── Dashboard Metrics ───────────────────────────────────────
export const dashboardMetrics = {
  totalSKUs:     { value: 4821, delta: "+12", trend: "up" as const },
  inboundToday:  { value: 18,   delta: "+15", trend: "up" as const },
  outboundToday: { value: 21,   delta: "+11", trend: "up" as const },
  lowStock:      { value: 8,    delta: "+2",  trend: "down" as const },
};

// ─── Notifications ────────────────────────────────────────────
export const initialNotifications: Notification[] = [
  { id: "n1", title: "Stok Kritis",        message: "SKU BTK240901C-S tersisa 2 unit di Rack R-D2",    time: "2 menit lalu",  read: false, type: "error"   },
  { id: "n2", title: "Inbound Selesai",    message: "12 unit RLK251208A-XXL berhasil masuk ke R-B1",   time: "5 menit lalu",  read: false, type: "success" },
  { id: "n3", title: "Outbound Pending",   message: "5 unit RLK251210A-M menunggu konfirmasi resi",    time: "32 menit lalu", read: false, type: "warning" },
  { id: "n4", title: "Transfer Rak",       message: "User 3 memindahkan 10 unit BTK240901C-M ke R-E2", time: "1 jam lalu",    read: true,  type: "info"    },
  { id: "n5", title: "Audit Dijadwalkan",  message: "Stock opname dijadwalkan besok pukul 08.00 WIB",  time: "3 jam lalu",    read: true,  type: "info"    },
];

// ─── Frequently Searched SKUs ─────────────────────────────────
export const frequentlySearched: Product[] = [
  { sku: "RLK251208A-XL",   name: "Batik Relek Series 1208A",  category: "Relek",   totalQty: 45,  rack: "R-A3" },
  { sku: "RLK251208A-XXL",  name: "Batik Relek Series 1208A",  category: "Relek",   totalQty: 30,  rack: "R-B1" },
  { sku: "RLK251210A-M",    name: "Batik Relek Series 1210A",  category: "Relek",   totalQty: 62,  rack: "R-A2" },
  { sku: "BTK240901C-S",    name: "Batik Classic Series 0901C",category: "Classic", totalQty: 2,   rack: "R-D2" },
  { sku: "BTK240901C-M",    name: "Batik Classic Series 0901C",category: "Classic", totalQty: 18,  rack: "R-D2" },
  { sku: "BTK240901C-L",    name: "Batik Classic Series 0901C",category: "Classic", totalQty: 35,  rack: "R-D3" },
  { sku: "OZC251105B-XL",   name: "Odza Classic Series 1105B", category: "Classic", totalQty: 88,  rack: "R-C1" },
  { sku: "OZC251105B-XXL",  name: "Odza Classic Series 1105B", category: "Classic", totalQty: 14,  rack: "R-C2" },
  { sku: "PRM241200A-L",    name: "Premium Batik Series 1200A",category: "Premium", totalQty: 120, rack: "R-F1" },
  { sku: "PRM241200A-M",    name: "Premium Batik Series 1200A",category: "Premium", totalQty: 95,  rack: "R-F1" },
];

// ─── Racks ────────────────────────────────────────────────────
export const racks = [
  { id: "R-A1", label: "Rack A-1", zone: "Zone A", capacity: 200, used: 145 },
  { id: "R-A2", label: "Rack A-2", zone: "Zone A", capacity: 200, used: 180 },
  { id: "R-A3", label: "Rack A-3", zone: "Zone A", capacity: 200, used: 62  },
  { id: "R-B1", label: "Rack B-1", zone: "Zone B", capacity: 150, used: 90  },
  { id: "R-B2", label: "Rack B-2", zone: "Zone B", capacity: 150, used: 148 },
  { id: "R-C1", label: "Rack C-1", zone: "Zone C", capacity: 300, used: 220 },
  { id: "R-C2", label: "Rack C-2", zone: "Zone C", capacity: 300, used: 75  },
  { id: "R-D2", label: "Rack D-2", zone: "Zone D", capacity: 200, used: 20  },
  { id: "R-D3", label: "Rack D-3", zone: "Zone D", capacity: 200, used: 100 },
  { id: "R-E1", label: "Rack E-1", zone: "Zone E", capacity: 250, used: 190 },
  { id: "R-E2", label: "Rack E-2", zone: "Zone E", capacity: 250, used: 60  },
  { id: "R-F1", label: "Rack F-1", zone: "Zone F", capacity: 400, used: 215 },
];
