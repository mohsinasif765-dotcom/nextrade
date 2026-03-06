"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ArrowRight, Activity, Menu, X } from 'lucide-react';

// Simple Icons as SVG components to keep it dependency-free
const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
);

const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
);

const ZapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
);

export default function LandingPage() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Mobile Menu State

  // Scroll logic for premium navbar effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // PWA Install Prompt Logic
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setInstallPrompt(null);
      console.log('PWA was installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  // VIP Install Button Component for reuse
  const InstallButton = ({ isMobile = false, isHeader = false }) => {
    if (!installPrompt) return null;

    return (
      <button 
        onClick={handleInstallClick}
        className={`relative group flex items-center justify-center gap-2 font-black uppercase tracking-widest transition-all active:scale-95 ${
          isMobile 
            ? "w-full py-4 mt-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 rounded-2xl text-xs shadow-[0_0_30px_rgba(251,191,36,0.3)]" 
            : isHeader 
              ? "px-3 py-2 md:px-5 md:py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 rounded-full text-[10px] md:text-xs shadow-[0_0_20px_rgba(251,191,36,0.3)] shrink-0"
              : "px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 rounded-full text-xs shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)]"
        }`}
      >
        <Download size={isHeader ? 14 : 16} className={isMobile ? "animate-bounce" : ""} />
        <span className={isHeader ? "hidden sm:inline" : ""}>Install App</span>
        <div className="absolute inset-0 rounded-full border border-white/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans overflow-x-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />

      {/* 1. Header / Navbar - Fixed Responsiveness */}
      <header className={`fixed top-0 w-full z-[100] transition-all duration-300 ${isScrolled || isMenuOpen ? 'bg-[#09090b]/95 backdrop-blur-md border-b border-slate-800/50 py-3' : 'bg-transparent py-5'}`}>
        <nav className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800 shadow-inner">
              <Activity className="text-emerald-400" size={18} />
            </div>
            <span className="text-lg md:text-2xl font-black text-white tracking-tighter italic">Nex<span className="text-emerald-400">Trade</span></span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
            <Link href="#" className="hover:text-emerald-400 transition-colors">Markets</Link>
            <Link href="#" className="hover:text-emerald-400 transition-colors">Futures</Link>
            <Link href="#" className="hover:text-emerald-400 transition-colors">Earn</Link>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <InstallButton isHeader={true} />
            
            <Link href="/login" className="hidden sm:block text-[10px] md:text-xs font-black uppercase tracking-widest px-4 md:px-6 py-2 md:py-2.5 bg-emerald-500 text-slate-950 rounded-full hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 whitespace-nowrap">
              Terminal
            </Link>

            {/* Mobile Hamburger Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-[#09090b] border-b border-slate-800 overflow-hidden"
            >
              <div className="flex flex-col p-6 gap-6 text-sm font-bold uppercase tracking-[0.2em] text-center">
                <Link href="#" onClick={() => setIsMenuOpen(false)} className="text-slate-300 hover:text-emerald-400">Markets</Link>
                <Link href="#" onClick={() => setIsMenuOpen(false)} className="text-slate-300 hover:text-emerald-400">Futures</Link>
                <Link href="#" onClick={() => setIsMenuOpen(false)} className="text-slate-300 hover:text-emerald-400">Earn</Link>
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">Sign In</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 2. Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-40 pb-20 md:pt-48 md:pb-32 text-center flex flex-col items-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-widest mb-8"
        >
          <ZapIcon />
          <span className="text-[10px] sm:text-xs">Next Generation Virtual Trading Engine</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-8xl font-black tracking-tighter leading-[1.1] max-w-5xl"
        >
          Master the Markets <br className="hidden md:block"/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 italic">Without the Risk.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 text-base md:text-xl text-slate-400 max-w-2xl leading-relaxed font-medium"
        >
          Unlock your trading potential with NexTrade's institutional-grade platform. Execute strategies across Crypto, Forex, and Metals with zero capital exposure.
        </motion.p>
        
        {/* MAIN CTA BUTTONS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2">
            Initialize Terminal <ArrowRight size={18} />
          </Link>
          
          {/* Mobile Install Button */}
          <div className="w-full sm:hidden">
            <InstallButton isMobile={true} />
          </div>
        </motion.div>

        {/* Stylized Chart Visual Placeholder */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-20 w-full aspect-[16/9] md:aspect-[21/9] bg-[#09090b] rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-800 p-4 md:p-10 shadow-2xl shadow-emerald-500/5 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent z-10"></div>
          
          <div className="absolute bottom-10 left-0 right-0 h-40 md:h-64 opacity-60 group-hover:opacity-100 transition-opacity duration-700">
            <svg viewBox="0 0 100 20" className="w-full h-full drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" preserveAspectRatio="none">
              <path d="M0,20 L10,15 L20,18 L30,10 L40,12 L50,5 L60,8 L70,2 L80,6 L90,1 L100,3 L100,20 Z" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth="0.5" />
            </svg>
          </div>
          
          <div className="flex justify-between items-start relative z-20">
            <div className="text-left bg-slate-900/50 backdrop-blur-md border border-slate-800 p-3 md:p-4 rounded-xl md:rounded-2xl">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BTC/USDT Perpetual</div>
              </div>
              <div className="text-xl md:text-5xl font-black text-white font-mono">69,420.00</div>
              <span className="text-emerald-400 font-bold text-xs mt-1 inline-block">+5.67% (24H)</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* 3. Features Section */}
      <section className="bg-[#09090b] py-20 md:py-32 border-t border-slate-800/50 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter italic">Engineered for <span className="text-emerald-400">Precision</span></h2>
            <p className="mt-4 text-slate-400 font-medium max-w-2xl mx-auto">Experience institutional-grade tools and lightning-fast execution in a completely risk-free environment.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border border-slate-800 bg-[#020617] p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-all">
                <TrendingUpIcon />
              </div>
              <h3 className="mt-8 text-2xl font-black tracking-tight">Multi-Asset Platform</h3>
              <p className="mt-4 text-slate-400 leading-relaxed text-sm font-medium">Trade popular Cryptocurrencies, major Forex pairs, and precious Metals all in one unified interface with real-time aggregated price feeds.</p>
            </div>
            
            <div className="border border-slate-800 bg-[#020617] p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-all">
                <ZapIcon />
              </div>
              <h3 className="mt-8 text-2xl font-black tracking-tight">Virtual Trade Engine</h3>
              <p className="mt-4 text-slate-400 leading-relaxed text-sm font-medium">Perfect your strategies using our advanced virtual matching engine. Experience real market volatility and speed with zero financial commitment.</p>
            </div>

            <div className="border border-slate-800 bg-[#020617] p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-all">
                <ShieldCheckIcon />
              </div>
              <h3 className="mt-8 text-2xl font-black tracking-tight">Managed Outcomes</h3>
              <p className="mt-4 text-slate-400 leading-relaxed text-sm font-medium">A secure and controlled B-Book environment where trading scenarios are efficiently managed by our robust administrative backend architecture.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="border-t border-slate-800/80 py-12 bg-[#020617] relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-600 text-[10px] md:text-xs font-bold uppercase tracking-widest">
          <p>&copy; 2026 NexTrade Protocol. All rights reserved.</p>
          <p className="mt-3 text-slate-700">This is a simulated virtual trading environment.</p>
        </div>
      </footer>
    </div>
  );
}