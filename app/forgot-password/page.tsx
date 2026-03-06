"use client";
import { useState } from "react";
import { Mail, ArrowLeft, Send, RefreshCw,AlertCircle,CheckCircle2, ShieldQuestion } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NeonInput from "@/components/NeonInput";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setSubmitted(true);
        setMessage({ text: "Recovery link dispatched!", type: "success" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-[400px] bg-[#09090b]/80 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl"
      >
        <button onClick={() => router.back()} className="mb-8 p-3 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 active:scale-95 transition-all">
          <ArrowLeft size={20} />
        </button>

        {!submitted ? (
          <>
            <div className="mb-8">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6 border border-emerald-500/20">
                <ShieldQuestion className="text-emerald-500" size={32} />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight italic">Account<span className="text-emerald-400">Recovery</span></h2>
              <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest font-bold">Secure Protocol Initialization</p>
            </div>

            <form onSubmit={handleResetRequest} className="space-y-6">
              <NeonInput 
                label="Registered Email" 
                icon={Mail} 
                type="email" 
                placeholder="Enter your email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              
              <button 
                disabled={loading || !email} 
                type="submit" 
                className="w-full bg-emerald-500 text-slate-950 font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCw className="animate-spin" /> : <>SEND RECOVERY LINK <Send size={18} /></>}
              </button>
            </form>
          </>
        ) : (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-10">
            <CheckCircle2 className="mx-auto text-emerald-500 mb-6" size={64} />
            <h2 className="text-2xl font-black text-white">Check Your Inbox</h2>
            <p className="text-slate-500 text-sm mt-4 px-4 leading-relaxed">
              Bhai, humne verification link <span className="text-emerald-400 font-bold">{email}</span> par bhej di hai. Apna email check karein.
            </p>
            <button onClick={() => setSubmitted(false)} className="mt-10 text-emerald-400 text-xs font-black uppercase tracking-widest hover:underline">
              Try different email
            </button>
          </motion.div>
        )}

        <AnimatePresence>
          {message.text && message.type === "error" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
              <AlertCircle className="text-red-500 shrink-0" size={18} />
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{message.text}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}