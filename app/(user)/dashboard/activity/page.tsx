"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, ArrowUpRight, ArrowDownLeft, TrendingUp, DollarSign, Activity as ActivityIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Mock activity data - in real app, fetch from Supabase
const mockActivities = [
  {
    id: 1,
    type: 'deposit',
    amount: 1000,
    currency: 'USDT',
    status: 'completed',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    description: 'Deposit via USDT'
  },
  {
    id: 2,
    type: 'trade',
    amount: 250,
    currency: 'BTCUSDT',
    status: 'profit',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    description: 'BTC/USDT Futures Trade'
  },
  {
    id: 3,
    type: 'withdraw',
    amount: 500,
    currency: 'USDT',
    status: 'pending',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    description: 'Withdrawal to wallet'
  },
  {
    id: 4,
    type: 'trade',
    amount: -150,
    currency: 'ETHUSDT',
    status: 'loss',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    description: 'ETH/USDT Leverage Trade'
  },
  {
    id: 5,
    type: 'bonus',
    amount: 50,
    currency: 'USDT',
    status: 'completed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    description: 'Welcome Bonus'
  }
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'deposit': return ArrowDownLeft;
    case 'withdraw': return ArrowUpRight;
    case 'trade': return TrendingUp;
    case 'bonus': return DollarSign;
    default: return ActivityIcon;
  }
};

const getActivityColor = (type: string, status: string) => {
  if (type === 'trade') {
    return status === 'profit' ? 'text-emerald-400' : 'text-rose-400';
  }
  switch (type) {
    case 'deposit': return 'text-emerald-400';
    case 'withdraw': return 'text-rose-400';
    case 'bonus': return 'text-amber-400';
    default: return 'text-slate-400';
  }
};

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export default function ActivityScreen() {
  const router = useRouter();
  const [activities, setActivities] = useState(mockActivities);
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdraw' | 'trade' | 'bonus'>('all');

  // In real app, fetch from Supabase
  useEffect(() => {
    // const fetchActivities = async () => {
    //   const { data } = await supabase.from('user_activities').select('*').order('timestamp', { ascending: false });
    //   if (data) setActivities(data);
    // };
    // fetchActivities();
  }, []);

  const filteredActivities = filter === 'all' ? activities : activities.filter(a => a.type === filter);

  return (
    <div className="pt-6 px-4 pb-24 font-sans max-w-md mx-auto relative">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => router.back()} 
          className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-400" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-black text-white tracking-tight">Activity <span className="text-emerald-400">History</span></h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Your Recent Transactions</p>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-900/50 rounded-2xl p-1 mb-6">
        {[
          { id: 'all', label: 'All' },
          { id: 'deposit', label: 'Deposits' },
          { id: 'withdraw', label: 'Withdrawals' },
          { id: 'trade', label: 'Trades' },
          { id: 'bonus', label: 'Bonuses' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${
              filter === tab.id 
                ? "bg-slate-800 text-white shadow-md" 
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {filteredActivities.map((activity, index) => {
          const Icon = getActivityIcon(activity.type);
          const color = getActivityColor(activity.type, activity.status);
          
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#09090b]/80 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl bg-slate-800/50 flex items-center justify-center ${color}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={12} className="text-slate-500" />
                      <span className="text-xs text-slate-500">{formatTime(activity.timestamp)}</span>
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                        activity.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                        activity.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                        activity.status === 'profit' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`text-sm font-black ${color}`}>
                    {activity.amount > 0 ? '+' : ''}{activity.amount} {activity.currency}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredActivities.length === 0 && (
        <div className="text-center py-12">
          <ActivityIcon size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No activities found</p>
        </div>
      )}

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border border-emerald-500/20 rounded-2xl p-4"
      >
        <h3 className="text-sm font-bold text-white mb-2">Activity Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs text-slate-400">Total Deposits</p>
            <p className="text-lg font-black text-emerald-400">$1,050</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Withdrawals</p>
            <p className="text-lg font-black text-rose-400">$500</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}