"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PiggyBank, Timer, ActivitySquare, HelpCircle, 
  ArrowDownToLine, ArrowUpFromLine, HeadphonesIcon, 
  TrendingUp, TrendingDown, Loader2, Gem
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Supabase Setup
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type MarketTab = 'crypto' | 'forex' | 'metal';

// Helper: Format Price
const formatPrice = (price: number, type: string) => {
  if (type === 'crypto' && price < 1) return price.toFixed(4);
  if (type === 'forex') return price.toFixed(5);
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
};

// Helper: Logos (From Marketing Screen)
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

// Banners
const banners = [
  { id: 1, title: "VIP Trading League", desc: "Win up to $10,000 in virtual prizes", bg: "from-emerald-600 via-teal-700 to-cyan-800" },
  { id: 2, title: "Zero Fee Deposit", desc: "Limited time offer for new accounts", bg: "from-blue-600 via-indigo-700 to-purple-800" },
  { id: 3, title: "Gold (XAU/USD) Surge", desc: "Trade metals with 100x leverage", bg: "from-amber-500 via-orange-600 to-red-700" },
  { id: 4, title: "Bitcast Revolution", desc: "AI-powered Bitcoin trading options", bg: "from-violet-600 via-purple-700 to-pink-800" },
  { id: 5, title: "Forex Mastery", desc: "Learn currency trading risk-free", bg: "from-green-500 via-emerald-600 to-teal-700" },
  { id: 6, title: "Crypto Futures", desc: "High leverage on top cryptocurrencies", bg: "from-yellow-500 via-amber-600 to-orange-700" },
  { id: 7, title: "24/7 Support", desc: "Premium assistance anytime", bg: "from-cyan-500 via-blue-600 to-indigo-700" },
  { id: 8, title: "Virtual Profits", desc: "Practice trading with real strategies", bg: "from-rose-500 via-pink-600 to-purple-700" },
];

export default function DashboardHome() {
  const router = useRouter();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [activeTab, setActiveTab] = useState<MarketTab>('crypto');
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Banner images (use the three images in public/)
  const bannerImages = ['/banner1.jpeg', '/banner2.jpeg', '/banner3.jpeg'];

  // Auto-scroll logic for banners (cycle through images)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Supabase Real-time Fetch & Subscribe
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data } = await supabase
          .from('users')
          .select('profile_image_url')
          .eq('id', authUser.id)
          .single();
        setUser(data);
      }
    };

    const fetchAssets = async () => {
      const { data } = await supabase
        .from('assets')
        .select('*')
        .eq('is_active', true)
        .order('live_price', { ascending: false });

      if (data) {
        const formattedData = data.map(item => ({ 
          ...item, 
          isUp: true,
          liveChange: "0.00" 
        }));
        setAssets(formattedData);
      }
      setIsLoading(false);
    };

    fetchUser();
    fetchAssets();

    const channel = supabase
      .channel('public:assets_dashboard')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'assets' }, (payload) => {
        setAssets((currentAssets) =>
          currentAssets.map((asset) => {
            if (asset.symbol === payload.new.symbol) {
              const oldPrice = asset.live_price;
              const newPrice = payload.new.live_price;
              const isUp = newPrice >= oldPrice;
              const diff = newPrice - oldPrice;
              const percentChange = oldPrice > 0 ? ((diff / oldPrice) * 100).toFixed(3) : "0.00";
              
              return { ...asset, live_price: newPrice, isUp, liveChange: diff !== 0 ? percentChange : asset.liveChange };
            }
            return asset;
          })
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const quickActions = [
    { name: "Deposit", icon: ArrowDownToLine, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { name: "Withdraw", icon: ArrowUpFromLine, color: "text-rose-400", bg: "bg-rose-400/10" },
    { name: "Bitcast", icon: Timer, color: "text-blue-400", bg: "bg-blue-400/10" },
    { name: "Activity", icon: ActivitySquare, color: "text-purple-400", bg: "bg-purple-400/10" },
    { name: "FAQ", icon: HelpCircle, color: "text-slate-400", bg: "bg-slate-400/10" },
    { name: "Support", icon: HeadphonesIcon, color: "text-cyan-400", bg: "bg-cyan-400/10" },
  ];

  // Filters
  const currentTabData = assets.filter(item => item.asset_type === activeTab);
  
  // Mixed Top Cards: 1 Crypto, 1 Forex, 1 Metal
  const topAssets = [
    ...assets.filter(a => a.asset_type === 'crypto').slice(0, 1),
    ...assets.filter(a => a.asset_type === 'forex').slice(0, 1),
    ...assets.filter(a => a.asset_type === 'metal').slice(0, 1),
  ];

  return (
    <div className="pt-6 px-4 lg:px-8 pb-24 lg:pb-6 font-sans w-full relative">
      
      {/* 1. Header Area */}
      <div className="flex justify-between items-center mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight">Nex<span className="text-emerald-400">Terminal</span></h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Virtual Trading Engine</p>
        </div>
        <button 
          onClick={() => router.push('/dashboard/profile')}
          className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden active:scale-95 transition-transform"
        >
          {user?.profile_image_url ? (
            <img 
              src={user.profile_image_url} 
              alt="Profile" 
              className="h-full w-full object-cover"
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
          ) : (
            <UserIconPlaceholder />
          )}
        </button>
      </div>

      {/* 2. Desktop Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Left Column: Banners & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Auto-Scrolling Promo Banners */}
          <div className="relative w-full h-36 lg:h-44 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-900/10 border border-slate-800">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentBanner}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="absolute inset-0"
              >
                <img
                  src={bannerImages[currentBanner]}
                  alt={`Banner ${currentBanner + 1}`}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {bannerImages.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${currentBanner === idx ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
                />
              ))}
            </div>
          </div>

          {/* VIP Quick Actions Menu */}
          <div className="bg-[#09090b]/80 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-4 lg:p-6">
            <div className="grid grid-cols-4 lg:grid-cols-6 gap-y-4 gap-x-2 lg:gap-4">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                const content = (
                  <div className="flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform">
                    <div className={`h-12 lg:h-14 w-12 lg:w-14 rounded-2xl ${action.bg} flex items-center justify-center border border-white/5`}>
                      <Icon size={22} className={action.color} strokeWidth={2} />
                    </div>
                    <span className="text-[9px] lg:text-[8px] font-bold text-slate-400 uppercase tracking-wider text-center">{action.name}</span>
                  </div>
                );
                if (action.name === 'Deposit') {
                  return <Link key={idx} href="/dashboard/deposit">{content}</Link>;
                } else if (action.name === 'Withdraw') {
                  return <Link key={idx} href="/dashboard/withdraw">{content}</Link>;
                } else if (action.name === 'Bitcast') {
                  return <Link key={idx} href="/trade?market=Bitcast">{content}</Link>;
                } else if (action.name === 'FAQ') {
                  return <Link key={idx} href="/dashboard/faq">{content}</Link>;
                } else if (action.name === 'Support') {
                  return <Link key={idx} href="/dashboard/support">{content}</Link>;
                } else if (action.name === 'Activity') {
                  return <Link key={idx} href="/dashboard/activity">{content}</Link>;
                } else {
                  return <div key={idx}>{content}</div>;
                }
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Top Assets Highlights (Desktop Only) */}
        <div className="hidden lg:block">
          {isLoading ? (
            <div className="w-full flex justify-center py-6 text-emerald-500">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 px-2">Top Assets</h3>
              {topAssets.map((asset, idx) => {
                const iconUrl = getAssetIcon(asset.symbol, asset.asset_type);
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[#09090b]/80 backdrop-blur-xl border border-slate-800/60 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden">
                        {iconUrl ? (
                          <img 
                            src={iconUrl} 
                            alt={asset.symbol} 
                            className="h-full w-full object-cover p-1"
                            onError={(e) => (e.currentTarget.style.display = 'none')} 
                          />
                        ) : (
                          <Gem className="text-amber-500" size={12} />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-300">{asset.symbol}</p>
                        <p className={`text-[10px] font-black ${asset.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {asset.isUp ? <TrendingUp size={8} className="inline mr-1"/> : <TrendingDown size={8} className="inline mr-1"/>}
                          {asset.liveChange}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-emerald-400">{formatPrice(asset.live_price, asset.asset_type)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. Top 3 Small Highlights (Mobile Only) */}
      <div className="mb-6 lg:hidden">
        {isLoading ? (
            <div className="w-full flex justify-center py-6 text-emerald-500">
                <Loader2 className="animate-spin" size={24} />
            </div>
        ) : (
            <div className="grid grid-cols-3 gap-2">
              {topAssets.map((asset, idx) => {
                const iconUrl = getAssetIcon(asset.symbol, asset.asset_type);
                return (
                  <div key={idx} className="flex flex-col items-center justify-center p-2 bg-[#09090b]/80 backdrop-blur-xl border border-slate-800/60 rounded-xl shadow-sm">
                    <div className="h-7 w-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden mb-1.5">
                      {iconUrl ? (
                        <img 
                          src={iconUrl} 
                          alt={asset.symbol} 
                          className="h-full w-full object-cover p-1"
                          onError={(e) => (e.currentTarget.style.display = 'none')} 
                        />
                      ) : (
                        <Gem className="text-amber-500" size={12} />
                      )}
                    </div>
                    
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide truncate w-full text-center">
                      {asset.symbol.replace('USDT', '')}
                    </div>
                    
                    <motion.div 
                      key={asset.live_price}
                      initial={{ color: asset.isUp ? "#10b981" : "#f43f5e" }}
                      animate={{ color: asset.isUp ? "#34d399" : "#fb7185" }} 
                      transition={{ duration: 1.5 }}
                      className="text-[10px] font-black w-full text-center truncate mt-0.5"
                    >
                      {formatPrice(asset.live_price, asset.asset_type)}
                    </motion.div>
                    
                    <div className={`text-[8px] font-bold flex items-center mt-1 ${asset.isUp ? "text-emerald-500" : "text-rose-500"}`}>
                      {asset.isUp ? <TrendingUp size={8} className="mr-0.5"/> : <TrendingDown size={8} className="mr-0.5"/>}
                      {asset.liveChange}%
                    </div>
                  </div>
                );
              })}
            </div>
        )}
      </div>

      {/* 5. Market Rates List with Tabs */}
      <div className="bg-[#09090b]/80 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-1 mb-6">
        
        {/* Tabs */}
        <div className="flex bg-slate-900/50 rounded-2xl p-1 mb-2">
          {([ {id: 'crypto', label: 'Crypto'}, {id: 'forex', label: 'Forex'}, {id: 'metal', label: 'Metals'} ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as MarketTab)}
              className={`flex-1 py-2.5 text-[10px] lg:text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${
                activeTab === tab.id 
                  ? "bg-slate-800 text-white shadow-md" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List Header */}
        <div className="flex justify-between px-4 py-2 text-[9px] lg:text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          <span>Asset Pair</span>
          <div className="flex gap-10">
            <span>Last Price</span>
            <span>24h Chg</span>
          </div>
        </div>

        {/* List Content */}
        <div className="px-2 pb-2 min-h-[150px] lg:min-h-[300px] max-h-[500px] overflow-y-auto">
          {isLoading ? (
              <div className="flex justify-center items-center h-full py-10 text-emerald-500">
                  <Loader2 className="animate-spin" size={24} />
              </div>
          ) : (
              <AnimatePresence mode="wait">
                <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                >
                {currentTabData.map((item, idx) => {
                  const listIconUrl = getAssetIcon(item.symbol, item.asset_type);
                  return (
                    <div key={idx} className="flex justify-between items-center p-3 lg:p-4 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                         {/* List Logo */}
                         <div className="h-8 w-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                            {listIconUrl ? (
                              <img src={listIconUrl} alt={item.symbol} className="h-full w-full object-cover p-1.5" onError={(e) => (e.currentTarget.style.display = 'none')} />
                            ) : (
                              <Gem className="text-amber-500" size={14} />
                            )}
                         </div>
                         <div className="font-bold text-sm text-slate-200 group-hover:text-white transition-colors">
                            {item.symbol}
                         </div>
                      </div>
                      <div className="flex items-center gap-6">
                          <motion.div 
                          key={item.live_price}
                          initial={{ color: item.isUp ? "#10b981" : "#f43f5e" }}
                          animate={{ color: "#cbd5e1" }} 
                          transition={{ duration: 1.5 }}
                          className="font-bold text-sm text-right w-20"
                          >
                          {formatPrice(item.live_price, item.asset_type)}
                          </motion.div>
                          <div className={`w-16 py-1.5 rounded-lg text-center text-xs font-black ${
                          item.isUp ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                          }`}>
                          {item.isUp && item.liveChange !== "0.00" ? "+" : ""}{item.liveChange}%
                          </div>
                      </div>
                    </div>
                  );
                })}
                </motion.div>
            </AnimatePresence>
          )}
        </div>
        
      </div>
    </div>
  );
}

const UserIconPlaceholder = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);