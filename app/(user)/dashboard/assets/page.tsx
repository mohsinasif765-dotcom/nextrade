"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowUpCircle, ArrowDownCircle, PieChart, Gem, Clock, Info, Loader2, Search 
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type AssetTab = 'Spot' | 'Contract';

// Dynamic Icon Helper
const getAssetIcon = (symbol: string) => {
  const cleanSymbol = symbol.replace('USDT', '').replace('/', '').toLowerCase();
  return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${cleanSymbol}.png`;
};

export default function AssetsScreen() {
  const [activeTab, setActiveTab] = useState<AssetTab>('Spot');
  const [assetData, setAssetData] = useState<any>(null);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const fetchAllAssets = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        // Fetch User Portfolio via RPC
        const { data, error } = await supabase.rpc('get_user_assets_v1', { 
          p_user_id: user.id 
        });

        if (error) throw error;
        
        if (mounted) {
          setAssetData(data);
          
          // Initial live prices set karna taake flash na ho
          if (data?.spot_assets) {
            const initialPrices: Record<string, number> = {};
            data.spot_assets.forEach((coin: any) => {
              const symbol = coin.coin_symbol || coin.symbol;
              initialPrices[symbol] = Number(coin.live_price || 0);
            });
            setLivePrices(initialPrices);
          }
        }

      } catch (err) {
        console.error("RPC Fetch Error:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchAllAssets();

    // SUPABASE REALTIME SUBSCRIPTION FOR LIVE WALLET UPDATES
    // Ye tab hit hoga jab DB mein cron/worker price update karega
    const channel = supabase
      .channel('public:assets_wallet')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'assets' }, (payload) => {
        if (mounted && payload.new.symbol) {
          // Hum sirf wo symbol check kar rahe hain jismein base coin ka naam ho (e.g. payload.new.symbol = BTCUSDT)
          const newPrice = payload.new.live_price;
          setLivePrices(prev => {
            // Humain check karna hoga ke payload wala symbol hamare user ke kis coin_symbol se match karta hai
            // Usually DB mein 'symbol' = BTCUSDT aur wallet mein 'coin_symbol' = BTCUSDT hota hai
            const symbolToUpdate = payload.new.symbol;
            return {
              ...prev,
              [symbolToUpdate]: newPrice
            };
          });
        }
      })
      .subscribe();

    // Hum bar bar RPC call nahi karain ge warna server overloaded ho jayega
    // Live update ab realtime subscription se hogi

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading && !assetData) {
    return (
      <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#0F172A]">
        <div className="relative flex items-center justify-center">
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-24 h-24 rounded-full bg-yellow-500/20"
          />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-t-yellow-500 border-r-transparent border-b-transparent border-l-transparent rounded-full shadow-[0_0_15px_rgba(252,213,53,0.5)]"
          />
          <div className="absolute font-black text-yellow-500 text-sm tracking-tighter">NEX</div>
        </div>
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]"
        >
          Initializing Secure Gate
        </motion.p>
      </div>
    );
  }

  // --- CALCULATING DYNAMIC WALLET TOTALS ---
  const main_balance = Number(assetData?.main_balance || 0);
  const contract_equity = Number(assetData?.contract_equity || 0);
  const unrealized_pnl = Number(assetData?.unrealized_pnl || 0);
  const spot_assets = assetData?.spot_assets || [];

  // Calculate Spot Equity dynamically based on Real-Time prices
  let dynamic_spot_equity = 0;
  spot_assets.forEach((coin: any) => {
    const symbol = coin.coin_symbol || coin.symbol;
    const balance = Number(coin.balance || 0);
    // Use live realtime price if available, fallback to initial fetched price
    const currentPrice = livePrices[symbol] !== undefined ? livePrices[symbol] : Number(coin.live_price || 0);
    dynamic_spot_equity += balance * currentPrice;
  });

  // Re-calculate Total Equity (Main + Spot + Contract)
  const total_equity = main_balance + dynamic_spot_equity + contract_equity;

  return (
    <div className="flex flex-col min-h-screen bg-[#0F172A] pb-20 selection:bg-yellow-500 selection:text-slate-900">
      
      {/* 1. TOTAL ASSETS HEADER */}
      <div className="p-6 pt-10 bg-gradient-to-b from-slate-800/50 to-transparent">
        <div className="flex items-center gap-2 text-slate-400 mb-2">
          <PieChart size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">Total Assets (USDT)</span>
        </div>
        
        {/* Animated Total Equity */}
        <motion.h1 
          key={total_equity}
          initial={{ color: "#FCD535" }} // Flashes yellow lightly on update
          animate={{ color: "#FFFFFF" }}
          className="text-4xl font-black font-mono tracking-tighter text-white mb-6"
        >
          {total_equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </motion.h1>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-2xl">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Main Balance</p>
            <p className="text-sm font-bold font-mono text-emerald-400">{main_balance.toFixed(2)} USDT</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-2xl">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Contract Avail.</p>
            <p className="text-sm font-bold font-mono text-blue-400">{main_balance.toFixed(2)} USDT</p>
          </div>
        </div>
      </div>

      {/* 2. ACTION BUTTONS */}
      <div className="flex gap-3 px-6 mb-8">
        <button 
          onClick={() => router.push('/dashboard/deposit')}
          className="flex-1 h-12 bg-yellow-500 text-[#0F172A] rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <ArrowUpCircle size={18} /> Deposit
        </button>
        <button 
          onClick={() => router.push('/dashboard/withdraw')}
          className="flex-1 h-12 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform border border-slate-700 hover:bg-slate-700"
        >
          <ArrowDownCircle size={18} /> Withdraw
        </button>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="flex px-6 border-b border-slate-800">
        {(['Spot', 'Contract'] as AssetTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest relative ${activeTab === tab ? 'text-yellow-500' : 'text-slate-500 hover:text-slate-400'}`}
          >
            {tab}
            {activeTab === tab && <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-[2px] bg-yellow-500" />}
          </button>
        ))}
      </div>

      {/* 4. CONTENT AREA */}
      <div className="flex-1 p-6 overflow-y-auto hide-scrollbar">
        <AnimatePresence mode="wait">
          
          {activeTab === 'Spot' && (
            <motion.div key="spot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {spot_assets.length > 0 ? spot_assets.map((coin: any, index: number) => {
                
                const symbol = coin.coin_symbol || coin.symbol;
                const iconUrl = getAssetIcon(symbol);
                const balance = Number(coin.balance || 0);
                
                // VIP Fix: Realtime price from state map
                const livePrice = livePrices[symbol] !== undefined ? livePrices[symbol] : Number(coin.live_price || 0);
                const displayPrice = livePrice < 1 ? livePrice.toFixed(6) : livePrice.toFixed(2);
                
                // Live Market Value Fix
                const valueUsdt = balance * livePrice;

                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-900/30 border border-slate-800/50 rounded-2xl hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center overflow-hidden border border-slate-700 shrink-0">
                        {iconUrl ? (
                           <img 
                             src={iconUrl} 
                             alt={symbol} 
                             className="h-full w-full object-cover p-1.5"
                             onError={(e) => (e.currentTarget.style.display = 'none')} 
                           />
                        ) : (
                           <Gem size={20} className="text-yellow-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white truncate max-w-[100px]">{symbol.replace('USDT', '')}</p>
                        <motion.p 
                           key={displayPrice}
                           initial={{ color: "#FCD535" }}
                           animate={{ color: "#64748b" }}
                           className="text-[10px] font-mono mt-0.5"
                        >
                          Price: ${displayPrice}
                        </motion.p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold font-mono text-sm text-white">
                        {balance.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                      </p>
                      <motion.p 
                        key={valueUsdt}
                        initial={{ color: "#FCD535" }}
                        animate={{ color: "#94a3b8" }}
                        className="text-[10px] font-mono mt-0.5"
                      >
                        ≈ ${valueUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </motion.p>
                    </div>
                  </div>
                );
              }) : (
                <div className="py-20 text-center opacity-30 flex flex-col items-center">
                  <Search size={40} className="mb-3 text-slate-500"/>
                  <p className="text-slate-400 uppercase text-[10px] font-bold tracking-widest">Empty Wallet</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'Contract' && (
            <motion.div key="contract" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 shrink-0">
                    <Gem size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">Contract Equity</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Unrealized PnL</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold font-mono text-sm text-white">
                    {contract_equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                  </p>
                  <p className={`text-[10px] font-mono font-bold mt-0.5 ${unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {unrealized_pnl >= 0 ? '+' : ''}{unrealized_pnl.toFixed(2)} USDT
                  </p>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <style jsx global>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}