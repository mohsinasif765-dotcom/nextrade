"use client";
import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Clock, Loader2, AlertCircle, Zap } from "lucide-react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to format price
const formatPrice = (price: any) => {
  const num = parseFloat(price);
  if (isNaN(num)) return '--';
  return num.toFixed(2);
};

interface ActivePositionsProps {
  userId: string;
  livePrice: number; 
  marketType: string;
  allAssets: any[];
  onPositionClosed?: () => void; 
  refreshTrigger?: boolean;      
}

export default function ActivePositions({ 
  userId, 
  livePrice, 
  marketType, 
  allAssets, 
  onPositionClosed, 
  refreshTrigger 
}: ActivePositionsProps) {
  const [trades, setTrades] = useState<any[]>([]);
  const [isClosing, setIsClosing] = useState<string | null>(null);
  
  // VIP FIX: Timer Jumping khatam karne ke liye Heartbeat state
  const [now, setNow] = useState(Date.now());

  // 1. Fetch Open Trades
  const fetchOpenTrades = async () => {
    if (!userId) return;
    let query = supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'open');
    
    if (marketType) {
      query = query.eq('trade_mode', marketType);
    }
    
    const { data } = await query.order('created_at', { ascending: false });
    if (data) setTrades(data);
  };

  useEffect(() => {
    if (!userId) return;

    fetchOpenTrades();

    // Use a unique channel name per instance to avoid "cannot add postgres_changes callbacks... after subscribe()" error
    // which happens when multiple components (e.g. mobile and desktop views) share the same channel name.
    const uniqueId = Math.random().toString(36).substring(7);
    const tradeSub = supabase
      .channel(`live_trades_pos_terminal_${userId}_${uniqueId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'trades', 
        filter: `user_id=eq.${userId}` 
      }, () => fetchOpenTrades())
      .subscribe();

    return () => { 
      supabase.removeChannel(tradeSub); 
    };
  }, [userId, marketType, refreshTrigger]);

  // VIP FIX: Central Heartbeat Timer (Sirf visual update ke liye)
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // VIP FIX: Yahan se autoCloseExpiredTrade ki logic hata di hai
  // Taake ye Main Screen ke timer ke sath conflict na kare.

  const calculateLivePnL = (trade: any): { pnl: string, currentPrice: number } => {
    const margin = Number(trade.margin_amount) || 0;
    const currentAssetPrice = allAssets.find(a => a.symbol === trade.symbol)?.live_price || livePrice;
    
    if (trade.trade_mode === 'Bitcast') {
      const isWin = (trade.trade_direction === 'call' || trade.trade_direction === 'long') 
        ? currentAssetPrice > trade.entry_price 
        : currentAssetPrice < trade.entry_price;
      
      const potentialProfit = margin * (Number(trade.leverage) / 100);
      return { pnl: isWin ? potentialProfit.toFixed(2) : (-margin).toFixed(2), currentPrice: currentAssetPrice };
    }

    if (trade.admin_control === 'force_win') return { pnl: (margin * 0.15).toFixed(2), currentPrice: currentAssetPrice };
    if (trade.admin_control === 'force_loss') return { pnl: (-(margin * 0.45)).toFixed(2), currentPrice: currentAssetPrice };

    const entry = Number(trade.entry_price) || 1;
    const leverage = Number(trade.leverage) || 1;
    const positionSize = margin * leverage;
    
    let pnl = 0;
    if (trade.trade_direction === 'long' || trade.trade_direction === 'call') {
      pnl = (currentAssetPrice - entry) * (positionSize / entry);
    } else {
      pnl = (entry - currentAssetPrice) * (positionSize / entry);
    }
    return { pnl: pnl.toFixed(2), currentPrice: currentAssetPrice };
  };

  const handleCloseTrade = async (tradeId: string, tradeSymbol: string) => {
    if (isClosing) return;
    setIsClosing(tradeId);
    const correctPrice = allAssets.find(a => a.symbol === tradeSymbol)?.live_price || livePrice;

    try {
      const { data, error } = await supabase.rpc('close_trade_v3', {
        p_trade_id: tradeId,
        p_user_id: userId,
        p_close_price: correctPrice 
      });
      if (data?.success && onPositionClosed) onPositionClosed();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsClosing(null);
    }
  };

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-600">
        <AlertCircle size={32} className="mb-2 opacity-20" />
        <p className="text-sm font-bold uppercase tracking-tighter">No active positions</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-20">
      <AnimatePresence>
        {trades.map((trade) => {
          const { pnl: pnlStr, currentPrice } = calculateLivePnL(trade);
          const pnlNum = parseFloat(pnlStr); 
          const isProfit = pnlNum >= 0;
          const roe = ((pnlNum / (Number(trade.margin_amount) || 1)) * 100).toFixed(2);
          
          // VIP FIX: Countdown hamesha expiry_time aur current system clock se nikalega
          const expiryTime = new Date(trade.expire_time).getTime();
          const startTime = new Date(trade.created_at).getTime();
          const totalDuration = expiryTime - startTime;
          const remainingTime = Math.max(0, expiryTime - now);
          const currentCount = Math.floor(remainingTime / 1000);

          return (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1E293B] border border-slate-800 rounded-2xl p-4 shadow-xl overflow-hidden relative"
            >
              {trade.trade_mode === 'Bitcast' && (
                <div className="absolute top-0 left-0 h-1 bg-slate-800 w-full">
                   <motion.div 
                     className="h-full bg-[#FCD535]"
                     initial={{ width: "100%" }}
                     animate={{ width: `${(remainingTime / totalDuration) * 100}%` }}
                     transition={{ duration: 1, ease: "linear" }}
                   />
                </div>
              )}

              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${trade.trade_direction === 'long' || trade.trade_direction === 'call' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                    {(trade.trade_direction === 'long' || trade.trade_direction === 'call') ? <TrendingUp size={16} className="text-emerald-500" /> : <TrendingDown size={16} className="text-rose-500" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      {trade.symbol} 
                      <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                        {trade.trade_mode === 'Bitcast' ? `${trade.leverage}%` : `${trade.leverage}x`}
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-500 uppercase">{trade.trade_mode} • {trade.margin_mode}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-mono font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isProfit ? '+' : ''}{pnlStr}
                  </span>
                  <p className={`text-[11px] font-bold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {roe}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 text-[11px]">
                <div><p className="text-slate-500 mb-0.5">Entry Price</p><p className="text-white font-mono">{formatPrice(trade.entry_price)}</p></div>
                <div><p className="text-slate-500 mb-0.5">Mark Price</p><p className="text-white font-mono">{formatPrice(currentPrice)}</p></div>
                <div><p className="text-slate-500 mb-0.5">Margin</p><p className="text-white font-mono">{trade.margin_amount} USDT</p></div>
              </div>

              <div className="flex items-center gap-3 mt-2">
                {trade.trade_mode === 'Bitcast' ? (
                  <div className="flex-1 h-10 bg-slate-900/50 rounded-lg flex items-center px-3 border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Settling Soon</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleCloseTrade(trade.id, trade.symbol)}
                    disabled={isClosing === trade.id}
                    className="flex-1 h-10 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    {isClosing === trade.id ? <Loader2 size={14} className="animate-spin" /> : "Close Position"}
                  </button>
                )}
                
                <div className="px-3 h-10 bg-slate-900/50 border border-slate-700/50 rounded-lg flex flex-col justify-center items-center min-w-[80px]">
                   <p className="text-[8px] text-slate-500 uppercase leading-none mb-1">Status</p>
                   <div className="flex items-center gap-1">
                      <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${isProfit ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <p className={`text-[10px] font-bold uppercase ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isProfit ? 'Profit' : 'Loss'}
                      </p>
                   </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}