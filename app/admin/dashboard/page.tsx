"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, Wallet, ArrowUpCircle, ArrowDownCircle, 
  ShieldAlert, Activity, TrendingUp, Settings2,
  ChevronRight, Loader2, DollarSign, MessageSquare
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBalance: 0,
    pendingKYC: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    activeTrades: 0,
    pendingSupport: 0 // Naya support stat
  });

  // Naya state jo database se live settings dikhayega
  const [liveConfig, setLiveConfig] = useState({
    leverage: "0",
    withdrawFee: "0"
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      // 1. Fetch Stats and Admin Settings in Parallel
      const [
        { count: usersCount },
        { data: balanceData },
        { count: kycCount },
        { count: depCount },
        { count: withCount },
        { count: tradeCount },
        { count: supportCount }, // Support tickets fetch call
        { data: settingsData } // Setting fetch call
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('main_balance'),
        supabase.from('kyc_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('deposit_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('withdraw_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('trades').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('admin_settings').select('max_leverage_allowed, withdraw_fee_percentage').eq('id', 1).single()
      ]);

      const totalBal = balanceData?.reduce((acc, curr) => acc + Number(curr.main_balance), 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalBalance: totalBal,
        pendingKYC: kycCount || 0,
        pendingDeposits: depCount || 0,
        pendingWithdrawals: withCount || 0,
        activeTrades: tradeCount || 0,
        pendingSupport: supportCount || 0
      });

      // Agar data mil jaye to state update kardo
      if (settingsData) {
        setLiveConfig({
          leverage: settingsData.max_leverage_allowed.toString(),
          withdrawFee: settingsData.withdraw_fee_percentage.toString()
        });
      }

      setLoading(false);
    };

    fetchAdminStats();
  }, []);

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-yellow-500" size={40} />
    </div>
  );

  return (
    <div className="p-6 space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Command Center</h1>
          <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-[0.3em]">System Health: Optimal</p>
        </div>
        <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(252,213,53,0.2)]">
           <Activity className="text-slate-950" size={24} />
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          icon={<Users size={20} />} 
          label="Total Traders" 
          value={stats.totalUsers} 
          color="blue" 
        />
        <StatCard 
          icon={<DollarSign size={20} />} 
          label="Total Liquidity" 
          value={`$${stats.totalBalance.toLocaleString()}`} 
          color="emerald" 
        />
      </div>

      {/* Pending Actions (The Action Center) */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 px-2">Critical Requests</h2>
        
        <div className="grid gap-4">
          <ActionItem 
            icon={<ShieldAlert className="text-orange-500" />} 
            label="Pending KYC Verification" 
            count={stats.pendingKYC} 
            onClick={() => router.push('/admin/kyc')}
          />
          <ActionItem 
            icon={<MessageSquare className="text-blue-500" />} 
            label="Support Inquiries" 
            count={stats.pendingSupport} 
            onClick={() => router.push('/admin/support')}
          />
          <ActionItem 
            icon={<ArrowUpCircle className="text-emerald-500" />} 
            label="Pending Deposits" 
            count={stats.pendingDeposits} 
            onClick={() => router.push('/admin/requests?tab=deposits')}
          />
          <ActionItem 
            icon={<ArrowDownCircle className="text-rose-500" />} 
            label="Pending Withdrawals" 
            count={stats.pendingWithdrawals} 
            onClick={() => router.push('/admin/requests?tab=withdrawals')}
          />
        </div>
      </div>

      {/* System Quick Controls - AB DATA REAL HAI */}
      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[35px] space-y-6">
        <div className="flex items-center gap-3">
          <Settings2 className="text-yellow-500" size={18} />
          <h3 className="font-black uppercase text-xs tracking-widest">Global Configs</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => router.push('/admin/settings')} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left active:scale-95 transition-all">
            <p className="text-[9px] text-slate-500 font-bold uppercase">Leverage Limit</p>
            <p className="text-sm font-black text-yellow-500">{liveConfig.leverage}x Max</p>
          </button>
          <button onClick={() => router.push('/admin/settings')} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left active:scale-95 transition-all">
            <p className="text-[9px] text-slate-500 font-bold uppercase">Withdraw Fee</p>
            <p className="text-sm font-black text-yellow-500">{liveConfig.withdrawFee}% Fixed</p>
          </button>
        </div>
      </div>

      {/* Live Market Pulse */}
      <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-6 rounded-[35px] flex items-center justify-between shadow-xl shadow-yellow-500/10">
        <div>
          <h3 className="text-slate-950 font-black uppercase text-sm tracking-tighter">Live Exposure</h3>
          <p className="text-slate-900/70 text-[10px] font-bold uppercase">{stats.activeTrades} Active Trades Running</p>
        </div>
        <TrendingUp className="text-slate-950/40" size={40} />
      </div>

    </div>
  );
}

// Stats Card Component
function StatCard({ icon, label, value, color }: any) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-[30px] space-y-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-500/10 text-${color}-500`}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{label}</p>
        <p className="text-lg font-black font-mono">{value}</p>
      </div>
    </div>
  );
}

// Action Item Component
function ActionItem({ icon, label, count, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="w-full bg-slate-900/40 border border-slate-800 p-5 rounded-[25px] flex items-center justify-between group active:bg-slate-900 transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center shadow-inner">
          {icon}
        </div>
        <span className="text-xs font-bold text-slate-300">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {count > 0 && (
          <span className="bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse">
            {count}
          </span>
        )}
        <ChevronRight size={16} className="text-slate-700 group-hover:text-yellow-500 transition-colors" />
      </div>
    </button>
  );
}