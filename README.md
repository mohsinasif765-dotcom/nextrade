# 🚀 NexTrade: Next-Generation Virtual Trading Engine

NexTrade is a premium, high-performance virtual trading platform designed for the modern trader. Built with **Next.js 15**, **Tailwind CSS 4**, and **Supabase**, it provides an institutional-grade experience for trading Cryptocurrencies, Forex pairs, and Metals in a risk-free, simulated environment.

![NexTrade Banner](https://img.shields.io/badge/NexTrade-Trading_Protocol-10b981?style=for-the-badge&logo=next.js)
![Status](https://img.shields.io/badge/Status-Active_Development-blue?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Fullstack_Next.js-emerald?style=for-the-badge)

---

## ✨ Key Features

### 📈 Institutional-Grade Trading
*   **Multi-Asset Support**: Trade Crypto (BTC, ETH), Forex, and Precious Metals.
*   **Real-time Visualization**: Integrated with `lightweight-charts` for professional technical analysis.
*   **Advanced Order Engine**: Support for Market/Limit orders with leverage and margin logic.
*   **Simulated Matching Engine**: High-speed trade execution via a custom B-Book matching logic.

### 🛡️ Secure Infrastructure
*   **RBAC (Role Based Access Control)**: Secure middleware protecting User and Admin routes.
*   **KYC System**: Integrated identity verification workflow for user compliance.
*   **Session Management**: Secure authentication via Supabase SSR and Edge-based session validation.

### 🛠️ Dedicated Admin Console
*   **User Management**: Monitor and manage user accounts, balances, and status.
*   **Trade Oversight**: Full visibility into active positions and historical transaction logs.
*   **Request Handling**: Streamlined processing for deposits, withdrawals, and KYC approvals.
*   **System Controls**: Dynamic global settings and support ticket management.

### 📱 Progressive Web App (PWA)
*   **Installable**: Install NexTrade directly on your mobile or desktop.
*   **Native-like Experience**: Custom install prompts and offline capabilities.
*   **Performance**: Optimized for speed and responsiveness across all devices.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) (App Router) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) & Glassmorphism |
| **Database/Auth** | [Supabase](https://supabase.com/) (PostgreSQL & SSR) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Charts** | [Lightweight Charts](https://tradingview.github.io/lightweight-charts/) |

---

## 📂 Project Structure

```text
├── app/                  # Next.js App Router
│   ├── (user)/           # Protected User Dashboard routes
│   ├── admin/            # Administrative Control Panel
│   ├── trade/            # Core Trading Interface
│   ├── login/            # Authentication flow
│   └── layout.tsx        # Global Layout & Providers
├── components/           # Reusable UI Components
│   ├── TradingChart.tsx  # Core Charting Logic
│   ├── ActivePositions.tsx # Dynamic Position Tracking
│   └── SystemGuard.tsx   # Global Session/Network monitor
├── supabase/             # Backend Logic
│   └── functions/        # Edge Functions (Price fetching, Auto-closer)
├── middleware.ts         # Authentication & RBAC Logic
└── public/               # Static Assets & PWA manifest
```

---

## 🚀 Getting Started

### 1. Prerequisites
*   Node.js 18+ 
*   Supabase Account

### 2. Installation
```bash
git clone <repository-url>
cd nex-trading
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# Private secrets should be set in Supabase dashboard for Edge Functions
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

---

## 🔧 Maintenance & Edge Functions

NexTrade utilizes Supabase Edge Functions for critical background tasks:
1.  **fetch-prices**: Periodically updates market prices from external APIs.
2.  **bitcast-closer**: Automated trade closing engine for liquidation and expiry.

To deploy these functions:
```bash
supabase functions deploy fetch-prices
supabase functions deploy bitcast-closer
```

---

## 📜 License
&copy; 2026 NexTrade Protocol. All rights reserved. Built with precision for the global trading community.
