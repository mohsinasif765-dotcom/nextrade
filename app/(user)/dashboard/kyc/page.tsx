"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, User, ImageIcon, Camera, CheckCircle2, 
  Loader2, ChevronRight, ShieldCheck, AlertCircle
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import NeonInput from "@/components/NeonInput";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function KYCPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [kycStatusData, setKycStatusData] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  
  // Refs for hidden inputs
  const frontInputRef = useRef<HTMLInputElement>(null);
  const holdingInputRef = useRef<HTMLInputElement>(null);
  
  // Form Data State
  const [formData, setFormData] = useState({
    full_name: "",
    id_number: "",
    expiry: "",
  });

  // State for actual File objects
  const [files, setFiles] = useState<{ front: File | null; holding: File | null }>({
    front: null,
    holding: null,
  });

  // Previews for UI
  const [previews, setPreviews] = useState({
    front: "",
    holding: ""
  });

  // 1. Initial Check: Get current KYC status
  useEffect(() => {
    const fetchKYCStatus = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('kyc_submissions')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (data) {
            setKycStatusData(data);
            // Agar pehle se data hai, to form mein bhar dena behtar hai
            setFormData({
              full_name: data.full_name || "",
              id_number: data.id_card_number || "",
              expiry: data.id_expiry_date || "",
            });
          }
        }
      } catch (err) {
        console.error("Error fetching KYC:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchKYCStatus();
  }, []);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const isStep1Complete = formData.full_name.trim() !== "" && formData.id_number.trim() !== "" && formData.expiry !== "";

  // Handle local file selection
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'holding') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFiles(prev => ({ ...prev, [type]: file }));
    const localUrl = URL.createObjectURL(file);
    setPreviews(prev => ({ ...prev, [type]: localUrl }));
  };

  // Helper function for storage upload
  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('kyc-documents')
      .upload(path, file, { upsert: true });
    
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(path);
    
    return publicUrl;
  };

  // Final Action: Batch Upload & DB Submission
  const handleSubmit = async () => {
    if (!files.front || !files.holding) {
      alert("Please select both ID images first");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const timestamp = Date.now();
      const frontPath = `${user.id}/front_${timestamp}`;
      const holdingPath = `${user.id}/holding_${timestamp}`;

      // Uploading to Storage
      const frontUrl = await uploadFile(files.front, frontPath);
      const holdingUrl = await uploadFile(files.holding, holdingPath);

      // Submit to RPC
      const { data, error } = await supabase.rpc('submit_kyc_v1', {
        p_user_id: user.id,
        p_full_name: formData.full_name,
        p_id_number: formData.id_number,
        p_expiry: formData.expiry,
        p_front_url: frontUrl,
        p_holding_url: holdingUrl
      });

      if (data?.success) {
        setKycStatusData({ status: 'pending' });
        setStep(4);
      } else {
        alert(data?.message || error?.message || "Verification failed");
      }
    } catch (err: any) {
      alert("System Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading View
  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  // Approved Status View
  if (kycStatusData?.status === 'verified') {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
          <ShieldCheck className="text-emerald-500" size={50} />
        </div>
        <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Verified Account</h1>
        <p className="text-slate-500 text-sm mt-4 px-8 leading-relaxed">
          Mubarak ho! Aap ki identity verify ho chuki hai. Aap ki withdrawal aur trading limits unlock kar di gayi hain.
        </p>
        <button 
          onClick={() => router.push('/dashboard/profile')} 
          className="w-full mt-12 h-16 bg-emerald-500 text-slate-950 font-black uppercase rounded-2xl tracking-widest shadow-lg shadow-emerald-500/20"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Pending Status View (Ager step 4 nahi hai to status screen dikhayen)
  if (kycStatusData?.status === 'pending' && step !== 4) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(234,179,8,0.2)]">
          <Loader2 className="text-yellow-500 animate-spin" size={40} />
        </div>
        <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Under Review</h1>
        <p className="text-slate-500 text-sm mt-4 px-8 leading-relaxed">
          Aap ki identity verification filhal process mein hai. Admin team aap ke documents check kar rahi hai.
        </p>
        <button 
          onClick={() => router.back()} 
          className="w-full mt-12 h-16 bg-slate-900 border border-slate-800 font-bold rounded-2xl tracking-widest uppercase text-white"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Default Form View (For New or Rejected users)
  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 pb-24 font-sans">
      
      {/* Header & Progress */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="p-3 bg-slate-900 rounded-2xl border border-slate-800 active:scale-95 transition-all">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black uppercase tracking-tight text-white">Identity Vault</h1>
        </div>
        
        {/* Rejection Alert if Rejected */}
        {kycStatusData?.status === 'rejected' && (
          <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3 items-center">
            <AlertCircle className="text-rose-500 shrink-0" size={20} />
            <div>
              <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest">Verification Rejected</p>
              <p className="text-[10px] text-slate-400 mt-1">{kycStatusData.rejection_reason || "Documents were not clear. Please re-submit."}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 h-1.5 px-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-800'}`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-3xl flex gap-4 items-center">
              <User className="text-emerald-500" size={24} />
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Step 01: Profile Information</p>
            </div>
            
            <NeonInput label="Legal Full Name" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} placeholder="As per Document" />
            <NeonInput label="Document ID Number" value={formData.id_number} onChange={(e) => setFormData({...formData, id_number: e.target.value})} placeholder="National ID / Passport" />
            <NeonInput label="Document Expiry" type="date" value={formData.expiry} onChange={(e) => setFormData({...formData, expiry: e.target.value})} />

            <button 
              onClick={nextStep} 
              disabled={!isStep1Complete}
              className={`w-full h-16 font-black uppercase tracking-widest rounded-3xl flex items-center justify-center gap-3 transition-all ${
                isStep1Complete ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed'
              }`}
            >
              Scan Documents <ChevronRight size={18} />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-3xl text-center">
              <ImageIcon className="text-emerald-500 mx-auto mb-3" size={32} />
              <h3 className="font-black text-sm uppercase text-white">ID Card Front</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Capture clear photo of document</p>
            </div>

            <div 
              onClick={() => frontInputRef.current?.click()}
              className="group relative h-56 border-2 border-dashed border-slate-800 rounded-[32px] flex flex-col items-center justify-center gap-4 hover:border-emerald-500/50 transition-all cursor-pointer overflow-hidden bg-slate-900/30"
            >
              {previews.front ? (
                <img src={previews.front} className="h-full w-full object-cover" alt="Front Preview" />
              ) : (
                <>
                  <Camera className="text-slate-600 group-hover:text-emerald-500 transition-colors" size={40} />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tap to Capture Front</span>
                </>
              )}
            </div>

            <input type="file" ref={frontInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelection(e, 'front')} />

            <div className="flex gap-4 pt-4">
              <button onClick={prevStep} className="flex-1 h-16 bg-slate-900 border border-slate-800 rounded-2xl font-black uppercase text-[11px] tracking-widest text-white">Back</button>
              <button 
                onClick={nextStep} 
                disabled={!files.front}
                className="flex-[2] h-16 bg-emerald-500 text-slate-950 font-black uppercase tracking-widest rounded-2xl disabled:opacity-50"
              >
                Next Photo
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-3xl text-center">
              <Camera className="text-emerald-500 mx-auto mb-3" size={32} />
              <h3 className="font-black text-sm uppercase text-white">Verification Selfie</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Hold ID card clearly near your face</p>
            </div>

            <div 
              onClick={() => holdingInputRef.current?.click()}
              className="group relative h-56 border-2 border-dashed border-slate-800 rounded-[32px] flex flex-col items-center justify-center gap-4 hover:border-emerald-500/50 transition-all cursor-pointer overflow-hidden bg-slate-900/30"
            >
              {previews.holding ? (
                <img src={previews.holding} className="h-full w-full object-cover" alt="Selfie Preview" />
              ) : (
                <>
                  <Camera className="text-slate-600 group-hover:text-emerald-500 transition-colors" size={40} />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tap to Capture Selfie</span>
                </>
              )}
            </div>

            <input type="file" ref={holdingInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelection(e, 'holding')} />

            <div className="flex gap-4 pt-4">
              <button onClick={prevStep} className="flex-1 h-16 bg-slate-900 border border-slate-800 rounded-2xl font-black uppercase text-[11px] tracking-widest text-white">Back</button>
              <button 
                disabled={submitting || !files.holding} 
                onClick={handleSubmit} 
                className="flex-[2] h-16 bg-emerald-500 text-slate-950 font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" />
                    <span className="text-[10px]">Processing...</span>
                  </div>
                ) : (
                  <>
                    <ShieldCheck size={20} />
                    Final Submit
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step4" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-20 space-y-6">
            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="text-emerald-500" size={48} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">Success</h2>
            <p className="text-slate-500 text-xs px-8 leading-relaxed">
              Bhai, aap ki identity files upload kar di gayi hain. Team review ke baad aap ka account verify ho jayega.
            </p>
            <button 
              onClick={() => router.push('/dashboard/profile')} 
              className="w-full h-16 bg-slate-900 border border-slate-800 rounded-3xl font-black uppercase tracking-widest text-[11px] mt-10 text-white"
            >
              Go to Profile
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}