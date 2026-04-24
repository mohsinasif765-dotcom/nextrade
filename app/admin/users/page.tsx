"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Users, Mail, Loader2, 
  SearchX, Ban, CheckCircle, Wallet, Edit2, Save, X
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type UserTab = 'active' | 'blocked';

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<UserTab>('active');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editBalanceValue, setEditBalanceValue] = useState<string>("");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('admin_get_users', {
        tab_status: activeTab === 'active',
        search_text: searchQuery || ''
      });
      if (!error) setUsers(data || []);
      setLoading(false);
    };

    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [activeTab, searchQuery]);

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId);
    const { error } = await supabase.rpc('admin_toggle_user', {
      target_user_id: userId,
      new_status: !currentStatus
    });

    if (!error) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
    setActionLoading(null);
  };

  const handleUpdateBalance = async (userId: string) => {
    if (isNaN(parseFloat(editBalanceValue))) return;
    
    setActionLoading(userId);
    const { error } = await supabase.rpc('admin_update_balance', {
      target_user_id: userId,
      new_balance: parseFloat(editBalanceValue)
    });

    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, main_balance: parseFloat(editBalanceValue) } : u));
      setEditingUserId(null);
    }
    setActionLoading(null);
  };

  return (
    <div className="min-h-screen p-4 md:p-6 pb-32">
      {/* Header Area */}
      <div className="space-y-6 mb-8">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-white">User Directory</h1>
          <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-[0.3em]">Total Registry: {users.length}</p>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 text-sm text-white outline-none focus:border-yellow-500/50 transition-all font-medium"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-slate-950/80 border border-slate-800 rounded-full mb-8">
        {(['active', 'blocked'] as UserTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all relative ${
              activeTab === tab ? "text-slate-950" : "text-slate-500"
            }`}
          >
            <span className="relative z-10">{tab}</span>
            {activeTab === tab && (
              <motion.div 
                layoutId="adminUserTab" 
                className="absolute inset-0 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/20" 
              />
            )}
          </button>
        ))}
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-30 text-white">
            <Loader2 className="animate-spin text-yellow-500 mb-4" size={40} />
            <p className="text-[10px] font-bold uppercase tracking-widest">Accessing Secure Records...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-[40px] border border-dashed border-slate-800">
            <SearchX className="mx-auto mb-4 text-slate-700" size={48} />
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No results in {activeTab} vault</p>
          </div>
        ) : (
          <AnimatePresence>
            {users.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900/60 border border-slate-800 p-4 md:p-5 rounded-[30px] space-y-4 overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3">
                  {/* User Info Container - min-w-0 is the fix */}
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700 shadow-inner overflow-hidden">
                      {user.profile_image_url ? (
                        <img src={user.profile_image_url} className="w-full h-full object-cover" alt="Profile" />
                      ) : (
                        <Users className="text-slate-500" size={20} />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-slate-100 truncate">
                        {user.full_name || 'Anonymous User'}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1 truncate">
                        <Mail size={10} className="shrink-0" /> 
                        <span className="truncate">{user.email}</span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Badges - shrink-0 to prevent compression */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${user.kyc_status === 'verified' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                      {user.kyc_status}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`} />
                  </div>
                </div>

                {/* Bottom Actions Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50 flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Wallet size={14} className="text-yellow-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[8px] text-slate-600 font-black uppercase tracking-tighter truncate">Net Balance</p>
                        {editingUserId === user.id ? (
                          <input 
                            type="number"
                            value={editBalanceValue}
                            onChange={(e) => setEditBalanceValue(e.target.value)}
                            className="bg-transparent border-b border-yellow-500 text-xs font-bold font-mono text-emerald-400 outline-none w-20"
                            autoFocus
                          />
                        ) : (
                          <p className="text-xs font-bold font-mono text-emerald-400 truncate">${Number(user.main_balance).toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {editingUserId === user.id ? (
                        <>
                          <button 
                            onClick={() => handleUpdateBalance(user.id)}
                            className="p-1 hover:bg-emerald-500/20 rounded-md text-emerald-500 transition-colors"
                          >
                            <Save size={14} />
                          </button>
                          <button 
                            onClick={() => setEditingUserId(null)}
                            className="p-1 hover:bg-rose-500/20 rounded-md text-rose-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => {
                            setEditingUserId(user.id);
                            setEditBalanceValue(user.main_balance.toString());
                          }}
                          className="p-1 hover:bg-slate-800 rounded-md text-slate-500 hover:text-yellow-500 transition-colors"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  <button 
                    disabled={actionLoading === user.id}
                    onClick={() => toggleUserStatus(user.id, user.is_active)}
                    className={`rounded-2xl border flex items-center justify-center gap-2 transition-all active:scale-95 px-2 py-3 ${
                      user.is_active 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white' 
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                    }`}
                  >
                    {actionLoading === user.id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : user.is_active ? (
                      <><Ban size={14} /> <span className="text-[10px] font-black uppercase">Block</span></>
                    ) : (
                      <><CheckCircle size={14} /> <span className="text-[10px] font-black uppercase">Activate</span></>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}