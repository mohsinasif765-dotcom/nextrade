"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, AlertTriangle, Loader2, Clock, Zap } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

// Supabase Client Setup
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type OrderType = 'Market' | 'Limit';
type MarginMode = 'Cross' | 'Isolated';

// VIP Fix: Added onOrderPlaced to interface
interface OrderBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrice: string;
  symbol: string;           
  marketType: string;       // 'Futures' | 'Leverage' | 'Bitcast' | 'Forex' | 'Spot'
  activeTimeframe?: string; 
  onOrderPlaced?: () => void; // Parent (VIPTradeScreen) ko refresh trigger dene k liye
  onTradeConfirm?: (side: string) => void; // VIP Trade Confirmation Modal ko trigger karny k liye
}

export default function OrderBottomSheet({ 
  isOpen, 
  onClose, 
  currentPrice, 
  symbol, 
  marketType, 
  activeTimeframe = '1m',
  onOrderPlaced,
  onTradeConfirm
}: OrderBottomSheetProps) {
  const [orderType, setOrderType] = useState<OrderType>('Market');
  const [marginMode, setMarginMode] = useState<MarginMode>('Cross');
  
  const getRawPrice = (p: string) => p.replace(/,/g, '');

  const [price, setPrice] = useState<string>(getRawPrice(currentPrice));
  const [margin, setMargin] = useState<string>("10"); 
  const [leverage, setLeverage] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<'long' | 'short' | null>(null);
  
  // VIP FIX: Bitcast ke naye states
  const [bitcastOption, setBitcastOption] = useState<number>(60); // Stores seconds
  
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);

  const quickLeverages = [5, 10, 20, 50, 100];
  
  // VIP FIX: Client ki requirement ke mutabiq fixed time and profit
  const bitcastOptionsList = [
    { time: 30, label: '30s', profit: 30 },
    { time: 60, label: '60s', profit: 40 },
    { time: 90, label: '90s', profit: 50 },
    { time: 120, label: '120s', profit: 60 },
    { time: 180, label: '180s', profit: 70 },
    { time: 300, label: '300s', profit: 80 }
  ];

  const marginNum = parseFloat(margin) || 0;
  
  const entryPriceNum = orderType === 'Market' 
    ? parseFloat(getRawPrice(currentPrice)) 
    : parseFloat(getRawPrice(price)) || 0;

  const fee = (marginNum * leverage * 0.0004).toFixed(4); 
  const positionSize = (marginNum * leverage).toFixed(2);
  
  // Bitcast Payout Calculation
  const selectedBitcastOpt = bitcastOptionsList.find(o => o.time === bitcastOption) || bitcastOptionsList[1];
  const expectedPayout = (marginNum + (marginNum * (selectedBitcastOpt.profit / 100))).toFixed(2);
  
  const isHighRisk = leverage > 20 && marketType !== 'Bitcast';
  const isLowBalance = marginNum > availableBalance;

  useEffect(() => {
    if (isOpen) {
      if (orderType === 'Market') setPrice(getRawPrice(currentPrice));
      
      const fetchUserData = async () => {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          setUserId(authData.user.id);
          const { data: userData } = await supabase
            .from('users')
            .select('main_balance')
            .eq('id', authData.user.id)
            .single();
            
          if (userData) setAvailableBalance(Number(userData.main_balance) || 0);
        }
      };
      
      fetchUserData();
    }
  }, [isOpen, currentPrice, orderType]);

  const adjustValue = (setter: React.Dispatch<React.SetStateAction<string>>, current: string, operation: 'add' | 'sub', step: number) => {
    const val = parseFloat(getRawPrice(current)) || 0;
    const newVal = operation === 'add' ? val + step : Math.max(0, val - step);
    setter(newVal.toString());
  };

  const handleOrder = async (direction: 'long' | 'short') => {
    if (!userId) return alert("Login required");
    if (marginNum <= 0) return alert("Margin must be greater than 0");
    if (isLowBalance) return alert("Insufficient balance");
    if (entryPriceNum <= 0) return alert("Invalid entry price");

    setIsLoading(direction);

    try {
      let liqPrice = direction === 'long' 
        ? entryPriceNum - (entryPriceNum / leverage) 
        : entryPriceNum + (entryPriceNum / leverage);
      liqPrice = Math.max(0, liqPrice);

      let expireTime = null;
      let finalLeverageOrProfit = leverage;

      // VIP FIX: Bitcast Exact Time Calculation & DB Hack
      if (marketType === 'Bitcast') {
        expireTime = new Date(Date.now() + bitcastOption * 1000).toISOString(); // Milliseconds calculation
        finalLeverageOrProfit = selectedBitcastOpt.profit; // Hum p_leverage ki jagah profit % bhej rahe hain!
      }

      const { data, error } = await supabase.rpc('place_trade_v2', {
        p_user_id: userId,
        p_symbol: symbol,
        p_trade_mode: marketType,
        p_direction: direction,
        p_margin: marginNum,
        p_leverage: finalLeverageOrProfit, 
        p_entry_price: entryPriceNum,
        p_liq_price: marketType === 'Bitcast' ? null : liqPrice,
        p_expire_time: expireTime,
        p_margin_mode: marginMode,
        p_order_type: orderType
      });

      if (error) throw error;

      if (data?.success) {
        setAvailableBalance(data.new_balance || availableBalance - marginNum);
        
        // Determine the side name for the confirmation
        let sideName = direction === 'long' 
          ? (marketType === 'Bitcast' ? 'CALL' : 'OPEN LONG')
          : (marketType === 'Bitcast' ? 'PUT' : 'OPEN SHORT');
        
        // VIP Trade Confirmation Modal
        if (onTradeConfirm) {
          onTradeConfirm(sideName);
        } else {
          alert(`${direction.toUpperCase()} Trade Opened Successfully!`);
        }
        
        // VIP Fix: Trigger refresh in parent component
        if (onOrderPlaced) onOrderPlaced();
        
        onClose();
      } else {
        alert("Error: " + (data?.message || "Unknown error occurred"));
      }

    } catch (err: any) {
      console.error("[RPC ERROR]", err.message);
      alert("Transaction Failed: " + err.message);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm z-[100]"
          />

          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-[#0F172A] rounded-t-[20px] border-t border-[#1E293B] z-[101] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="flex justify-center pt-[12px] pb-[8px] relative shrink-0">
              <div className="w-[40px] h-[4px] bg-[#334155] rounded-full" />
              <button onClick={onClose} className="absolute right-[16px] top-[16px] text-[#94A3B8] hover:text-[#FFFFFF] bg-[#1E293B] p-1 rounded-full">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar pb-[20px]">
              {marketType === 'Bitcast' ? (
                // VIP FIX: BITCAST FIXED TIME & PROFIT UI
                <div className="px-[16px] mt-[8px]">
                  <div className="flex items-center justify-between mb-[12px]">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-[#FCD535]" />
                      <span className="text-[14px] font-bold text-white">Select Expiry Time</span>
                    </div>
                  </div>
                  
                  {/* Grid of 6 Options */}
                  <div className="grid grid-cols-3 gap-[10px]">
                    {bitcastOptionsList.map((opt) => (
                      <button
                        key={opt.time}
                        onClick={() => setBitcastOption(opt.time)}
                        className={`flex flex-col items-center justify-center h-[56px] rounded-[10px] transition-all border ${
                          bitcastOption === opt.time 
                            ? "bg-[#FCD535]/10 border-[#FCD535] text-[#FCD535]" 
                            : "bg-[#1E293B] border-transparent text-[#94A3B8] hover:border-[#334155]"
                        }`}
                      >
                        <span className="text-[14px] font-bold leading-tight">{opt.label}</span>
                        <span className="text-[10px] font-medium opacity-80">{opt.profit}% Profit</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex gap-[24px] px-[16px] h-[40px] items-center border-b border-[#334155]/50">
                    {(['Market', 'Limit'] as OrderType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setOrderType(type)}
                        className={`text-[14px] font-medium relative h-full flex items-center transition-colors ${
                          orderType === type ? "text-[#FCD535]" : "text-[#94A3B8]"
                        }`}
                      >
                        {type} Order
                        {orderType === type && (
                          <motion.div layoutId="orderTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FCD535]" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-[12px] px-[16px] mt-[16px]">
                    {(['Cross', 'Isolated'] as MarginMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setMarginMode(mode)}
                        className={`flex-1 h-[36px] rounded-[10px] text-[13px] font-bold transition-all ${
                          marginMode === mode 
                            ? "border border-[#FCD535] text-[#FCD535] bg-[#FCD535]/5" 
                            : "bg-[#1E293B] text-[#94A3B8] border border-transparent"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <AnimatePresence>
                {orderType === 'Limit' && marketType !== 'Bitcast' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    className="px-[16px] overflow-hidden"
                  >
                    <label className="text-[12px] text-[#94A3B8] mb-[8px] block">Price (USDT)</label>
                    <div className="flex items-center justify-between h-[44px] bg-[#1E293B]/50 border border-[#334155] rounded-[12px] p-[4px]">
                      <button onClick={() => adjustValue(setPrice, price, 'sub', 10)} className="w-[36px] h-[36px] rounded-[8px] bg-[#1E293B] flex items-center justify-center text-[#FFFFFF] hover:bg-[#334155]">
                        <Minus size={16} />
                      </button>
                      <input 
                        type="number" 
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="flex-1 bg-transparent text-center text-[#FFFFFF] text-[15px] font-bold outline-none font-mono"
                      />
                      <button onClick={() => adjustValue(setPrice, price, 'add', 10)} className="w-[36px] h-[36px] rounded-[8px] bg-[#1E293B] flex items-center justify-center text-[#FFFFFF] hover:bg-[#334155]">
                        <Plus size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="px-[16px] mt-[24px]">
                <div className="flex justify-between items-end mb-[8px]">
                  <label className="text-[12px] text-[#94A3B8]">Investment Amount (USDT)</label>
                  <span className={`text-[12px] font-mono ${isLowBalance ? 'text-[#F6465D]' : 'text-[#00C087]'}`}>
                    Avail: {availableBalance.toFixed(2)}
                  </span>
                </div>
                <div className={`flex items-center justify-between h-[44px] bg-[#1E293B]/50 border rounded-[12px] p-[4px] transition-colors ${isLowBalance ? 'border-[#F6465D]' : 'border-[#334155]'}`}>
                  <button onClick={() => adjustValue(setMargin, margin, 'sub', 10)} className="w-[36px] h-[36px] rounded-[8px] bg-[#1E293B] flex items-center justify-center text-[#FFFFFF] hover:bg-[#334155]">
                    <Minus size={16} />
                  </button>
                  <input 
                    type="number" 
                    value={margin}
                    onChange={(e) => setMargin(e.target.value)}
                    className="flex-1 bg-transparent text-center text-[#FFFFFF] text-[15px] font-bold outline-none font-mono"
                  />
                  <button onClick={() => adjustValue(setMargin, margin, 'add', 10)} className="w-[36px] h-[36px] rounded-[8px] bg-[#1E293B] flex items-center justify-center text-[#FFFFFF] hover:bg-[#334155]">
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {marketType !== 'Bitcast' && (
                <div className="px-[16px] mt-[24px]">
                  <div className="flex justify-between items-center mb-[16px]">
                    <label className="text-[12px] text-[#94A3B8]">Leverage</label>
                    <div className="text-[14px] font-bold text-[#FCD535] bg-[#FCD535]/10 px-[8px] py-[2px] rounded-[6px]">
                      {leverage}x
                    </div>
                  </div>
                  
                  <input 
                    type="range" min="1" max="100" 
                    value={leverage}
                    onChange={(e) => setLeverage(parseInt(e.target.value))}
                    className="w-full h-[4px] bg-[#334155] rounded-full appearance-none outline-none accent-[#FCD535] cursor-pointer mb-[16px]"
                  />

                  <div className="flex justify-between gap-[8px]">
                    {quickLeverages.map((lev) => (
                      <button
                        key={lev}
                        onClick={() => setLeverage(lev)}
                        className={`flex-1 h-[36px] rounded-[10px] text-[13px] font-bold transition-all ${
                          leverage === lev 
                            ? "bg-[#FCD535] text-[#0F172A]" 
                            : "bg-[#1E293B] text-[#94A3B8] hover:bg-[#334155]"
                        }`}
                      >
                        {lev}x
                      </button>
                    ))}
                  </div>

                  {isHighRisk && (
                    <div className="mt-[12px] flex items-center gap-[8px] text-[#F59E0B] bg-[#F59E0B]/10 p-[8px] rounded-[8px] border border-[#F59E0B]/20">
                      <AlertTriangle size={14} />
                      <span className="text-[11px] font-medium">High leverage increases liquidation risk.</span>
                    </div>
                  )}
                </div>
              )}

              <div className="px-[16px] mt-[24px] space-y-[12px]">
                {marketType !== 'Bitcast' ? (
                  <>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#94A3B8]">Position Size</span>
                      <span className="text-[#FFFFFF] font-mono">{positionSize} USDT</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#94A3B8]">Est. Trading Fee</span>
                      <span className="text-[#FCD535] font-mono">{fee} USDT</span>
                    </div>
                  </>
                ) : (
                  // VIP FIX: Expected Payout UI for Bitcast
                  <div className="flex justify-between items-center p-[12px] bg-[#0B1120] rounded-[10px] border border-[#334155]/50">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-[#00C087]" />
                      <span className="text-[13px] text-[#94A3B8]">Expected Payout</span>
                    </div>
                    <span className="text-[#00C087] font-bold font-mono text-[16px]">{expectedPayout} USDT</span>
                  </div>
                )}
              </div>

              <div className="px-[16px] mt-[24px]">
                <button 
                  onClick={() => handleOrder('long')}
                  disabled={isLoading !== null || isLowBalance || !userId}
                  className="w-full h-[52px] rounded-[14px] bg-[#00C087] text-[#FFFFFF] text-[16px] font-[700] mb-[12px] flex justify-center items-center disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                  {isLoading === 'long' ? <Loader2 className="animate-spin" size={20} /> : (marketType === 'Bitcast' ? 'CALL (UP)' : 'OPEN LONG')}
                </button>
                
                <button 
                  onClick={() => handleOrder('short')}
                  disabled={isLoading !== null || isLowBalance || !userId}
                  className="w-full h-[52px] rounded-[14px] bg-[#F6465D] text-[#FFFFFF] text-[16px] font-[700] flex justify-center items-center disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                  {isLoading === 'short' ? <Loader2 className="animate-spin" size={20} /> : (marketType === 'Bitcast' ? 'PUT (DOWN)' : 'OPEN SHORT')}
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}