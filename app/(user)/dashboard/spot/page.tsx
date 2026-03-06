"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown, Minus, Plus, Loader2, BarChart2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

// Supabase Setup
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type OrderSide = 'Buy' | 'Sell';
type OrderType = 'Limit' | 'Market';

// Asli Content Function (Jo Suspense ke andar chalega)
function SpotTradeScreenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // DYNAMIC URL PARAMETERS
  const urlSymbol = searchParams.get('symbol') || 'BTCUSDT';
  const urlType = searchParams.get('type') || 'crypto';
  const urlSide = (searchParams.get('side') as OrderSide) || 'Buy';
  const baseCoin = urlSymbol.replace('USDT', ''); // e.g., 'BTC', 'SOL'
  
  // Core Trading States
  const [side, setSide] = useState<OrderSide>(urlSide); 
  const [orderType, setOrderType] = useState<OrderType>('Limit');
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [activePercent, setActivePercent] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Real Data States
  const [assetData, setAssetData] = useState({ price: 0, change: 0, isUp: true });
  const [availableUSDT, setAvailableUSDT] = useState<number>(0);
  const [spotFeePercent, setSpotFeePercent] = useState<number>(0.1); // Default 0.1% fee
  
  // Note: Since there is no multi-coin wallet table yet in schema, base coin balance is 0 for now.
  const [availableCoin, setAvailableCoin] = useState<number>(0); 

  const currentBalance = side === 'Buy' ? availableUSDT : availableCoin;
  const balanceSymbol = side === 'Buy' ? 'USDT' : baseCoin;

  useEffect(() => {
    const fetchInitialData = async () => {
      // 1. Get Current Logged In User & Balance
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('main_balance')
          .eq('id', authData.user.id)
          .single();
          
        if (userData) {
          setAvailableUSDT(Number(userData.main_balance) || 0);
        }
      }

      // 2. Fetch Admin Settings for Spot Fee (You need to add a spot_fee_percentage column in admin_settings)
      const { data: adminSettings } = await supabase
        .from('admin_settings')
        .select('*')
        .single();

      if (adminSettings && adminSettings.spot_fee_percentage !== undefined) {
        setSpotFeePercent(Number(adminSettings.spot_fee_percentage));
      }

      // 3. Fetch Initial Asset Price
      const { data: assetRes } = await supabase
        .from('assets')
        .select('live_price')
        .eq('symbol', urlSymbol)
        .single();
        
      if (assetRes) {
        setAssetData({ price: assetRes.live_price, change: 2.34, isUp: true }); 
        setPrice(assetRes.live_price.toString()); 
      }
      
      setIsDataLoaded(true);
    };

    fetchInitialData();

    // 4. Real-time Price Listener
    const channel = supabase
      .channel(`spot_trade_${urlSymbol}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'assets', filter: `symbol=eq.${urlSymbol}` }, (payload) => {
        const newPrice = payload.new.live_price;
        setAssetData(prev => ({
          price: newPrice,
          change: prev.change,
          isUp: newPrice >= prev.price
        }));
        
        if (orderType === 'Market') {
          setPrice(newPrice.toString());
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [urlSymbol, orderType]);

  // 1. Add logic to fetch coin balance inside useEffect
  useEffect(() => {
    const fetchBalances = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch USDT from Users table
      const { data: userData } = await supabase.from('users').select('main_balance').eq('id', user.id).single();
      if (userData) setAvailableUSDT(Number(userData.main_balance));

      // Fetch Base Coin (e.g., SOL) from Wallets table
      const { data: walletData, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .eq('coin_symbol', baseCoin)
        .maybeSingle(); // Fix: Do not use .single()

      if (error) {
        console.error("Wallet Fetch Error:", error.message);
      }

      // If no data, show balance as 0
      const coinBalance = walletData ? Number(walletData.balance) : 0;
      setAvailableCoin(coinBalance);
    };

    if (isDataLoaded) fetchBalances();
  }, [isDataLoaded, baseCoin, side]);

  const orderBook = useMemo(() => {
    const p = assetData.price;
    if (p === 0) return { asks: [], bids: [] };

    const asks = Array.from({ length: 5 }, (_, i) => ({
      price: (p + (5 - i) * (p * 0.00015)).toFixed(2), 
      vol: (Math.random() * 2 + 0.1).toFixed(3)
    }));

    const bids = Array.from({ length: 5 }, (_, i) => ({
      price: (p - (i + 1) * (p * 0.00015)).toFixed(2), 
      vol: (Math.random() * 2 + 0.1).toFixed(3)
    }));

    return { asks, bids };
  }, [assetData.price]);

  const priceNum = parseFloat(price) || 0;
  const qtyNum = parseFloat(quantity) || 0;
  const totalValue = (priceNum * qtyNum).toFixed(2);
  
  // Dynamic Fee Calculation based on Admin Settings
  const estFee = (parseFloat(totalValue) * (spotFeePercent / 100)).toFixed(4); 

  const isLowBalance = side === 'Buy' ? parseFloat(totalValue) > availableUSDT : qtyNum > availableCoin;
  const isButtonDisabled = isLoading || !isDataLoaded || isLowBalance || qtyNum <= 0 || (orderType === 'Limit' && priceNum <= 0);

  const handlePercentage = (percent: number) => {
    setActivePercent(percent);
    if (side === 'Buy') {
      if (priceNum > 0) {
        const affordableQty = (availableUSDT * (percent / 100)) / priceNum;
        setQuantity(affordableQty.toFixed(5));
      }
    } else {
      const sellQty = availableCoin * (percent / 100);
      setQuantity(sellQty.toFixed(5));
    }
  };

  const adjustValue = (setter: React.Dispatch<React.SetStateAction<string>>, current: string, operation: 'add' | 'sub', step: number) => {
    const val = parseFloat(current) || 0;
    const newVal = operation === 'add' ? val + step : Math.max(0, val - step);
    setter(newVal.toFixed(2));
    setActivePercent(null);
  };

  const handleOrder = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login first");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('place_spot_order', {
        p_user_id: user.id,
        p_symbol: urlSymbol,
        p_base_coin: baseCoin,
        p_side: side,
        p_order_type: orderType,
        p_price: priceNum,
        p_quantity: qtyNum,
        p_fee_percent: spotFeePercent
      });

      if (error) throw error;

      if (data?.success) {
        alert(`${side} Order for ${baseCoin} Placed Successfully!`);
        setQuantity("");
        setActivePercent(null);
        // Refresh balances logic yahan call kar saktay hain
      } else {
        alert(data?.message || "Unknown error");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md lg:max-w-full mx-auto bg-[#0F172A] text-[#FFFFFF] flex flex-col lg:flex-row font-sans selection:bg-[#FCD535] selection:text-[#0F172A]">
      
      {/* DESKTOP LEFT SIDEBAR - Asset Info */}
      <div className="hidden lg:flex lg:w-80 lg:flex-col lg:border-r lg:border-[#1E293B] bg-[#0B1120]">
        <div className="p-6 border-b border-[#1E293B]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#FCD535] mb-4">Asset Info</h3>
          <div className="space-y-4">
            <div className="bg-slate-800/50 p-4 rounded-xl">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Symbol</p>
              <p className="text-lg font-bold text-white">{urlSymbol.replace('USDT', '/USDT')}</p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Type</p>
              <p className="text-sm font-medium text-slate-300 capitalize">{urlType}</p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Base Coin</p>
              <p className="text-lg font-bold text-emerald-400">{baseCoin}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Quick Stats</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
              <span className="text-xs text-slate-500">Available USDT</span>
              <span className="text-sm font-mono text-white">{availableUSDT.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
              <span className="text-xs text-slate-500">Available {baseCoin}</span>
              <span className="text-sm font-mono text-white">{availableCoin.toFixed(5)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
              <span className="text-xs text-slate-500">Spot Fee</span>
              <span className="text-sm font-mono text-yellow-500">{spotFeePercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 1. HEADER SECTION */}
        <header className="shrink-0 h-[60px] px-[16px] lg:px-[24px] flex items-center justify-between border-b border-[#1E293B] sticky top-0 bg-[#0F172A] z-20">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => router.back()} className="mr-[12px] active:scale-90 transition-transform shrink-0">
              <ArrowLeft size={22} className="text-[#FFFFFF]" />
            </button>
            <div>
              <h1 className="text-[18px] lg:text-[24px] font-[600] text-[#FFFFFF] leading-tight">
                {urlSymbol.replace('USDT', '/USDT')}
              </h1>
              {isDataLoaded && (
                <span className={`text-[12px] lg:text-[14px] font-medium ${assetData.isUp ? 'text-[#00C087]' : 'text-[#F6465D]'}`}>
                  {assetData.isUp ? '+' : ''}{assetData.change}%
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-[14px] text-[#94A3B8]">
            <button 
              onClick={() => router.push(`/trade?market=Spot&symbol=${urlSymbol}&type=${urlType}`)} 
              className="hover:text-[#00C087] transition-colors active:scale-90"
            >
              <BarChart2 size={20} className="rotate-90" />
            </button>
          </div>
        </header>

        {/* MAIN CONTENT AREA - SCROLLABLE */}
        <div className="flex-1 overflow-y-auto hide-scrollbar pb-8 lg:pb-6">
          
          {/* MAIN TRADING AREA */}
          <div className="flex flex-col lg:flex-row px-[16px] lg:px-[24px] pt-[16px] lg:pt-[24px] gap-[16px] lg:gap-[24px]">
            
            {/* LEFT COLUMN: ORDER ENTRY */}
            <div className="w-full lg:w-[45%] flex flex-col">
              
              {/* 2. BUY / SELL TOGGLE */}
              <div className="flex gap-[8px] h-[44px] lg:h-[48px] mb-[16px] lg:mb-[20px] bg-[#1E293B] p-1 rounded-xl">
                <button 
                  onClick={() => setSide('Buy')}
                  className={`flex-1 rounded-lg text-[14px] lg:text-[15px] font-bold transition-all ${
                    side === 'Buy' ? "bg-[#00C087] text-[#FFFFFF] shadow-md" : "text-[#94A3B8]"
                  }`}
                >
                  Buy
                </button>
                <button 
                  onClick={() => setSide('Sell')}
                  className={`flex-1 rounded-lg text-[14px] lg:text-[15px] font-bold transition-all ${
                    side === 'Sell' ? "bg-[#F6465D] text-[#FFFFFF] shadow-md" : "text-[#94A3B8]"
                  }`}
                >
                  Sell
                </button>
              </div>

              {/* 3. ORDER TYPE DROPDOWN */}
              <div className="relative mb-[16px] lg:mb-[20px]">
                <button 
                  onClick={() => setOrderType(orderType === 'Limit' ? 'Market' : 'Limit')}
                  className="w-full h-[40px] lg:h-[44px] bg-[#1E293B] border border-[#334155] rounded-[10px] px-[12px] flex items-center justify-between text-[13px] lg:text-[14px] font-medium text-[#E2E8F0]"
                >
                  {orderType} Order
                  <ChevronDown size={14} className="text-[#94A3B8]" />
                </button>
              </div>

              {/* 4. PRICE INPUT */}
              <AnimatePresence mode="wait">
                {orderType === 'Limit' ? (
                  <motion.div 
                    initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                    animate={{ height: "auto", opacity: 1, marginBottom: 16 }}
                    exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center justify-between h-[44px] lg:h-[48px] bg-[#0F172A] border border-[#334155] rounded-[10px] p-[4px]">
                      <button onClick={() => adjustValue(setPrice, price, 'sub', 10)} className="w-[36px] lg:w-[40px] h-[36px] lg:h-[40px] rounded-[8px] bg-[#1E293B] flex items-center justify-center hover:bg-[#334155] text-[#94A3B8]">
                        <Minus size={16} />
                      </button>
                      <input 
                        type="number" 
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="flex-1 w-full bg-transparent text-center text-[#FFFFFF] text-[14px] lg:text-[16px] font-mono outline-none"
                      />
                      <button onClick={() => adjustValue(setPrice, price, 'add', 10)} className="w-[36px] lg:w-[40px] h-[36px] lg:h-[40px] rounded-[8px] bg-[#1E293B] flex items-center justify-center hover:bg-[#334155] text-[#94A3B8]">
                        <Plus size={16} />
                      </button>
                    </div>
                    <p className="text-[10px] lg:text-[11px] text-slate-500 mt-1 text-center">≈ ${price}</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                    animate={{ height: "auto", opacity: 1, marginBottom: 16 }}
                    exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center justify-center h-[44px] lg:h-[48px] bg-[#1E293B]/50 border border-[#334155] rounded-[10px]">
                      <span className="text-[13px] lg:text-[14px] text-slate-400">Market Price</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 5. QUANTITY INPUT */}
              <div className="flex items-center justify-between h-[44px] lg:h-[48px] bg-[#0F172A] border border-[#334155] rounded-[10px] p-[4px] mb-[12px] lg:mb-[16px]">
                <button onClick={() => { adjustValue(setQuantity, quantity, 'sub', 0.01); setActivePercent(null); }} className="w-[36px] lg:w-[40px] h-[36px] lg:h-[40px] rounded-[8px] bg-[#1E293B] flex items-center justify-center hover:bg-[#334155] text-[#94A3B8]">
                  <Minus size={16} />
                </button>
                <input 
                  type="number" 
                  placeholder={`Qty (${baseCoin})`}
                  value={quantity}
                  onChange={(e) => { setQuantity(e.target.value); setActivePercent(null); }}
                  className="flex-1 w-full bg-transparent text-center text-[#FFFFFF] text-[13px] lg:text-[15px] font-mono outline-none placeholder:text-[#475569] placeholder:font-sans"
                />
                <button onClick={() => { adjustValue(setQuantity, quantity, 'add', 0.01); setActivePercent(null); }} className="w-[36px] lg:w-[40px] h-[36px] lg:h-[40px] rounded-[8px] bg-[#1E293B] flex items-center justify-center hover:bg-[#334155] text-[#94A3B8]">
                  <Plus size={16} />
                </button>
              </div>

              {/* 6. PERCENTAGE SELECTOR */}
              <div className="flex justify-between h-[28px] lg:h-[32px] mb-[16px] lg:mb-[20px]">
                {[25, 50, 75, 100].map((percent) => (
                  <button
                    key={percent}
                    onClick={() => handlePercentage(percent)}
                    className={`flex-1 mx-[2px] rounded border text-[11px] lg:text-[12px] font-medium transition-colors ${
                      activePercent === percent 
                        ? "border-[#FCD535] text-[#FCD535] bg-[#FCD535]/10" 
                        : "border-[#334155] text-[#94A3B8] bg-transparent hover:border-[#94A3B8]"
                    }`}
                  >
                    {percent}%
                  </button>
                ))}
              </div>

              {/* 7. TOTAL SECTION */}
              <div className="space-y-2 lg:space-y-3 mb-[20px] lg:mb-[24px]">
                <div className="flex justify-between items-center text-[12px] lg:text-[13px]">
                  <span className="text-[#94A3B8]">Available</span>
                  <span className={`font-mono ${isLowBalance ? 'text-[#F6465D]' : 'text-[#FFFFFF]'}`}>
                    {currentBalance.toFixed(2)} {balanceSymbol}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[12px] lg:text-[13px]">
                  <span className="text-[#94A3B8]">Max Total</span>
                  <span className="text-[#FFFFFF] font-mono">{totalValue} USDT</span>
                </div>
                <div className="flex justify-between items-center text-[12px] lg:text-[13px]">
                  <span className="text-[#94A3B8]">Est. Fee ({spotFeePercent}%)</span>
                  <span className="text-[#FCD535] font-mono">{estFee} USDT</span>
                </div>
              </div>

              {/* 8. BUY / SELL BUTTON */}
              <button 
                onClick={handleOrder}
                disabled={isButtonDisabled}
                className={`h-[52px] lg:h-[56px] w-full rounded-[12px] text-[16px] lg:text-[18px] font-[700] text-[#FFFFFF] flex justify-center items-center active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed ${
                  side === 'Buy' ? "bg-[#00C087] shadow-[0_4px_15px_rgba(0,192,135,0.2)]" : "bg-[#F6465D] shadow-[0_4px_15px_rgba(246,70,93,0.2)]"
                }`}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  `${side} ${baseCoin}`
                )}
              </button>
            </div>

            {/* RIGHT COLUMN: ORDER BOOK */}
            <div className="w-full lg:w-[55%] flex flex-col font-mono selection:bg-transparent">
              <div className="flex justify-between text-[11px] lg:text-[12px] text-[#94A3B8] mb-[8px] lg:mb-[12px] px-[4px] font-sans">
                <span>Price (USDT)</span>
                <span>Quantity ({baseCoin})</span>
              </div>
              
              {/* Asks (Sells) - Red */}
              <div className="flex flex-col gap-[2px] lg:gap-[3px] mb-[8px] lg:mb-[12px]">
                {orderBook.asks.map((ask, i) => (
                  <div key={`ask-${i}`} className="flex justify-between items-center relative h-[24px] lg:h-[28px] px-[4px] group cursor-pointer overflow-hidden rounded-sm hover:bg-slate-800/20 transition-colors">
                    <div className="absolute right-0 top-0 bottom-0 bg-[#F6465D]/15 transition-all duration-300" style={{ width: `${Math.random() * 80 + 20}%` }} />
                    <span className="text-[#F6465D] text-[12px] lg:text-[13px] relative z-10 font-mono">{ask.price}</span>
                    <span className="text-[#CBD5E1] text-[11px] lg:text-[12px] relative z-10 font-mono">{ask.vol}</span>
                  </div>
                ))}
              </div>

              {/* Current Market Price in Middle */}
              <div className="my-[12px] lg:my-[16px] py-[8px] lg:py-[12px] px-[4px] border-y border-[#1E293B] flex flex-col justify-center items-center bg-slate-900/20 rounded-lg">
                <span className={`text-[18px] lg:text-[22px] font-bold ${assetData.isUp ? 'text-[#00C087]' : 'text-[#F6465D]'}`}>
                  {assetData.price.toFixed(2)}
                </span>
                <span className="text-[10px] lg:text-[11px] text-[#94A3B8] font-sans mt-1">Current Market Price</span>
              </div>

              {/* Bids (Buys) - Green */}
              <div className="flex flex-col gap-[2px] lg:gap-[3px] mt-[8px] lg:mt-[12px]">
                {orderBook.bids.map((bid, i) => (
                  <div key={`bid-${i}`} className="flex justify-between items-center relative h-[24px] lg:h-[28px] px-[4px] group cursor-pointer overflow-hidden rounded-sm hover:bg-slate-800/20 transition-colors">
                    <div className="absolute right-0 top-0 bottom-0 bg-[#00C087]/15 transition-all duration-300" style={{ width: `${Math.random() * 80 + 20}%` }} />
                    <span className="text-[#00C087] text-[12px] lg:text-[13px] relative z-10 font-mono">{bid.price}</span>
                    <span className="text-[#CBD5E1] text-[11px] lg:text-[12px] relative z-10 font-mono">{bid.vol}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

// ----------------------------------------------------
// VIP FIX: MAIN EXPORT (Suspense Wrapper)
// ----------------------------------------------------
export default function SpotTradeScreen() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F172A] text-emerald-500">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Syncing Market Data...</p>
      </div>
    }>
      <SpotTradeScreenContent />
    </Suspense>
  );
}