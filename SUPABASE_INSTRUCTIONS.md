# Supabase Database Setup

For the application to work correctly, you need to ensure your database schema matches the application types.

## 1. Initial Setup (If creating from scratch)

Go to the **SQL Editor** in your Supabase dashboard and run the following script:

```sql
-- Create Leads Table
create table public.leads (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  company text not null,
  email text,
  phone text,
  state text,
  status text not null,
  value numeric default 0,
  notes text,
  "lastContact" text,
  interest text[],
  visibility text default 'public',
  "ownerId" text
);

-- Create Products Table
create table public.products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  sku text not null,
  category text not null,
  price numeric default 0,
  stock integer default 0,
  visibility text default 'public',
  "ownerId" text
);

-- Enable Row Level Security
alter table public.leads enable row level security;
alter table public.products enable row level security;

-- Create policies (Development Mode: Allow all)
create policy "Enable all access for all users" on public.leads for all using (true) with check (true);
create policy "Enable all access for all users" on public.products for all using (true) with check (true);

-- Enable Realtime
alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.products;
```

## 2. Update Existing Schema (Run this if you have existing tables)

If you have already created the tables without `visibility` and `ownerId`, run this SQL to add them:

```sql
-- Add columns to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public',
ADD COLUMN IF NOT EXISTS "ownerId" text;

-- Add columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public',
ADD COLUMN IF NOT EXISTS "ownerId" text;
```

**Note:** We use `"ownerId"` (quoted) to strictly match the camelCase used in the application code.