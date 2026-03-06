"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Camera, ShieldCheck, History, Lock, 
  FileText, HelpCircle, LogOut, ChevronRight, 
  Loader2, Mail, CheckCircle, Crown, Download
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  
  // PWA Install State
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Profile Data Fetching
  useEffect(() => {
    const getProfile = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return router.push("/login");

      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      setUser(data);
      setFullName(data?.full_name || "");
      setLoading(false);
    };
    getProfile();
  }, [router]);

  // PWA Install Logic
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handleUpdateName = async () => {
    setUpdating(true);
    const { error } = await supabase
      .from("users")
      .update({ full_name: fullName })
      .eq("id", user.id);
    
    if (!error) alert("Profile Updated!");
    setUpdating(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUpdating(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("No User Found");

      // 1. File Name unique rakhein
      const fileExt = file.name.split('.').pop();
      const fileName = `${authUser.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 2. Storage mein upload karein
      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. Proper Public URL lein (Manual URL se behtar hai)
      const { data: { publicUrl } } = supabase.storage
        .from("profile-images")
        .getPublicUrl(filePath);

      // 4. Users table mein URL update karein
      const { error: updateError } = await supabase
        .from("users")
        .update({ profile_image_url: publicUrl })
        .eq("id", authUser.id);

      if (updateError) throw updateError;

      // 5. UI Update karein
      setUser((prev: any) => ({ ...prev, profile_image_url: publicUrl }));
      alert("Profile image updated!");

    } catch (error: any) {
      console.error(error);
      alert("Error: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <Loader2 className="animate-spin text-brand" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-6 pb-32">
      {/* 1. VIP Profile Header */}
      <div className="relative flex flex-col items-center mt-8 mb-12">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full border-4 border-brand/20 p-1 shadow-[0_0_30px_rgba(252,213,53,0.1)]">
            <div className="w-full h-full rounded-full bg-slate-800 overflow-hidden flex items-center justify-center">
              {user?.profile_image_url ? (
                <img src={user.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={60} className="text-slate-600" />
              )}
            </div>
          </div>
          <label className="absolute bottom-1 right-1 p-2 bg-brand text-background rounded-full shadow-xl border-2 border-background active:scale-90 transition-all cursor-pointer">
            <Camera size={16} />
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageUpload} 
            />
          </label>
        </div>

        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <input 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={handleUpdateName}
              className="bg-transparent text-2xl font-black text-center outline-none border-b border-transparent focus:border-brand/30 transition-all"
              placeholder="Enter Name"
            />
            {updating ? <Loader2 size={14} className="animate-spin opacity-50" /> : <Crown size={18} className="text-brand animate-pulse" />}
          </div>
          <div className="flex items-center gap-2 mt-2 justify-center">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
              <Mail size={12} /> {user?.email}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-center">
            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
              user?.kyc_status === 'verified' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {user?.kyc_status === 'verified' ? '✓ Verified' : '⏳ Unverified'}
            </span>
          </div>
        </div>
      </div>

      {/* 1.5 PWA VIP Install Button */}
      <AnimatePresence>
        {installPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-8"
          >
            <button
              onClick={handleInstallClick}
              className="w-full relative group flex items-center justify-between p-[2px] bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 rounded-[28px] shadow-[0_0_30px_rgba(251,191,36,0.15)] active:scale-[0.98] transition-all"
            >
              <div className="flex-1 bg-slate-950 backdrop-blur-md rounded-[26px] p-5 flex items-center justify-between group-hover:bg-slate-900 transition-colors">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-inner animate-pulse">
                    <Download className="text-slate-950" size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500 uppercase tracking-widest">Install App</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Get the Native Experience</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-amber-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Menu Grid */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 px-4">Management</h2>
        
        <div className="grid gap-3">
          <ProfileMenuBtn 
            icon={<History className="text-emerald-500" />} 
            title="Transaction History" 
            onClick={() => router.push("/dashboard/history")}
          />
          <ProfileMenuBtn 
            icon={<Lock className="text-yellow-500" />} 
            title="Change Passwords" 
            onClick={() => router.push("/dashboard/settings/payment-methods")}
          />
          <ProfileMenuBtn 
            icon={<CheckCircle className="text-blue-500" />} 
            title="Verification (KYC)" 
            subtitle="Verified User"
            onClick={() => router.push("/dashboard/kyc")}
          />
        </div>

        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 px-4 mt-8">NexTrade Protocol</h2>
        
        <div className="grid gap-3">
          <ProfileMenuBtn 
            icon={<FileText size={18} />} 
            title="Terms & Conditions" 
            onClick={() => router.push("/dashboard/terms")}
          />
          <ProfileMenuBtn 
            icon={<ShieldCheck size={18} />} 
            title="Privacy Policy" 
            onClick={() => router.push("/dashboard/privacy")}
          />
          <ProfileMenuBtn 
            icon={<HelpCircle size={18} />} 
            title="Contact Support" 
            onClick={() => router.push("/dashboard/support")}
          />
        </div>

        {/* 3. Logout Section */}
        <div className="pt-10">
          <button 
            onClick={handleLogout}
            className="w-full h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 font-black uppercase tracking-[0.2em] text-[10px] rounded-[24px] flex items-center justify-center gap-3 active:bg-rose-500 active:text-white transition-all shadow-xl shadow-rose-500/5"
          >
            <LogOut size={18} /> Exit NexTrade Instance
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-component for Menu Buttons
function ProfileMenuBtn({ icon, title, subtitle, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="w-full p-5 bg-slate-900/40 border border-border-subtle rounded-[28px] flex items-center justify-between group active:scale-[0.98] transition-all"
    >
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="text-left">
          <h3 className="text-sm font-bold text-slate-200">{title}</h3>
          {subtitle && <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">{subtitle}</p>}
        </div>
      </div>
      <ChevronRight size={18} className="text-slate-700 group-hover:text-brand transition-colors" />
    </button>
  );
}