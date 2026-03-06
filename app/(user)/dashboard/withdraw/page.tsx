"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Landmark, Wallet, ShieldCheck, 
  Loader2, ChevronRight, AlertCircle, TrendingUp, 
  CreditCard, Fingerprint, Lock
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import NeonInput from "@/components/NeonInput";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type WithdrawMethod = 'USDT' | 'Bank';

export default function WithdrawPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<WithdrawMethod>('USDT');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
      setUserProfile(data);
      setLoading(false);
    };
    fetchUserData();
  }, []);

  const isMethodSet = activeTab === 'USDT' ? userProfile?.usdt_address : userProfile?.bank_name;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !password) return alert("Please fill all fields");
    
    setSubmitting(true);
    // Calling the NEW process_withdrawal_v2 RPC
    const { data, error } = await supabase.rpc('process_withdrawal_v2', {
      p_user_id: userProfile.id,
      p_amount: parseFloat(amount),
      p_method: activeTab,
      p_password: password
    });

    if (error) {
      alert("Network Error: " + error.message);
    } else if (data.success) {
      alert(data.message);
      router.push('/dashboard/assets');
    } else {
      alert(data.message); // This handles "Insufficient Balance" etc.
    }
    setSubmitting(false);
  };

  const setQuickAmount = (percent: number) => {
    const total = userProfile?.main_balance || 0;
    setAmount((total * (percent / 100)).toFixed(2));
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#020617]">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <Loader2 className="animate-pulse text-emerald-500" size={20} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 lg:p-8 pb-24 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      
      {/* Dynamic Background Glow */}
      <div className="fixed top-0 left-0 w-full h-[300px] bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 lg:mb-12">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-3 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl active:scale-90 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg lg:text-2xl font-black tracking-tight">Withdrawal</h1>
            <p className="text-[10px] lg:text-xs text-slate-500 font-bold uppercase tracking-widest">Payout Portal</p>
          </div>
        </div>
        <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
           <ShieldCheck className="text-emerald-500" size={18} />
        </div>
      </div>

      {/* Balance Card */}
      <div className="relative group overflow-hidden bg-slate-900 border border-slate-800 p-6 lg:p-10 rounded-[35px] mb-6 lg:mb-12 shadow-2xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 blur-[50px] rounded-full group-hover:bg-emerald-500/20 transition-all duration-700" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[11px] lg:text-sm text-slate-500 font-black uppercase tracking-[0.2em]">Total Liquidity</p>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-bold text-slate-400">$</span>
            <h2 className="text-4xl lg:text-5xl font-black font-mono tracking-tighter">
              {Number(userProfile?.main_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-slate-950/80 backdrop-blur-xl border border-slate-800/50 rounded-[22px] mb-8 lg:mb-12">
        {(['USDT', 'Bank'] as WithdrawMethod[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 lg:py-4 rounded-[18px] text-[12px] lg:text-sm font-black uppercase tracking-widest transition-all relative ${
                isActive ? "text-slate-950" : "text-slate-500"
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                {tab === 'USDT' ? <CreditCard size={14} /> : <Landmark size={14} />}
                {tab}
              </span>
              {isActive && (
                <motion.div layoutId="tabGlow" className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-[18px] shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {!isMethodSet ? (
            <motion.div 
              key="missing"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-slate-900/50 border border-dashed border-slate-700 p-8 lg:p-12 rounded-[35px] text-center"
            >
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="text-rose-500 w-8 h-8 lg:w-10 lg:h-10" />
              </div>
              <h3 className="text-xl lg:text-2xl font-black mb-3 text-white">Missing Protocol</h3>
              <p className="text-sm lg:text-base text-slate-500 leading-relaxed mb-8 px-4">
                Aapka <span className="text-white font-bold">{activeTab} wallet address</span> link nahi hai.
              </p>
              <button 
                onClick={() => router.push('/dashboard/settings/payment-methods')}
                className="w-full h-14 lg:h-16 bg-white text-black font-black uppercase text-xs lg:text-sm tracking-widest rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
              >
                Configure Now <ChevronRight size={18} />
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12"
            >
              {/* Left Column: Recipient Info */}
              <div className="order-1 lg:order-1">
                <div className="bg-slate-900/40 border border-slate-800 p-6 lg:p-8 rounded-3xl flex items-center gap-5">
                  <div className={`w-12 h-12 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center ${activeTab === 'USDT' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {activeTab === 'USDT' ? <TrendingUp size={24} /> : <Landmark size={24} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] lg:text-sm text-slate-500 font-black uppercase tracking-widest">Recipient Destination</p>
                    <p className="text-sm lg:text-base font-mono truncate text-emerald-400/90 mt-0.5">
                      {activeTab === 'USDT' ? userProfile.usdt_address : `${userProfile.bank_name}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Form */}
              <div className="order-2 lg:order-2">
                <form onSubmit={handleWithdraw} className="space-y-6 lg:space-y-8">
                  <div>
                    <NeonInput 
                      label="Amount to Extract"
                      name="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                    <div className="flex gap-2 mt-4">
                      {[25, 50, 100].map((pc) => (
                        <button
                          key={pc}
                          type="button"
                          onClick={() => setQuickAmount(pc)}
                          className="flex-1 py-3 bg-slate-900/80 border border-slate-800 rounded-xl text-[10px] lg:text-xs font-black text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all uppercase tracking-tighter"
                        >
                          {pc === 100 ? 'Max' : `${pc}%`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative group">
                    <NeonInput 
                      label="Authorization PIN"
                      name="password"
                      type="password"
                      placeholder="••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Lock className="absolute right-4 bottom-4 text-slate-700" size={18} />
                  </div>

                  <div className="pt-4">
                    <button 
                      disabled={submitting}
                      className="w-full h-16 lg:h-18 bg-emerald-500 text-slate-950 font-black uppercase tracking-[0.25em] text-xs lg:text-sm rounded-[25px] shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 overflow-hidden relative group"
                    >
                      {submitting ? <Loader2 className="animate-spin" size={20} /> : (
                        <>
                          <Fingerprint size={20} className="group-hover:scale-110 transition-transform" />
                          Authorize Withdrawal
                        </>
                      )}
                      <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                    </button>
                  </div>
                  
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-full border border-slate-800">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      <span className="text-[10px] lg:text-xs text-slate-400 font-bold uppercase tracking-widest">End-to-End Encrypted</span>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}