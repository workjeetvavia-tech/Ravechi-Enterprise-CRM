import { Lead, LeadStatus, Product, ProductCategory, PurchaseOrder, PurchaseOrderStatus, AppUser, Client, Proposal, Invoice, InvoiceItem } from "../types";
import { supabase } from "./supabaseClient";

// LocalStorage Keys (Fallback/Cache)
const LEADS_KEY = 'ravechi_leads_v2';
const PRODUCTS_KEY = 'ravechi_products_v2';
const PO_KEY = 'ravechi_purchase_orders';
const CLIENTS_KEY = 'ravechi_clients';
const PROPOSALS_KEY = 'ravechi_proposals';
const INVOICES_KEY = 'ravechi_invoices'; // Combined for local storage fallback simplicity if needed, though pages split them
const USERS_KEY = 'ravechi_users';

// In-Memory Cache
let leadsCache: Lead[] = [];
let productsCache: Product[] = [];
let purchaseOrdersCache: PurchaseOrder[] = [];
let clientsCache: Client[] = [];
let proposalsCache: Proposal[] = [];
let invoicesCache: Invoice[] = [];

// --- EVENT SYSTEM ---
type ChangeCallback = () => void;
const listeners: Record<string, ChangeCallback[]> = {
    leads: [],
    products: [],
    purchaseOrders: [],
    clients: [],
    proposals: [],
    invoices: []
};

const notify = (type: string) => {
    if (listeners[type]) listeners[type].forEach(cb => cb());
};

// Real-time Subscription
export const subscribeToData = (type: 'leads' | 'products' | 'purchaseOrders' | 'clients' | 'proposals' | 'invoices', callback: ChangeCallback) => {
    if (!listeners[type]) listeners[type] = [];
    listeners[type].push(callback);
    
    let supabaseSubscription: any = null;
    if (supabase) {
        let table = '';
        if (type === 'leads') table = 'leads';
        if (type === 'products') table = 'products';
        if (type === 'purchaseOrders') table = 'purchase_orders';
        if (type === 'clients') table = 'clients';
        if (type === 'proposals') table = 'proposals';
        if (type === 'invoices') table = 'invoices';

        if (table) {
            supabaseSubscription = supabase
                .channel(`public:${table}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: table }, () => {
                    callback();
                })
                .subscribe();
        }
    }

    return () => {
        listeners[type] = listeners[type].filter(cb => cb !== callback);
        if (supabaseSubscription) {
            supabase.removeChannel(supabaseSubscription);
        }
    };
};

// --- HELPER: GET APP USERS ---
export const getAppUsers = (): AppUser[] => {
    try {
        const saved = localStorage.getItem(USERS_KEY);
        if (!saved) {
            const defaults: AppUser[] = [
                { id: '1', name: 'Jaydeep D', email: 'jaydeep@ravechi.com', role: 'Admin', status: 'Active' },
                { id: '2', name: 'Sales Rep 1', email: 'sales1@ravechi.com', role: 'Employee', status: 'Active' },
                { id: '3', name: 'Accountant', email: 'accounts@ravechi.com', role: 'Employee', status: 'Active' },
            ];
            localStorage.setItem(USERS_KEY, JSON.stringify(defaults));
            return defaults;
        }
        return JSON.parse(saved);
    } catch (e) {
        return [];
    }
};

// --- DATA MAPPERS ---
const mapLead = (item: any): Lead => ({
    id: item.id,
    name: item.name,
    company: item.company,
    email: item.email || '',
    phone: item.phone || '',
    state: item.state || '',
    status: item.status as LeadStatus,
    value: Number(item.value) || 0,
    notes: item.notes || '',
    lastContact: item.lastContact || item["lastContact"] || new Date().toISOString().split('T')[0],
    interest: Array.isArray(item.interest) ? item.interest : [],
    visibility: item.visibility || 'public',
    sharedWith: Array.isArray(item.sharedWith) ? item.sharedWith : [],
    ownerId: item.ownerId || item["ownerId"] || ''
});

const mapProduct = (item: any): Product => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    category: item.category as ProductCategory,
    price: Number(item.price) || 0,
    stock: Number(item.stock) || 0,
    visibility: item.visibility || 'public',
    ownerId: item.ownerId || item["ownerId"] || ''
});

const mapPO = (item: any): PurchaseOrder => ({
    id: item.id,
    itemName: item.itemName || item["itemName"],
    vendor: item.vendor,
    quantity: item.quantity,
    estimatedCost: item.estimatedCost || item["estimatedCost"],
    status: item.status as PurchaseOrderStatus,
    orderDate: item.orderDate || item["orderDate"],
    notes: item.notes || ''
});

const mapClient = (item: any): Client => ({
    id: item.id,
    name: item.name,
    company: item.company,
    email: item.email || '',
    phone: item.phone || '',
    gstin: item.gstin || '',
    address: item.address || '',
    status: item.status || 'Active'
});

const mapProposal = (item: any): Proposal => ({
    id: item.id,
    title: item.title,
    clientName: item.clientName || item["clientName"],
    value: Number(item.value) || 0,
    date: item.date,
    validUntil: item.validUntil || item["validUntil"],
    description: item.description || '',
    status: item.status
});

const mapInvoice = (item: any): Invoice => ({
    id: item.id,
    number: item.number,
    clientName: item.clientName || item["clientName"],
    clientGstin: item.clientGstin || item["clientGstin"],
    clientAddress: item.clientAddress || item["clientAddress"],
    date: item.date,
    dueDate: item.dueDate || item["dueDate"],
    amount: Number(item.amount),
    status: item.status,
    type: item.type,
    items: item.items || [] 
});

// --- LEADS OPERATIONS ---
export const getLeads = async (currentUserId?: string): Promise<Lead[]> => {
  if (supabase) {
      try {
        let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
        if (currentUserId) {
           query = query.or(`visibility.eq.public,"ownerId".eq.${currentUserId},sharedWith.cs.{${currentUserId}}`);
        } else {
           query = query.eq('visibility', 'public');
        }
        const { data, error } = await query;
        if (error) {
            // Fallback for missing schema
            if (error.code === '42703' || error.message.includes("sharedWith")) { 
                const { data: fallbackData } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
                return (fallbackData || []).map(mapLead);
            }
            throw error;
        }
        return (data || []).map(mapLead);
      } catch (err: any) { console.error("Supabase Leads Error:", err.message); }
  }
  return Promise.resolve(leadsCache);
};

export const addLead = async (lead: Omit<Lead, 'id'>): Promise<Lead> => {
  if (supabase) {
      const payload: any = { ...lead, interest: lead.interest || [], sharedWith: lead.sharedWith || [] };
      try {
        const { data, error } = await supabase.from('leads').insert([{ ...payload, visibility: lead.visibility || 'public', "ownerId": lead.ownerId }]).select().single();
        if (error) throw error;
        return mapLead(data);
      } catch (err) { console.error("Error adding lead:", err); }
  }
  return Promise.resolve({ ...lead, id: Date.now().toString() } as Lead);
};

export const updateLead = async (updatedLead: Lead): Promise<Lead> => {
  if (supabase) {
      const { id, ...updates } = updatedLead;
      try {
        const { error } = await supabase.from('leads').update(updates).eq('id', id);
        if (error) throw error;
        return updatedLead;
      } catch (err) { console.error("Error updating lead", err); }
  }
  return Promise.resolve(updatedLead);
};

export const deleteLead = async (id: string): Promise<void> => {
  if (supabase) {
      try {
        await supabase.from('leads').delete().eq('id', id);
      } catch (err) { console.error("Error deleting lead", err); }
  }
};

export const updateLeadStatus = async (id: string, status: LeadStatus): Promise<void> => {
    if (supabase) {
        try { await supabase.from('leads').update({ status }).eq('id', id); } catch(e) { console.error(e); }
    }
};

// --- PRODUCTS OPERATIONS ---
export const getProducts = async (currentUserId?: string): Promise<Product[]> => {
  if (supabase) {
      try {
        let query = supabase.from('products').select('*').order('created_at', { ascending: false });
        if (currentUserId) query = query.or(`visibility.eq.public,"ownerId".eq.${currentUserId}`);
        else query = query.eq('visibility', 'public');
        const { data, error } = await query;
        if (!error) return (data || []).map(mapProduct);
      } catch (err) {}
  }
  return Promise.resolve(productsCache);
};

export const addProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
    if (supabase) {
        try {
            const { data, error } = await supabase.from('products').insert([{ ...product, visibility: product.visibility || 'public', "ownerId": product.ownerId }]).select().single();
            if (!error) return mapProduct(data);
        } catch(err) {}
    }
    return Promise.resolve({ ...product, id: Date.now().toString() } as Product);
};

export const addBulkProducts = async (products: Omit<Product, 'id'>[]): Promise<Product[]> => {
    if (supabase) {
        try {
            const { data, error } = await supabase.from('products').insert(products).select();
            if (!error) return (data || []).map(mapProduct);
        } catch(err) {}
    }
    return Promise.resolve([]);
};

export const updateProduct = async (updatedProduct: Product): Promise<Product> => {
    if (supabase) {
        const { id, ...rest } = updatedProduct;
        await supabase.from('products').update(rest).eq('id', id);
    }
    return updatedProduct;
};

export const deleteProduct = async (id: string): Promise<void> => {
    if (supabase) await supabase.from('products').delete().eq('id', id);
};

// --- PURCHASE ORDERS OPERATIONS ---
export const getPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
    if (supabase) {
        try {
            const { data, error } = await supabase.from('purchase_orders').select('*').order('created_at', { ascending: false });
            if (!error) return (data || []).map(mapPO);
        } catch (e) {}
    }
    return Promise.resolve(purchaseOrdersCache);
};

export const addPurchaseOrder = async (po: Omit<PurchaseOrder, 'id'>): Promise<PurchaseOrder> => {
    if (supabase) {
        try {
            const payload = { "itemName": po.itemName, vendor: po.vendor, quantity: po.quantity, "estimatedCost": po.estimatedCost, status: po.status, "orderDate": po.orderDate, notes: po.notes };
            const { data, error } = await supabase.from('purchase_orders').insert([payload]).select().single();
            if (!error) return mapPO(data);
        } catch (e) {}
    }
    return Promise.resolve({ ...po, id: Date.now().toString() } as PurchaseOrder);
};

export const updatePurchaseOrder = async (po: PurchaseOrder): Promise<PurchaseOrder> => {
    if (supabase) {
        const payload = { "itemName": po.itemName, vendor: po.vendor, quantity: po.quantity, "estimatedCost": po.estimatedCost, status: po.status, "orderDate": po.orderDate, notes: po.notes };
        await supabase.from('purchase_orders').update(payload).eq('id', po.id);
    }
    return po;
};

export const deletePurchaseOrder = async (id: string): Promise<void> => {
    if (supabase) await supabase.from('purchase_orders').delete().eq('id', id);
};

export const updatePurchaseOrderStatus = async (id: string, status: PurchaseOrderStatus): Promise<void> => {
    if (supabase) await supabase.from('purchase_orders').update({ status }).eq('id', id);
};

// --- CLIENTS OPERATIONS ---
export const getClients = async (): Promise<Client[]> => {
    if (supabase) {
        try {
            const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
            if (!error) return (data || []).map(mapClient);
        } catch(e) { console.error(e); }
    }
    return Promise.resolve(clientsCache);
};

export const addClient = async (client: Omit<Client, 'id'>): Promise<Client> => {
    if (supabase) {
        try {
            const { data, error } = await supabase.from('clients').insert([client]).select().single();
            if (!error) return mapClient(data);
        } catch(e) { console.error(e); }
    }
    return Promise.resolve({ ...client, id: Date.now().toString() } as Client);
};

export const updateClient = async (client: Client): Promise<Client> => {
    if (supabase) {
        const { id, ...rest } = client;
        await supabase.from('clients').update(rest).eq('id', id);
    }
    return client;
};

export const deleteClient = async (id: string): Promise<void> => {
    if (supabase) await supabase.from('clients').delete().eq('id', id);
};

// --- PROPOSALS OPERATIONS ---
export const getProposals = async (): Promise<Proposal[]> => {
    if (supabase) {
        try {
            const { data, error } = await supabase.from('proposals').select('*').order('created_at', { ascending: false });
            if (!error) return (data || []).map(mapProposal);
        } catch(e) { console.error(e); }
    }
    return Promise.resolve(proposalsCache);
};

export const addProposal = async (proposal: Omit<Proposal, 'id'>): Promise<Proposal> => {
    if (supabase) {
        try {
            // Mapping camelCase to potentially needed snake_case or specific column names if defined in SQL
            const payload = {
                title: proposal.title,
                "clientName": proposal.clientName,
                value: proposal.value,
                date: proposal.date,
                "validUntil": proposal.validUntil,
                description: proposal.description,
                status: proposal.status
            };
            const { data, error } = await supabase.from('proposals').insert([payload]).select().single();
            if (!error) return mapProposal(data);
        } catch(e) { console.error(e); }
    }
    return Promise.resolve({ ...proposal, id: Date.now().toString() } as Proposal);
};

export const updateProposal = async (proposal: Proposal): Promise<Proposal> => {
    if (supabase) {
        const payload = {
            title: proposal.title,
            "clientName": proposal.clientName,
            value: proposal.value,
            date: proposal.date,
            "validUntil": proposal.validUntil,
            description: proposal.description,
            status: proposal.status
        };
        await supabase.from('proposals').update(payload).eq('id', proposal.id);
    }
    return proposal;
};

export const deleteProposal = async (id: string): Promise<void> => {
    if (supabase) await supabase.from('proposals').delete().eq('id', id);
};

// --- INVOICES OPERATIONS ---
export const getInvoices = async (type?: 'Invoice' | 'Proforma'): Promise<Invoice[]> => {
    if (supabase) {
        try {
            let query = supabase.from('invoices').select('*').order('created_at', { ascending: false });
            if (type) query = query.eq('type', type);
            const { data, error } = await query;
            if (!error) return (data || []).map(mapInvoice);
        } catch(e) { console.error(e); }
    }
    return Promise.resolve(invoicesCache.filter(i => !type || i.type === type));
};

export const addInvoice = async (invoice: Omit<Invoice, 'id'>): Promise<Invoice> => {
    if (supabase) {
        try {
            const payload = {
                number: invoice.number,
                "clientName": invoice.clientName,
                "clientGstin": invoice.clientGstin,
                "clientAddress": invoice.clientAddress,
                date: invoice.date,
                "dueDate": invoice.dueDate,
                amount: invoice.amount,
                status: invoice.status,
                type: invoice.type,
                items: invoice.items // Supabase handles JSON array automatically
            };
            const { data, error } = await supabase.from('invoices').insert([payload]).select().single();
            if (error) throw error;
            return mapInvoice(data);
        } catch(e) { console.error(e); }
    }
    return Promise.resolve({ ...invoice, id: Date.now().toString() } as Invoice);
};

export const updateInvoice = async (invoice: Invoice): Promise<Invoice> => {
    if (supabase) {
        const payload = {
            number: invoice.number,
            "clientName": invoice.clientName,
            "clientGstin": invoice.clientGstin,
            "clientAddress": invoice.clientAddress,
            date: invoice.date,
            "dueDate": invoice.dueDate,
            amount: invoice.amount,
            status: invoice.status,
            type: invoice.type,
            items: invoice.items
        };
        await supabase.from('invoices').update(payload).eq('id', invoice.id);
    }
    return invoice;
};

export const deleteInvoice = async (id: string): Promise<void> => {
    if (supabase) await supabase.from('invoices').delete().eq('id', id);
};