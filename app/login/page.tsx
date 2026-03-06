"use client";
import { useState, useEffect } from "react";
import { Mail, Lock, User, ArrowRight, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NeonInput from "@/components/NeonInput";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

// Initialize Supabase SSR Browser Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export default function LoginPage() {
  const router = useRouter();
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // Login States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Registration States
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [strength, setStrength] = useState(0);

  // --- OTP STATES (Updated for 8 Digits) ---
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [timer, setTimer] = useState(120); // 2 minutes
  const [canResend, setCanResend] = useState(false);

  // Initial Config Log
  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("CONFIG ERROR: Check your .env.local file!");
    } else {
      console.log("NexTrading System: Supabase Client Connected.");
    }
  }, []);

  // --- OTP TIMER LOGIC ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showOtpScreen && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [showOtpScreen, timer]);

  const toggleForm = () => {
    setIsFlipped(!isFlipped);
    setPassword("");
    setConfirmPassword("");
    setMessage({ text: "", type: "" });
    console.log("UI: Switched to", !isFlipped ? "Signup" : "Login");
  };

  // Password Strength Logic
  useEffect(() => {
    let s = 0;
    if (password.length > 5) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    if (password.length > 10) s++;
    setStrength(s);
  }, [password]);

  const strengthConfig = [
    { label: "Very Weak", color: "bg-red-600", width: "20%" },
    { label: "Weak", color: "bg-orange-500", width: "40%" },
    { label: "Fair", color: "bg-yellow-500", width: "60%" },
    { label: "Good", color: "bg-blue-500", width: "80%" },
    { label: "Strong", color: "bg-emerald-500", width: "100%" },
  ];

  // --- LOGIN HANDLER ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Processing Login for:", loginEmail);
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        console.error("Login Failed:", error.message);
        setMessage({ text: error.message, type: "error" });
        setLoading(false);
      } else {
        console.log("Login OK. User ID:", data.user?.id);
        setMessage({ text: "Access Granted! Redirecting...", type: "success" });
        
        setTimeout(() => {
          console.log("Executing Hard Redirect to /dashboard");
          window.location.href = "/dashboard";
        }, 800);
      }
    } catch (err) {
      console.error("System Crash during Login:", err);
      setLoading(false);
    }
  };

  // --- SIGNUP HANDLER ---
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Processing Signup for:", signupEmail);

    if (password !== confirmPassword) {
      console.warn("Validation: Passwords don't match.");
      return;
    }
    
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: password,
        options: {
          data: { full_name: signupName },
        },
      });

      if (error) {
        console.error("Signup Failed:", error.message);
        setMessage({ text: error.message, type: "error" });
        setLoading(false);
      } else {
        console.log("Signup Initialized. Waiting for 8-digit OTP.");
        setMessage({ text: "8-Digit OTP sent to email!", type: "success" });
        setShowOtpScreen(true);
        setTimer(120); // Reset timer to 2 minutes
        setLoading(false);
      }
    } catch (err) {
      console.error("System Crash during Signup:", err);
      setLoading(false);
    }
  };

  // --- VERIFY OTP HANDLER ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log("Verifying 8-digit OTP for:", signupEmail);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: signupEmail,
        token: otpCode,
        type: 'signup',
      });

      if (error) {
        // VIP FAIL LOGIC: Vibrate and Reset
        if (typeof window !== "undefined" && window.navigator.vibrate) {
          window.navigator.vibrate([200, 100, 200]);
        }
        console.error("OTP Invalid:", error.message);
        setMessage({ text: "Invalid Token! Access Denied.", type: "error" });
        setOtpCode(""); // Reset input field
        setLoading(false);
      } else {
        console.log("OTP Verified. VIP Journey Starts.");
        setMessage({ text: "Identity Confirmed! Redirecting...", type: "success" });
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1200);
      }
    } catch (err) {
      console.error("OTP Verification Crash:", err);
      setLoading(false);
    }
  };

  // --- RESEND OTP HANDLER ---
  const handleResendOtp = async () => {
    if (!canResend) return;
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: signupEmail,
    });
    if (!error) {
      setTimer(120);
      setCanResend(false);
      setMessage({ text: "New 8-Digit Code Sent!", type: "success" });
    }
    setLoading(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />

      <AnimatePresence>
        {message.text && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-10 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-full font-bold text-sm shadow-xl ${
              message.type === "error" ? "bg-red-500/90 text-white" : "bg-emerald-500/90 text-slate-950"
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative w-full max-w-[400px] h-[680px] perspective-1000">
        <motion.div 
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 260, damping: 20 }}
          className="relative w-full h-full preserve-3d"
        >
          {/* --- LOGIN FORM --- */}
          <div className="absolute inset-0 backface-hidden bg-[#09090b]/80 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-8 flex flex-col shadow-2xl justify-center">
            <div className="mb-8">
              <h2 className="text-3xl font-black text-white tracking-tight">Nex<span className="text-emerald-400">Login</span></h2>
              <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest font-bold">Secure Access Terminal</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-2">
              <NeonInput 
                label="Email Address" icon={Mail} type="email" placeholder="ali@example.com" 
                value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required 
              />
              <div className="relative">
                <NeonInput 
                  label="Password" icon={Lock} type="password" placeholder="••••••••" 
                  value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required 
                />
                <div className="flex justify-end mt-2">
                  <button 
                    type="button"
                    onClick={() => router.push("/forgot-password")}
                    className="text-[10px] text-slate-500 font-bold uppercase tracking-widest hover:text-emerald-400 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button disabled={loading} type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black py-4 rounded-xl flex items-center justify-center gap-2 mt-4 transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                {loading ? <RefreshCw className="animate-spin" size={18} /> : <>LOGIN <ArrowRight size={18} /></>}
              </button>
            </form>

            <div className="mt-8 text-center text-slate-500 text-xs font-bold uppercase tracking-wider">
              New to market? <button onClick={toggleForm} className="text-emerald-400 hover:underline">Create VIP Account</button>
            </div>
          </div>

          {/* --- REGISTRATION & OTP FORM --- */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#09090b]/80 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-8 flex flex-col shadow-2xl justify-center">
            
            <AnimatePresence mode="wait">
              {!showOtpScreen ? (
                /* STEP 1: REGISTRATION DATA */
                <motion.div key="signup-fields" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="mb-6">
                    <h2 className="text-3xl font-black text-white tracking-tight">Nex<span className="text-emerald-400">Join</span></h2>
                    <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest font-bold">Start Virtual Journey</p>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-1">
                    <NeonInput label="Full Name" icon={User} placeholder="Ali Ahmed" value={signupName} onChange={(e) => setSignupName(e.target.value)} required />
                    <NeonInput label="Email Address" icon={Mail} type="email" placeholder="ali@example.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
                    
                    <div className="relative">
                      <NeonInput label="Password" icon={Lock} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                      <AnimatePresence>
                        {password.length > 0 && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-1 mb-4">
                            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                              <motion.div animate={{ width: strengthConfig[strength-1]?.width || "0%" }} className={`h-full ${strengthConfig[strength-1]?.color || "bg-slate-700"}`} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <NeonInput label="Confirm" icon={Lock} type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    {confirmPassword && (
                      <div className="flex items-center gap-1 px-1 mb-2">
                        {password === confirmPassword ? <><CheckCircle2 size={12} className="text-emerald-500" /> <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Match</span></> : <><AlertCircle size={12} className="text-red-500" /> <span className="text-[9px] font-bold text-red-500 uppercase tracking-tighter">Mismatch</span></>}
                      </div>
                    )}

                    <button disabled={password !== confirmPassword || strength < 2 || loading} type="submit" className="w-full bg-white hover:bg-slate-200 disabled:opacity-30 text-slate-950 font-black py-4 rounded-xl flex items-center justify-center gap-2 mt-4 transition-all">
                      {loading ? <RefreshCw className="animate-spin" size={18} /> : <>CREATE ACCOUNT <ArrowRight size={18} /></>}
                    </button>
                  </form>
                </motion.div>
              ) : (
                /* STEP 2: OTP VERIFICATION (UPDATED FOR 8 DIGITS) */
                <motion.div key="otp-fields" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
                  <div className="mb-8">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                      <ShieldCheck className="text-emerald-400" size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Verify <span className="text-emerald-400">Identity</span></h2>
                    <p className="text-slate-500 text-[10px] mt-2 uppercase tracking-widest font-bold">Code sent to: {signupEmail}</p>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">8-Digit Terminal Code</label>
                      <input 
                        type="text" 
                        maxLength={8}
                        placeholder="00000000"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                        className="w-full bg-slate-900/50 border-2 border-slate-800 focus:border-emerald-500 rounded-2xl py-4 text-center text-xl font-mono font-bold tracking-[0.3em] text-white outline-none transition-all"
                        required
                      />
                    </div>

                    <button disabled={otpCode.length < 8 || loading} type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20">
                      {loading ? <RefreshCw className="animate-spin" size={18} /> : <>VERIFY CODE <ArrowRight size={18} /></>}
                    </button>

                    <div className="flex flex-col items-center gap-2">
                      <p className="text-[10px] text-slate-600 font-bold uppercase">
                        {timer > 0 ? `Resend available in ${formatTime(timer)}` : "Ready to Resend"}
                      </p>
                      <button 
                        type="button"
                        onClick={handleResendOtp}
                        disabled={!canResend || loading}
                        className="text-xs text-emerald-400 font-bold uppercase tracking-wider disabled:opacity-20 hover:text-white transition-colors"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 text-center text-slate-500 text-xs font-bold uppercase tracking-wider">
              {showOtpScreen ? (
                <button onClick={() => setShowOtpScreen(false)} className="text-slate-400 hover:text-emerald-400">Change Email Address</button>
              ) : (
                <>Member? <button onClick={toggleForm} className="text-emerald-400 hover:underline">Sign In</button></>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}