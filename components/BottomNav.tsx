"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, BarChart2, ArrowUpDown, Wallet, Briefcase } from "lucide-react";
import Link from "next/link";

export default function BottomNav() {
  const pathname = usePathname();

  // Navigation Items for Trading App
  const navItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Market", href: "/dashboard/markets", icon: BarChart2 },
    // Center Button (Trade) - Nex-Trading Theme
    { name: "Trade", href: "/trade", icon: ArrowUpDown, isSpecial: true },
    { name: "Spot", href: "/dashboard/spot", icon: Wallet },
    { name: "Assets", href: "/dashboard/assets", icon: Briefcase },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      {/* Floating Glass Container */}
      <div className="flex items-center gap-1 bg-slate-950/90 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] px-2 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-md pointer-events-auto">
        
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          // Special Center Button Design (Emerald Neon)
          if (item.isSpecial) {
            return (
              <div key={item.name} className="relative -top-7 mx-2">
                <Link href={item.href}>
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-[0_10px_25px_rgba(16,185,129,0.4)] border-[6px] border-slate-950 transition-all"
                  >
                    <Icon className="text-slate-950" size={28} strokeWidth={2.5} />
                  </motion.div>
                </Link>
                {/* Visual Label for Center button */}
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  {item.name}
                </span>
              </div>
            );
          }

          // Normal Tabs
          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex-1 flex flex-col items-center justify-center py-3 cursor-pointer"
            >
              {/* Active Background Glow */}
              {isActive && (
                <motion.div
                  layoutId="nav-bubble"
                  className="absolute inset-0 bg-emerald-500/10 rounded-2xl"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              {/* Icon */}
              <div className={`relative z-10 transition-all duration-300 ${isActive ? "text-emerald-400 scale-110" : "text-slate-500 hover:text-slate-300"}`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              {/* Active Dot Indicator */}
              {isActive && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute bottom-1 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_10px_#34d399]"
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}