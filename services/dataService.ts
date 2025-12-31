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
        
        // Try to filter by visibility
        if (currentUserId) {
           query = query.or(`visibility.eq.public,"ownerId".eq.${currentUserId}`);
        } else {
           query = query.eq('visibility', 'public');
        }

        const { data, error } = await query;
        
        if (error) {
            // Handle undefined column error gracefully
            if (error.code === '42703') { 
                console.warn("Supabase schema mismatch: 'visibility' or 'ownerId' column missing. Fetching all leads as fallback.");
                // Fallback: Fetch without filters
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('leads')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (fallbackError) throw fallbackError;
                return (fallbackData || []).map(mapLead);
            }
            throw error;
        }
        
        return (data || []).map(mapLead);
      } catch (err: any) {
        console.error("Error fetching leads:", err.message);
        return [];
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
      // Create payload, only including fields if we think they exist (basic assumption here is we try to send them)
      // If the insert fails due to missing column, we can try omitting them.
      const payload: any = {
          ...lead,
          interest: lead.interest || []
      };
      
      // We try to insert with visibility/ownerId. If it fails, we strip them.
      try {
        const { data, error } = await supabase.from('leads').insert([{
             ...payload,
             visibility: lead.visibility || 'public',
             "ownerId": lead.ownerId
        }]).select().single();
        
        if (error) {
             if (error.code === '42703') {
                 console.warn("Column missing during insert, retrying without visibility/ownerId");
                 const { data: retryData, error: retryError } = await supabase.from('leads').insert([payload]).select().single();
                 if (retryError) throw retryError;
                 return mapLead(retryData);
             }
             throw error;
        }
        return mapLead(data);
      } catch (err) {
        console.error("Error adding lead:", err);
        throw err;
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
      const payload: any = { ...updates };
      // Explicitly map ownerId
      if (updatedLead.ownerId) payload["ownerId"] = updatedLead.ownerId;

      try {
        const { error } = await supabase.from('leads').update(payload).eq('id', id);
        if (error) {
            if (error.code === '42703') {
                // Retry without extra columns
                delete payload.visibility;
                delete payload["ownerId"];
                const { error: retryError } = await supabase.from('leads').update(payload).eq('id', id);
                if (retryError) throw retryError;
                return updatedLead;
            }
            throw error;
        }
      } catch (err) {
          console.error("Error updating lead", err);
          throw err;
      }
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
                console.warn("Supabase schema mismatch: 'visibility' column missing in products. Fetching all as fallback.");
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (fallbackError) throw fallbackError;
                return (fallbackData || []).map(mapProduct);
            }
            throw error;
        }
        
        return (data || []).map(mapProduct);
      } catch (err: any) {
        console.error("Error fetching products:", err.message);
        return [];
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
        const payload: any = { ...product };

        try {
            const { data, error } = await supabase.from('products').insert([{
                ...payload,
                visibility: product.visibility || 'public',
                "ownerId": product.ownerId
            }]).select().single();

            if (error) {
                 if (error.code === '42703') {
                     const { data: retryData, error: retryError } = await supabase.from('products').insert([payload]).select().single();
                     if (retryError) throw retryError;
                     return mapProduct(retryData);
                 }
                 throw error;
            }
            return mapProduct(data);
        } catch(err) {
            console.error("Error adding product", err);
            throw err;
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