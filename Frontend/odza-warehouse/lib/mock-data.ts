// lib/mock-data.ts

export type ActionType = "Inbound" | "Outbound" | "Adjustment" | "Canceled" | "Return" | "Reject";

export interface ActivityItem {
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
  type: "warning" | "info" | "error" | "success";
  read: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  totalQty: number;
  rack: string;
  lastUpdated: string;
}

export interface Rack {
  id: string;
  code: string;
  label: string;
  zone: string;
  capacity: number;
  used: number;
  products: string[];
}

export interface DashboardMetrics {
  totalSKUs: number;
  skuChange: number;
  inboundToday: number;
  inboundChange: number;
  outboundToday: number;
  outboundChange: number;
  lowStockAlerts: number;
  lowStockChange: number;
}

// ─── Dashboard Metrics ────────────────────────────────────────────
export const dashboardMetrics: DashboardMetrics = {
  totalSKUs: 4821,
  skuChange: 12,
  inboundToday: 18,
  inboundChange: 15,
  outboundToday: 21,
  outboundChange: 11,
  lowStockAlerts: 8,
  lowStockChange: 2,
};

// ─── Recent Activity ──────────────────────────────────────────────
export const recentActivity: ActivityItem[] = [
  {
    id: "act-001",
    sku: "RLK251208A-XL",
    operator: "User 1",
    action: "Adjustment",
    timestamp: "1 minutes ago",
    rack: "R-A01",
    qty: 5,
  },
  {
    id: "act-002",
    sku: "RLK251208A-XXL",
    operator: "User 2",
    action: "Inbound",
    timestamp: "5 minutes ago",
    rack: "R-A02",
    qty: 12,
  },
  {
    id: "act-003",
    sku: "RLK251210A-M",
    operator: "User 2",
    action: "Outbound",
    timestamp: "30 minutes ago",
    rack: "R-B01",
    qty: 8,
  },
  {
    id: "act-004",
    sku: "RLK251210B-M",
    operator: "User 3",
    action: "Canceled",
    timestamp: "1 hour ago",
    rack: "R-B03",
    qty: 3,
  },
  {
    id: "act-005",
    sku: "RLK2251210B-XXL",
    operator: "User 1",
    action: "Canceled",
    timestamp: "2 hour ago",
    rack: "R-C01",
    qty: 6,
  },
  {
    id: "act-006",
    sku: "BTK220901C-L",
    operator: "User 3",
    action: "Return",
    timestamp: "3 hours ago",
    rack: "R-D02",
    qty: 2,
  },
  {
    id: "act-007",
    sku: "BTK220901C-S",
    operator: "User 2",
    action: "Inbound",
    timestamp: "4 hours ago",
    rack: "R-A03",
    qty: 20,
  },
  {
    id: "act-008",
    sku: "PRG230512A-M",
    operator: "User 1",
    action: "Outbound",
    timestamp: "5 hours ago",
    rack: "R-C03",
    qty: 15,
  },
  {
    id: "act-009",
    sku: "PRG230512B-XL",
    operator: "User 3",
    action: "Reject",
    timestamp: "6 hours ago",
    rack: "R-D01",
    qty: 4,
  },
  {
    id: "act-010",
    sku: "KBY240303A-L",
    operator: "User 1",
    action: "Adjustment",
    timestamp: "7 hours ago",
    rack: "R-B02",
    qty: 9,
  },
];

// ─── Search Suggestions (frequent SKUs) ───────────────────────────
export const frequentSKUs: string[] = [
  "RLK251208A-XL",
  "RLK251208A-XXL",
  "RLK251208A-L",
  "RLK251208A-M",
  "RLK251210A-M",
  "RLK251210A-L",
  "RLK251210B-M",
  "RLK251210B-XL",
  "RLK2251210B-XXL",
  "BTK220901C-L",
  "BTK220901C-S",
  "BTK220901C-M",
  "BTK220901D-XL",
  "PRG230512A-M",
  "PRG230512A-L",
  "PRG230512B-XL",
  "KBY240303A-L",
  "KBY240303A-M",
  "KBY240303B-S",
  "SMB250101A-M",
];

// ─── Notifications ────────────────────────────────────────────────
export const initialNotifications: Notification[] = [
  {
    id: "notif-001",
    title: "Low Stock Alert",
    message: "SKU RLK251208A-XL tersisa 3 unit di Rack R-A01.",
    time: "2 menit lalu",
    type: "warning",
    read: false,
  },
  {
    id: "notif-002",
    title: "Inbound Selesai",
    message: "20 unit BTK220901C-S berhasil masuk ke Rack R-A03.",
    time: "15 menit lalu",
    type: "success",
    read: false,
  },
  {
    id: "notif-003",
    title: "Low Stock Alert",
    message: "SKU PRG230512B-XL tersisa 1 unit di Rack R-D01.",
    time: "1 jam lalu",
    type: "warning",
    read: false,
  },
  {
    id: "notif-004",
    title: "Transaksi Dibatalkan",
    message: "Outbound RLK251210B-M dibatalkan oleh User 3.",
    time: "2 jam lalu",
    type: "error",
    read: false,
  },
  {
    id: "notif-005",
    title: "Rack Hampir Penuh",
    message: "Rack R-C01 sudah terisi 92% kapasitas.",
    time: "3 jam lalu",
    type: "info",
    read: true,
  },
  {
    id: "notif-006",
    title: "Return Diproses",
    message: "2 unit BTK220901C-L telah dikembalikan ke Rack R-D02.",
    time: "4 jam lalu",
    type: "info",
    read: true,
  },
];

// ─── Products ─────────────────────────────────────────────────────
export const allProducts: Product[] = [
  { id: "p-001", sku: "RLK251208A-XL", name: "Batik Relek 2512 Series A", category: "Batik Relek", totalQty: 47, rack: "R-A01", lastUpdated: "1 jam lalu" },
  { id: "p-002", sku: "RLK251208A-XXL", name: "Batik Relek 2512 Series A", category: "Batik Relek", totalQty: 32, rack: "R-A02", lastUpdated: "5 menit lalu" },
  { id: "p-003", sku: "RLK251208A-L", name: "Batik Relek 2512 Series A", category: "Batik Relek", totalQty: 58, rack: "R-A01", lastUpdated: "2 jam lalu" },
  { id: "p-004", sku: "RLK251208A-M", name: "Batik Relek 2512 Series A", category: "Batik Relek", totalQty: 71, rack: "R-A03", lastUpdated: "3 jam lalu" },
  { id: "p-005", sku: "RLK251210A-M", name: "Batik Relek 2512 Series B", category: "Batik Relek", totalQty: 25, rack: "R-B01", lastUpdated: "30 menit lalu" },
  { id: "p-006", sku: "RLK251210A-L", name: "Batik Relek 2512 Series B", category: "Batik Relek", totalQty: 40, rack: "R-B01", lastUpdated: "1 jam lalu" },
  { id: "p-007", sku: "RLK251210B-M", name: "Batik Relek 2512 Series C", category: "Batik Relek", totalQty: 18, rack: "R-B03", lastUpdated: "1 jam lalu" },
  { id: "p-008", sku: "RLK2251210B-XXL", name: "Batik Relek 2512 Series C", category: "Batik Relek", totalQty: 9, rack: "R-C01", lastUpdated: "2 jam lalu" },
  { id: "p-009", sku: "BTK220901C-L", name: "Batik Klasik 2209 Series C", category: "Batik Klasik", totalQty: 63, rack: "R-D02", lastUpdated: "3 jam lalu" },
  { id: "p-010", sku: "BTK220901C-S", name: "Batik Klasik 2209 Series C", category: "Batik Klasik", totalQty: 85, rack: "R-A03", lastUpdated: "4 jam lalu" },
  { id: "p-011", sku: "BTK220901C-M", name: "Batik Klasik 2209 Series C", category: "Batik Klasik", totalQty: 52, rack: "R-A03", lastUpdated: "4 jam lalu" },
  { id: "p-012", sku: "BTK220901D-XL", name: "Batik Klasik 2209 Series D", category: "Batik Klasik", totalQty: 30, rack: "R-D01", lastUpdated: "5 jam lalu" },
  { id: "p-013", sku: "PRG230512A-M", name: "Batik Progo 2305 Series A", category: "Batik Progo", totalQty: 44, rack: "R-C03", lastUpdated: "5 jam lalu" },
  { id: "p-014", sku: "PRG230512A-L", name: "Batik Progo 2305 Series A", category: "Batik Progo", totalQty: 37, rack: "R-C03", lastUpdated: "6 jam lalu" },
  { id: "p-015", sku: "PRG230512B-XL", name: "Batik Progo 2305 Series B", category: "Batik Progo", totalQty: 3, rack: "R-D01", lastUpdated: "6 jam lalu" },
  { id: "p-016", sku: "KBY240303A-L", name: "Batik Kebaya 2403 Series A", category: "Batik Kebaya", totalQty: 22, rack: "R-B02", lastUpdated: "7 jam lalu" },
  { id: "p-017", sku: "KBY240303A-M", name: "Batik Kebaya 2403 Series A", category: "Batik Kebaya", totalQty: 19, rack: "R-B02", lastUpdated: "8 jam lalu" },
  { id: "p-018", sku: "KBY240303B-S", name: "Batik Kebaya 2403 Series B", category: "Batik Kebaya", totalQty: 61, rack: "R-C02", lastUpdated: "9 jam lalu" },
  { id: "p-019", sku: "SMB250101A-M", name: "Batik Simbat 2501 Series A", category: "Batik Simbat", totalQty: 75, rack: "R-C02", lastUpdated: "10 jam lalu" },
  { id: "p-020", sku: "SMB250101A-L", name: "Batik Simbat 2501 Series A", category: "Batik Simbat", totalQty: 48, rack: "R-C02", lastUpdated: "11 jam lalu" },
];

// ─── Racks ─────────────────────────────────────────────────────────
export const racks: Rack[] = [
  { id: "rack-01", code: "R-A01", label: "Rak A01", zone: "Zone A", capacity: 200, used: 105, products: ["RLK251208A-XL", "RLK251208A-L"] },
  { id: "rack-02", code: "R-A02", label: "Rak A02", zone: "Zone A", capacity: 200, used: 32, products: ["RLK251208A-XXL"] },
  { id: "rack-03", code: "R-A03", label: "Rak A03", zone: "Zone A", capacity: 200, used: 156, products: ["RLK251208A-M", "BTK220901C-S", "BTK220901C-M"] },
  { id: "rack-04", code: "R-B01", label: "Rak B01", zone: "Zone B", capacity: 150, used: 65, products: ["RLK251210A-M", "RLK251210A-L"] },
  { id: "rack-05", code: "R-B02", label: "Rak B02", zone: "Zone B", capacity: 150, used: 41, products: ["KBY240303A-L", "KBY240303A-M"] },
  { id: "rack-06", code: "R-B03", label: "Rak B03", zone: "Zone B", capacity: 150, used: 18, products: ["RLK251210B-M"] },
  { id: "rack-07", code: "R-C01", label: "Rak C01", zone: "Zone C", capacity: 100, used: 92, products: ["RLK2251210B-XXL"] },
  { id: "rack-08", code: "R-C02", label: "Rak C02", zone: "Zone C", capacity: 100, used: 59, products: ["KBY240303B-S", "SMB250101A-M", "SMB250101A-L"] },
  { id: "rack-09", code: "R-C03", label: "Rak C03", zone: "Zone C", capacity: 100, used: 81, products: ["PRG230512A-M", "PRG230512A-L"] },
  { id: "rack-10", code: "R-D01", label: "Rak D01", zone: "Zone D", capacity: 120, used: 33, products: ["BTK220901D-XL", "PRG230512B-XL"] },
  { id: "rack-11", code: "R-D02", label: "Rak D02", zone: "Zone D", capacity: 120, used: 63, products: ["BTK220901C-L"] },
];

// ─── Audit Trail (full history) ────────────────────────────────────
export const auditTrail: ActivityItem[] = [
  ...recentActivity,
  { id: "act-011", sku: "KBY240303B-S", operator: "User 2", action: "Inbound", timestamp: "8 hours ago", rack: "R-C02", qty: 15 },
  { id: "act-012", sku: "SMB250101A-M", operator: "User 1", action: "Outbound", timestamp: "9 hours ago", rack: "R-C02", qty: 10 },
  { id: "act-013", sku: "BTK220901D-XL", operator: "User 3", action: "Inbound", timestamp: "10 hours ago", rack: "R-D01", qty: 30 },
  { id: "act-014", sku: "PRG230512A-M", operator: "User 2", action: "Adjustment", timestamp: "11 hours ago", rack: "R-C03", qty: 44 },
  { id: "act-015", sku: "SMB250101A-L", operator: "User 1", action: "Inbound", timestamp: "12 hours ago", rack: "R-C02", qty: 48 },
  { id: "act-016", sku: "RLK251208A-L", operator: "User 3", action: "Outbound", timestamp: "Yesterday, 15:30", rack: "R-A01", qty: 7 },
  { id: "act-017", sku: "BTK220901C-L", operator: "User 1", action: "Inbound", timestamp: "Yesterday, 13:00", rack: "R-D02", qty: 65 },
  { id: "act-018", sku: "KBY240303A-L", operator: "User 2", action: "Outbound", timestamp: "Yesterday, 11:00", rack: "R-B02", qty: 5 },
  { id: "act-019", sku: "PRG230512B-XL", operator: "User 3", action: "Inbound", timestamp: "Yesterday, 09:00", rack: "R-D01", qty: 4 },
  { id: "act-020", sku: "RLK251210A-M", operator: "User 1", action: "Return", timestamp: "2 days ago", rack: "R-B01", qty: 2 },
];