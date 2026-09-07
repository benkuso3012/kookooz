-- 1. Schema alignment
ALTER TABLE public.menu_items RENAME COLUMN prep_time_minutes TO prep_time;
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS is_vegan boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_gluten_free boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rating numeric NOT NULL DEFAULT 4.5;

ALTER TABLE public.menu_categories RENAME COLUMN display_order TO sort_order;

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS hours text,
  ADD COLUMN IF NOT EXISTS is_flagship boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rating numeric NOT NULL DEFAULT 4.8,
  ADD COLUMN IF NOT EXISTS features text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.orders RENAME COLUMN total TO total_amount;
ALTER TABLE public.orders RENAME COLUMN customer_phone TO phone;

ALTER TABLE public.order_items RENAME COLUMN unit_price TO item_price;
ALTER TABLE public.order_items ALTER COLUMN subtotal SET DEFAULT 0;

CREATE OR REPLACE FUNCTION public.set_order_item_subtotal()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.subtotal = COALESCE(NEW.item_price,0) * COALESCE(NEW.quantity,1);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS order_items_subtotal ON public.order_items;
CREATE TRIGGER order_items_subtotal BEFORE INSERT OR UPDATE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.set_order_item_subtotal();

-- 2. Suppliers & inventory: cost data restricted to admin/manager
DROP POLICY IF EXISTS "Staff view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Staff view inventory" ON public.inventory;

-- 3. Orders: staff may progress orders, but not touch money/payment/ownership
DROP POLICY IF EXISTS "Staff update orders" ON public.orders;
CREATE POLICY "Staff update orders" ON public.orders
FOR UPDATE TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.guard_order_financials()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') THEN
    RETURN NEW;
  END IF;
  IF NEW.total_amount IS DISTINCT FROM OLD.total_amount
     OR NEW.subtotal IS DISTINCT FROM OLD.subtotal
     OR NEW.tax IS DISTINCT FROM OLD.tax
     OR NEW.discount IS DISTINCT FROM OLD.discount
     OR NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee
     OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
     OR NEW.promo_code IS DISTINCT FROM OLD.promo_code
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Only managers or admins can change order totals, payment details or ownership';
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.guard_order_financials() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS orders_financial_guard ON public.orders;
CREATE TRIGGER orders_financial_guard BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.guard_order_financials();

-- 4. Lock down helper function execution
REVOKE ALL ON FUNCTION public.set_order_item_subtotal() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;

-- 5. Realtime
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.orders; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;