"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Home, BarChart2, ArrowUpDown, Wallet, Briefcase, 
  User, LogOut, Settings, FileText, HelpCircle, ChevronDown 
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        setUser(data);
      }
    };
    getUser();
  }, []);

  const navItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Markets", href: "/dashboard/markets", icon: BarChart2 },
    { name: "Trade", href: "/trade", icon: ArrowUpDown },
    { name: "Spot", href: "/dashboard/spot", icon: Wallet },
    { name: "Assets", href: "/dashboard/assets", icon: Briefcase },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="hidden lg:flex lg:w-64 bg-[#09090b]/80 backdrop-blur-xl border-r border-slate-800/60 h-screen flex-col sticky top-0 z-40">
      
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-800/60">
        <h1 className="text-xl font-black text-white tracking-tight">
          Nex<span className="text-emerald-400">Terminal</span>
        </h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
          Virtual Trading Engine
        </p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link key={item.name} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                }`}
              >
                <Icon size={18} strokeWidth={2} />
                <span className="text-sm font-semibold">{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 rounded-r-full"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-slate-800/60 p-4 space-y-3">
        {user && (
          <motion.button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            whileHover={{ opacity: 0.8 }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/30 hover:bg-slate-700/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center">
                {user?.profile_image_url ? (
                  <img 
                    src={user.profile_image_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={16} className="text-slate-400" />
                )}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white truncate">{user?.full_name || "User"}</p>
                <p className="text-[10px] text-slate-500">{user?.email}</p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown size={16} className="text-slate-400" />
            </motion.div>
          </motion.button>
        )}

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-1"
            >
              <SidebarMenuBtn
                icon={<User size={16} />}
                label="Profile"
                onClick={() => {
                  router.push("/dashboard/profile");
                  setIsMenuOpen(false);
                }}
              />
              <SidebarMenuBtn
                icon={<FileText size={16} />}
                label="Terms"
                onClick={() => {
                  router.push("/dashboard/terms");
                  setIsMenuOpen(false);
                }}
              />
              <SidebarMenuBtn
                icon={<HelpCircle size={16} />}
                label="Support"
                onClick={() => {
                  router.push("/dashboard/support");
                  setIsMenuOpen(false);
                }}
              />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors text-sm font-medium"
              >
                <LogOut size={16} /> Logout
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="border-t border-slate-800/60 p-4 text-center">
        <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">
          v1.0.0 • Always Virtual
        </p>
      </div>
    </aside>
  );
}

// Helper Component
function SidebarMenuBtn({ icon, label, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/30 transition-colors text-sm font-medium"
    >
      {icon}
      {label}
    </button>
  );
}

// For animation imports
import { AnimatePresence } from "framer-motion";
