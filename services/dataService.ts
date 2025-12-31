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

export const getLeads = async (currentUserId?: string): Promise<Lead[]> => {
  if (supabase) {
      let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
      
      // We use double quotes for "ownerId" because it is likely created as a case-sensitive column
      // to match the TypeScript interface style, similar to "lastContact".
      if (currentUserId) {
         query = query.or(`visibility.eq.public,"ownerId".eq.${currentUserId}`);
      } else {
         query = query.eq('visibility', 'public');
      }

      const { data, error } = await query;
      
      if (error) {
          // Log the full error object for debugging
          console.error("Supabase error fetching leads:", JSON.stringify(error, null, 2));
          // If the error is about missing columns, we might want to fail gracefully or warn the user
          if (error.code === '42703') { // Undefined column
              console.warn("It looks like 'visibility' or 'ownerId' columns are missing in your Supabase table. Please run the SQL migration script provided in SUPABASE_INSTRUCTIONS.md");
          }
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
          lastContact: item.lastContact || item["lastContact"] || new Date().toISOString().split('T')[0],
          interest: Array.isArray(item.interest) ? item.interest : [],
          visibility: item.visibility || 'public',
          ownerId: item.ownerId || item["ownerId"] || ''
      })) as Lead[];
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
      // Ensure complex types like interest array are passed correctly
      const payload = {
          ...lead,
          interest: lead.interest || [],
          visibility: lead.visibility || 'public',
          // Explicitly map ownerId to "ownerId" if needed by strict casing, 
          // but usually JS object keys are passed as is.
          "ownerId": lead.ownerId
      };
      
      const { data, error } = await supabase.from('leads').insert([payload]).select().single();
      if (error) {
          console.error("Supabase error adding lead:", JSON.stringify(error, null, 2));
          throw error;
      }
      
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
          lastContact: item.lastContact || item["lastContact"] || new Date().toISOString().split('T')[0],
          interest: Array.isArray(item.interest) ? item.interest : [],
          visibility: item.visibility || 'public',
          ownerId: item.ownerId || item["ownerId"] || ''
      };
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
      // Ensure we map ownerId correctly if needed
      const payload = {
          ...updates,
          "ownerId": updatedLead.ownerId
      };

      const { error } = await supabase.from('leads').update(payload).eq('id', id);
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

export const getProducts = async (currentUserId?: string): Promise<Product[]> => {
  if (supabase) {
      let query = supabase.from('products').select('*').order('created_at', { ascending: false });

      if (currentUserId) {
        // Quote "ownerId" for safety
        query = query.or(`visibility.eq.public,"ownerId".eq.${currentUserId}`);
      } else {
        query = query.eq('visibility', 'public');
      }

      const { data, error } = await query;
      
      if (error) {
          console.error("Supabase error fetching products:", JSON.stringify(error, null, 2));
           if (error.code === '42703') { 
              console.warn("Missing 'visibility' or 'ownerId' columns in products table. Check SUPABASE_INSTRUCTIONS.md");
          }
          return [];
      }
      
      return (data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          category: item.category as ProductCategory,
          price: Number(item.price) || 0,
          stock: Number(item.stock) || 0,
          visibility: item.visibility || 'public',
          ownerId: item.ownerId || item["ownerId"] || ''
      })) as Product[];
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
        const payload = {
            ...product,
            visibility: product.visibility || 'public',
            "ownerId": product.ownerId
        };

        const { data, error } = await supabase.from('products').insert([payload]).select().single();
        if (error) {
             console.error("Supabase error adding product:", JSON.stringify(error, null, 2));
             throw error;
        }
        
        const item = data;
        return {
          id: item.id,
          name: item.name,
          sku: item.sku,
          category: item.category as ProductCategory,
          price: Number(item.price) || 0,
          stock: Number(item.stock) || 0,
          visibility: item.visibility || 'public',
          ownerId: item.ownerId || item["ownerId"] || ''
        };
    }

    return new Promise((resolve) => {
      const newProduct = { ...product, id: Math.random().toString(36).substr(2, 9) } as Product;
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