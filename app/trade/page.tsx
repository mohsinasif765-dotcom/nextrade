"use client";
import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Home, ChevronDown, Loader2, Search, X, Clock, Gem, ListChecks } from "lucide-react";
import TradingChart from "@/components/TradingChart"; 
import OrderBottomSheet from "@/components/OrderBottomSheet";
import ActivePositions from "@/components/ActivePositions"; 
import TradeHistory from "@/components/TradeHistory"; 
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

// Supabase Setup
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type MarketTab = 'Futures' | 'Leverage' | 'Bitcast' | 'Forex' | 'Spot';
type Timeframe = 'Line' | '1m' | '5m' | '15m' | '30m' | '1h' | '1D';
type AssetType = 'crypto' | 'forex' | 'metal';

// Default assets for Smart Tab Switching
const defaultAssets: Record<MarketTab, { symbol: string, type: AssetType }> = {
  'Futures': { symbol: 'BTCUSDT', type: 'crypto' },
  'Leverage': { symbol: 'ETHUSDT', type: 'crypto' },
  'Bitcast': { symbol: 'BTCUSDT', type: 'crypto' },
  'Forex': { symbol: 'EUR/USD', type: 'forex' },
  'Spot': { symbol: 'SOLUSDT', type: 'crypto' }
};

// Helpers
const formatPrice = (price: number) => {
  if (price < 1) return price.toFixed(4);
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
};

const getAssetIcon = (symbol: string, type: string) => {
  const cleanSymbol = symbol.replace('USDT', '').replace('/', '').toLowerCase();
  if (type === 'crypto') return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${cleanSymbol}.png`;
  if (type === 'forex') {
    const baseCurrency = cleanSymbol.substring(0, 2); 
    const flagMap: Record<string, string> = { 'eu': 'eu', 'gb': 'gb', 'us': 'us', 'jp': 'jp', 'au': 'au', 'ca': 'ca' };
    return `https://flagcdn.com/w80/${flagMap[baseCurrency] || baseCurrency}.png`;
  }
  return null; 
};

// --- BITCAST SPECIFIC OPTIONS ---
const bitcastOptions = [
  { id: 'btc-1m', symbol: 'BTCUSDT', label: 'BTC 1M', timeframe: '1m', type: 'crypto' },
  { id: 'btc-2m', symbol: 'BTCUSDT', label: 'BTC 2M', timeframe: '1m', type: 'crypto' }, 
  { id: 'btc-5m', symbol: 'BTCUSDT', label: 'BTC 5M', timeframe: '5m', type: 'crypto' },
  { id: 'eth-1m', symbol: 'ETHUSDT', label: 'ETH 1M', timeframe: '1m', type: 'crypto' },
  { id: 'eth-5m', symbol: 'ETHUSDT', label: 'ETH 5M', timeframe: '5m', type: 'crypto' },
];

function VIPTradeScreenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL Parameters
  const urlMarket = (searchParams.get('market') as MarketTab) || 'Futures';
  const urlSymbol = searchParams.get('symbol') || 'BTCUSDT';
  const urlType = (searchParams.get('type') as AssetType) || 'crypto';

  // States
  const [activeMarket, setActiveMarket] = useState<MarketTab>(urlMarket);
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('1m');
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);
  
  // Sidebar & All Assets State
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<AssetType>('crypto');
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [adminControlStatus, setAdminControlStatus] = useState<'normal' | 'force_win' | 'force_loss'>('normal');

  // Naya state bottom tabs ke liye
  const [bottomActiveTab, setBottomActiveTab] = useState<'positions' | 'history'>('positions');
  const [refreshPositionsToggle, setRefreshPositionsToggle] = useState(false); // To force refresh

  const marketTabs: MarketTab[] = ['Futures', 'Leverage', 'Bitcast', 'Forex', 'Spot'];
  const timeframes: Timeframe[] = ['Line', '1m', '5m', '15m', '30m', '1h', '1D'];

  // Handle Main Market Tab Switch
  const handleTabChange = (tab: MarketTab) => {
    setActiveMarket(tab);
    let targetSymbol = urlSymbol;
    let targetType = urlType;
    const allowedTypes: Record<MarketTab, AssetType[]> = {
      'Futures': ['crypto', 'metal', 'forex'], 
      'Leverage': ['crypto', 'metal', 'forex'],
      'Bitcast': ['crypto'], 
      'Forex': ['forex'],    
      'Spot': ['crypto', 'metal']
    };
    if (!allowedTypes[tab].includes(urlType)) {
      targetSymbol = defaultAssets[tab].symbol;
      targetType = defaultAssets[tab].type;
    }
    router.replace(`?market=${tab}&symbol=${targetSymbol}&type=${targetType}`, { scroll: false });
  };

  const handleSidebarSelect = (symbol: string, type: AssetType, tf?: Timeframe) => {
    let targetMarket = activeMarket;
    if (activeMarket === 'Forex' && type !== 'forex') {
      targetMarket = 'Futures'; setActiveMarket('Futures');
    } else if (activeMarket === 'Bitcast' && type !== 'crypto') {
      targetMarket = 'Leverage'; setActiveMarket('Leverage');
    }
    router.replace(`?market=${targetMarket}&symbol=${symbol}&type=${type}`, { scroll: false });
    if (tf) setActiveTimeframe(tf as Timeframe); 
    setIsSidebarOpen(false);
    setSearchQuery("");
  };

  const openSidebar = () => { setSidebarTab(urlType as AssetType); setIsSidebarOpen(true); };

  const triggerPositionRefresh = () => {
     setRefreshPositionsToggle(prev => !prev);
  }


  useEffect(() => {
    // Auth user check karo taake positions dikhayi ja sakein
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUserId(data.user.id);
    };
    checkUser();

    const fetchAllAssets = async () => {
      setIsLoading(true);
      const { data } = await supabase.from('assets').select('*').eq('is_active', true).order('live_price', { ascending: false });
      if (data) setAllAssets(data.map(item => ({ ...item, isUp: true, liveChange: "0.00" })));
      setIsLoading(false);
    };
    fetchAllAssets();

    const channel = supabase.channel('public:trade_assets_all').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'assets' }, (payload) => {
      setAllAssets((currentAssets) => currentAssets.map((asset) => {
        if (asset.symbol === payload.new.symbol) {
          return { ...asset, live_price: payload.new.live_price, isUp: payload.new.live_price >= asset.live_price };
        }
        return asset;
      }));
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const activeAssetData = allAssets.find(a => a.symbol === urlSymbol) || { live_price: 0, isUp: true, liveChange: "0.00" };
  const simulatedHigh = activeAssetData.live_price > 0 ? formatPrice(activeAssetData.live_price * 1.015) : "0.00";
  const simulatedLow = activeAssetData.live_price > 0 ? formatPrice(activeAssetData.live_price * 0.985) : "0.00";

  const filteredSidebarAssets = allAssets.filter(item => item.asset_type === sidebarTab && item.symbol.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-[100dvh] w-full max-w-md lg:max-w-full mx-auto bg-[#0F172A] text-[#FFFFFF] flex flex-col lg:flex-row font-sans relative">
      
      {/* DESKTOP LEFT SIDEBAR - Asset List */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-[#1E293B] bg-[#0B1120]">
        <div className="p-4 border-b border-[#1E293B]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#FCD535] mb-3">Markets</h3>
          <div className="flex items-center bg-[#1E293B] rounded-lg px-3 py-2">
            <Search size={16} className="text-slate-500 mr-2" />
            <input 
              type="text" 
              placeholder="Search assets..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="bg-transparent outline-none text-xs w-full placeholder-slate-600" 
            />
          </div>
        </div>

        <div className="flex gap-2 px-4 py-3 border-b border-[#1E293B]">
          {(['crypto', 'forex', 'metal'] as AssetType[]).map((t) => (
            <button 
              key={t} 
              onClick={() => setSidebarTab(t)} 
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${sidebarTab === t ? "bg-[#FCD535] text-[#0F172A]" : "bg-[#1E293B] text-slate-400 hover:bg-slate-700"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredSidebarAssets.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-xs">No assets found</div>
          ) : (
            filteredSidebarAssets.map((item) => (
              <div 
                key={item.symbol} 
                onClick={() => handleSidebarSelect(item.symbol, item.asset_type as AssetType)}
                className={`flex items-center justify-between p-3 mx-2 my-1.5 rounded-lg cursor-pointer transition-all ${
                  urlSymbol === item.symbol 
                    ? "bg-[#FCD535]/10 border border-[#FCD535] shadow-lg shadow-[#FCD535]/20" 
                    : "hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0 border border-slate-700">
                    {getAssetIcon(item.symbol, item.asset_type) ? (
                      <img src={getAssetIcon(item.symbol, item.asset_type)!} className="h-full w-full object-cover p-0.5" alt={item.symbol} />
                    ) : (
                      <Gem size={14} className="text-amber-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold leading-tight truncate">{item.symbol.replace('USDT', '')}</p>
                    <p className="text-[8px] text-slate-500 uppercase">{item.asset_type}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className={`text-xs font-bold font-mono ${item.isUp ? "text-[#00C087]" : "text-[#F6465D]"}`}>
                    {formatPrice(item.live_price)}
                  </p>
                  <p className={`text-[8px] font-bold ${item.isUp ? "text-[#00C087]" : "text-[#F6465D]"}`}>
                    {item.liveChange}%
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 1. HEADER */}
        <header className="shrink-0 h-[60px] px-[16px] lg:px-[24px] flex items-center justify-between border-b border-[#1E293B]">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => router.back()} className="mr-[12px] active:scale-90 transition-transform shrink-0">
              <ArrowLeft size={22} className="text-[#FFFFFF]" />
            </button>
            <button 
              onClick={openSidebar} 
              className="lg:hidden flex items-center gap-1.5 active:scale-95 transition-transform hover:opacity-80 bg-slate-800/50 py-1 px-2 rounded-lg shrink-0"
            >
              <h1 className="text-[18px] font-[600] text-[#FFFFFF]">{urlSymbol.replace('USDT', '/USDT')}</h1>
              <ChevronDown size={18} className="text-[#94A3B8]" />
            </button>
            <h1 className="hidden lg:block text-[22px] font-[700] text-[#FFFFFF]">{urlSymbol.replace('USDT', '/USDT')}</h1>
          </div>
          <div className="flex items-center gap-[16px] text-[#94A3B8]">
            <button onClick={openSidebar} className="lg:hidden hover:text-[#FFFFFF] transition-colors active:scale-90" title="Open markets">
              <Search size={20} />
            </button>
            <button onClick={() => router.push('/')} className="hover:text-[#FFFFFF] transition-colors active:scale-90">
              <Home size={20} />
            </button>
          </div>
        </header>

        {/* 2. MARKET TABS */}
        <div className="shrink-0 h-[44px] flex border-b border-[#1E293B] overflow-x-auto lg:overflow-x-visible hide-scrollbar bg-[#0F172A]">
          {marketTabs.map((tab) => (
            <button 
              key={tab} 
              onClick={() => handleTabChange(tab)} 
              className={`min-w-[80px] lg:min-w-[100px] flex-1 flex justify-center items-center text-[14px] font-medium relative transition-colors ${
                activeMarket === tab ? "text-[#FCD535]" : "text-[#94A3B8] hover:text-white"
              }`}
            >
              {tab}
              {activeMarket === tab && <motion.div layoutId="marketTabIndicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FCD535]" />}
            </button>
          ))}
        </div>

        {/* 3. PRICE SECTION - Enhanced for Desktop */}
        <div className="shrink-0 h-[80px] lg:h-[100px] px-[16px] lg:px-[24px] py-[10px] flex justify-between items-center bg-[#0F172A] border-b border-[#1E293B]">
          {isLoading || activeAssetData.live_price === 0 ? (
            <div className="w-full flex items-center justify-center text-[#FCD535]"><Loader2 className="animate-spin" size={24} /></div>
          ) : (
            <>
              <div className="w-full lg:w-[50%] flex flex-col justify-center gap-2">
                <motion.div 
                  key={activeAssetData.live_price} 
                  initial={{ scale: 0.95 }} 
                  animate={{ scale: 1 }} 
                  className={`text-[28px] lg:text-[36px] font-[700] tracking-tight flex items-center gap-2 font-mono ${
                    activeAssetData.isUp ? 'text-[#00C087]' : 'text-[#F6465D]'
                  }`}
                >
                  {formatPrice(activeAssetData.live_price)}
                </motion.div>
                <div className={`text-[13px] lg:text-[15px] font-medium ${activeAssetData.isUp ? 'text-[#00C087]' : 'text-[#F6465D]'}`}>
                  ≈ ${(activeAssetData.live_price).toFixed(2)}
                </div>
              </div>
              <div className="hidden lg:flex w-[50%] flex-row justify-end gap-8">
                <div className="flex flex-col items-end gap-2">
                  <div className="text-[12px] text-[#94A3B8] font-medium">24h High</div>
                  <div className="text-[18px] font-bold text-[#FFFFFF]">{simulatedHigh}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-[12px] text-[#94A3B8] font-medium">24h Low</div>
                  <div className="text-[18px] font-bold text-[#FFFFFF]">{simulatedLow}</div>
                </div>
              </div>
              <div className="lg:hidden flex flex-col justify-center items-end text-[11px] text-[#94A3B8] gap-1">
                <div className="flex justify-between w-full max-w-[100px]"><span>High</span> <span className="text-[#FFFFFF]">{simulatedHigh}</span></div>
                <div className="flex justify-between w-full max-w-[100px]"><span>Low</span> <span className="text-[#FFFFFF]">{simulatedLow}</span></div>
              </div>
            </>
          )}
        </div>

        {/* 4. CHART AREA - Larger on Desktop */}
        <div className="shrink-0 h-[300px] lg:h-[450px] bg-[#0F172A] p-[8px] lg:p-[12px] flex flex-col relative border-b border-[#1E293B] pb-[80px]">
          <div className="shrink-0 h-[30px] flex items-center gap-4 overflow-x-auto hide-scrollbar mb-[4px]">
            {timeframes.map((tf) => (
              <button 
                key={tf} 
                onClick={() => setActiveTimeframe(tf)} 
                className={`text-[12px] lg:text-[13px] font-medium transition-colors ${
                  activeTimeframe === tf ? "text-[#FCD535]" : "text-[#94A3B8] hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          <div className="flex-1 w-full rounded-lg overflow-hidden relative">
            <TradingChart 
              symbol={urlSymbol} 
              assetType={urlType as any} 
              activeTimeframe={activeTimeframe} 
              currentLivePrice={activeAssetData.live_price} 
            />
          </div>
        </div>

        {/* 5. POSITIONS & PNL SECTION - Mobile Only */}
        <div className="flex-1 flex flex-col bg-[#0B1120] overflow-hidden lg:hidden">
<div className="flex items-center px-4 lg:px-6 border-b border-[#1E293B] shrink-0 space-x-8 lg:hidden">
            <button 
              onClick={() => setBottomActiveTab('positions')} 
              className={`py-4 text-[12px] lg:text-[13px] font-bold uppercase tracking-wider relative transition-colors ${
                bottomActiveTab === 'positions' ? 'text-[#FCD535]' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <ListChecks size={18} />
                Positions
              </div>
              {bottomActiveTab === 'positions' && <motion.div layoutId="btmTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FCD535]" />}
            </button>
            <button 
              onClick={() => setBottomActiveTab('history')} 
              className={`py-4 text-[12px] lg:text-[13px] font-bold uppercase tracking-wider relative transition-colors ${
                bottomActiveTab === 'history' ? 'text-[#FCD535]' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock size={18} />
                Order History
              </div>
              {bottomActiveTab === 'history' && <motion.div layoutId="btmTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FCD535]" />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto hide-scrollbar p-3 lg:p-6">
          {bottomActiveTab === 'positions' ? (
            <ActivePositions 
              userId={userId || ''} 
              livePrice={activeAssetData.live_price} 
              marketType={activeMarket} 
              allAssets={allAssets} 
              onPositionClosed={triggerPositionRefresh} // trigger refresh
              refreshTrigger={refreshPositionsToggle} // Pass toggle state
            />
          ) : (
            <TradeHistory 
              userId={userId || ''} 
              marketType={activeMarket}
            />
          )}
          </div>
        </div>

        {/* 6. ACTION BUTTONS (Sticky Bottom) */}
        <div className="shrink-0 sticky bottom-0 bg-[#1E293B] border-t border-[#334155] p-[16px] lg:p-[24px] pb-safe z-50">
          <div className="grid grid-cols-2 gap-[12px] lg:gap-[16px]">
            {activeMarket === 'Spot' ? (
              <>
                <button 
                  onClick={() => router.push(`/dashboard/spot?symbol=${urlSymbol}&side=Buy`)} 
                  className="h-[50px] lg:h-[56px] bg-[#00C087] rounded-[12px] text-[15px] lg:text-[16px] font-[700] text-white active:scale-95 transition-transform hover:bg-[#00B878]"
                >
                  BUY
                </button>
                <button 
                  onClick={() => router.push(`/dashboard/spot?symbol=${urlSymbol}&side=Sell`)} 
                  className="h-[50px] lg:h-[56px] bg-[#F6465D] rounded-[12px] text-[15px] lg:text-[16px] font-[700] text-white active:scale-95 transition-transform hover:bg-[#E63A52]"
                >
                  SELL
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setIsOrderPanelOpen(true)} 
                  className="h-[50px] lg:h-[56px] bg-[#00C087] rounded-[12px] text-[15px] lg:text-[16px] font-[700] text-white active:scale-95 transition-transform hover:bg-[#00B878]"
                >
                  {activeMarket === 'Bitcast' ? 'CALL' : 'OPEN LONG'}
                </button>
                <button 
                  onClick={() => setIsOrderPanelOpen(true)} 
                  className="h-[50px] lg:h-[56px] bg-[#F6465D] rounded-[12px] text-[15px] lg:text-[16px] font-[700] text-white active:scale-95 transition-transform hover:bg-[#E63A52]"
                >
                  {activeMarket === 'Bitcast' ? 'PUT' : 'OPEN SHORT'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* DESKTOP RIGHT SIDEBAR - Positions & History */}
      <div className="hidden lg:flex lg:w-80 lg:flex-col bg-[#0B1120] border-l border-[#1E293B]">
        <div className="flex items-center px-4 lg:px-6 border-b border-[#1E293B] shrink-0 space-x-8">
          <button 
            onClick={() => setBottomActiveTab('positions')} 
            className={`py-4 text-[12px] lg:text-[13px] font-bold uppercase tracking-wider relative transition-colors ${
              bottomActiveTab === 'positions' ? 'text-[#FCD535]' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <ListChecks size={18} />
              Positions
            </div>
            {bottomActiveTab === 'positions' && <motion.div layoutId="btmTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FCD535]" />}
          </button>
          <button 
            onClick={() => setBottomActiveTab('history')} 
            className={`py-4 text-[12px] lg:text-[13px] font-bold uppercase tracking-wider relative transition-colors ${
              bottomActiveTab === 'history' ? 'text-[#FCD535]' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock size={18} />
              Order History
            </div>
            {bottomActiveTab === 'history' && <motion.div layoutId="btmTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FCD535]" />}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto hide-scrollbar p-3 lg:p-6">
          {bottomActiveTab === 'positions' ? (
            <ActivePositions 
              userId={userId || ''} 
              livePrice={activeAssetData.live_price} 
              marketType={activeMarket} 
              allAssets={allAssets} 
              onPositionClosed={triggerPositionRefresh} // trigger refresh
              refreshTrigger={refreshPositionsToggle} // Pass toggle state
            />
          ) : (
            <TradeHistory 
              userId={userId || ''} 
              marketType={activeMarket}
            />
          )}
        </div>
      </div>

      <OrderBottomSheet 
        isOpen={isOrderPanelOpen} 
        onClose={() => setIsOrderPanelOpen(false)} 
        currentPrice={formatPrice(activeAssetData.live_price)} 
        symbol={urlSymbol} 
        marketType={activeMarket} 
        activeTimeframe={activeTimeframe} 
        onOrderPlaced={triggerPositionRefresh} // Ensure positions refresh immediately after order
      />

      {/* 7. MOBILE MARKET SHEET (Mobile Only) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsSidebarOpen(false)} 
              className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }} 
              className="absolute bottom-0 left-0 right-0 h-[60%] bg-[#0B1120] z-50 shadow-2xl flex flex-col border-t border-[#1E293B] lg:hidden"
            >
              <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
                <h2 className="text-lg font-bold">Select Market</h2>
                <X size={20} onClick={() => setIsSidebarOpen(false)} className="text-slate-400 cursor-pointer" />
              </div>
              <div className="p-4">
                <div className="flex items-center bg-[#1E293B] rounded-xl px-3 py-2">
                  <Search size={16} className="text-slate-500 mr-2" />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="bg-transparent outline-none text-sm w-full" 
                  />
                </div>
              </div>
              <div className="flex px-4 gap-2 mb-2">
                {(['crypto', 'forex', 'metal'] as AssetType[]).map((t) => (
                  <button 
                    key={t} 
                    onClick={() => setSidebarTab(t)} 
                    className={`flex-1 py-1.5 text-[11px] font-bold uppercase rounded-lg transition-all ${
                      sidebarTab === t ? "bg-[#FCD535] text-[#0F172A]" : "bg-[#1E293B] text-slate-400"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {filteredSidebarAssets.map((item) => (
                  <div 
                    key={item.symbol} 
                    onClick={() => handleSidebarSelect(item.symbol, item.asset_type as AssetType)} 
                    className={`flex items-center justify-between p-3 mb-1 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-all ${
                      urlSymbol === item.symbol ? "bg-[#FCD535]/5 border border-[#FCD535]/30" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                        {getAssetIcon(item.symbol, item.asset_type) ? (
                          <img src={getAssetIcon(item.symbol, item.asset_type)!} className="h-full w-full object-cover p-1" alt={item.symbol} />
                        ) : (
                          <Gem size={14} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-tight">{item.symbol.replace('USDT', '')}</p>
                        <p className="text-[9px] text-slate-500 uppercase">{item.asset_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold font-mono ${item.isUp ? "text-[#00C087]" : "text-[#F6465D]"}`}>
                        {formatPrice(item.live_price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}

// ----------------------------------------------------
// VIP FIX: MAIN EXPORT (Suspense Wrapper)
// ----------------------------------------------------
export default function VIPTradeScreen() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F172A] text-[#FCD535]">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Loading Trade Terminal...</p>
      </div>
    }>
      <VIPTradeScreenContent />
    </Suspense>
  );
}