export enum LeadStatus {
  NEW = 'New',
  CONTACTED = 'Contacted',
  QUALIFIED = 'Qualified',
  PROPOSAL = 'Proposal Sent',
  WON = 'Won',
  LOST = 'Lost'
}

export enum ProductCategory {
  STATIONERY = 'Stationery',
  IT_HARDWARE = 'IT Hardware',
  SOFTWARE = 'Software',
  OFFICE_FURNITURE = 'Office Furniture'
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  state: string; // Added State field
  status: LeadStatus;
  value: number; // In INR
  notes: string;
  lastContact: string;
  interest: string[]; // e.g., ["Laptops", "A4 Paper"]
  visibility: 'public' | 'private';
  ownerId: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  stock: number;
  sku: string;
  visibility: 'public' | 'private';
  ownerId: string;
}

export interface DashboardStats {
  totalRevenue: number;
  activeLeads: number;
  conversionRate: number;
  inventoryAlerts: number;
}