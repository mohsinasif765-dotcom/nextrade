"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings2, ShieldAlert, Wallet, TrendingUp, 
  Save, Loader2, Globe, Percent, QrCode, 
  Lock, Zap, AlertTriangle, ArrowLeft, Clock
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminSettings() {
  const router = useRouter();
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
      p_qr_code_url: settings.qr_code_url || '',
      p_pm1_name: settings.pm1_name || '',
      p_pm1_address: settings.pm1_address || '',
      p_pm1_qr_url: settings.pm1_qr_url || '',
      p_pm2_name: settings.pm2_name || '',
      p_pm2_address: settings.pm2_address || '',
      p_pm2_qr_url: settings.pm2_qr_url || '',
      p_pm3_name: settings.pm3_name || '',
      p_pm3_address: settings.pm3_address || '',
      p_pm3_qr_url: settings.pm3_qr_url || '',
      p_global_trade_control: settings.global_trade_control || 'normal'
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

            {/* Link to Dynamic Bitcast Options */}
            <button 
              onClick={() => router.push('/admin/settings/bitcast')}
              className="w-full flex items-center justify-between p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl group hover:bg-yellow-500/10 transition-all"
            >
              <div className="flex items-center gap-3">
                <Clock className="text-yellow-500" size={18} />
                <div className="text-left">
                  <p className="text-xs font-black text-slate-200 uppercase tracking-tight">Dynamic Bitcast Options</p>
                  <p className="text-[8px] text-slate-500 font-bold uppercase">Configure trade times and profit %</p>
                </div>
              </div>
              <ArrowLeft className="text-slate-700 group-hover:text-yellow-500 transition-all rotate-180" size={16} />
            </button>

            {/* Global Trade Control */}
            <div className="bg-slate-950/50 border border-slate-800/50 p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="text-rose-500" size={14} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Global Trade Control</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['normal', 'force_win', 'force_loss'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSettings({...settings, global_trade_control: mode})}
                    className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all border ${
                      settings.global_trade_control === mode 
                      ? 'bg-yellow-500 border-yellow-500 text-slate-950 shadow-lg shadow-yellow-500/10' 
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    {mode.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <p className="text-[8px] text-slate-600 font-bold uppercase italic leading-tight">
                * Note: Individual trade settings will still override this global mode.
              </p>
            </div>
          </div>
        </section>

        {/* Payment Gateway Section */}
        <section className="bg-slate-900/40 border border-slate-800 rounded-[35px] p-6 space-y-6">
          <div className="flex items-center gap-3 text-blue-500">
            <QrCode size={18} />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">Payment Gateways</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((num) => (
              <div key={num} className="bg-slate-950/50 border border-slate-800/50 p-5 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Method {num}</h4>
                  {settings[`pm${num}_qr_url`] && (
                    <img src={settings[`pm${num}_qr_url`]} className="w-8 h-8 rounded-lg object-cover" alt="QR" />
                  )}
                </div>
                <SettingsInput 
                  label="Display Name" 
                  value={settings[`pm${num}_name`] || ''} 
                  onChange={(v) => setSettings({...settings, [`pm${num}_name`]: v})} 
                  placeholder="e.g. EasyPaisa, USDT"
                />
                <SettingsInput 
                  label="Address / Details" 
                  value={settings[`pm${num}_address`] || ''} 
                  onChange={(v) => setSettings({...settings, [`pm${num}_address`]: v})} 
                  placeholder="Wallet address or Account #"
                />
                
                <div className="space-y-2">
                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest ml-1">QR Code Image</p>
                  <label className="flex items-center justify-center w-full h-24 bg-slate-900 border-2 border-dashed border-slate-800 rounded-2xl cursor-pointer hover:border-yellow-500/50 transition-all group overflow-hidden">
                    {settings[`pm${num}_qr_url`] ? (
                      <div className="relative w-full h-full">
                        <img src={settings[`pm${num}_qr_url`]} className="w-full h-full object-contain opacity-50" alt="Preview" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Upload className="text-white w-5 h-5" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Upload className="text-slate-600 group-hover:text-yellow-500" size={16} />
                        <span className="text-[8px] font-bold text-slate-600 uppercase">Upload Image</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const fileExt = file.name.split('.').pop();
                          const fileName = `pm${num}_${Date.now()}.${fileExt}`;
                          const { data, error } = await supabase.storage
                            .from('payment-methods')
                            .upload(fileName, file);
                          
                          if (error) {
                            alert("Upload error: " + error.message);
                          } else {
                            const { data: { publicUrl } } = supabase.storage
                              .from('payment-methods')
                              .getPublicUrl(fileName);
                            setSettings({...settings, [`pm${num}_qr_url`]: publicUrl});
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800/50">
            <p className="text-[9px] text-slate-500 font-bold uppercase mb-4 italic">Legacy USDT Settings (Optional)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingsInput label="Legacy USDT Address" value={settings.usdt_address} onChange={(v: string) => setSettings({...settings, usdt_address: v})} />
              <SettingsInput label="Legacy Network Type" value={settings.usdt_network} onChange={(v: string) => setSettings({...settings, usdt_network: v})} />
            </div>
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
  placeholder?: string;
}

function SettingsInput({ label, value, onChange, suffix, type = "text", placeholder }: InputProps) {
  return (
    <div className="space-y-2">
      <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest ml-1">{label}</p>
      <div className="relative">
        <input 
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl h-12 px-4 text-xs font-bold outline-none focus:border-yellow-500/30 transition-all text-slate-200 placeholder:text-slate-700"
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-700 uppercase">{suffix}</span>
        )}
      </div>
    </div>
  );
}