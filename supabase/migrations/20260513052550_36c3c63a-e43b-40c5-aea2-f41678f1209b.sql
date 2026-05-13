
-- Settings table
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.settings FOR SELECT USING (true);
CREATE POLICY "settings admin write" ON public.settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.settings (key, value) VALUES
  ('store_name', '"Kinetic"'::jsonb),
  ('store_tagline', '"Premium Digital Marketplace"'::jsonb),
  ('currency', '"IDR"'::jsonb),
  ('currency_symbol', '"Rp"'::jsonb),
  ('support_email', '"support@example.com"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Orders: payment columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS midtrans_order_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS snap_token TEXT,
  ADD COLUMN IF NOT EXISTS payment_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Admin policies for orders
DROP POLICY IF EXISTS "orders admin all" ON public.orders;
CREATE POLICY "orders admin all" ON public.orders FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "order_items admin all" ON public.order_items;
CREATE POLICY "order_items admin all" ON public.order_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin can see all profiles
DROP POLICY IF EXISTS "profiles admin read" ON public.profiles;
CREATE POLICY "profiles admin read" ON public.profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can manage user_roles
DROP POLICY IF EXISTS "user_roles admin all" ON public.user_roles;
CREATE POLICY "user_roles admin all" ON public.user_roles FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin can read all products (including unpublished)
DROP POLICY IF EXISTS "products admin read all" ON public.products;
CREATE POLICY "products admin read all" ON public.products FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
