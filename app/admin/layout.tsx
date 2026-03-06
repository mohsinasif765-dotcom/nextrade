import AdminBottomNav from "@/components/AdminBottomNav";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex bg-[#0F172A]">
      
      {/* Desktop Admin Sidebar (Hidden on Mobile) */}
      <AdminSidebar />

      {/* Main Layout Area - Margin left added for desktop to accommodate sidebar */}
      <div className="flex-1 flex flex-col w-full lg:ml-[280px] min-h-screen relative overflow-x-hidden">
        
        {/* Content Area */}
        <main className="flex-1 relative z-10 pb-32 lg:pb-10 px-4 lg:px-8">
          {/* Admin Badge Indicator */}
          <div className="flex justify-center pt-4 lg:pt-8 mb-6">
             <div className="bg-yellow-500/10 border border-yellow-500/20 px-4 py-1 rounded-full">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500">NexTrade Admin Node</span>
             </div>
          </div>
          
          {children}
        </main>

        {/* Mobile Admin Specific Navigation (Hidden on Desktop via Wrapper) */}
        <div className="block lg:hidden">
          <AdminBottomNav />
        </div>
        
        {/* Admin Background Glow (Yellowish) - Hidden on desktop as sidebar handles glow */}
        <div className="fixed lg:hidden bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md h-40 bg-gradient-to-t from-yellow-500/5 to-transparent pointer-events-none z-0" />
      </div>
    </div>
  );
}