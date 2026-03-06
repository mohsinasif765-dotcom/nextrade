"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";

const faqs = [
  {
    question: "What is NexTerminal?",
    answer: "NexTerminal is a virtual trading platform where you can practice trading cryptocurrencies, forex, and metals with virtual funds. It's designed for learning and honing trading skills without risking real money."
  },
  {
    question: "How do I deposit funds?",
    answer: "Click on the Deposit icon in the dashboard. Enter the amount you want to deposit and upload a screenshot of your USDT transaction. Our admin will verify and credit the virtual funds to your account."
  },
  {
    question: "How do I withdraw funds?",
    answer: "Use the Withdraw icon to request a withdrawal. Enter the amount and provide your wallet address. Withdrawals are processed after admin verification."
  },
  {
    question: "What is Bitcast trading?",
    answer: "Bitcast is our proprietary trading mode for Bitcoin with predefined timeframes and leverage options. It's optimized for quick trades and high-frequency strategies."
  },
  {
    question: "How do I start trading?",
    answer: "Navigate to the Trade screen from the dashboard. Select your market (Futures, Leverage, Bitcast, etc.), choose an asset, and place orders using the order panel."
  },
  {
    question: "Are there any fees?",
    answer: "As a virtual trading platform, there are no real fees. However, in the simulation, spreads and commissions may be applied to mimic real market conditions."
  },
  {
    question: "How do I view my positions and history?",
    answer: "In the Trade screen, use the bottom tabs to switch between Active Positions and Trade History. You can monitor your open trades and past transactions."
  },
  {
    question: "Is my data secure?",
    answer: "We use Supabase for secure data storage and authentication. All transactions are virtual and no real money is involved."
  },
  {
    question: "How do I contact support?",
    answer: "Use the Support icon in the dashboard to reach out to our team. We're here to help with any questions or issues."
  },
  {
    question: "Can I trade on mobile?",
    answer: "Yes, NexTerminal is fully responsive and works on mobile devices. Access all features from your smartphone or tablet."
  }
];

export default function FAQScreen() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpanded(expanded === index ? null : index);
  };

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
          <h1 className="text-xl font-black text-white tracking-tight">Nex<span className="text-emerald-400">Terminal</span></h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Frequently Asked Questions</p>
        </div>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      {/* FAQ List */}
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-[#09090b]/80 backdrop-blur-xl border border-slate-800/60 rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => toggleExpand(index)}
              className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <HelpCircle size={18} className="text-emerald-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-white">{faq.question}</span>
              </div>
              <motion.div
                animate={{ rotate: expanded === index ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={16} className="text-slate-400" />
              </motion.div>
            </button>
            
            <AnimatePresence>
              {expanded === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-4 pb-4"
                >
                  <p className="text-xs text-slate-300 leading-relaxed">{faq.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-500">
          Still have questions? Contact our support team.
        </p>
      </div>
    </div>
  );
}