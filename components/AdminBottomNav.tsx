"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  GitPullRequest, 
  Activity, 
  Settings 
} from "lucide-react";
import Link from "next/link";

export default function AdminBottomNav() {
  const pathname = usePathname();

  // Admin Navigation Items
  const navItems = [
    { name: "Stats", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    // Center Button (Requests - KYC/Deposit/Withdraw)
    { name: "Requests", href: "/admin/requests", icon: GitPullRequest, isSpecial: true },
    { name: "Live Trades", href: "/admin/trades", icon: Activity },
    { name: "Config", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      {/* Floating Glass Container - Admin Gold Theme */}
      <div className="flex items-center gap-1 bg-slate-950/90 backdrop-blur-2xl border border-yellow-500/10 rounded-[2.5rem] px-2 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)] w-full max-w-md pointer-events-auto">
        
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          // Special Center Button Design (NexTrade Gold Neon)
          if (item.isSpecial) {
            return (
              <div key={item.name} className="relative -top-7 mx-2">
                <Link href={item.href}>
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="h-16 w-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-[0_10px_25px_rgba(252,213,53,0.3)] border-[6px] border-slate-950 transition-all"
                  >
                    <Icon className="text-slate-950" size={28} strokeWidth={2.5} />
                  </motion.div>
                </Link>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest text-yellow-500">
                  {item.name}
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex-1 flex flex-col items-center justify-center py-3 cursor-pointer"
            >
              {isActive && (
                <motion.div
                  layoutId="admin-nav-bubble"
                  className="absolute inset-0 bg-yellow-500/10 rounded-2xl"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              <div className={`relative z-10 transition-all duration-300 ${isActive ? "text-yellow-500 scale-110" : "text-slate-500 hover:text-slate-300"}`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              {isActive && (
                <motion.div
                  layoutId="admin-nav-dot"
                  className="absolute bottom-1 w-1.5 h-1.5 bg-yellow-500 rounded-full shadow-[0_0_10px_#fcd535]"
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}