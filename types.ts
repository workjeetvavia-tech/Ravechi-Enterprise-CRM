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
  state: string;
  status: LeadStatus;
  value: number; // In INR
  notes: string;
  lastContact: string;
  interest: string[];
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

// --- New Entities ---

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  gstin?: string;
  address: string;
  status: 'Active' | 'Inactive';
}

export interface Proposal {
  id: string;
  title: string;
  clientName: string;
  value: number;
  date: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
}

export interface Invoice {
  id: string;
  number: string;
  clientName: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  type: 'Invoice' | 'Proforma';
}

export interface Ticket {
  id: string;
  subject: string;
  clientName: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved';
  date: string;
}

export interface FinanceRecord {
  id: string;
  description: string;
  amount: number;
  type: 'Income' | 'Expense';
  category: string;
  date: string;
}

export interface TimesheetEntry {
  id: string;
  project: string;
  task: string;
  hours: number;
  date: string;
}
