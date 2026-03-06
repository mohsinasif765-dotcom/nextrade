"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Landmark, Wallet, ShieldCheck, 
  CheckCircle2, Loader2, Save, KeyRound 
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import NeonInput from "@/components/NeonInput";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type SetupTab = 'USDT' | 'Bank';

export default function PaymentMethodSetup() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SetupTab>('USDT');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExistingPassword, setHasExistingPassword] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    bank_name: "",
    account_number: "",
    swift_code: "",
    usdt_address: "",
    new_password: ""
  });
  const [oldPassword, setOldPassword] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('users')
        .select('full_name, bank_name, account_number, swift_code, usdt_address, transaction_password')
        .eq('id', user.id)
        .single();

      if (data) {
        setFormData({
          full_name: data.full_name || "",
          bank_name: data.bank_name || "",
          account_number: data.account_number || "",
          swift_code: data.swift_code || "",
          usdt_address: data.usdt_address || "",
          new_password: data.transaction_password || ""
        });
        // Check if password already exists in DB
        if (data.transaction_password) setHasExistingPassword(true);
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // RPC Call
      const { data, error } = await supabase.rpc('update_payment_setup_v1', {
        p_user_id: user.id,
        p_full_name: formData.full_name,
        p_bank_name: formData.bank_name,
        p_account_number: formData.account_number,
        p_swift_code: formData.swift_code,
        p_usdt_address: formData.usdt_address,
        p_new_password: formData.new_password,
        p_old_password: hasExistingPassword ? oldPassword : null
      });

      if (error) throw error;

      if (data.success) {
        alert(data.message);
        router.back();
      } else {
        alert("Error: " + data.message);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center bg-[#0F172A]">
      <Loader2 className="animate-spin text-yellow-500" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-6 pb-24 font-sans">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => router.back()} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl active:scale-90 transition-all">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black uppercase tracking-widest">Withdrawal Setup</h1>
      </div>

      <div className="flex p-1.5 bg-slate-900/50 border border-slate-800 rounded-[24px] mb-10">
        {(['USDT', 'Bank'] as SetupTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all relative ${
              activeTab === tab ? "text-[#0F172A]" : "text-slate-500"
            }`}
          >
            <span className="relative z-10">{tab} Method</span>
            {activeTab === tab && (
              <motion.div layoutId="setupActive" className="absolute inset-0 bg-yellow-500 rounded-2xl" />
            )}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="flex flex-col space-y-8">
        {/* Verification Section - Show if password already exists */}
        {hasExistingPassword && (
          <div className="bg-yellow-500/5 border border-yellow-500/10 p-6 rounded-[32px] mb-2">
            <div className="flex items-center gap-3 mb-4">
              <KeyRound className="text-yellow-500" size={18} />
              <p className="text-[10px] text-yellow-500 font-black uppercase tracking-widest">Security Verification</p>
            </div>
            <NeonInput 
              label="Current Transaction Password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Enter existing PIN to unlock changes"
              required
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'USDT' ? (
            <motion.div key="usdt" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
              <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-[24px] flex gap-4 items-start mb-4 text-[10px] text-slate-400">
                <Wallet className="text-blue-400 shrink-0" size={20} />
                <p>Apna <span className="text-white font-bold">USDT (TRC20)</span> address enter karein. Wrong address par withdrawal recover nahi hoga.</p>
              </div>
              <NeonInput label="USDT Wallet Address" value={formData.usdt_address} onChange={(e) => setFormData({...formData, usdt_address: e.target.value})} placeholder="TXYZ..." />
            </motion.div>
          ) : (
            <motion.div key="bank" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-[24px] flex gap-4 items-start mb-4 text-[10px] text-slate-400">
                <Landmark className="text-emerald-400 shrink-0" size={20} />
                <p>Bank details bilkul sahi enter karein. Title of Account wahi hona chahiye jo aapke bank mein hai.</p>
              </div>
              <NeonInput label="Full Name" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} placeholder="Account Title" />
              <NeonInput label="Bank Name" value={formData.bank_name} onChange={(e) => setFormData({...formData, bank_name: e.target.value})} placeholder="e.g. Meezan Bank" />
              <NeonInput label="Account Number / IBAN" value={formData.account_number} onChange={(e) => setFormData({...formData, account_number: e.target.value})} placeholder="0000 0000 0000" />
              <NeonInput label="Swift / Sort Code" value={formData.swift_code} onChange={(e) => setFormData({...formData, swift_code: e.target.value})} placeholder="Global Swift Code" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* New Password Section */}
        <div className="pt-2 border-t border-slate-800">
          <NeonInput 
            label={hasExistingPassword ? "New Transaction Password" : "Set Transaction Password"}
            type="password"
            value={formData.new_password}
            onChange={(e) => setFormData({...formData, new_password: e.target.value})}
            placeholder="Set 6-digit PIN"
            maxLength={6}
            required
          />
        </div>

        <div className="mt-12 pt-6">
          <button 
            disabled={isSaving}
            className="w-full h-18 bg-yellow-500 text-[#0F172A] font-black uppercase tracking-[0.2em] rounded-[24px] shadow-[0_15px_40px_rgba(252,213,53,0.2)] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Update Security Profile</>}
          </button>
        </div>
      </form>
    </div>
  );
}