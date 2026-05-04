-- Add payment method fields to admin_settings
ALTER TABLE public.admin_settings 
ADD COLUMN IF NOT EXISTS pm1_name text DEFAULT 'USDT',
ADD COLUMN IF NOT EXISTS pm1_address text DEFAULT 'Your_USDT_Address_Here',
ADD COLUMN IF NOT EXISTS pm1_qr_url text,
ADD COLUMN IF NOT EXISTS pm2_name text,
ADD COLUMN IF NOT EXISTS pm2_address text,
ADD COLUMN IF NOT EXISTS pm2_qr_url text,
ADD COLUMN IF NOT EXISTS pm3_name text,
ADD COLUMN IF NOT EXISTS pm3_address text,
ADD COLUMN IF NOT EXISTS pm3_qr_url text;

-- Update admin_save_settings function to include new fields
CREATE OR REPLACE FUNCTION public.admin_save_settings(
    p_maintenance_mode boolean, 
    p_min_deposit_amount numeric, 
    p_min_withdraw_amount numeric, 
    p_withdraw_fee_percentage numeric, 
    p_spot_fee_percentage numeric, 
    p_max_leverage_allowed integer, 
    p_force_win_profit_percentage numeric, 
    p_usdt_address text, 
    p_usdt_network text, 
    p_qr_code_url text,
    p_pm1_name text DEFAULT 'USDT',
    p_pm1_address text DEFAULT '',
    p_pm1_qr_url text DEFAULT '',
    p_pm2_name text DEFAULT '',
    p_pm2_address text DEFAULT '',
    p_pm2_qr_url text DEFAULT '',
    p_pm3_name text DEFAULT '',
    p_pm3_address text DEFAULT '',
    p_pm3_qr_url text DEFAULT ''
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Security: Sirf Admin ko allow karega
  IF (SELECT role FROM public.users WHERE id = auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized Protocol';
  END IF;

  UPDATE public.admin_settings 
  SET 
    maintenance_mode = p_maintenance_mode,
    min_deposit_amount = p_min_deposit_amount,
    min_withdraw_amount = p_min_withdraw_amount,
    withdraw_fee_percentage = p_withdraw_fee_percentage,
    spot_fee_percentage = p_spot_fee_percentage,
    max_leverage_allowed = p_max_leverage_allowed,
    force_win_profit_percentage = p_force_win_profit_percentage,
    usdt_address = p_usdt_address,
    usdt_network = p_usdt_network,
    qr_code_url = p_qr_code_url,
    pm1_name = p_pm1_name,
    pm1_address = p_pm1_address,
    pm1_qr_url = p_pm1_qr_url,
    pm2_name = p_pm2_name,
    pm2_address = p_pm2_address,
    pm2_qr_url = p_pm2_qr_url,
    pm3_name = p_pm3_name,
    pm3_address = p_pm3_address,
    pm3_qr_url = p_pm3_qr_url,
    updated_at = NOW()
  WHERE id = 1;
END;
$function$;

-- Create storage bucket for payment methods if it doesn't exist
-- Note: This is usually done via Supabase dashboard or API, but we can try to add a record to storage.buckets if needed.
-- However, storage.buckets is a system table. We should probably just tell the user to create it or use the API.
-- For the sake of this task, I'll assume I should provide the SQL to create it.
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-methods', 'payment-methods', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for payment-methods bucket
DROP POLICY IF EXISTS "Public Access PM" ON storage.objects;
CREATE POLICY "Public Access PM" ON storage.objects FOR SELECT USING (bucket_id = 'payment-methods');

DROP POLICY IF EXISTS "Admin Full Access PM" ON storage.objects;
CREATE POLICY "Admin Full Access PM" ON storage.objects FOR ALL USING (bucket_id = 'payment-methods' AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Add payment_method column to deposit_requests
ALTER TABLE public.deposit_requests 
ADD COLUMN IF NOT EXISTS payment_method text;

-- Update create_deposit_request_v3 function to include payment_method
CREATE OR REPLACE FUNCTION public.create_deposit_request_v3(
    p_user_id uuid, 
    p_amount numeric, 
    p_screenshot_url text,
    p_payment_method text
)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_min_deposit NUMERIC;
  v_ref_id TEXT;
BEGIN
  -- 1. Min Deposit check karein
  SELECT min_deposit_amount INTO v_min_deposit FROM public.admin_settings WHERE id = 1;

  IF p_amount < v_min_deposit THEN
    RETURN json_build_object('success', false, 'message', 'Minimum deposit is ' || v_min_deposit || ' USDT');
  END IF;

  -- 2. Reference ID generate karein
  v_ref_id := 'DEP-' || to_char(now(), 'MS') || floor(random() * 1000)::text;

  -- 3. Deposit Request Table mein entry
  INSERT INTO public.deposit_requests (user_id, amount, screenshot_url, trx_id, status, payment_method)
  VALUES (p_user_id, p_amount, p_screenshot_url, v_ref_id, 'pending', p_payment_method);

  -- 4. Transactions Table mein entry (FOR HISTORY)
  INSERT INTO public.transactions (user_id, amount, type, status, description)
  VALUES (p_user_id, p_amount, 'deposit', 'pending', 'Deposit request via ' || p_payment_method || ' (Ref: ' || v_ref_id || ')');

  RETURN json_build_object('success', true, 'message', 'Deposit request submitted! Ref ID: ' || v_ref_id);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$function$;
