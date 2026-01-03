# Supabase Database Setup

For the application to work correctly, you need to ensure your database schema matches the application types.

## Fix: "Relation already exists" or "Column does not exist"

If you see errors saying "leads already exists" or "column leads.visibility does not exist", run the following **Migration Script** in your Supabase SQL Editor. This script specifically adds the missing columns to your existing tables.

```sql
-- 1. Add 'visibility' and 'ownerId' to the 'leads' table if they don't exist
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public',
ADD COLUMN IF NOT EXISTS "ownerId" text;

-- 2. Add 'visibility' and 'ownerId' to the 'products' table if they don't exist
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public',
ADD COLUMN IF NOT EXISTS "ownerId" text;

-- 3. Add 'state' to 'leads' if it is missing (needed for filters)
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS state text;
```

---

## Full Setup (Only for new, empty projects)

**DO NOT RUN THIS IF YOU ALREADY HAVE TABLES.**

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

-- Create Purchase Orders Table
create table public.purchase_orders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  "itemName" text not null,
  vendor text not null,
  quantity integer default 1,
  "estimatedCost" numeric default 0,
  status text not null,
  "orderDate" text not null,
  notes text
);

-- Create Clients Table
create table public.clients (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  company text not null,
  email text,
  phone text,
  gstin text,
  address text,
  status text default 'Active'
);

-- Create Proposals Table
create table public.proposals (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  "clientName" text not null,
  value numeric default 0,
  date text not null,
  "validUntil" text,
  description text,
  status text not null
);

-- Create Invoices Table
create table public.invoices (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  number text not null,
  "clientName" text not null,
  "clientGstin" text,
  "clientAddress" text,
  date text not null,
  "dueDate" text,
  items jsonb default '[]'::jsonb,
  amount numeric default 0,
  status text not null,
  type text not null
);

-- Enable Row Level Security
alter table public.leads enable row level security;
alter table public.products enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.clients enable row level security;
alter table public.proposals enable row level security;
alter table public.invoices enable row level security;

-- Create policies (Development Mode: Allow all)
create policy "Enable all access for all users" on public.leads for all using (true) with check (true);
create policy "Enable all access for all users" on public.products for all using (true) with check (true);
create policy "Enable all access for all users" on public.purchase_orders for all using (true) with check (true);
create policy "Enable all access for all users" on public.clients for all using (true) with check (true);
create policy "Enable all access for all users" on public.proposals for all using (true) with check (true);
create policy "Enable all access for all users" on public.invoices for all using (true) with check (true);

-- Enable Realtime
alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.purchase_orders;
alter publication supabase_realtime add table public.clients;
alter publication supabase_realtime add table public.proposals;
alter publication supabase_realtime add table public.invoices;
```