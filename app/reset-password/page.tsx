"use client";
import { useState } from "react";
import { Lock, RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import NeonInput from "@/components/NeonInput";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return alert("Passwords mismatch!");
    
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <motion.div className="w-full max-w-[400px] bg-[#09090b] border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
        {!success ? (
          <>
            <h2 className="text-2xl font-black text-white italic mb-8">New <span className="text-emerald-400">Credentials</span></h2>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <NeonInput label="New Password" icon={Lock} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <NeonInput label="Confirm New Password" icon={Lock} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              <button disabled={loading} className="w-full bg-emerald-500 text-slate-950 font-black py-4 rounded-xl mt-4">
                {loading ? <RefreshCw className="animate-spin mx-auto" /> : "UPDATE TERMINAL ACCESS"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-10">
            <CheckCircle2 className="text-emerald-500 mx-auto mb-4" size={50} />
            <h3 className="text-white font-bold">Access Restored!</h3>
            <p className="text-slate-500 text-xs mt-2">Redirecting to login...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}