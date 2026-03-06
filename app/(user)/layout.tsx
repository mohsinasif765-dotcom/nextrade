import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import SystemGuard from "@/components/SystemGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex bg-[#0F172A]">
      
      {/* SystemGuard Wrapper - Sirf Dashboard area ko monitor karega */}
      <SystemGuard>
        
        {/* Desktop Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Content */}
          <main className="flex-1 relative z-10 pb-24 lg:pb-6 overflow-y-auto">
            <div className="w-full lg:max-w-7xl mx-auto">
              {children}
            </div>
          </main>

          {/* Mobile Bottom Navigation */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
            <BottomNav />
          </div>
        </div>
        
        {/* NexTrade Signature Gradient (Mobile Only) */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md h-32 bg-gradient-to-t from-yellow-500/5 to-transparent pointer-events-none z-0 lg:hidden" />
      
      </SystemGuard>
    </div>
  );
}