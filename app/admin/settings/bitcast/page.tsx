"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, Plus, Trash2, Loader2, Clock, 
  ArrowLeft, Save, AlertCircle, Percent
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminBitcastSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Form states
  const [newTime, setNewTime] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newProfit, setNewProfit] = useState("");

  const fetchOptions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("bitcast_options")
      .select("*")
      .order("time_seconds", { ascending: true });
    setOptions(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleAddOption = async () => {
    if (!newTime || !newLabel || !newProfit) return alert("Fill all fields");
    
    setIsAdding(true);
    const { data, error } = await supabase.rpc('admin_save_bitcast_option', {
      p_time_seconds: parseInt(newTime),
      p_label: newLabel,
      p_profit_percentage: parseFloat(newProfit)
    });

    if (error) {
      alert("Error: " + error.message);
    } else {
      setNewTime("");
      setNewLabel("");
      setNewProfit("");
      fetchOptions();
    }
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this option?")) return;
    
    setIsDeleting(id);
    const { error } = await supabase.rpc('admin_delete_bitcast_option', {
      p_id: id
    });

    if (error) {
      alert("Error: " + error.message);
    } else {
      fetchOptions();
    }
    setIsDeleting(null);
  };

  if (loading && options.length === 0) return (
    <div className="h-screen flex items-center justify-center bg-[#0B1120] text-yellow-500">
      <Loader2 className="animate-spin" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen p-6 pb-32 space-y-8 bg-[#0B1120]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 bg-slate-900 rounded-xl text-slate-400 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter italic text-white">Bitcast Options</h1>
            <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-[0.3em]">Dynamic Trade Config</p>
          </div>
        </div>
      </div>

      {/* Add New Option Section */}
      <section className="bg-slate-900/40 border border-slate-800 rounded-[35px] p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Plus className="text-emerald-500" size={18} />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">Add New Option</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] text-slate-600 font-black uppercase tracking-widest ml-1">Time (Seconds)</label>
            <input 
              type="number" placeholder="e.g. 60"
              value={newTime} onChange={(e) => setNewTime(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl h-12 px-4 text-xs font-bold outline-none focus:border-yellow-500/30 transition-all text-slate-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] text-slate-600 font-black uppercase tracking-widest ml-1">Label</label>
            <input 
              type="text" placeholder="e.g. 1m"
              value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl h-12 px-4 text-xs font-bold outline-none focus:border-yellow-500/30 transition-all text-slate-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] text-slate-600 font-black uppercase tracking-widest ml-1">Profit (%)</label>
            <input 
              type="number" placeholder="e.g. 80"
              value={newProfit} onChange={(e) => setNewProfit(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl h-12 px-4 text-xs font-bold outline-none focus:border-yellow-500/30 transition-all text-slate-200"
            />
          </div>
        </div>
        
        <button 
          onClick={handleAddOption}
          disabled={isAdding}
          className="w-full h-12 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-50"
        >
          {isAdding ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Save Option</>}
        </button>
      </section>

      {/* Existing Options List */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 ml-2">
          <Zap className="text-yellow-500" size={18} />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">Active Options ({options.length})</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {options.map((opt) => (
            <motion.div 
              key={opt.id}
              layout
              className="bg-slate-900/40 border border-slate-800 p-4 rounded-3xl flex items-center justify-between group hover:border-slate-700 transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="h-12 w-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-yellow-500">
                  <Clock size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white">{opt.label}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{opt.time_seconds} Seconds</p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-xs font-black text-emerald-500 italic">+{opt.profit_percentage}%</p>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Profit</p>
                </div>
                <button 
                  onClick={() => handleDelete(opt.id)}
                  disabled={isDeleting === opt.id}
                  className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all active:scale-90 disabled:opacity-50"
                >
                  {isDeleting === opt.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                </button>
              </div>
            </motion.div>
          ))}

          {options.length === 0 && !loading && (
            <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-[40px] space-y-4">
              <AlertCircle size={40} className="mx-auto text-slate-700" />
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">No dynamic options found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
