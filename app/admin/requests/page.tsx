"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowUpCircle, ArrowDownCircle, Check, X, 
  ExternalLink, Loader2, Wallet, User, Clock, SearchX
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type RequestTab = 'deposits' | 'withdrawals';

export default function AdminRequestsPage() {
  const [activeTab, setActiveTab] = useState<RequestTab>('deposits');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedProof, setSelectedProof] = useState<string | null>(null); // State for selected payment proof

  const fetchRequests = async () => {
    setLoading(true);
    const table = activeTab === 'deposits' ? 'deposit_requests' : 'withdraw_requests';
    const { data } = await supabase
      .from(table)
      .select('*, users(email, full_name, main_balance)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [activeTab]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    const rpcName = activeTab === 'deposits' ? 'admin_verify_deposit' : 'admin_verify_withdraw';
    
    const { data } = await supabase.rpc(rpcName, { p_id: id, p_action: action });

    if (data?.success) {
      setRequests(prev => prev.filter(r => r.id !== id));
    } else {
      alert(data?.message || "Operation failed");
    }
    setProcessingId(null);
  };

  return (
    <div className="p-6 pb-32">
      <div className="mb-8">
        <h1 className="text-2xl font-black uppercase tracking-tighter">Settlement Center</h1>
        <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-[0.3em]">Pending Validations</p>
      </div>

      {/* Admin Tabs */}
      <div className="flex p-1.5 bg-slate-950 border border-slate-800 rounded-full mb-10">
        {(['deposits', 'withdrawals'] as RequestTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all relative ${
              activeTab === tab ? "text-slate-950" : "text-slate-500"
            }`}
          >
            <span className="relative z-10">{tab} Queue</span>
            {activeTab === tab && (
              <motion.div layoutId="reqTab" className="absolute inset-0 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/20" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center py-20 opacity-30">
            <Loader2 className="animate-spin text-yellow-500 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Accessing Ledger...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-[40px] border border-dashed border-slate-800">
            <SearchX className="mx-auto mb-4 text-slate-700" size={48} />
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No pending {activeTab}</p>
          </div>
        ) : (
          <AnimatePresence>
            {requests.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-slate-900/60 border border-slate-800 rounded-[35px] overflow-hidden"
              >
                {/* User Info Header */}
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800">
                      <User className="text-slate-500" size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-200">{req.users?.full_name || 'Unset'}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-bold">{req.users?.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Curr Balance</p>
                     <p className="text-xs font-black text-emerald-500">${Number(req.users?.main_balance).toFixed(2)}</p>
                  </div>
                </div>

                {/* Amount & Details */}
                <div className="p-6 space-y-5">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Request Amount</p>
                      <h2 className="text-3xl font-black font-mono text-yellow-500">${Number(req.amount).toFixed(2)}</h2>
                    </div>
                    <div className="text-[9px] text-slate-600 flex items-center gap-1 font-bold">
                       <Clock size={12} /> {new Date(req.created_at).toLocaleTimeString()}
                    </div>
                  </div>

                  {activeTab === 'deposits' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                          {req.payment_method || 'Legacy'}
                        </span>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Trx ID: <span className="text-slate-300">{req.trx_id}</span></p>
                      </div>
                      {req.screenshot_url && (
                        <button 
                          onClick={() => setSelectedProof(req.screenshot_url)} 
                          className="flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase hover:underline"
                        >
                          <ExternalLink size={12} /> View Payment Proof
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                      <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Target Wallet/Bank</p>
                      <p className="text-[11px] font-mono text-slate-300 break-all">{req.wallet_address}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-4 pt-2">
                    <button 
                      disabled={processingId === req.id}
                      onClick={() => handleAction(req.id, 'reject')}
                      className="flex-1 h-14 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      {processingId === req.id ? <Loader2 className="animate-spin" size={16} /> : <><X size={16} /> Reject</>}
                    </button>
                    <button 
                      disabled={processingId === req.id}
                      onClick={() => handleAction(req.id, 'approve')}
                      className="flex-[2] h-14 bg-emerald-500 text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-500/10"
                    >
                      {processingId === req.id ? <Loader2 className="animate-spin" size={16} /> : <><Check size={16} /> Approve</>}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Payment Proof Modal */}
      {selectedProof && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 w-[90%] max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-black uppercase text-slate-200">Payment Proof</h2>
              <button onClick={() => setSelectedProof(null)} className="text-slate-500 hover:text-slate-300">
                <X size={16} />
              </button>
            </div>
            <img src={selectedProof} alt="Payment Proof" className="rounded-lg border border-slate-800" />
          </div>
        </div>
      )}
    </div>
  );
}