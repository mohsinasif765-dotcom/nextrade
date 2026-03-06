"use client";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { ListChecks, TrendingUp, TrendingDown } from "lucide-react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// VIP Fix: Props mein refreshTrigger add kiya gaya hai
interface TradeHistoryProps {
  userId: string;
  marketType?: string;
  refreshTrigger?: boolean; 
}

export default function TradeHistory({ userId, marketType, refreshTrigger }: TradeHistoryProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchHistory = async () => {
      setLoading(true);
      
      // VIP FIX: Column name 'trade_mode' use kiya hai jo aapke SQL data mein hai
      let query = supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'open');

      // VIP FIX: market_type ki jagah trade_mode column query mein use hoga
      if (marketType) {
        query = query.ilike('trade_mode', marketType); 
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error("History Fetch Error:", error.message);
      }

      if (data) {
        setHistory(data);
      }
      setLoading(false);
    };

    fetchHistory();
    
    // refreshTrigger ko dependency mein dala taake close hone pe refresh ho
  }, [userId, marketType, refreshTrigger]); 

  if (loading) return (
    <div className="py-10 text-center text-slate-500 animate-pulse text-[10px] font-bold uppercase tracking-widest">
      Syncing History...
    </div>
  );

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 opacity-20">
        <ListChecks size={40} className="text-white" />
        <p className="text-sm mt-2 font-bold uppercase tracking-tighter text-white">No History Yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-10">
      {history.map((trade) => {
        const pnl = Number(trade.pnl_amount) || 0;
        const isProfit = pnl > 0;
        const date = new Date(trade.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

        return (
          <div key={trade.id} className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${
                  trade.trade_direction === 'long' || trade.trade_direction === 'call' || trade.trade_direction === 'buy'
                  ? 'bg-emerald-500/20 text-emerald-500' 
                  : 'bg-rose-500/20 text-rose-500'
                }`}>
                  {trade.trade_direction}
                </span>
                <span className="text-sm font-bold text-slate-200">{trade.symbol}</span>
                <span className="text-[10px] text-slate-500 font-bold">{date}</span>
              </div>
              <div className={`text-sm font-mono font-black ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isProfit ? '+' : ''}{pnl.toFixed(2)} USDT
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px] font-bold uppercase tracking-tight text-slate-500">
              <div>
                <p className="mb-0.5">Entry</p>
                <p className="text-slate-300 font-mono">{trade.entry_price}</p>
              </div>
              <div className="text-center">
                <p className="mb-0.5">Exit</p>
                <p className="text-slate-300 font-mono">{trade.close_price || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="mb-0.5">Margin</p>
                <p className="text-slate-300 font-mono">{trade.margin_amount} USDT</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}