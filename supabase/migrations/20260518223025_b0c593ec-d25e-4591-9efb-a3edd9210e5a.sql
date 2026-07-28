
-- 1. Roles enum + user_roles table
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

create policy "Users view own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

create policy "Admins manage roles" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 2. First signup becomes admin, others become users
create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public
as $$
declare admin_exists boolean;
begin
  select exists(select 1 from public.user_roles where role = 'admin') into admin_exists;
  if not admin_exists then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_role();

-- 3. Products table
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text not null default '',
  price text not null,
  old_price text,
  image_url text,
  tag text,
  category text not null default 'General',
  description text not null default '',
  features text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Public read products" on public.products
  for select using (true);

create policy "Admins insert products" on public.products
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins update products" on public.products
  for update to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins delete products" on public.products
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

-- 4. Storage bucket for product images (public read)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Public read product images" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "Admins upload product images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));

create policy "Admins update product images" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));

create policy "Admins delete product images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));

-- 5. Seed existing products (image_url null → frontend uses bundled fallback by slug)
insert into public.products (slug, name, tagline, price, old_price, tag, category, description, features, sort_order) values
('ultra-3-smartwatch', 'Ultra 3 Smartwatch', 'Pakistan''s Most Versatile 7-Strap Luxury Watch', 'Rs. 4,500', 'Rs. 12,000', '7-in-1 Edition', 'Smart Watch',
 'The ultimate smartwatch package for DesiCart customers. Featuring a stunning Super AMOLED display and 7 different interchangeable straps to match every outfit.',
 array['Big Full HD Infinite Display','7 Premium Straps Included in Box','Wireless Fast Charging','Bluetooth Calling & Heart Rate Monitoring','Sports Mode & Calculator Built-in'], 1),
('airpods-pro-2-black', 'Airpods Pro 2 Black', 'Master Copy | ANC & Deep Bass', 'Rs. 1,500', 'Rs. 3,500', 'Best Seller', 'Earbuds',
 'Experience premium sound with the sleek Airpods Pro 2 in a stunning matte black finish. Designed for comfort and high-quality audio, these are the perfect daily drivers for music and calls.',
 array['Active Noise Cancellation (ANC) support','Superior Bass & Crisp Treble','3-4 Hours Playback Time','Touch Controls for Music & Calls','Wireless Charging Case'], 2),
('kts-1185-speaker', 'KTS-1185 Wireless Speaker', '3-Inch Drive | Built-in Emergency Torch', 'Rs. 1,800', 'Rs. 3,500', 'New', 'Speakers',
 'A portable powerhouse for music lovers. This wireless speaker features a 3-inch high-bass driver and a built-in emergency light, making it the perfect outdoor companion.',
 array['3" Powerful Audio Drive','Built-in High-Power Emergency Light','FM Radio & USB/TF Card Support','Wireless Bluetooth Connectivity','Rugged, Portable Design with Handle'], 3),
('super-charger-powerbank', 'Super Charger Power Bank', 'LED Digital Display | PD Fast Charging', 'Rs. 2,999', 'Rs. 6,000', 'Limited', 'Accessories',
 'Never run out of juice again. This intelligent super-fast charging power bank features a digital percentage display and PD Type-C input/output.',
 array['Intelligent Super Fast Charging','LED Digital Battery Percentage Display','Type-C PD 20W Output','Travel-Friendly Design (Check-in OK)','Multiple Device Protection Circuit'], 4),
('akg-handsfree', 'AKG Type-C Handsfree', 'Best Sound and Bass | Samsung Optimized', 'Rs. 600', 'Rs. 1,200', null, 'Headphones',
 'Original-quality AKG tuned earphones featuring deep bass and crystal clear audio. Available in both Type-C and 3.5mm jack versions to fit any smartphone.',
 array['Tuned by AKG for Studio Quality Sound','Tangle-free Fabric Cable','In-line Mic with Volume Control','Extra Bass Boost Technology','Ergonomic In-ear Design'], 5),
('kts-1706-solar-speaker', 'KTS-1706 Solar Speaker', '4-Inch Drive | Solar Powered Music', 'Rs. 2,500', 'Rs. 4,500', 'Outdoor', 'Speakers',
 'A rugged outdoor speaker that never stops playing. With a built-in solar panel, you can charge it under the sun while enjoying your favorite hits with the massive 4-inch driver.',
 array['Built-in Solar Charging Panel','Large 4" High-Output Driver','High-Power LED Flashlight','Bluetooth, USB, and SD Card Support','Long-lasting Rechargeable Battery'], 6),
('portable-ac-cooling-fan', 'Portable AC Cooling Fan', '3-in-1 Mini AC | Humidifier | Cooling Fan', 'Rs. 1,999', 'Rs. 4,000', 'Summer Hit', 'Home Appliance',
 'Beat the summer heat with this compact 3-in-1 portable air conditioner. Combines a powerful cooling fan, water-mist humidifier, and ambient night light — perfect for desks, bedrooms and small rooms.',
 array['3-in-1: Cooler, Humidifier & Fan','5 Mist Spray Outlets for Instant Cooling','3 Adjustable Fan Speeds','USB Powered — Use Anywhere','Built-in 7-Color Night Light'], 7),
('10000mah-slim-power-bank', '10000mAh Slim Power Bank', 'PD 22.5W Fast Charging | Ultra Slim Design', 'Rs. 1,999', 'Rs. 3,500', 'Trending', 'Accessories',
 'An ultra-slim 10000mAh portable charger with PD 22.5W fast charging support. Pocket-friendly size with enough power to top up your phone 2–3 times on a single charge.',
 array['10000mAh High-Density Battery','PD 22.5W Super Fast Charging','Slim & Lightweight Pocket Design','Type-C & USB-A Output Ports','Multi-Layer Safety Protection'], 8),
('20000mah-transparent-power-bank', '20000mAh Transparent Power Bank', '66W PD Super Fast Charging | Cyberpunk Look', 'Rs. 3,499', 'Rs. 6,500', 'Premium', 'Accessories',
 'A massive 20000mAh power bank with a stunning transparent body that shows off the internal circuitry. Features 66W PD super fast charging and a clear digital display — perfect for tech lovers.',
 array['20000mAh Long-lasting Capacity','66W PD Super Fast Charging Output','Transparent Cyberpunk Body Design','LED Display: Voltage, Current & %','Charges Phones, Tablets & Laptops'], 9),
('p9-wireless-headphones', 'P9 Wireless Bluetooth Headphones', 'Noise Cancelling | Mic | 5 Color Options', 'Rs. 1,499', 'Rs. 3,000', 'Best Seller', 'Headphones',
 'Premium P9 over-ear wireless headphones with active noise cancellation and built-in mic. Soft cushion ear-cups for all-day comfort, available in 5 trendy colors.',
 array['Active Noise Cancelling (ANC)','Built-in HD Mic for Calls','Bluetooth 5.3 Wireless Connectivity','Soft Memory-Foam Ear Cushions','Available in 5 Stylish Colors'], 10);
