"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { AlertOctagon, Wrench } from "lucide-react";

export default function SystemGuard({ children }: { children: React.ReactNode }) {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        // 1. Direct RPC Call for Maintenance Mode (Bypasses RLS)
        const { data: maintenanceStatus } = await supabase.rpc('check_maintenance_mode');
        setIsMaintenance(!!maintenanceStatus);

        // 2. Direct RPC Call for User Status (Bypasses RLS)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: isActive } = await supabase.rpc('check_user_active');
          // Agar isActive explicitly false hai, tabhi block karein
          setIsBlocked(isActive === false);
        }
      } catch (error) {
        console.error("System Guard Error:", error);
      }
    };

    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 15000);
    return () => clearInterval(interval);
  }, [supabase]);

  return (
    <>
      {children}

      {isMaintenance && (
        <div className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-24 h-24 bg-amber-500/10 rounded-[2rem] flex items-center justify-center border border-amber-500/20 mb-8 animate-pulse shadow-[0_0_50px_rgba(245,158,11,0.2)]">
            <Wrench className="text-amber-500" size={40} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter italic mb-4">
            System <span className="text-amber-500">Upgrade</span>
          </h1>
          <p className="text-slate-400 max-w-lg text-sm md:text-base font-medium leading-relaxed">
            NexTrade protocol is currently under scheduled maintenance. We are upgrading our core engine. Please check back shortly.
          </p>
        </div>
      )}

      {!isMaintenance && isBlocked && (
        <div className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-24 h-24 bg-rose-500/10 rounded-[2rem] flex items-center justify-center border border-rose-500/20 mb-8 animate-pulse shadow-[0_0_50px_rgba(243,24,64,0.2)]">
            <AlertOctagon className="text-rose-500" size={40} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter italic mb-4">
            Access <span className="text-rose-500">Denied</span>
          </h1>
          <p className="text-slate-400 max-w-lg text-sm md:text-base font-medium leading-relaxed">
            Your account has been restricted by the administrator. All trading functions are permanently frozen. Please contact our support team.
          </p>
        </div>
      )}
    </>
  );
}