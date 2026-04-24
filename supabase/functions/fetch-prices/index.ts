import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const TWELVE_DATA_API_KEY = Deno.env.get('TWELVE_DATA_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] 🚀 Fetching Hybrid Market Data (Binance + Twelve Data)`);

  try {
    // 1. Get all active assets from DB
    const { data: assets, error: fetchError } = await supabase
      .from('assets')
      .select('symbol, asset_type')
      .eq('is_active', true);

    if (fetchError) throw fetchError;
    if (!assets || assets.length === 0) {
      return new Response(JSON.stringify({ message: "No active assets" }), { status: 200 });
    }

    // Split assets based on type
    const cryptoAssets = assets.filter(a => a.asset_type === 'crypto');
    const otherAssets = assets.filter(a => a.asset_type !== 'crypto');
    
    let updates: any[] = [];

    // ------------------------------------------------------------------
    // STEP A: Fetch Crypto Prices from BINANCE (Free, Fast, Unlimited)
    // ------------------------------------------------------------------
    if (cryptoAssets.length > 0) {
      console.log(`[${requestId}] 📈 Fetching ${cryptoAssets.length} crypto prices from Binance...`);
      try {
        const binanceRes = await fetch('https://api.binance.com/api/v3/ticker/price');
        const binanceData = await binanceRes.json();

        cryptoAssets.forEach(asset => {
          const match = binanceData.find((p: any) => p.symbol === asset.symbol);
          if (match) {
            updates.push({
              symbol: asset.symbol,
              asset_type: asset.asset_type,
              live_price: parseFloat(match.price),
              updated_at: new Date().toISOString()
            });
          }
        });
      } catch (err) {
        console.error(`[${requestId}] ❌ Binance Fetch Error:`, err.message);
      }
    }

    // ------------------------------------------------------------------
    // STEP B: Fetch Forex/Metals from TWELVE DATA (Limit: 8 symbols)
    // ------------------------------------------------------------------
    if (otherAssets.length > 0) {
      const symbolsParam = otherAssets.map(a => a.symbol).join(',');
      console.log(`[${requestId}] 💱 Fetching ${otherAssets.length} other prices from Twelve Data...`);
      
      try {
        const tdUrl = `https://api.twelvedata.com/price?symbol=${symbolsParam}&apikey=${TWELVE_DATA_API_KEY}`;
        const tdRes = await fetch(tdUrl);
        const tdData = await tdRes.json();

        if (tdData.status !== 'error') {
          // Handle Twelve Data's dynamic JSON structure
          if (otherAssets.length === 1) {
            updates.push({
              symbol: otherAssets[0].symbol,
              asset_type: otherAssets[0].asset_type,
              live_price: parseFloat(tdData.price),
              updated_at: new Date().toISOString()
            });
          } else {
            otherAssets.forEach(asset => {
              if (tdData[asset.symbol] && tdData[asset.symbol].price) {
                updates.push({
                  symbol: asset.symbol,
                  asset_type: asset.asset_type,
                  live_price: parseFloat(tdData[asset.symbol].price),
                  updated_at: new Date().toISOString()
                });
              }
            });
          }
        } else {
          console.error(`[${requestId}] ❌ Twelve Data Error:`, tdData.message);
        }
      } catch (err) {
        console.error(`[${requestId}] ❌ Twelve Data Fetch Error:`, err.message);
      }
    }

    // ------------------------------------------------------------------
    // STEP C: Batch Upsert to Supabase
    // ------------------------------------------------------------------
    if (updates.length > 0) {
      console.log(`[${requestId}] 💾 Saving ${updates.length} updated prices to database...`);
      const { error: updateError } = await supabase
        .from('assets')
        .upsert(updates, { onConflict: 'symbol' });

      if (updateError) throw updateError;
      console.log(`[${requestId}] ✨ Success! Prices updated.`);
    } else {
      console.log(`[${requestId}] ⚠️ No valid prices fetched to update.`);
    }

    return new Response(JSON.stringify({ success: true, updatedCount: updates.length }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error(`[${requestId}] 🔥 Critical Error:`, err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
})