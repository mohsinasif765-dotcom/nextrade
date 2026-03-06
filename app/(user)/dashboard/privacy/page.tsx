"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Eye, Lock, Database } from "lucide-react";
import { useRouter } from "next/navigation";

const privacySections = [
  {
    icon: Eye,
    title: "Information We Collect",
    content: "We collect information you provide directly to us, such as when you create an account, make deposits, or contact support. This includes your email, name, and transaction data."
  },
  {
    icon: Database,
    title: "How We Use Your Information",
    content: "We use your information to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and communicate with you about products and services."
  },
  {
    icon: Lock,
    title: "Information Sharing",
    content: "We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy or as required by law."
  },
  {
    icon: ShieldCheck,
    title: "Data Security",
    content: "We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction."
  },
  {
    title: "Cookies and Tracking",
    content: "We may use cookies and similar technologies to enhance your experience, analyze usage, and assist in our marketing efforts."
  },
  {
    title: "Third-Party Services",
    content: "Our platform may integrate with third-party services. We are not responsible for the privacy practices of these external services."
  },
  {
    title: "Children's Privacy",
    content: "Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13."
  },
  {
    title: "Changes to This Policy",
    content: "We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page."
  },
  {
    title: "Contact Us",
    content: "If you have any questions about this Privacy Policy, please contact us through our support channels."
  }
];

export default function PrivacyPage() {
  const router = useRouter();

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
          <h1 className="text-xl font-black text-white tracking-tight">Privacy <span className="text-emerald-400">Policy</span></h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Your Data Protection</p>
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
          <ShieldCheck size={24} className="text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Data Privacy Commitment</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          At NexTerminal, we are committed to protecting your privacy and personal information. 
          This Privacy Policy explains how we collect, use, and safeguard your data.
        </p>
      </motion.div>

      {/* Privacy Sections */}
      <div className="space-y-4 mb-6">
        {privacySections.map((section, index) => {
          const Icon = section.icon || ShieldCheck;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#09090b]/80 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-emerald-400">{section.title}</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{section.content}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Contact Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border border-emerald-500/20 rounded-3xl p-6"
      >
        <h3 className="text-sm font-bold text-white mb-2">Questions About Privacy?</h3>
        <p className="text-xs text-slate-300 mb-4">
          If you have any concerns about your privacy or how we handle your data, please don't hesitate to contact us.
        </p>
        <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm">
          Contact Privacy Team
        </button>
      </motion.div>

      {/* Footer Note */}
      <div className="text-center mt-6">
        <p className="text-xs text-slate-500">
          Effective Date: March 5, 2026
        </p>
        <p className="text-xs text-slate-600 mt-1">
          This policy may be updated periodically
        </p>
      </div>
    </div>
  );
}