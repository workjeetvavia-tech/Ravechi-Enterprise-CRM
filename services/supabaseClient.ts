
import { createClient } from '@supabase/supabase-js';

// Access environment variables. 
// Note: In Vite/Create-React-App these are import.meta.env or process.env. 
// Since this is a generic setup often used with bundlers, we use process.env.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
