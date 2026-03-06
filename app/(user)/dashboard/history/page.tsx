"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, ArrowUpRight, ArrowDownLeft, 
  History, Filter, Loader2, Calendar, 
  AlertCircle
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type FilterType = 'all' | 'deposit' | 'withdrawal' | 'trade';

export default function HistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterType>('all');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 15;

  const fetchTransactions = useCallback(async (currentFilter: FilterType, currentPage: number, isInitial = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

    // Dynamic Filter Logic
    if (currentFilter === 'trade') {
      query = query.in('type', ['trade_profit', 'trade_loss']);
    } else if (currentFilter !== 'all') {
      query = query.eq('type', currentFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database Error:", error.message);
    }

    if (data) {
      console.log("Real Data Fetched:", data); // Isay check karein console mein
      if (isInitial) {
        setTransactions(data);
      } else {
        setTransactions(prev => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    setPage(0);
    fetchTransactions(activeTab, 0, true);
  }, [activeTab, fetchTransactions]);

  // Lazy Loading Logic
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLElement | null) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setLoadingMore(true);
        setPage(prev => {
          const nextPage = prev + 1;
          fetchTransactions(activeTab, nextPage);
          return nextPage;
        });
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, activeTab, fetchTransactions]);

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'completed': return 'text-emerald-500 bg-emerald-500/10';
      case 'pending': return 'text-yellow-500 bg-yellow-500/10';
      case 'failed': return 'text-rose-500 bg-rose-500/10';
      default: return 'text-slate-500 bg-slate-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 pb-24 font-sans selection:bg-brand/20">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-3 bg-slate-900 border border-border-subtle rounded-[20px] active:scale-90 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">Ledger</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Real-time History</p>
          </div>
        </div>
        <div className="p-3 bg-slate-900 border border-border-subtle rounded-[20px]">
          <History size={20} className="text-brand" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-10 pb-2">
        {(['all', 'deposit', 'withdrawal', 'trade'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
              activeTab === tab 
              ? "bg-brand text-background shadow-yellow-glow" 
              : "bg-slate-900 text-slate-500 border border-border-subtle"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List Area */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="text-[10px] uppercase font-bold tracking-[0.3em]">Querying Database...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 rounded-[40px] border border-border-subtle border-dashed">
             <AlertCircle className="mx-auto mb-4 text-slate-700" size={48} />
             <p className="text-slate-500 text-xs font-bold uppercase tracking-widest px-10">No transactions recorded yet</p>
          </div>
        ) : (
          transactions.map((tx, index) => (
            <motion.div
              key={tx.id}
              ref={index === transactions.length - 1 ? lastElementRef : null}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/40 border border-border-subtle p-5 rounded-[28px] flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                tx.type.includes('profit') || tx.type === 'deposit' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
              }`}>
                {tx.type.includes('profit') || tx.type === 'deposit' ? 
                  <ArrowUpRight className="text-emerald-500" size={20} /> : 
                  <ArrowDownLeft className="text-rose-500" size={20} />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {tx.type.replace('_', ' ')}
                  </p>
                  <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${getStatusStyle(tx.status)}`}>
                    {tx.status}
                  </span>
                </div>
                <h3 className="text-xs font-bold truncate text-slate-200">{tx.description}</h3>
                <div className="flex items-center gap-2 text-[9px] text-slate-600 mt-1 uppercase font-black tracking-tighter">
                  <Calendar size={10} />
                  {new Date(tx.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="text-right">
                <p className={`text-sm font-black font-mono ${
                  tx.type.includes('profit') || tx.type === 'deposit' ? 'text-emerald-400' : 'text-rose-500'
                }`}>
                  {tx.type.includes('profit') || tx.type === 'deposit' ? '+' : '-'}${Number(tx.amount || 0).toFixed(2)}
                </p>
              </div>
            </motion.div>
          ))
        )}
        
        {loadingMore && (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-brand" size={24} />
          </div>
        )}
      </div>
    </div>
  );
}