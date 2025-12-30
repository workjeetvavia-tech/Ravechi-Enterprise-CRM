# Supabase Database Setup

For the application to work correctly, you need to create the database tables in your Supabase project.
Go to the **SQL Editor** in your Supabase dashboard and run the following script:

```sql
-- Create Leads Table
-- We use double quotes to enforce mixed case column names matching the TypeScript interfaces
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
  interest text[] -- Array of strings
);

-- Create Products Table
create table public.products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  sku text not null,
  category text not null,
  price numeric default 0,
  stock integer default 0
);

-- Enable Row Level Security (Optional: For development, we allow public access, 
-- but for production you should set up RLS policies)
alter table public.leads enable row level security;
alter table public.products enable row level security;

-- Create policies to allow everyone to read/write (FOR DEVELOPMENT ONLY)
create policy "Enable all access for all users" on public.leads for all using (true) with check (true);
create policy "Enable all access for all users" on public.products for all using (true) with check (true);

-- Enable Realtime for these tables
alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.products;
```

**Note:** The application uses specific column names like `lastContact` (camelCase). The SQL above creates them exactly as needed. If you create tables via the Table Editor GUI, ensure you use the exact case matching `types.ts`.
