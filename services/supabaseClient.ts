import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iryptznehudfgqffklig.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyeXB0em5laHVkZmdxZmZrbGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNjU1NTMsImV4cCI6MjA4MjY0MTU1M30.MuJdZkF_MMiy0jsxLWQJ3WbuSe0EQUv9NDEko3PL0DE';

export const supabase = createClient(supabaseUrl, supabaseKey);