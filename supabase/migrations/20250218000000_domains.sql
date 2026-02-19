-- Create domains table
create table if not exists domains (
  id uuid default gen_random_uuid() primary key,
  domain text not null unique,
  brand_name text not null,
  brand_tagline text not null default '',
  logo_letter text not null default 'T',
  logo_color text not null default '#0F4C81',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add domain_id column to articles
alter table articles add column if not exists domain_id uuid references domains(id);

-- Enable RLS
alter table domains enable row level security;

-- Create policies for domains
create policy "Domains are viewable by everyone"
  on domains for select
  to public
  using (true);

create policy "Admins can insert domains"
  on domains for insert
  to authenticated
  with check (true);

create policy "Admins can update domains"
  on domains for update
  to authenticated
  using (true);

create policy "Admins can delete domains"
  on domains for delete
  to authenticated
  using (true);
