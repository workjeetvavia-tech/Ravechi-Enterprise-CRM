import { Lead, LeadStatus, Product, ProductCategory, PurchaseOrder, PurchaseOrderStatus } from "../types";
import { supabase } from "./supabaseClient";

// LocalStorage Keys (Fallback/Cache)
const LEADS_KEY = 'ravechi_leads_v2';
const PRODUCTS_KEY = 'ravechi_products_v2';
const PO_KEY = 'ravechi_purchase_orders';

// In-Memory Cache
let leadsCache: Lead[] = [];
let productsCache: Product[] = [];
let purchaseOrdersCache: PurchaseOrder[] = [];

const initLocalData = () => {
    try {
        const storedLeads = localStorage.getItem(LEADS_KEY);
        leadsCache = storedLeads ? JSON.parse(storedLeads) : [];

        const storedProducts = localStorage.getItem(PRODUCTS_KEY);
        productsCache = storedProducts ? JSON.parse(storedProducts) : [];

        const storedPOs = localStorage.getItem(PO_KEY);
        purchaseOrdersCache = storedPOs ? JSON.parse(storedPOs) : [];
    } catch (e) {
        console.error("Failed to load local data", e);
    }
};

initLocalData();

// --- EVENT SYSTEM ---
type ChangeCallback = () => void;
const listeners: { leads: ChangeCallback[], products: ChangeCallback[], purchaseOrders: ChangeCallback[] } = {
    leads: [],
    products: [],
    purchaseOrders: []
};

const notify = (type: 'leads' | 'products' | 'purchaseOrders') => {
    listeners[type].forEach(cb => cb());
};

// Real-time Subscription
export const subscribeToData = (type: 'leads' | 'products' | 'purchaseOrders', callback: ChangeCallback) => {
    listeners[type].push(callback);
    
    let supabaseSubscription: any = null;
    if (supabase && (type === 'leads' || type === 'products')) {
        const table = type;
        supabaseSubscription = supabase
            .channel(`public:${table}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: table }, () => {
                callback();
            })
            .subscribe();
    }

    return () => {
        listeners[type] = listeners[type].filter(cb => cb !== callback);
        if (supabaseSubscription) {
            supabase.removeChannel(supabaseSubscription);
        }
    };
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

// --- LEADS OPERATIONS ---

export const getLeads = async (currentUserId?: string): Promise<Lead[]> => {
  if (supabase) {
      try {
        let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
        
        if (currentUserId) {
           query = query.or(`visibility.eq.public,"ownerId".eq.${currentUserId}`);
        } else {
           query = query.eq('visibility', 'public');
        }

        const { data, error } = await query;
        
        if (error) {
            if (error.code === '42703') { 
                const { data: fallbackData } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
                return (fallbackData || []).map(mapLead);
            }
            throw error;
        }
        return (data || []).map(mapLead);
      } catch (err: any) {
        console.error("Error fetching leads from Supabase:", err.message);
        // Fallback to local
      }
  }
  
  // Local Storage Fallback
  return new Promise((resolve) => {
      const filtered = leadsCache.filter(l => 
          l.visibility === 'public' || (currentUserId && l.ownerId === currentUserId)
      );
      setTimeout(() => resolve([...filtered]), 300);
  });
};

export const addLead = async (lead: Omit<Lead, 'id'>): Promise<Lead> => {
  if (supabase) {
      const payload: any = { ...lead, interest: lead.interest || [] };
      try {
        const { data, error } = await supabase.from('leads').insert([{
             ...payload,
             visibility: lead.visibility || 'public',
             "ownerId": lead.ownerId
        }]).select().single();
        
        if (error) throw error;
        return mapLead(data);
      } catch (err) {
        console.error("Error adding lead:", err);
      }
  }
  
  return new Promise((resolve) => {
    const newLead = { ...lead, id: Math.random().toString(36).substr(2, 9) } as Lead;
    leadsCache = [newLead, ...leadsCache];
    localStorage.setItem(LEADS_KEY, JSON.stringify(leadsCache));
    notify('leads');
    setTimeout(() => resolve(newLead), 300);
  });
};

export const updateLead = async (updatedLead: Lead): Promise<Lead> => {
  if (supabase) {
      const { id, ...updates } = updatedLead;
      try {
        const { error } = await supabase.from('leads').update(updates).eq('id', id);
        if (error) throw error;
        return updatedLead;
      } catch (err) {
          console.error("Error updating lead", err);
      }
  }

  return new Promise((resolve) => {
    leadsCache = leadsCache.map(l => l.id === updatedLead.id ? updatedLead : l);
    localStorage.setItem(LEADS_KEY, JSON.stringify(leadsCache));
    notify('leads');
    setTimeout(() => resolve(updatedLead), 300);
  });
};

export const deleteLead = async (id: string): Promise<void> => {
  if (supabase) {
      try {
        const { error } = await supabase.from('leads').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
          console.error("Error deleting lead", err);
      }
  }

  return new Promise((resolve) => {
    leadsCache = leadsCache.filter(l => l.id !== id);
    localStorage.setItem(LEADS_KEY, JSON.stringify(leadsCache));
    notify('leads');
    setTimeout(() => resolve(), 300);
  });
};

export const updateLeadStatus = async (id: string, status: LeadStatus): Promise<void> => {
    if (supabase) {
        try {
            await supabase.from('leads').update({ status }).eq('id', id);
        } catch(e) { console.error(e); }
    }
    
    leadsCache = leadsCache.map(l => l.id === id ? { ...l, status } : l);
    localStorage.setItem(LEADS_KEY, JSON.stringify(leadsCache));
    notify('leads');
};

// --- PRODUCTS OPERATIONS ---

export const getProducts = async (currentUserId?: string): Promise<Product[]> => {
  if (supabase) {
      try {
        let query = supabase.from('products').select('*').order('created_at', { ascending: false });

        if (currentUserId) {
            query = query.or(`visibility.eq.public,"ownerId".eq.${currentUserId}`);
        } else {
            query = query.eq('visibility', 'public');
        }

        const { data, error } = await query;
        if (error) {
             if (error.code === '42703') {
                 const { data: fallback } = await supabase.from('products').select('*').order('created_at', { ascending: false });
                 return (fallback || []).map(mapProduct);
             }
             throw error;
        }
        return (data || []).map(mapProduct);
      } catch (err: any) {
        console.error("Supabase fetch failed, trying local:", err.message);
      }
  }

  return new Promise((resolve) => {
      const filtered = productsCache.filter(p => 
        p.visibility === 'public' || (currentUserId && p.ownerId === currentUserId)
      );
      setTimeout(() => resolve([...filtered]), 300);
  });
};

export const addProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
    if (supabase) {
        try {
            const { data, error } = await supabase.from('products').insert([{
                ...product,
                visibility: product.visibility || 'public',
                "ownerId": product.ownerId
            }]).select().single();

            if (error) throw error;
            return mapProduct(data);
        } catch(err) {
            console.error("Error adding product", err);
        }
    }

    return new Promise((resolve) => {
      const newProduct = { ...product, id: Math.random().toString(36).substr(2, 9) } as Product;
      productsCache = [newProduct, ...productsCache];
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(productsCache));
      notify('products');
      setTimeout(() => resolve(newProduct), 500);
    });
};

export const addBulkProducts = async (products: Omit<Product, 'id'>[]): Promise<Product[]> => {
    if (supabase) {
        try {
            const { data, error } = await supabase.from('products').insert(products).select();
            if (error) throw error;
            return (data || []).map(mapProduct);
        } catch(err) {
            console.error("Error adding bulk products", err);
        }
    }

    return new Promise((resolve) => {
        const newProducts = products.map(p => ({
            ...p,
            id: Math.random().toString(36).substr(2, 9)
        })) as Product[];
        
        productsCache = [...newProducts, ...productsCache];
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(productsCache));
        notify('products');
        setTimeout(() => resolve(newProducts), 500);
    });
};

export const updateProduct = async (updatedProduct: Product): Promise<Product> => {
    if (supabase) {
        try {
            const { id, ...rest } = updatedProduct;
            const { error } = await supabase.from('products').update(rest).eq('id', id);
            if (error) throw error;
            return updatedProduct;
        } catch(err) {
             console.error("Error updating product", err);
        }
    }

    return new Promise((resolve) => {
        productsCache = productsCache.map(p => p.id === updatedProduct.id ? updatedProduct : p);
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(productsCache));
        notify('products');
        setTimeout(() => resolve(updatedProduct), 300);
    });
};

export const deleteProduct = async (id: string): Promise<void> => {
    let supabaseSuccess = false;
    if (supabase) {
        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (!error) {
                supabaseSuccess = true;
            } else {
                console.error("Supabase delete failed (likely permission/RLS):", error);
            }
        } catch(err) {
            console.error("Error deleting product from Supabase", err);
        }
    }

    productsCache = productsCache.filter(p => p.id !== id);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(productsCache));

    if (!supabase || supabaseSuccess) {
        notify('products');
    } else {
        console.warn("Skipping 'products' notification.");
    }
};

// --- PURCHASE ORDERS OPERATIONS (Local Storage Only for now) ---

export const getPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve([...purchaseOrdersCache]), 100);
    });
};

export const addPurchaseOrder = async (po: Omit<PurchaseOrder, 'id'>): Promise<PurchaseOrder> => {
    return new Promise((resolve) => {
        const newPO = { ...po, id: Date.now().toString() } as PurchaseOrder;
        purchaseOrdersCache = [newPO, ...purchaseOrdersCache];
        localStorage.setItem(PO_KEY, JSON.stringify(purchaseOrdersCache));
        notify('purchaseOrders');
        setTimeout(() => resolve(newPO), 100);
    });
};

export const updatePurchaseOrder = async (po: PurchaseOrder): Promise<PurchaseOrder> => {
    return new Promise((resolve) => {
        purchaseOrdersCache = purchaseOrdersCache.map(p => p.id === po.id ? po : p);
        localStorage.setItem(PO_KEY, JSON.stringify(purchaseOrdersCache));
        notify('purchaseOrders');
        setTimeout(() => resolve(po), 100);
    });
};

export const deletePurchaseOrder = async (id: string): Promise<void> => {
    return new Promise((resolve) => {
        purchaseOrdersCache = purchaseOrdersCache.filter(p => p.id !== id);
        localStorage.setItem(PO_KEY, JSON.stringify(purchaseOrdersCache));
        notify('purchaseOrders');
        setTimeout(() => resolve(), 100);
    });
};

export const updatePurchaseOrderStatus = async (id: string, status: PurchaseOrderStatus): Promise<void> => {
    return new Promise((resolve) => {
        purchaseOrdersCache = purchaseOrdersCache.map(p => p.id === id ? { ...p, status } : p);
        localStorage.setItem(PO_KEY, JSON.stringify(purchaseOrdersCache));
        notify('purchaseOrders');
        setTimeout(() => resolve(), 100);
    });
};