"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  GitPullRequest, 
  Activity, 
  Settings,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Stats", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Requests", href: "/admin/requests", icon: GitPullRequest, isSpecial: true },
    { name: "Live Trades", href: "/admin/trades", icon: Activity },
    { name: "Config", href: "/admin/settings", icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[280px] h-screen fixed left-0 top-0 bg-slate-950/80 backdrop-blur-2xl border-r border-slate-800 z-50">
      {/* Sidebar Header */}
      <div className="p-8 flex items-center gap-3 border-b border-slate-800/50">
        <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20">
          <ShieldCheck className="text-yellow-500" size={20} />
        </div>
        <div>
          <h2 className="text-xl font-black text-white tracking-tighter italic">Nex<span className="text-yellow-500">Admin</span></h2>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Protocol Terminal</p>
        </div>
      </div>

      {/* Sidebar Links */}
      <div className="flex-1 py-8 px-6 space-y-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isSpecial) {
            return (
              <div key={item.name} className="py-4">
                <Link href={item.href} className="block group">
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 p-[2px] transition-all hover:shadow-[0_0_30px_rgba(252,213,53,0.3)]">
                    <div className="bg-slate-950 px-4 py-4 rounded-[14px] flex items-center gap-4 group-hover:bg-slate-900/50 transition-colors">
                      <Icon className="text-yellow-500" size={20} strokeWidth={2.5} />
                      <span className="text-sm font-black uppercase tracking-widest text-yellow-500">
                        {item.name}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group"
            >
              {isActive && (
                <motion.div
                  layoutId="admin-sidebar-active"
                  className="absolute inset-0 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className={`relative z-10 transition-colors ${isActive ? "text-yellow-500" : "text-slate-500 group-hover:text-slate-300"}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`relative z-10 text-xs font-bold uppercase tracking-widest transition-colors ${isActive ? "text-yellow-500" : "text-slate-500 group-hover:text-slate-300"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Sidebar Footer Glow */}
      <div className="h-32 bg-gradient-to-t from-yellow-500/5 to-transparent pointer-events-none" />
    </aside>
  );
}