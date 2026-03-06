"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

const termsSections = [
  {
    title: "1. Acceptance of Terms",
    content: "By accessing and using NexTerminal, you accept and agree to be bound by the terms and provision of this agreement."
  },
  {
    title: "2. Virtual Trading Platform",
    content: "NexTerminal is a virtual trading simulation platform. All trades are for educational and practice purposes only. No real money is involved."
  },
  {
    title: "3. User Responsibilities",
    content: "Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account."
  },
  {
    title: "4. Prohibited Activities",
    content: "Users may not use the platform for illegal activities, market manipulation, or any actions that violate applicable laws and regulations."
  },
  {
    title: "5. Intellectual Property",
    content: "All content, features, and functionality of NexTerminal are owned by us and are protected by copyright, trademark, and other intellectual property laws."
  },
  {
    title: "6. Limitation of Liability",
    content: "NexTerminal shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with the use of the platform."
  },
  {
    title: "7. Privacy Policy",
    content: "Your privacy is important to us. Please review our Privacy Policy, which also governs your use of NexTerminal, to understand our practices."
  },
  {
    title: "8. Termination",
    content: "We may terminate or suspend your account and access to the platform immediately, without prior notice, for any reason."
  },
  {
    title: "9. Governing Law",
    content: "These terms shall be interpreted and governed by the laws of the jurisdiction in which NexTerminal operates, without regard to conflict of law provisions."
  },
  {
    title: "10. Changes to Terms",
    content: "We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms."
  }
];

export default function TermsPage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);

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
          <h1 className="text-xl font-black text-white tracking-tight">Terms & <span className="text-emerald-400">Conditions</span></h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">NexTerminal Agreement</p>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#09090b]/80 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <FileText size={24} className="text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Legal Agreement</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          These Terms and Conditions govern your use of NexTerminal, a virtual trading platform. 
          By using our services, you agree to comply with these terms. Please read them carefully.
        </p>
      </motion.div>

      {/* Terms Sections */}
      <div className="space-y-4 mb-6">
        {termsSections.map((section, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-[#09090b]/80 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-4"
          >
            <h3 className="text-sm font-bold text-emerald-400 mb-2">{section.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{section.content}</p>
          </motion.div>
        ))}
      </div>

      {/* Acceptance Checkbox */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-[#09090b]/80 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            id="accept-terms"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="w-4 h-4 text-emerald-400 bg-slate-800 border-slate-600 rounded focus:ring-emerald-500 focus:ring-2"
          />
          <label htmlFor="accept-terms" className="text-sm text-slate-300">
            I have read and agree to the Terms and Conditions
          </label>
        </div>
        <button
          disabled={!accepted}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle size={18} />
          Accept Terms
        </button>
      </motion.div>

      {/* Footer Note */}
      <div className="text-center">
        <p className="text-xs text-slate-500">
          Last updated: March 5, 2026
        </p>
        <p className="text-xs text-slate-600 mt-1">
          For questions, contact our support team
        </p>
      </div>
    </div>
  );
}