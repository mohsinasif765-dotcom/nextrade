"use client";
import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CandlestickSeries, LineSeries, UTCTimestamp, ISeriesApi } from "lightweight-charts";
import { Loader2 } from "lucide-react";

// Memory Cache: Component re-mount hone par data zaya nahi hoga
const chartDataCache: Record<string, any[]> = {};

interface TradingChartProps {
  symbol: string; 
  assetType: 'crypto' | 'forex' | 'metal'; 
  activeTimeframe?: string; // e.g., '15m', '1h', '1d'
  adminControlStatus?: 'normal' | 'force_win' | 'force_loss';
  // TS Error: Ye property missing thi isliye error aa raha tha
  currentLivePrice?: number; 
}

// Timeframe adapters kyunke Binance aur TwelveData ke formats thore alag hain
const getBinanceTimeframe = (tf: string) => tf === 'Line' ? '1d' : tf;
const getTwelveDataTimeframe = (tf: string) => {
  if (tf === 'Line' || tf === '1d') return '1day';
  if (tf === '1h') return '1h';
  if (tf.includes('m')) return tf.replace('m', 'min'); // '15m' -> '15min'
  return '15min'; // fallback
};

// Fallback Fake Data Generator agar API fail ho jaye
const generateMockData = (basePrice: number) => {
  const data = [];
  let current = basePrice > 0 ? basePrice : 1.1000; // Agar base price 0 ho to default 1.1 le lo
  const now = Math.floor(Date.now() / 1000);
  for(let i=100; i>=0; i--) {
     const open = current;
     // Small random movement
     const close = current + (Math.random() - 0.5) * (current * 0.005);
     const high = Math.max(open, close) + Math.random() * (current * 0.002);
     const low = Math.min(open, close) - Math.random() * (current * 0.002);
     data.push({ time: (now - (i * 60 * 15)) as UTCTimestamp, open, high, low, close, value: close });
     current = close; // next candle starts from here
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

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Chart Initialization
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
    let rawData: any[] = []; // Reference for latest data

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

    // Hybrid Data Fetching Logic
    const loadChartData = async () => {
      const cacheKey = `${symbol}_${activeTimeframe}`;
      
      // 1. Check Cache first (API call bachane ke liye)
      if (chartDataCache[cacheKey]) {
        rawData = [...chartDataCache[cacheKey]];
        series.setData(rawData);
        chart.timeScale().fitContent();
        setIsLoading(false);
      } else {
        setIsLoading(true);
        setError(null);

        try {
          let formattedData = [];

          // 2. Crypto ke liye BINANCE use karo (Unlimited & Free)
          if (assetType === 'crypto') {
            const cleanSymbol = symbol.replace('/', ''); // Ensure BTCUSDT format
            const interval = getBinanceTimeframe(activeTimeframe);
            
            const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${cleanSymbol}&interval=${interval}&limit=100`);
            if (!res.ok) throw new Error("Binance API error");
            
            const data = await res.json();
            formattedData = data.map((d: any) => ({
              time: (d[0] / 1000) as UTCTimestamp,
              open: parseFloat(d[1]),
              high: parseFloat(d[2]),
              low: parseFloat(d[3]),
              close: parseFloat(d[4]),
              value: parseFloat(d[4])
            }));
          } 
          
          // 3. Forex & Metals ke liye TWELVEDATA use karo
          else {
            const interval = getTwelveDataTimeframe(activeTimeframe);
            const apiKey = process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY;
            
            // Agar API key nahi hai tou mock throw kare
            if (!apiKey || apiKey === 'undefined') {
              throw new Error("Missing API Key");
            }

            const res = await fetch(`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&apikey=${apiKey}&outputsize=100`);
            const data = await res.json();
            
            // TwelveData jab limit exceed karti hai tou status error deti hai
            if (data.status === "error") throw new Error(data.message);
            
            formattedData = data.values.reverse().map((d: any) => ({
              time: (new Date(d.datetime).getTime() / 1000) as UTCTimestamp,
              open: parseFloat(d.open),
              high: parseFloat(d.high),
              low: parseFloat(d.low),
              close: parseFloat(d.close),
              value: parseFloat(d.close)
            }));
          }

          // Save to memory cache and set data
          chartDataCache[cacheKey] = formattedData;
          rawData = [...formattedData];
          series.setData(rawData);
          chart.timeScale().fitContent();

        } catch (err: any) {
          console.warn("API Failed, using Mock Data:", err.message);
          // Yahan error show karne ke bajaye mock data dikha dete hain
          const mockData = generateMockData(currentLivePrice);
          chartDataCache[cacheKey] = mockData;
          rawData = [...mockData];
          series.setData(rawData);
          chart.timeScale().fitContent();
        } finally {
          setIsLoading(false);
        }
      }

      // --- 4. THE MAGIC: Admin Control Manipulation ---
      if (rawData.length > 0 && adminControlStatus !== 'normal') {
        const manipulationTimer = setInterval(() => {
          // Get the last candle
          const lastIndex = rawData.length - 1;
          const currentCandle = { ...rawData[lastIndex] };
          
          // Define a small variation based on asset type
          const volatility = assetType === 'crypto' ? (currentCandle.close * 0.0005) : (currentCandle.close * 0.0001); 

          if (adminControlStatus === 'force_loss') {
            // Fake push price down
            currentCandle.close -= volatility;
            if(currentCandle.close < currentCandle.low) currentCandle.low = currentCandle.close;
          } else if (adminControlStatus === 'force_win') {
            // Fake push price up
            currentCandle.close += volatility;
            if(currentCandle.close > currentCandle.high) currentCandle.high = currentCandle.close;
          }

          // Line chart uses 'value', Candlestick uses open/high/low/close
          currentCandle.value = currentCandle.close;
          
          // Update the array and chart
          rawData[lastIndex] = currentCandle;
          series.update(currentCandle);
          
        }, 1000); // Update every 1 second

        return () => clearInterval(manipulationTimer);
      }
    };

    const cleanupManipulation = loadChartData();

    const handleResize = () => {
      if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      // Handle the async cleanup from loadChartData if manipulation timer was set
      cleanupManipulation.then(cleanup => {
        if(typeof cleanup === 'function') cleanup();
      });
    };
  }, [symbol, assetType, activeTimeframe, adminControlStatus, currentLivePrice]);

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