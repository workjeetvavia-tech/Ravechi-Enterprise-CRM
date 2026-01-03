import { Lead, LeadStatus, Product, ProductCategory, PurchaseOrder, PurchaseOrderStatus, AppUser, Client, Proposal, Invoice, InvoiceItem } from "../types";

// LocalStorage Keys
const LEADS_KEY = 'ravechi_leads_v2';
const PRODUCTS_KEY = 'ravechi_products_v2';
const PO_KEY = 'ravechi_purchase_orders';
const CLIENTS_KEY = 'ravechi_clients';
const PROPOSALS_KEY = 'ravechi_proposals';
const INVOICES_KEY = 'ravechi_invoices';
const USERS_KEY = 'ravechi_users';

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

export const subscribeToData = (type: 'leads' | 'products' | 'purchaseOrders' | 'clients' | 'proposals' | 'invoices', callback: ChangeCallback) => {
    if (!listeners[type]) listeners[type] = [];
    listeners[type].push(callback);
    return () => {
        listeners[type] = listeners[type].filter(cb => cb !== callback);
    };
};

// --- GENERIC STORAGE HELPERS ---
const getFromStorage = <T>(key: string, defaults: T[] = []): T[] => {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaults;
    } catch (e) {
        return defaults;
    }
};

const saveToStorage = <T>(key: string, data: T[]) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// --- HELPER: GET APP USERS ---
export const getAppUsers = (): AppUser[] => {
    return getFromStorage<AppUser>(USERS_KEY, [
        { id: '1', name: 'Jaydeep D', email: 'jaydeep@ravechi.com', role: 'Admin', status: 'Active' },
        { id: '2', name: 'Sales Rep 1', email: 'sales1@ravechi.com', role: 'Employee', status: 'Active' },
        { id: '3', name: 'Accountant', email: 'accounts@ravechi.com', role: 'Employee', status: 'Active' },
    ]);
};

// --- LEADS OPERATIONS ---
export const getLeads = async (currentUserId?: string): Promise<Lead[]> => {
    return Promise.resolve(getFromStorage<Lead>(LEADS_KEY));
};

export const addLead = async (lead: Omit<Lead, 'id'>): Promise<Lead> => {
    const leads = getFromStorage<Lead>(LEADS_KEY);
    const newLead = { ...lead, id: Date.now().toString() } as Lead;
    saveToStorage(LEADS_KEY, [newLead, ...leads]);
    notify('leads');
    return Promise.resolve(newLead);
};

export const updateLead = async (updatedLead: Lead): Promise<Lead> => {
    const leads = getFromStorage<Lead>(LEADS_KEY);
    const newLeads = leads.map(l => l.id === updatedLead.id ? updatedLead : l);
    saveToStorage(LEADS_KEY, newLeads);
    notify('leads');
    return Promise.resolve(updatedLead);
};

export const deleteLead = async (id: string): Promise<void> => {
    const leads = getFromStorage<Lead>(LEADS_KEY);
    saveToStorage(LEADS_KEY, leads.filter(l => l.id !== id));
    notify('leads');
};

export const updateLeadStatus = async (id: string, status: LeadStatus): Promise<void> => {
    const leads = getFromStorage<Lead>(LEADS_KEY);
    const lead = leads.find(l => l.id === id);
    if (lead) {
        lead.status = status;
        saveToStorage(LEADS_KEY, leads);
        notify('leads');
    }
};

// --- PRODUCTS OPERATIONS ---
export const getProducts = async (currentUserId?: string): Promise<Product[]> => {
    return Promise.resolve(getFromStorage<Product>(PRODUCTS_KEY));
};

export const addProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
    const products = getFromStorage<Product>(PRODUCTS_KEY);
    const newProduct = { ...product, id: Date.now().toString() } as Product;
    saveToStorage(PRODUCTS_KEY, [newProduct, ...products]);
    notify('products');
    return Promise.resolve(newProduct);
};

export const addBulkProducts = async (newProducts: Omit<Product, 'id'>[]): Promise<Product[]> => {
    const products = getFromStorage<Product>(PRODUCTS_KEY);
    const added = newProducts.map((p, i) => ({ ...p, id: (Date.now() + i).toString() } as Product));
    saveToStorage(PRODUCTS_KEY, [...added, ...products]);
    notify('products');
    return Promise.resolve(added);
};

export const updateProduct = async (updatedProduct: Product): Promise<Product> => {
    const products = getFromStorage<Product>(PRODUCTS_KEY);
    const newProducts = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    saveToStorage(PRODUCTS_KEY, newProducts);
    notify('products');
    return Promise.resolve(updatedProduct);
};

export const deleteProduct = async (id: string): Promise<void> => {
    const products = getFromStorage<Product>(PRODUCTS_KEY);
    saveToStorage(PRODUCTS_KEY, products.filter(p => p.id !== id));
    notify('products');
};

// --- PURCHASE ORDERS OPERATIONS ---
export const getPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
    return Promise.resolve(getFromStorage<PurchaseOrder>(PO_KEY));
};

export const addPurchaseOrder = async (po: Omit<PurchaseOrder, 'id'>): Promise<PurchaseOrder> => {
    const orders = getFromStorage<PurchaseOrder>(PO_KEY);
    const newPO = { ...po, id: Date.now().toString() } as PurchaseOrder;
    saveToStorage(PO_KEY, [newPO, ...orders]);
    notify('purchaseOrders');
    return Promise.resolve(newPO);
};

export const updatePurchaseOrder = async (po: PurchaseOrder): Promise<PurchaseOrder> => {
    const orders = getFromStorage<PurchaseOrder>(PO_KEY);
    const newOrders = orders.map(o => o.id === po.id ? po : o);
    saveToStorage(PO_KEY, newOrders);
    notify('purchaseOrders');
    return Promise.resolve(po);
};

export const deletePurchaseOrder = async (id: string): Promise<void> => {
    const orders = getFromStorage<PurchaseOrder>(PO_KEY);
    saveToStorage(PO_KEY, orders.filter(o => o.id !== id));
    notify('purchaseOrders');
};

export const updatePurchaseOrderStatus = async (id: string, status: PurchaseOrderStatus): Promise<void> => {
    const orders = getFromStorage<PurchaseOrder>(PO_KEY);
    const po = orders.find(o => o.id === id);
    if (po) {
        po.status = status;
        saveToStorage(PO_KEY, orders);
        notify('purchaseOrders');
    }
};

// --- CLIENTS OPERATIONS ---
export const getClients = async (): Promise<Client[]> => {
    return Promise.resolve(getFromStorage<Client>(CLIENTS_KEY));
};

export const addClient = async (client: Omit<Client, 'id'>): Promise<Client> => {
    const clients = getFromStorage<Client>(CLIENTS_KEY);
    const newClient = { ...client, id: Date.now().toString() } as Client;
    saveToStorage(CLIENTS_KEY, [newClient, ...clients]);
    notify('clients');
    return Promise.resolve(newClient);
};

export const updateClient = async (client: Client): Promise<Client> => {
    const clients = getFromStorage<Client>(CLIENTS_KEY);
    const newClients = clients.map(c => c.id === client.id ? client : c);
    saveToStorage(CLIENTS_KEY, newClients);
    notify('clients');
    return Promise.resolve(client);
};

export const deleteClient = async (id: string): Promise<void> => {
    const clients = getFromStorage<Client>(CLIENTS_KEY);
    saveToStorage(CLIENTS_KEY, clients.filter(c => c.id !== id));
    notify('clients');
};

// --- PROPOSALS OPERATIONS ---
export const getProposals = async (): Promise<Proposal[]> => {
    return Promise.resolve(getFromStorage<Proposal>(PROPOSALS_KEY));
};

export const addProposal = async (proposal: Omit<Proposal, 'id'>): Promise<Proposal> => {
    const proposals = getFromStorage<Proposal>(PROPOSALS_KEY);
    const newProposal = { ...proposal, id: Date.now().toString() } as Proposal;
    saveToStorage(PROPOSALS_KEY, [newProposal, ...proposals]);
    notify('proposals');
    return Promise.resolve(newProposal);
};

export const updateProposal = async (proposal: Proposal): Promise<Proposal> => {
    const proposals = getFromStorage<Proposal>(PROPOSALS_KEY);
    const newProposals = proposals.map(p => p.id === proposal.id ? proposal : p);
    saveToStorage(PROPOSALS_KEY, newProposals);
    notify('proposals');
    return Promise.resolve(proposal);
};

export const deleteProposal = async (id: string): Promise<void> => {
    const proposals = getFromStorage<Proposal>(PROPOSALS_KEY);
    saveToStorage(PROPOSALS_KEY, proposals.filter(p => p.id !== id));
    notify('proposals');
};

// --- INVOICES OPERATIONS ---
export const getInvoices = async (type?: 'Invoice' | 'Proforma'): Promise<Invoice[]> => {
    const invoices = getFromStorage<Invoice>(INVOICES_KEY);
    if (type) {
        return Promise.resolve(invoices.filter(i => i.type === type));
    }
    return Promise.resolve(invoices);
};

export const addInvoice = async (invoice: Omit<Invoice, 'id'>): Promise<Invoice> => {
    const invoices = getFromStorage<Invoice>(INVOICES_KEY);
    const newInvoice = { ...invoice, id: Date.now().toString() } as Invoice;
    saveToStorage(INVOICES_KEY, [newInvoice, ...invoices]);
    notify('invoices');
    return Promise.resolve(newInvoice);
};

export const updateInvoice = async (invoice: Invoice): Promise<Invoice> => {
    const invoices = getFromStorage<Invoice>(INVOICES_KEY);
    const newInvoices = invoices.map(i => i.id === invoice.id ? invoice : i);
    saveToStorage(INVOICES_KEY, newInvoices);
    notify('invoices');
    return Promise.resolve(invoice);
};

export const deleteInvoice = async (id: string): Promise<void> => {
    const invoices = getFromStorage<Invoice>(INVOICES_KEY);
    saveToStorage(INVOICES_KEY, invoices.filter(i => i.id !== id));
    notify('invoices');
};