"use client";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Clock, Loader2, AlertCircle } from "lucide-react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// VIP Fix: TypeScript Interface Define ki hai
interface ActivePositionsProps {
  userId: string;
  livePrice: number; // Chart ki price (fallback)
  marketType: string;
  allAssets: any[];
  onPositionClosed?: () => void; // Parent ko batane ke liye
  refreshTrigger?: boolean;      // Parent se refresh lene ke liye
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

  // 1. Fetch Open Trades (refreshTrigger dependency shamil hai)
  useEffect(() => {
    if (!userId) return;

    const fetchOpenTrades = async () => {
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

    fetchOpenTrades();

    const tradeSub = supabase
      .channel('live_trades')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'trades', 
        filter: `user_id=eq.${userId}` 
      }, () => fetchOpenTrades())
      .subscribe();

    return () => { supabase.removeChannel(tradeSub); };
  }, [userId, marketType, refreshTrigger]); // Refresh on trigger

  // 2. Live PnL Logic - Multi-asset Support
  const calculateLivePnL = (trade: any): { pnl: string, currentPrice: number } => {
    const margin = Number(trade.margin_amount) || 0;
    
    // Trade ke specific symbol ki price dhoondo, warna chart wali use karo
    const currentAssetPrice = allAssets.find(a => a.symbol === trade.symbol)?.live_price || livePrice;
    
    // Force Win/Loss Override
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

      if (error) throw error;
      
      if (data?.success) {
        // Parent ko refresh trigger bhejain
        if (onPositionClosed) onPositionClosed();
        // UI se fauran nikal do
        setTrades(prev => prev.filter(t => t.id !== tradeId));
      }
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

          return (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1E293B] border border-slate-800 rounded-2xl p-4 shadow-xl"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${trade.trade_direction === 'long' || trade.trade_direction === 'call' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                    {(trade.trade_direction === 'long' || trade.trade_direction === 'call') ? <TrendingUp size={16} className="text-emerald-500" /> : <TrendingDown size={16} className="text-rose-500" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      {trade.symbol} 
                      <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">{trade.leverage}x</span>
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
                <div>
                  <p className="text-slate-500 mb-0.5">Entry Price</p>
                  <p className="text-white font-mono">{trade.entry_price}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">Mark Price</p>
                  <p className="text-white font-mono">{currentPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">Margin</p>
                  <p className="text-white font-mono">{trade.margin_amount} USDT</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2">
                {trade.trade_mode === 'Bitcast' ? (
                  <div className="flex-1 bg-slate-900 h-8 rounded-lg flex items-center px-3 gap-2 border border-slate-700">
                    <Clock size={12} className="text-amber-400 animate-pulse" />
                    <span className="text-[10px] text-slate-300 uppercase">Awaiting Bitcast Expiry...</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleCloseTrade(trade.id, trade.symbol)}
                    disabled={isClosing === trade.id}
                    className="flex-1 h-9 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold transition-colors flex items-center justify-center"
                  >
                    {isClosing === trade.id ? <Loader2 size={14} className="animate-spin" /> : "Close Position"}
                  </button>
                )}
                
                <div className="px-3 h-9 bg-rose-500/10 border border-rose-500/20 rounded-lg flex flex-col justify-center items-center min-w-[70px]">
                   <p className="text-[9px] text-rose-500 leading-none">Liq. Price</p>
                   <p className="text-[11px] font-mono text-rose-400">{trade.liquidation_price || '--'}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}