"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, User, CreditCard, Eye, 
  Check, X, Loader2, SearchX, ExternalLink,
  AlertCircle, Calendar
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function AdminKYCPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // State for selected image preview

  const fetchKYC = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('kyc_submissions')
      .select('*, users(email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    setSubmissions(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchKYC(); }, []);

  const handleAction = async (id: string, userId: string, action: 'verified' | 'rejected') => {
    setProcessingId(id);
    const { data } = await supabase.rpc('admin_verify_kyc_v1', {
      p_id: id,
      p_user_id: userId,
      p_action: action,
      p_reason: action === 'rejected' ? rejectReason : null
    });

    if (data?.success) {
      setSubmissions(prev => prev.filter(s => s.id !== id));
      setShowRejectModal(null);
      setRejectReason("");
    } else {
      alert(data?.message || "Action failed");
    }
    setProcessingId(null);
  };

  return (
    <div className="p-6 pb-32">
      <div className="mb-10">
        <h1 className="text-2xl font-black uppercase tracking-tighter">Compliance Hub</h1>
        <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-[0.3em]">Identity Verifications</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20 opacity-30">
          <Loader2 className="animate-spin text-yellow-500 mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest">Scanning Identities...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-[40px] border border-dashed border-slate-800">
          <ShieldCheck className="mx-auto mb-4 text-slate-700" size={48} />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">All Clear! No Pending KYC</p>
        </div>
      ) : (
        <div className="space-y-6">
          {submissions.map((kyc) => (
            <motion.div
              key={kyc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/60 border border-slate-800 rounded-[35px] overflow-hidden"
            >
              {/* User Identity Header */}
              <div className="p-5 bg-slate-950/30 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20">
                    <User className="text-yellow-500" size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-100 uppercase">{kyc.full_name}</h3>
                    <p className="text-[9px] text-slate-500 font-bold">{kyc.users?.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-600 font-black uppercase">ID Number</p>
                  <p className="text-xs font-bold font-mono text-slate-300">{kyc.id_card_number}</p>
                </div>
              </div>

              {/* Data & Images Content */}
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase">
                  <Calendar size={14} className="text-yellow-500" />
                  ID Expiry: <span className="text-slate-200">{kyc.id_expiry_date}</span>
                </div>

                {/* Images Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <ImagePreview label="Front Side" url={kyc.id_front_url} onClick={() => setSelectedImage(kyc.id_front_url)} />
                  <ImagePreview label="Hand-held Selfie" url={kyc.id_holding_url} onClick={() => setSelectedImage(kyc.id_holding_url)} />
                </div>

                {/* Verification Actions */}
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowRejectModal(kyc)}
                    className="flex-1 h-14 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <X size={16} /> Reject
                  </button>
                  <button 
                    onClick={() => handleAction(kyc.id, kyc.user_id, 'verified')}
                    disabled={processingId === kyc.id}
                    className="flex-[2] h-14 bg-emerald-500 text-slate-950 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-500/10"
                  >
                    {processingId === kyc.id ? <Loader2 className="animate-spin" size={16} /> : <><Check size={16} /> Verify Identity</>}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Rejection Modal Overlay */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[35px] p-8 space-y-6 shadow-2xl">
              <div className="flex items-center gap-3 text-rose-500">
                <AlertCircle size={24} />
                <h3 className="font-black uppercase tracking-tight">Decline Verification</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Please provide a reason for rejection. This will be shown to the user.</p>
              <textarea 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Photo is blurry, ID expired..."
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs outline-none focus:border-rose-500/50 transition-all resize-none"
              />
              <div className="flex gap-4">
                <button onClick={() => setShowRejectModal(null)} className="flex-1 text-[10px] font-black uppercase text-slate-500">Cancel</button>
                <button 
                  onClick={() => handleAction(showRejectModal.id, showRejectModal.user_id, 'rejected')}
                  className="flex-[2] h-14 bg-rose-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest"
                >
                  Confirm Reject
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 w-[90%] max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-black uppercase text-slate-200">Image Preview</h2>
              <button onClick={() => setSelectedImage(null)} className="text-slate-500 hover:text-slate-300">
                <X size={16} />
              </button>
            </div>
            <img src={selectedImage} alt="Preview" className="rounded-lg border border-slate-800" />
          </div>
        </div>
      )}
    </div>
  );
}

// Image Preview Sub-component
function ImagePreview({ label, url, onClick }: { label: string, url: string, onClick: () => void }) {
  return (
    <div className="space-y-2">
      <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest ml-1">{label}</p>
      <div 
        className="relative group h-32 bg-slate-950 rounded-[20px] border border-slate-800 overflow-hidden flex items-center justify-center cursor-pointer"
        onClick={onClick}
      >
        {url ? (
          <>
            <img src={url} alt={label} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye className="text-white" size={20} />
            </div>
          </>
        ) : (
          <SearchX className="text-slate-800" size={24} />
        )}
      </div>
    </div>
  );
}