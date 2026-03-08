"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Activity, Bitcoin, DollarSign, Gem, Loader2, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

// Supabase Setup
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type MarketTab = 'crypto' | 'forex' | 'metal';

// Helper: Asset Names
const getAssetName = (symbol: string) => {
  const names: Record<string, string> = {
    'BTCUSDT': 'Bitcoin', 'ETHUSDT': 'Ethereum', 'BNBUSDT': 'Binance Coin',
    'SOLUSDT': 'Solana', 'XRPUSDT': 'Ripple', 'ADAUSDT': 'Cardano',
    'DOGEUSDT': 'Dogecoin', 'EUR/USD': 'Euro / US Dollar',
    'GBP/USD': 'British Pound / USD', 'USD/JPY': 'US Dollar / Yen',
    'XAU/USD': 'Gold Spot', 'XAG/USD': 'Silver Spot'
  };
  return names[symbol] || symbol;
};

// Helper: Actual Icons Logic
const getAssetIcon = (symbol: string, type: string) => {
  const cleanSymbol = symbol.replace('USDT', '').replace('/', '').toLowerCase();
  
  if (type === 'crypto') {
    return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${cleanSymbol}.png`;
  }
  if (type === 'forex') {
    const baseCurrency = cleanSymbol.substring(0, 2); 
    const flagMap: Record<string, string> = { 'eu': 'eu', 'gb': 'gb', 'us': 'us', 'jp': 'jp', 'au': 'au', 'ca': 'ca' };
    return `https://flagcdn.com/w80/${flagMap[baseCurrency] || baseCurrency}.png`;
  }
  return null; 
};

const formatPrice = (price: number, type: string) => {
  if (type === 'crypto' && price < 1) return price.toFixed(6); // VIP Fix: Better precision for small coins
  if (type === 'forex') return price.toFixed(5);
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
};

export default function MarketsPage() {
  const router = useRouter(); 
  const [activeTab, setActiveTab] = useState<MarketTab>('crypto');
  const [searchQuery, setSearchQuery] = useState("");
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Binance WebSocket Reference
  const wsRef = useRef<WebSocket | null>(null);

  const tabs = [
    { id: 'crypto', label: 'Crypto', icon: Bitcoin, color: 'from-emerald-400 to-cyan-500', shadow: 'shadow-emerald-500/20' },
    { id: 'forex', label: 'Forex', icon: DollarSign, color: 'from-blue-400 to-indigo-500', shadow: 'shadow-blue-500/20' },
    { id: 'metal', label: 'Metals', icon: Gem, color: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-500/20' },
  ];

  useEffect(() => {
    let mounted = true;

    const fetchAssetsAndSetupStreams = async () => {
      // 1. Fetch initial data from Supabase
      const { data } = await supabase
        .from('assets')
        .select('*')
        .eq('is_active', true)
        .order('live_price', { ascending: false });

      if (data && mounted) {
        const formattedData = data.map(item => ({ 
          ...item, 
          isUp: true,
          liveChange: "0.00" 
        }));
        setAssets(formattedData);
        setIsLoading(false);

        // 2. Setup Binance WebSocket for Crypto
        const cryptoAssets = data.filter(a => a.asset_type === 'crypto');
        if (cryptoAssets.length > 0) {
          // Binance expects lowercase symbols without slashes for its streams
          const streams = cryptoAssets.map(a => `${a.symbol.toLowerCase()}@ticker`).join('/');
          const wsUrl = `wss://stream.binance.com:9443/ws/${streams}`;
          
          wsRef.current = new WebSocket(wsUrl);
          
          wsRef.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message && message.s && message.c && message.P) {
              const symbol = message.s; // e.g. BTCUSDT
              const livePrice = parseFloat(message.c); // Current price
              const priceChangePercent = parseFloat(message.P).toFixed(4); // 24hr change percent - 4 decimal places
              
              setAssets(prevAssets => prevAssets.map(asset => {
                if (asset.symbol === symbol) {
                  return {
                    ...asset,
                    live_price: livePrice,
                    isUp: parseFloat(priceChangePercent) >= 0,
                    liveChange: priceChangePercent
                  };
                }
                return asset;
              }));
            }
          };

          wsRef.current.onerror = (error) => {
            console.error("Binance WebSocket Error:", error);
          };
        }
      }
    };

    fetchAssetsAndSetupStreams();

    // 3. Keep Supabase realtime for Forex and Metals
    const channel = supabase
      .channel('public:assets')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'assets' }, (payload) => {
        setAssets((currentAssets) =>
          currentAssets.map((asset) => {
            // Sirf tab update karein database se agar wo crypto nahi hai (Kyunke crypto binance se aa raha hai)
            if (asset.symbol === payload.new.symbol && asset.asset_type !== 'crypto') {
              const oldPrice = asset.live_price;
              const newPrice = payload.new.live_price;
              const isUp = newPrice >= oldPrice;
              const diff = newPrice - oldPrice;
              const percentChange = oldPrice > 0 ? ((diff / oldPrice) * 100).toFixed(4) : "0.00";
              
              return { ...asset, live_price: newPrice, isUp, liveChange: diff !== 0 ? percentChange : asset.liveChange };
            }
            return asset;
          })
        );
      })
      .subscribe();

    return () => { 
      mounted = false;
      supabase.removeChannel(channel); 
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const currentData = assets.filter(item => 
    item.asset_type === activeTab &&
    (item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
     getAssetName(item.symbol).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // SMART ROUTING LOGIC: Asset type ke hisab se default trade tab set karna
  const handleAssetClick = (symbol: string, type: string) => {
    let targetMarketTab = 'Futures'; // Crypto ke liye default Futures rakha hai (Bitcast ya Spot par user wahan ja kar click kar lega)
    
    if (type === 'forex') {
      targetMarketTab = 'Forex';
    } else if (type === 'metal') {
      targetMarketTab = 'Spot'; // Metals ko Spot ya Futures par map kar sakte ho, maine Spot kar diya
    }

    router.push(`/trade?market=${targetMarketTab}&symbol=${symbol}&type=${type}`);
  };

  return (
    <div className="min-h-screen bg-[#020617] pt-6 px-4 pb-32 font-sans relative overflow-x-hidden">
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[300px] bg-emerald-900/20 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 mb-8 flex items-center gap-4">
        <button 
          onClick={() => router.push('/dashboard')} 
          className="h-10 w-10 bg-[#09090b]/80 backdrop-blur-xl border border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
            Markets
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Real-time Trading Pairs</p>
        </div>
      </div>

      <div className="relative z-10 mb-6">
        <div className="relative flex items-center bg-[#09090b]/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-1">
          <div className="pl-4 pr-2 text-slate-500"><Search size={18} /></div>
          <input 
            type="text" 
            placeholder="Search assets..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-sm text-white py-3 outline-none"
          />
        </div>
      </div>

      <div className="relative z-10 flex gap-2 mb-6 bg-[#09090b]/60 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800/80">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as MarketTab)}
              className={`relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                isActive ? "text-slate-950" : "text-slate-500"
              }`}
            >
              {isActive && (
                <motion.div layoutId="market-tab-active" className={`absolute inset-0 bg-gradient-to-r ${tab.color} rounded-xl shadow-lg ${tab.shadow}`} />
              )}
              <span className="relative z-20 flex items-center gap-1.5">
                <tab.icon size={14} strokeWidth={3} />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative z-10 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-emerald-500">
            <Loader2 className="animate-spin mb-4" size={32} />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} className="space-y-3">
              {currentData.map((item, idx) => {
                const iconUrl = getAssetIcon(item.symbol, item.asset_type);
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={item.symbol} 
                    onClick={() => handleAssetClick(item.symbol, item.asset_type)}
                    className="relative cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform"
                  >
                    <div className="relative flex items-center justify-between bg-[#09090b]/80 backdrop-blur-xl border border-slate-800/80 p-4 rounded-2xl shadow-xl hover:bg-slate-800/50 transition-colors">
                      
                      <div className="flex items-center gap-3 w-[45%]">
                        <div className="h-10 w-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                          {iconUrl ? (
                            <img 
                              src={iconUrl} 
                              alt={item.symbol} 
                              className="h-full w-full object-cover p-1.5"
                              onError={(e) => (e.currentTarget.style.display = 'none')} 
                            />
                          ) : (
                            <Gem className="text-amber-500" size={18} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-black text-white truncate">{item.symbol.replace('USDT', '')}</h3>
                          <p className="text-[10px] text-slate-500 font-bold truncate">{getAssetName(item.symbol)}</p>
                        </div>
                      </div>

                      <div className="w-[30%] text-right flex flex-col items-end">
                        <motion.span 
                          key={item.live_price} 
                          initial={{ color: item.isUp ? "#10b981" : "#f43f5e" }}
                          animate={{ color: "#e2e8f0" }} 
                          transition={{ duration: 1.5 }}
                          className="text-sm font-mono font-bold"
                        >
                          {item.asset_type === 'crypto' ? '$' : ''}{formatPrice(item.live_price, item.asset_type)}
                        </motion.span>
                      </div>

                      <div className="w-[25%] flex justify-end">
                        <div className={`flex items-center justify-center min-w-[70px] h-[32px] px-2 rounded-lg text-[11px] font-bold font-mono shadow-md transition-colors ${
                          item.isUp ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                        }`}>
                          {item.isUp ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                          {item.isUp && item.liveChange !== "0.00" ? "+" : ""}{item.liveChange}%
                        </div>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}