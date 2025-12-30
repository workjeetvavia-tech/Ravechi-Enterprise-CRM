import { Lead, LeadStatus, Product, ProductCategory } from "../types";
import { supabase } from "./supabaseClient";

// LocalStorage Keys
const LEADS_KEY = 'ravechi_leads_v2';
const PRODUCTS_KEY = 'ravechi_products_v2';

// In-Memory Cache for LocalStorage
let leadsCache: Lead[] = [];
let productsCache: Product[] = [];

// Initialize LocalStorage Data
const initLocalData = () => {
    try {
        const storedLeads = localStorage.getItem(LEADS_KEY);
        leadsCache = storedLeads ? JSON.parse(storedLeads) : [];

        const storedProducts = localStorage.getItem(PRODUCTS_KEY);
        productsCache = storedProducts ? JSON.parse(storedProducts) : [];
    } catch (e) {
        console.error("Failed to load local data", e);
    }
};

// Only init local data if we might need it (or just always init it, it's cheap)
initLocalData();

// --- EVENT SYSTEM ---
type ChangeCallback = () => void;
const listeners: { leads: ChangeCallback[], products: ChangeCallback[] } = {
    leads: [],
    products: []
};

const notify = (type: 'leads' | 'products') => {
    listeners[type].forEach(cb => cb());
};

// Real-time Subscription (Hybrid)
export const subscribeToData = (type: 'leads' | 'products', callback: ChangeCallback) => {
    listeners[type].push(callback);
    
    // If Supabase is active, set up real-time subscription
    let supabaseSubscription: any = null;
    if (supabase) {
        const table = type === 'leads' ? 'leads' : 'products';
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

// Listen for storage changes (Cross-tab sync for LocalStorage)
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
        if (e.key === LEADS_KEY) {
            leadsCache = JSON.parse(e.newValue || '[]');
            notify('leads');
        }
        if (e.key === PRODUCTS_KEY) {
            productsCache = JSON.parse(e.newValue || '[]');
            notify('products');
        }
    });
}

// --- LEADS OPERATIONS ---

export const getLeads = async (): Promise<Lead[]> => {
  if (supabase) {
      const { data, error } = await supabase.from('leads').select('*').order('id', { ascending: false });
      if (error) {
          console.error("Supabase error fetching leads:", error);
          return [];
      }
      return data as Lead[] || [];
  }
  return new Promise((resolve) => setTimeout(() => resolve([...leadsCache]), 300));
};

export const addLead = async (lead: Omit<Lead, 'id'>): Promise<Lead> => {
  if (supabase) {
      // Allow Supabase to generate ID if configured, or generate one here
      // For compatibility with the interface which expects ID, we might let DB handle it 
      // but we need to return the full object.
      // We'll generate a UUID-like string if Supabase doesn't return one immediately or just rely on return.
      const { data, error } = await supabase.from('leads').insert([lead]).select().single();
      if (error) throw error;
      return data as Lead;
  }
  
  return new Promise((resolve) => {
    const newLead = { ...lead, id: Math.random().toString(36).substr(2, 9) };
    leadsCache = [newLead, ...leadsCache];
    localStorage.setItem(LEADS_KEY, JSON.stringify(leadsCache));
    notify('leads');
    setTimeout(() => resolve(newLead), 300);
  });
};

export const updateLead = async (updatedLead: Lead): Promise<Lead> => {
  if (supabase) {
      const { error } = await supabase.from('leads').update(updatedLead).eq('id', updatedLead.id);
      if (error) throw error;
      return updatedLead;
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
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
      return;
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
      const { error } = await supabase.from('leads').update({ status }).eq('id', id);
      if (error) throw error;
      return;
  }

  return new Promise((resolve) => {
    leadsCache = leadsCache.map(l => l.id === id ? { ...l, status } : l);
    localStorage.setItem(LEADS_KEY, JSON.stringify(leadsCache));
    notify('leads');
    setTimeout(() => resolve(), 300);
  });
};

// --- PRODUCTS OPERATIONS ---

export const getProducts = async (): Promise<Product[]> => {
  if (supabase) {
      const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false });
      if (error) {
          console.error("Supabase error fetching products:", error);
          return [];
      }
      return data as Product[] || [];
  }
  return new Promise((resolve) => setTimeout(() => resolve([...productsCache]), 300));
};

export const addProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
    if (supabase) {
        const { data, error } = await supabase.from('products').insert([product]).select().single();
        if (error) throw error;
        return data as Product;
    }

    return new Promise((resolve) => {
      const newProduct = { ...product, id: Math.random().toString(36).substr(2, 9) };
      productsCache = [newProduct, ...productsCache];
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(productsCache));
      notify('products');
      setTimeout(() => resolve(newProduct), 500);
    });
};

export const deleteProduct = async (id: string): Promise<void> => {
    if (supabase) {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        return;
    }

    return new Promise((resolve) => {
        productsCache = productsCache.filter(p => p.id !== id);
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(productsCache));
        notify('products');
        setTimeout(() => resolve(), 300);
    });
};