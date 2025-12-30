import { Lead, LeadStatus, Product, ProductCategory } from "../types";
import { supabase } from "./supabaseClient";

// LocalStorage Keys (Fallback/Cache)
const LEADS_KEY = 'ravechi_leads_v2';
const PRODUCTS_KEY = 'ravechi_products_v2';

// In-Memory Cache
let leadsCache: Lead[] = [];
let productsCache: Product[] = [];

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

// Real-time Subscription
export const subscribeToData = (type: 'leads' | 'products', callback: ChangeCallback) => {
    listeners[type].push(callback);
    
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

// --- LEADS OPERATIONS ---

export const getLeads = async (): Promise<Lead[]> => {
  if (supabase) {
      // Order by created_at for chronological sorting
      const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });
      
      if (error) {
          console.error("Supabase error fetching leads:", error);
          return [];
      }
      
      // Robust mapping to ensure type safety
      return (data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          company: item.company,
          email: item.email || '',
          phone: item.phone || '',
          state: item.state || '',
          status: item.status as LeadStatus,
          value: Number(item.value) || 0,
          notes: item.notes || '',
          lastContact: item.lastContact || new Date().toISOString().split('T')[0],
          interest: Array.isArray(item.interest) ? item.interest : []
      })) as Lead[];
  }
  return new Promise((resolve) => setTimeout(() => resolve([...leadsCache]), 300));
};

export const addLead = async (lead: Omit<Lead, 'id'>): Promise<Lead> => {
  if (supabase) {
      // Ensure complex types like interest array are passed correctly
      const payload = {
          ...lead,
          interest: lead.interest || []
      };
      
      const { data, error } = await supabase.from('leads').insert([payload]).select().single();
      if (error) throw error;
      
      // Map returned data to safe Lead object
      const item = data;
      return {
          id: item.id,
          name: item.name,
          company: item.company,
          email: item.email || '',
          phone: item.phone || '',
          state: item.state || '',
          status: item.status as LeadStatus,
          value: Number(item.value) || 0,
          notes: item.notes || '',
          lastContact: item.lastContact || new Date().toISOString().split('T')[0],
          interest: Array.isArray(item.interest) ? item.interest : []
      };
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
      const { id, ...updates } = updatedLead;
      const { error } = await supabase.from('leads').update(updates).eq('id', id);
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
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
          console.error("Supabase error fetching products:", error);
          return [];
      }
      
      return (data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          category: item.category as ProductCategory,
          price: Number(item.price) || 0,
          stock: Number(item.stock) || 0
      })) as Product[];
  }
  return new Promise((resolve) => setTimeout(() => resolve([...productsCache]), 300));
};

export const addProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
    if (supabase) {
        const { data, error } = await supabase.from('products').insert([product]).select().single();
        if (error) throw error;
        
        const item = data;
        return {
          id: item.id,
          name: item.name,
          sku: item.sku,
          category: item.category as ProductCategory,
          price: Number(item.price) || 0,
          stock: Number(item.stock) || 0
        };
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