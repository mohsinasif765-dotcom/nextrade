"use client";
import { useState, useEffect } from "react";
import { 
  ShieldCheck, MessageSquare, Image as ImageIcon, 
  Send, Loader2, User, Clock, CheckCircle2, ExternalLink, Search 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminSupportPage() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [submittingId, setSubmittingId] = useState<string | null>(null); // Only for button loading
  const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({}); // Store text for each ticket separately
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const fetchTickets = async () => {
    setLoading(true);
    let query = supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    
    if (filter !== "all") {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    if (data) setTickets(data);
    setLoading(false);
  };

  const handleSendReply = async (ticketId: string) => {
    const text = replyTexts[ticketId];
    if (!text || !text.trim()) {
      alert("Please write a reply!");
      return;
    }

    setSubmittingId(ticketId);
  
    try {
      // Log to check if the call is being made
      console.log("Sending reply for ticket:", ticketId);

      const { data, error } = await supabase
        .from('support_tickets')
        .update({ 
          admin_reply: text, 
          status: 'resolved' 
        })
        .eq('id', ticketId)
        .select(); // .select() confirms if the row was updated

      if (error) {
        console.error("Supabase Error:", error);
        alert("Database Error: " + error.message);
      } else if (data && data.length === 0) {
        // If no error but data is empty, it means RLS is blocking the update
        alert("RLS Blocked: You do not have permission to update this ticket.");
      } else {
        alert("Reply Sent Successfully!");
        setReplyTexts(prev => {
          const newState = { ...prev };
          delete newState[ticketId];
          return newState;
        });
        fetchTickets(); // Refresh list to move ticket to resolved
      }
    } catch (err: any) {
      alert("System Crash: " + err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleTextChange = (ticketId: string, value: string) => {
    setReplyTexts(prev => ({
      ...prev,
      [ticketId]: value
    }));
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-8 font-sans">
      {/* Admin Header */}
      <div className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <ShieldCheck className="text-emerald-500" size={32} /> Support Control
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-2">Central Ticket Management System</p>
        </div>

        <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800">
          {['pending', 'resolved', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === tab ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket List */}
      <div className="max-w-6xl mx-auto space-y-6">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-[40px]">
            <p className="text-slate-600 font-bold uppercase text-xs tracking-widest">No tickets in this sector</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#09090b] border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-8 grid md:grid-cols-[1fr_300px] gap-8">
                {/* Left: Content */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-emerald-500 border border-slate-800">
                      <User size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">{ticket.user_email}</h3>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{new Date(ticket.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-900">
                    <p className="text-sm text-slate-300 leading-relaxed italic">"{ticket.message}"</p>
                  </div>

                  {/* Reply Input */}
                  {ticket.status === 'pending' && (
                    <div className="space-y-3">
                      <textarea
                        placeholder="Write your response here..."
                        value={replyTexts[ticket.id] || ""}
                        onChange={(e) => handleTextChange(ticket.id, e.target.value)}
                        className="w-full h-24 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs outline-none focus:border-emerald-500/50 transition-all resize-none text-white"
                      />
                      <button 
                        onClick={() => handleSendReply(ticket.id)}
                        disabled={submittingId === ticket.id || !replyTexts[ticket.id]}
                        className="h-12 px-8 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center gap-2 hover:bg-emerald-400 transition-all disabled:opacity-50"
                      >
                        {submittingId === ticket.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <><Send size={14} /> Dispatch Reply</>
                        )}
                      </button>
                    </div>
                  )}

                  {ticket.admin_reply && (
                    <div className="border-t border-slate-800 pt-6">
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-3">Previous Response</p>
                      <p className="text-xs text-slate-400">{ticket.admin_reply}</p>
                    </div>
                  )}
                </div>

                {/* Right: Media & Status */}
                <div className="space-y-6 border-l border-slate-800/50 pl-8 hidden md:block">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Attachment</span>
                    {ticket.screenshot_url && (
                      <a href={ticket.screenshot_url} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-white transition-colors">
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>

                  {ticket.screenshot_url ? (
                    <div className="relative group rounded-2xl overflow-hidden border border-slate-800 h-40 bg-slate-950">
                      <img 
                        src={ticket.screenshot_url} 
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                        alt="Screenshot" 
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/40 pointer-events-none">
                        <ImageIcon size={24} />
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center gap-2">
                      <ImageIcon className="text-slate-800" size={24} />
                      <span className="text-[8px] font-black text-slate-800 uppercase">No Media</span>
                    </div>
                  )}

                  <div className="pt-4">
                    <div className={`w-full py-3 rounded-xl border flex items-center justify-center gap-2 ${
                      ticket.status === 'pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    }`}>
                      {ticket.status === 'pending' ? <Clock size={12} /> : <CheckCircle2 size={12} />}
                      <span className="text-[10px] font-black uppercase tracking-widest">{ticket.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}