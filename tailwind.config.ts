import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}', // Added for safety
    './src/**/*.{js,ts,jsx,tsx,mdx}',   // Added for safety
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F172A',
        foreground: '#F8FAFC',
        'brand-yellow': '#FCD535',
        'buy-green': '#00C087',
        'sell-red': '#F6465D',
        'border-slate': '#1E293B',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-geist-mono)', 'ui-mono', 'monospace'],
      },
      borderRadius: {
        '35': '35px',
        '25': '25px',
        '22': '22px',
        '32': '32px', // Added since we used it in withdraw page
      },
      boxShadow: {
        'emerald-glow': '0 0 20px rgba(16, 185, 129, 0.3)',
        'yellow-glow': '0 0 15px rgba(252, 213, 53, 0.5)',
      },
    },
  },
  plugins: [],
};

export default config;