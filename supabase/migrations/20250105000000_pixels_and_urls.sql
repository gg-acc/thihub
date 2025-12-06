-- Create pixels table
create table if not exists pixels (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  pixel_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create cta_urls table
create table if not exists cta_urls (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table pixels enable row level security;
alter table cta_urls enable row level security;

-- Create policies for pixels
create policy "Pixels are viewable by everyone"
  on pixels for select
  to public
  using (true);

create policy "Admins can insert pixels"
  on pixels for insert
  to authenticated
  with check (true);

create policy "Admins can update pixels"
  on pixels for update
  to authenticated
  using (true);

create policy "Admins can delete pixels"
  on pixels for delete
  to authenticated
  using (true);

-- Create policies for cta_urls
create policy "CTA URLs are viewable by everyone"
  on cta_urls for select
  to public
  using (true);

create policy "Admins can insert cta_urls"
  on cta_urls for insert
  to authenticated
  with check (true);

create policy "Admins can update cta_urls"
  on cta_urls for update
  to authenticated
  using (true);

create policy "Admins can delete cta_urls"
  on cta_urls for delete
  to authenticated
  using (true);

