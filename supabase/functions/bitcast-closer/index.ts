import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date().toISOString();
    console.log(`[${now}] Checking for expired Bitcast trades...`);

    // 1. Fetch expired trades (Sirf Bitcast aur Open status)
    const { data: expiredTrades, error: fetchError } = await supabase
      .from('trades')
      .select('id, user_id, symbol, trade_mode')
      .eq('status', 'open')
      .eq('trade_mode', 'Bitcast')
      .lte('expire_time', now);

    if (fetchError) throw fetchError;

    if (!expiredTrades || expiredTrades.length === 0) {
      return new Response(JSON.stringify({ message: "No expired trades" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`Found ${expiredTrades.length} trades. Processing each symbol separately...`);

    // 2. Process trades one by one for safety
    const results = await Promise.all(expiredTrades.map(async (trade) => {
      try {
        // Specifically us symbol ki live price lo jo trade mein hai
        const { data: assetData, error: priceError } = await supabase
          .from('assets')
          .select('live_price')
          .eq('symbol', trade.symbol)
          .single();

        if (priceError || !assetData || assetData.live_price <= 0) {
          console.error(`[SKIP] Price not found for ${trade.symbol}. Trade ID: ${trade.id}`);
          return { trade_id: trade.id, success: false, error: "Price Fetch Failed" };
        }

        const currentPrice = assetData.live_price;
        console.log(`[CLOSE] Closing ${trade.symbol} at ${currentPrice}. Trade ID: ${trade.id}`);

        // 3. RPC Call (v3) use karna jo humne PnL capping ke liye update kiya hai
        const { data, error: rpcError } = await supabase.rpc('close_trade_v3', {
          p_trade_id: trade.id,
          p_user_id: trade.user_id,
          p_close_price: currentPrice
        });

        if (rpcError) throw rpcError;

        return { trade_id: trade.id, success: true, result: data };

      } catch (innerError) {
        console.error(`[ERROR] Trade ID ${trade.id}:`, innerError.message);
        return { trade_id: trade.id, success: false, error: innerError.message };
      }
    }));

    return new Response(JSON.stringify({ processed: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Critical Edge Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
})