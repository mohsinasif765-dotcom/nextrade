"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings2, ShieldAlert, Wallet, TrendingUp, 
  Save, Loader2, Globe, Percent, QrCode, 
  Lock, Zap, AlertTriangle 
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase
        .from("admin_settings")
        .select("*")
        .eq("id", 1)
        .single();
      setSettings(data);
      setLoading(false);
    }
    fetchSettings();
  }, []);

  // VIP Fix: Secure RPC call with strict type casting
  const handleUpdate = async () => {
    setUpdating(true);
    
    const { error } = await supabase.rpc('admin_save_settings', {
      p_maintenance_mode: Boolean(settings.maintenance_mode),
      p_min_deposit_amount: Number(settings.min_deposit_amount),
      p_min_withdraw_amount: Number(settings.min_withdraw_amount),
      p_withdraw_fee_percentage: Number(settings.withdraw_fee_percentage),
      p_spot_fee_percentage: Number(settings.spot_fee_percentage),
      p_max_leverage_allowed: Number(settings.max_leverage_allowed),
      p_force_win_profit_percentage: Number(settings.force_win_profit_percentage),
      p_usdt_address: settings.usdt_address || '',
      p_usdt_network: settings.usdt_network || '',
      p_qr_code_url: settings.qr_code_url || ''
    });

    if (!error) {
      alert("NexTrade Global Config Updated!");
    } else {
      alert("Error: " + error.message);
    }
    setUpdating(false);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-background text-yellow-500">
      <Loader2 className="animate-spin" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen p-6 pb-32 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter italic">Global Config</h1>
          <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-[0.3em]">Master System Controls</p>
        </div>
        <button 
          onClick={handleUpdate}
          disabled={updating}
          className="flex items-center gap-2 bg-yellow-500 text-slate-950 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-yellow-500/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {updating ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Deploy Changes</>}
        </button>
      </div>

      <div className="space-y-6">
        {/* System Status Section */}
        <section className="bg-slate-900/40 border border-slate-800 rounded-[35px] p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="text-yellow-500" size={18} />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">System Status</h3>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
            <div>
              <p className="text-xs font-bold text-slate-200">Maintenance Mode</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-tighter">Disable App Access for Users</p>
            </div>
            <button 
              onClick={() => setSettings({...settings, maintenance_mode: !settings.maintenance_mode})}
              className={`w-14 h-8 rounded-full transition-all flex items-center px-1 ${settings.maintenance_mode ? 'bg-rose-500 justify-end' : 'bg-slate-800 justify-start'}`}
            >
              <div className="w-6 h-6 bg-white rounded-full shadow-lg" />
            </button>
          </div>
        </section>

        {/* Financial Limits Section */}
        <section className="bg-slate-900/40 border border-slate-800 rounded-[35px] p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Wallet className="text-emerald-500" size={18} />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">Financial Limits</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SettingsInput label="Min Deposit" value={settings.min_deposit_amount} onChange={(v: string) => setSettings({...settings, min_deposit_amount: v})} suffix="USDT" />
            <SettingsInput label="Min Withdraw" value={settings.min_withdraw_amount} onChange={(v: string) => setSettings({...settings, min_withdraw_amount: v})} suffix="USDT" />
            <SettingsInput label="Withdraw Fee" value={settings.withdraw_fee_percentage} onChange={(v: string) => setSettings({...settings, withdraw_fee_percentage: v})} suffix="%" />
            <SettingsInput label="Spot Fee" value={settings.spot_fee_percentage} onChange={(v: string) => setSettings({...settings, spot_fee_percentage: v})} suffix="%" />
          </div>
        </section>

        {/* Trade Algorithms Section */}
        <section className="bg-slate-900/40 border border-slate-800 rounded-[35px] p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Zap className="text-yellow-500" size={18} />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">Trade Algorithms</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-yellow-500/5 border border-yellow-500/10 p-4 rounded-2xl">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-xs font-black text-yellow-500 uppercase italic">Force Win Profit</p>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Automatic profit percentage</p>
                </div>
                <div className="text-xl font-black font-mono text-yellow-500">{settings.force_win_profit_percentage}%</div>
              </div>
              <input 
                type="range" min="1" max="50" step="0.5"
                value={settings.force_win_profit_percentage}
                onChange={(e) => setSettings({...settings, force_win_profit_percentage: e.target.value})}
                className="w-full accent-yellow-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <SettingsInput label="Max Leverage" value={settings.max_leverage_allowed} onChange={(v: string) => setSettings({...settings, max_leverage_allowed: v})} suffix="X" />
          </div>
        </section>

        {/* Payment Gateway Section */}
        <section className="bg-slate-900/40 border border-slate-800 rounded-[35px] p-6 space-y-6">
          <div className="flex items-center gap-3 text-blue-500">
            <QrCode size={18} />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">Payment Gateway</h3>
          </div>
          <div className="space-y-4">
            <SettingsInput label="Admin USDT Address" value={settings.usdt_address} onChange={(v: string) => setSettings({...settings, usdt_address: v})} />
            <SettingsInput label="Network Type" value={settings.usdt_network} onChange={(v: string) => setSettings({...settings, usdt_network: v})} />
            <SettingsInput label="QR Code URL" value={settings.qr_code_url || ''} onChange={(v: string) => setSettings({...settings, qr_code_url: v})} />
          </div>
        </section>
      </div>
    </div>
  );
}

// Fixed Types for Sub-component
interface InputProps {
  label: string;
  value: any;
  onChange: (v: string) => void;
  suffix?: string;
  type?: string;
}

function SettingsInput({ label, value, onChange, suffix, type = "text" }: InputProps) {
  return (
    <div className="space-y-2">
      <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest ml-1">{label}</p>
      <div className="relative">
        <input 
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl h-12 px-4 text-xs font-bold outline-none focus:border-yellow-500/30 transition-all text-slate-200"
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-700 uppercase">{suffix}</span>
        )}
      </div>
    </div>
  );
}