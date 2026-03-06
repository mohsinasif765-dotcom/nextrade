"use client";
import { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, Send, Image as ImageIcon, Loader2, 
  MessageSquare, Clock, CheckCircle2, AlertCircle, X 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SupportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  
  // Form State
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setFetching(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) setTickets(data);
    }
    setFetching(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      let screenshotUrl = "";

      // 1. Upload Screenshot if exists
      if (screenshot) {
        const fileName = `${user.id}/${Date.now()}-${screenshot.name}`;
        const { error: uploadError } = await supabase.storage
          .from('support-attachments')
          .upload(fileName, screenshot);
        
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('support-attachments')
          .getPublicUrl(fileName);
        
        screenshotUrl = publicUrl;
      }

      // 2. Insert Ticket into DB
      const { error: dbError } = await supabase
        .from('support_tickets')
        .insert([{
          user_id: user.id,
          user_email: user.email,
          message: message,
          screenshot_url: screenshotUrl,
          status: 'pending'
        }]);

      if (dbError) throw dbError;

      setMessage("");
      setScreenshot(null);
      setPreview("");
      fetchTickets();
      alert("Ticket submitted successfully");

    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight italic">Support Center</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Protocol Assistance Terminal</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* --- Left Side: Submission Form --- */}
        <div className="space-y-6">
          <div className="bg-[#09090b] border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-emerald-400">
              <MessageSquare size={20} /> New Inquiry
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Describe your issue</label>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please describe your issue in detail..."
                  className="w-full h-40 bg-slate-950 border border-slate-800 rounded-3xl p-5 outline-none focus:border-emerald-500/50 transition-all text-sm resize-none"
                  required
                />
              </div>

              {/* Screenshot Upload Box */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Attachment (Optional)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative h-32 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-900/30 transition-all overflow-hidden"
                >
                  {preview ? (
                    <img src={preview} className="w-full h-full object-cover opacity-50" />
                  ) : (
                    <>
                      <ImageIcon className="text-slate-600" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Click to add screenshot</span>
                    </>
                  )}
                  {preview && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setPreview(""); setScreenshot(null); }}
                      className="absolute top-2 right-2 p-1 bg-red-500 rounded-full"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>

              <button 
                disabled={loading || !message}
                className="w-full h-16 bg-emerald-500 text-slate-950 font-black uppercase rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Send Ticket</>}
              </button>
            </form>
          </div>
        </div>

        {/* --- Right Side: Ticket History --- */}
        <div className="space-y-6">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-2">Ticket History</h2>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {fetching ? (
              <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-slate-700" /></div>
            ) : tickets.length === 0 ? (
              <div className="bg-slate-900/20 border border-slate-800/50 rounded-3xl p-10 text-center">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No tickets found</p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <motion.div 
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#09090b] border border-slate-800 rounded-3xl p-6 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {ticket.status === 'pending' ? (
                        <Clock className="text-amber-500" size={14} />
                      ) : (
                        <CheckCircle2 className="text-emerald-500" size={14} />
                      )}
                      <span className={`text-[10px] font-black uppercase tracking-widest ${ticket.status === 'pending' ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-600 font-bold">{new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-slate-200 leading-relaxed">{ticket.message}</p>
                    {ticket.screenshot_url && (
                      <a href={ticket.screenshot_url} target="_blank" className="inline-flex items-center gap-2 text-[10px] text-blue-400 font-bold hover:underline mt-2">
                        <ImageIcon size={12} /> View Attachment
                      </a>
                    )}
                  </div>

                  {/* Admin Reply Section */}
                  <AnimatePresence>
                    {ticket.admin_reply ? (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-4 pt-4 border-t border-slate-800"
                      >
                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl">
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Admin Response</p>
                          <p className="text-xs text-slate-300 leading-relaxed">{ticket.admin_reply}</p>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <p className="text-[9px] text-slate-600 italic">Waiting for admin response...</p>
                      </div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}