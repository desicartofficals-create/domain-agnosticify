
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "Users view own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "Admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

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
  images text[] not null default '{}',
  colors text[] not null default '{}',
  sections text[] not null default '{}',
  discount_percent int,
  category_slug text,
  views_count int not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "Public read products" on public.products for select using (true);
create policy "Admins insert products" on public.products for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update products" on public.products for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete products" on public.products for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger products_touch_updated_at before update on public.products for each row execute function public.touch_updated_at();
alter publication supabase_realtime add table public.products;

create policy "Public read product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "Admins upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));
create policy "Admins update product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));
create policy "Admins delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null,
  product_name text not null,
  product_color text,
  unit_price text not null,
  quantity integer not null default 1,
  subtotal integer,
  delivery_charge integer not null default 300,
  total integer,
  customer_name text not null,
  customer_phone text not null,
  customer_city text not null,
  customer_address text not null,
  status text not null default 'new',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant insert on public.orders to anon;
grant select, insert, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "Anyone can place order" on public.orders for insert to anon, authenticated with check (true);
create policy "Admins view orders" on public.orders for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update orders" on public.orders for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete orders" on public.orders for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger orders_touch_updated_at before update on public.orders for each row execute function public.touch_updated_at();
create index idx_orders_created_at on public.orders(created_at desc);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null,
  customer_name text not null,
  rating integer not null default 5,
  comment text not null default '',
  image_url text,
  created_at timestamptz not null default now()
);
grant select, insert on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "Public read reviews" on public.reviews for select using (true);
create policy "Anyone can post review" on public.reviews for insert with check (
  length(customer_name) between 1 and 80 and length(comment) <= 1000 and rating between 1 and 5);
create policy "Admins update reviews" on public.reviews for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete reviews" on public.reviews for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create index reviews_product_slug_created_idx on public.reviews (product_slug, created_at desc);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  image_url text,
  link_slug text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Public can view categories" on public.categories for select using (true);
create policy "Admins can insert categories" on public.categories for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update categories" on public.categories for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can delete categories" on public.categories for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger categories_touch_updated_at before update on public.categories for each row execute function public.touch_updated_at();

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  path text,
  referrer text,
  country text,
  country_code text,
  city text,
  created_at timestamptz not null default now()
);
grant insert on public.visits to anon, authenticated;
grant select, delete on public.visits to authenticated;
grant all on public.visits to service_role;
alter table public.visits enable row level security;
create policy "Anyone can record a visit" on public.visits for insert with check (true);
create policy "Admins can view visits" on public.visits for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create index visits_country_idx on public.visits (country);

create table public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "Public read settings" on public.site_settings for select using (true);
create policy "Admins insert settings" on public.site_settings for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update settings" on public.site_settings for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete settings" on public.site_settings for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create table public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  subtitle text not null default '',
  badge text,
  image_url text,
  link_slug text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.hero_slides to anon, authenticated;
grant insert, update, delete on public.hero_slides to authenticated;
grant all on public.hero_slides to service_role;
alter table public.hero_slides enable row level security;
create policy "Public read hero slides" on public.hero_slides for select using (true);
create policy "Admins insert hero slides" on public.hero_slides for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update hero slides" on public.hero_slides for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete hero slides" on public.hero_slides for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger hero_slides_touch_updated_at before update on public.hero_slides for each row execute function public.touch_updated_at();

insert into public.products (slug, name, tagline, price, old_price, tag, category, category_slug, sections, description, features, sort_order) values
('ultra-3-smartwatch','Ultra 3 Smartwatch','Pakistan''s Most Versatile 7-Strap Luxury Watch','Rs. 4,500','Rs. 12,000','7-in-1 Edition','Smart Watch','smart-watches',array['best-sellers','best-offers'],
 'The ultimate smartwatch package for DesiCart customers. Featuring a stunning Super AMOLED display and 7 different interchangeable straps to match every outfit.',
 array['Big Full HD Infinite Display','7 Premium Straps Included in Box','Wireless Fast Charging','Bluetooth Calling & Heart Rate Monitoring','Sports Mode & Calculator Built-in'],1),
('airpods-pro-2-black','Airpods Pro 2 Black','Master Copy | ANC & Deep Bass','Rs. 1,500','Rs. 3,500','Best Seller','Earbuds','earbuds',array['best-sellers'],
 'Experience premium sound with the sleek Airpods Pro 2 in a stunning matte black finish. Designed for comfort and high-quality audio, these are the perfect daily drivers for music and calls.',
 array['Active Noise Cancellation (ANC) support','Superior Bass & Crisp Treble','3-4 Hours Playback Time','Touch Controls for Music & Calls','Wireless Charging Case'],2),
('kts-1185-speaker','KTS-1185 Wireless Speaker','3-Inch Drive | Built-in Emergency Torch','Rs. 1,800','Rs. 3,500','New','Speakers','speakers',array['just-launched'],
 'A portable powerhouse for music lovers. This wireless speaker features a 3-inch high-bass driver and a built-in emergency light, making it the perfect outdoor companion.',
 array['3" Powerful Audio Drive','Built-in High-Power Emergency Light','FM Radio & USB/TF Card Support','Wireless Bluetooth Connectivity','Rugged, Portable Design with Handle'],3),
('super-charger-powerbank','Super Charger Power Bank','LED Digital Display | PD Fast Charging','Rs. 2,999','Rs. 6,000','Limited','Accessories','power-banks',array['best-offers'],
 'Never run out of juice again. This intelligent super-fast charging power bank features a digital percentage display and PD Type-C input/output.',
 array['Intelligent Super Fast Charging','LED Digital Battery Percentage Display','Type-C PD 20W Output','Travel-Friendly Design (Check-in OK)','Multiple Device Protection Circuit'],4),
('akg-handsfree','AKG Type-C Handsfree','Best Sound and Bass | Samsung Optimized','Rs. 600','Rs. 1,200',null,'Headphones','headphones',array['best-offers'],
 'Original-quality AKG tuned earphones featuring deep bass and crystal clear audio. Available in both Type-C and 3.5mm jack versions to fit any smartphone.',
 array['Tuned by AKG for Studio Quality Sound','Tangle-free Fabric Cable','In-line Mic with Volume Control','Extra Bass Boost Technology','Ergonomic In-ear Design'],5),
('kts-1706-solar-speaker','KTS-1706 Solar Speaker','4-Inch Drive | Solar Powered Music','Rs. 2,500','Rs. 4,500','Outdoor','Speakers','speakers',array['just-launched'],
 'A rugged outdoor speaker that never stops playing. With a built-in solar panel, you can charge it under the sun while enjoying your favorite hits with the massive 4-inch driver.',
 array['Built-in Solar Charging Panel','Large 4" High-Output Driver','High-Power LED Flashlight','Bluetooth, USB, and SD Card Support','Long-lasting Rechargeable Battery'],6),
('portable-ac-cooling-fan','Portable AC Cooling Fan','3-in-1 Mini AC | Humidifier | Cooling Fan','Rs. 1,999','Rs. 4,000','Summer Hit','Home Appliance','home-kitchen',array['just-launched'],
 'Beat the summer heat with this compact 3-in-1 portable air conditioner. Combines a powerful cooling fan, water-mist humidifier, and ambient night light — perfect for desks, bedrooms and small rooms.',
 array['3-in-1: Cooler, Humidifier & Fan','5 Mist Spray Outlets for Instant Cooling','3 Adjustable Fan Speeds','USB Powered — Use Anywhere','Built-in 7-Color Night Light'],7),
('10000mah-slim-power-bank','10000mAh Slim Power Bank','PD 22.5W Fast Charging | Ultra Slim Design','Rs. 1,999','Rs. 3,500','Trending','Accessories','power-banks',array['best-sellers'],
 'An ultra-slim 10000mAh portable charger with PD 22.5W fast charging support. Pocket-friendly size with enough power to top up your phone 2-3 times on a single charge.',
 array['10000mAh High-Density Battery','PD 22.5W Super Fast Charging','Slim & Lightweight Pocket Design','Type-C & USB-A Output Ports','Multi-Layer Safety Protection'],8),
('20000mah-transparent-power-bank','20000mAh Transparent Power Bank','66W PD Super Fast Charging | Cyberpunk Look','Rs. 3,499','Rs. 6,500','Premium','Accessories','power-banks',array['best-offers'],
 'A massive 20000mAh power bank with a stunning transparent body that shows off the internal circuitry. Features 66W PD super fast charging and a clear digital display — perfect for tech lovers.',
 array['20000mAh Long-lasting Capacity','66W PD Super Fast Charging Output','Transparent Cyberpunk Body Design','LED Display: Voltage, Current & %','Charges Phones, Tablets & Laptops'],9),
('p9-wireless-headphones','P9 Wireless Bluetooth Headphones','Noise Cancelling | Mic | 5 Color Options','Rs. 1,499','Rs. 3,000','Best Seller','Headphones','headphones',array['best-sellers','just-launched'],
 'Premium P9 over-ear wireless headphones with active noise cancellation and built-in mic. Soft cushion ear-cups for all-day comfort, available in 5 trendy colors.',
 array['Active Noise Cancelling (ANC)','Built-in HD Mic for Calls','Bluetooth 5.3 Wireless Connectivity','Soft Memory-Foam Ear Cushions','Available in 5 Stylish Colors'],10);

insert into public.categories (slug, label, link_slug, sort_order) values
  ('smart-watches','Smart Watches','ultra-3-smartwatch',1),
  ('earbuds','Earbuds','airpods-pro-2-black',2),
  ('speakers','Speakers','kts-1185-speaker',3),
  ('power-banks','Power Banks','super-charger-powerbank',4),
  ('headphones','Headphones','akg-handsfree',5),
  ('home-kitchen','Home & Kitchen','portable-ac-cooling-fan',6);

insert into public.hero_slides (title, subtitle, badge, link_slug, sort_order) values
  ('Ultra 3 Smartwatch','Pakistan''s Most Versatile Luxury Watch','Featured','ultra-3-smartwatch',1),
  ('Airpods Pro 2','ANC & Deep Bass','Best Seller','airpods-pro-2-black',2),
  ('KTS-1185 Speaker','Pakistan''s Loudest Speaker Box','New','kts-1185-speaker',3);

insert into public.site_settings (key, value) values
  ('ribbon_text','AZADI CELEBRATION ENDS IN • LIMITED STOCK LEFT!'),
  ('ribbon_bg','#0f9d58'),
  ('ribbon_fg','#ffffff'),
  ('ribbon_countdown_end',''),
  ('ribbon_enabled','true'),
  ('urgency_text','1361+ People viewed this in the last 7 days'),
  ('urgency_timer_minutes','1440'),
  ('social_facebook',''),
  ('social_x',''),
  ('social_instagram',''),
  ('social_pinterest',''),
  ('social_youtube',''),
  ('social_tiktok',''),
  ('social_linkedin',''),
  ('social_snapchat','');

do $$
declare new_user_id uuid := gen_random_uuid();
begin
  if exists (select 1 from auth.users where email = 'admin@desicart.xyz') then
    select id into new_user_id from auth.users where email = 'admin@desicart.xyz';
  else
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated','authenticated','admin@desicart.xyz', crypt('Huzaifa4028@', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), new_user_id, jsonb_build_object('sub', new_user_id::text, 'email','admin@desicart.xyz','email_verified', true), 'email','admin@desicart.xyz', now(), now(), now());
  end if;
  insert into public.user_roles (user_id, role) values (new_user_id, 'admin') on conflict (user_id, role) do nothing;
end $$;
