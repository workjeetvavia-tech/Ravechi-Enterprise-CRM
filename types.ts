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

export enum PurchaseOrderStatus {
  NEEDED = 'Product Needed',
  ORDERED = 'Order Given',
  TRANSIT = 'Items on the way',
  REACHED = 'Items Reached'
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Employee';
  status: 'Active' | 'Inactive';
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
  visibility: 'public' | 'private' | 'shared';
  sharedWith?: string[]; // Array of User IDs
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
  validUntil?: string;
  description?: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
}

export interface InvoiceItem {
  id: string;
  description: string;
  hsn: string;
  quantity: number;
  rate: number;
  gstRate: number; // e.g., 18
}

export interface Invoice {
  id: string;
  number: string;
  clientName: string;
  clientGstin?: string;
  clientAddress?: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  amount: number; // Total amount including tax
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  type: 'Invoice' | 'Proforma';
}

export interface TicketComment {
  id: string;
  text: string;
  author: string;
  date: string;
}

export interface Ticket {
  id: string;
  subject: string;
  clientName: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved';
  date: string;
  comments?: TicketComment[];
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
  startTime?: string;
  endTime?: string;
}

export interface PurchaseOrder {
  id: string;
  itemName: string;
  vendor: string;
  quantity: number;
  estimatedCost: number;
  status: PurchaseOrderStatus;
  orderDate: string;
  notes?: string;
}