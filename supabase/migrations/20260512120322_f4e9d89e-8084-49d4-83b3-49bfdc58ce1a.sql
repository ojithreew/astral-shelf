
-- Roles
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'user',
  created_at timestamptz not null default now(),
  unique(user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "users view own roles" on public.user_roles for select using (auth.uid() = user_id);

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles select own" on public.profiles for select using (auth.uid() = id);
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile + default role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "categories public read" on public.categories for select using (true);
create policy "categories admin write" on public.categories for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  tagline text,
  description text,
  price numeric(10,2) not null default 0,
  thumbnail_url text,
  gallery jsonb not null default '[]'::jsonb,
  preview_url text,
  file_url text,
  category_id uuid references public.categories(id) on delete set null,
  tags text[] not null default '{}',
  software text,
  author_name text,
  rating numeric(2,1) not null default 0,
  reviews_count int not null default 0,
  downloads_count int not null default 0,
  is_featured boolean not null default false,
  is_trending boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.products enable row level security;
create policy "products public read" on public.products for select using (is_published = true);
create policy "products admin all" on public.products for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create index on public.products (category_id);
create index on public.products (is_featured) where is_featured = true;

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  status text not null default 'pending',
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;
create policy "orders select own" on public.orders for select using (auth.uid() = user_id);
create policy "orders insert own" on public.orders for insert with check (auth.uid() = user_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete restrict not null,
  price numeric(10,2) not null,
  quantity int not null default 1
);
alter table public.order_items enable row level security;
create policy "order_items select own" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "order_items insert own" on public.order_items for insert with check (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

-- Cart
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity int not null default 1,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);
alter table public.cart_items enable row level security;
create policy "cart all own" on public.cart_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Wishlist
create table public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);
alter table public.wishlist enable row level security;
create policy "wishlist all own" on public.wishlist for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Seed categories
insert into public.categories (name, slug, icon) values
  ('UI Kits', 'ui-kits', 'layout'),
  ('Templates', 'templates', 'layers'),
  ('Icons', 'icons', 'star'),
  ('3D Assets', '3d', 'box'),
  ('Code', 'code', 'code'),
  ('Fonts', 'fonts', 'type');

-- Seed products
insert into public.products (name, slug, tagline, description, price, thumbnail_url, category_id, software, author_name, rating, reviews_count, downloads_count, is_featured, is_trending, tags) values
  ('Echelon Dashboard System', 'echelon-dashboard', 'Enterprise dashboard kit', 'A premium dashboard design system with 240+ components built for serious data products. Includes Figma source, React export, and Storybook.', 89, 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', (select id from public.categories where slug='ui-kits'), 'Figma', 'DesignCore Studio', 4.9, 2100, 8420, true, true, array['dashboard','figma','dark']),
  ('Prism 3D Icon Suite', 'prism-3d-icons', '120 isometric 3D icons', 'Premium isometric 3D icon set in monochrome. Three weights, OBJ + Figma + PNG.', 45, 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800', (select id from public.categories where slug='icons'), 'Figma', 'Studio Void', 5.0, 128, 1240, true, false, array['3d','icons','isometric']),
  ('Lumina OS Mobile Kit', 'lumina-os-mobile', 'iOS mobile design system', 'Beautiful mobile UI kit with 80 screens.', 24, 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800', (select id from public.categories where slug='ui-kits'), 'Figma', 'Sarah Jenkins', 4.2, 312, 4120, false, true, array['mobile','ios']),
  ('Nova Components Pro', 'nova-components-pro', 'React + Tailwind library', '180 production-ready React components with TypeScript and Tailwind v4.', 149, 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800', (select id from public.categories where slug='code'), 'React', 'Vector Ops', 5.0, 540, 9120, true, true, array['react','tailwind','typescript']),
  ('MailCraft Ultra', 'mailcraft-ultra', '40 dark email templates', 'Responsive transactional email templates with MJML source.', 32, 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=800', (select id from public.categories where slug='templates'), 'Email', 'Postman Labs', 3.8, 84, 720, false, false, array['email','mjml']),
  ('Metropolis Type Family', 'metropolis-type', 'Modernist sans-serif', '14 weights, variable axis, 600+ glyphs.', 120, 'https://images.unsplash.com/photo-1505682634904-d7c8d95cdc50?w=800', (select id from public.categories where slug='fonts'), 'Font', 'Foundry X', 4.9, 410, 2890, false, true, array['typography','sans-serif']),
  ('NodeFlow Engine V2', 'nodeflow-engine', 'Visual node editor', 'Drag-drop node-based editor for React. Zero deps.', 19, 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800', (select id from public.categories where slug='code'), 'React', 'Backend Mastery', 4.5, 88, 1320, false, false, array['react','nodes','editor']),
  ('Claymorphic Elements', 'claymorphic-elements', 'Free 3D clay assets', '30 soft 3D shapes for backgrounds and hero sections.', 0, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800', (select id from public.categories where slug='3d'), 'PNG', 'Render Loft', 4.1, 220, 14300, false, true, array['3d','free','clay']),
  ('Aurora Gradient Pack', 'aurora-gradients', '60 mesh gradients', 'Vibrant mesh gradients in SVG and PNG.', 12, 'https://images.unsplash.com/photo-1614851099511-773084f6911d?w=800', (select id from public.categories where slug='3d'), 'SVG', 'NeonLabs', 4.6, 156, 3210, false, false, array['gradients','colors']),
  ('Linear Pro Icon Set', 'linear-pro-icons', '1200 line icons', 'Pixel-perfect line icons in 24/20/16 sizes.', 24, 'https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=800', (select id from public.categories where slug='icons'), 'Figma', 'GlyphCo', 4.8, 980, 6240, false, false, array['icons','line']),
  ('Kanso Portfolio Template', 'kanso-portfolio', 'Minimal portfolio', 'Ultra-minimalist Japanese aesthetic portfolio template.', 0, 'https://images.unsplash.com/photo-1481487196290-c152efe083f5?w=800', (select id from public.categories where slug='templates'), 'Framer', 'Kenji Sato', 5.0, 67, 5400, true, false, array['portfolio','minimal','free']),
  ('Hyperion UI Kit', 'hyperion-ui-kit', 'SaaS dashboard kit', 'Professional SaaS dashboard design system.', 89, 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800', (select id from public.categories where slug='ui-kits'), 'Figma', 'Studio Arcane', 4.9, 1820, 7240, false, true, array['saas','dashboard']);
