# HeatShield AI 🔥

## AI-Powered Hyperlocal Urban Heat-Risk Intelligence Platform

> Built for **FortyGuard Hackathon '26** — Building the World's Temperature AI

---

## 📌 Overview

**HeatShield AI** is a production-grade MVP that transforms hyperlocal temperature intelligence into understandable and actionable heat-risk information. It leverages the **FortyGuard Temperature API** for high-resolution heat data and **Groq AI** for intelligent risk analysis and recommendations.

### Core USP

> *"HeatShield AI doesn't just show temperature. It explains the risk, predicts what may happen next, identifies who may be affected, and provides actionable intelligence about what to do."*

---

## 🚀 Live Demo

- **Deployed URL:** [https://heatshield-ai.vercel.app](https://heatshield-ai.vercel.app)
- **Repository:** [https://github.com/yourusername/heatshield-ai](https://github.com/yourusername/heatshield-ai)

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🌡️ **Real-time Temperature** | Current temperature with heat index and feels-like temperature |
| 🗺️ **Interactive Heatmap** | GeoJSON-based heatmap with color-coded temperature points |
| 🔥 **Hotspot Detection** | Automatic detection of areas with temperature ≥ 35°C |
| 📊 **Trend Analysis** | Historical temperature trends with rising/falling/stable indicators |
| 📈 **Forecast** | 12-hour temperature forecast with confidence intervals |
| 🛡️ **Risk Assessment** | Deterministic risk engine with score (0-100) and level (LOW/MEDIUM/HIGH/CRITICAL) |
| 🤖 **AI Analysis** | Groq-powered risk explanation, affected groups, and recommendations |
| 👥 **Vulnerability Profile** | Identifies potentially affected groups based on risk level |
| 🕐 **Timezone Support** | Automatic timezone detection for selected US cities |
| 📱 **Responsive** | Works on desktop, tablet, and mobile devices |

---

## 🏗️ Architecture

```
                   FORTYGUARD API
                       │
                       ▼
                DATA COLLECTION
                       │
                       ▼
                DATA PROCESSING
                       │
              ┌────────┴────────┐
              ▼                 ▼
        TEMPERATURE          DURATION
          / TREND           / PERSISTENCE
              │                 │
              └────────┬────────┘
                       ▼
                HEAT RISK ENGINE
                       │
                ┌──────┴──────┐
                ▼             ▼
           RISK SCORE     RISK FACTORS
                │             │
                └──────┬──────┘
                       ▼
                   AI ANALYSIS (Groq)
                       │
             ┌─────────┼─────────┐
             ▼         ▼         ▼
          EXPLAIN    FORECAST  RECOMMEND
             │         │         │
             └─────────┼─────────┘
                       ▼
                HEATSHIELD AI
                   DASHBOARD
```

---

## 🛠️ Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.x | React framework with App Router |
| React | 18.x | UI library |
| Tailwind CSS | 3.x | Utility-first CSS |
| shadcn/ui | Latest | Component library |
| Leaflet | 1.9.x | Interactive maps |
| React Leaflet | 4.x | Leaflet for React |
| Recharts | 2.x | Charts and graphs |
| Lucide React | Latest | Icons |
| Sonner | Latest | Toast notifications |

### APIs

| API | Purpose |
|-----|---------|
| **FortyGuard Temperature API** | Hyperlocal temperature data, heatmaps, environmental parameters |
| **Groq API** | AI-powered risk analysis and recommendations |

### Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| Tailwind CSS | Styling |
| Vercel | Deployment |

---

## 📁 Project Structure

```
heatshield-ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   └── route.js           # AI analysis endpoint
│   │   │   ├── fortyguard/
│   │   │   │   ├── heatmap/
│   │   │   │   │   └── route.js       # Heatmap API
│   │   │   │   ├── environmental/
│   │   │   │   │   └── route.js       # Environmental API
│   │   │   │   └── status/
│   │   │   │       └── route.js       # Status polling
│   │   │   ├── risk/
│   │   │   │   └── route.js           # Risk calculation
│   │   │   ├── recommendations/
│   │   │   │   └── route.js           # Recommendations API
│   │   │   ├── forecast/
│   │   │   │   └── route.js           # Forecast API
│   │   │   └── demo/
│   │   │       └── route.js           # Demo data API
│   │   ├── page.js                    # Main dashboard
│   │   ├── layout.js                  # Root layout
│   │   └── globals.css                # Global styles
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Progress.jsx
│   │   │   └── ...
│   │   ├── dashboard/
│   │   │   ├── Header.jsx
│   │   │   ├── KPI.jsx
│   │   │   └── DashboardLayout.jsx
│   │   ├── map/
│   │   │   ├── HeatMap.jsx
│   │   │   ├── MapControls.jsx
│   │   │   ├── LocationSearch.jsx
│   │   │   ├── MapLegend.jsx
│   │   │   ├── HotspotMarker.jsx
│   │   │   ├── MapPopup.jsx
│   │   │   ├── MapLoading.jsx
│   │   │   └── MapContainer.jsx
│   │   ├── risk/
│   │   │   ├── RiskScore.jsx
│   │   │   ├── RiskLevelBadge.jsx
│   │   │   ├── RiskFactors.jsx
│   │   │   └── VulnerabilityProfile.jsx
│   │   ├── charts/
│   │   │   ├── TemperatureChart.jsx
│   │   │   └── TrendChart.jsx
│   │   ├── ai/
│   │   │   ├── AIExplanation.jsx
│   │   │   └── Recommendations.jsx
│   │   └── shared/
│   │       ├── ErrorBoundary.jsx
│   │       ├── LoadingState.jsx
│   │       └── ActivityProgress.jsx
│   │
│   ├── lib/
│   │   ├── fortyguard/
│   │   │   ├── client.js
│   │   │   ├── config.js
│   │   │   ├── heatmap.js
│   │   │   ├── environmental.js
│   │   │   ├── status.js
│   │   │   └── normalizer.js
│   │   ├── risk/
│   │   │   ├── engine.js
│   │   │   ├── thresholds.js
│   │   │   └── vulnerability.js
│   │   ├── ai/
│   │   │   ├── groq.js
│   │   │   ├── prompts.js
│   │   │   └── cache.js
│   │   ├── forecast/
│   │   │   └── trend.js
│   │   ├── geo/
│   │   │   ├── coordinates.js
│   │   │   ├── distance.js
│   │   │   └── heatmap-utils.js
│   │   ├── validation/
│   │   │   ├── schemas.js
│   │   │   └── fortyguard-schemas.js
│   │   ├── demo/
│   │   │   └── data.js
│   │   ├── datetime.js
│   │   ├── utils.js
│   │   ├── errors.js
│   │   ├── constants.js
│   │   └── rate-limit.js
│   │
│   └── hooks/
│       └── useHeatmapData.js
│
├── public/
│   └── leaflet/
│       └── images/
│           ├── marker-icon.png
│           ├── marker-icon-2x.png
│           └── marker-shadow.png
│
├── .env.local.example
├── tailwind.config.js
├── postcss.config.js
├── components.json
├── package.json
└── README.md
```

---

## 🔧 Installation

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- FortyGuard API Key
- Groq API Key

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/heatshield-ai.git
cd heatshield-ai

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.local.example .env.local

# 4. Add your API keys to .env.local
# FORTYGUARD_API_KEY=your_fortyguard_api_key
# GROQ_API_KEY=your_groq_api_key

# 5. Run development server
npm run dev

# 6. Open http://localhost:3000
```

---

## 🔑 Environment Variables

Create a `.env.local` file in the root directory:

```env
# FortyGuard API
FORTYGUARD_API_KEY=your_fortyguard_api_key_here
FORTYGUARD_BASE_URL=https://api.fortyguard.com

# Groq AI API
GROQ_API_KEY=your_groq_api_key_here

# App Configuration
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_DEFAULT_LAT=33.4484
NEXT_PUBLIC_DEFAULT_LNG=-112.0740
NEXT_PUBLIC_DEFAULT_CITY=Phoenix
NEXT_PUBLIC_DEFAULT_STATE=AZ
```

---

## 📦 Dependencies

### Core Dependencies

```json
{
  "dependencies": {
    "next": "15.0.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "recharts": "^2.10.3",
    "lucide-react": "^0.294.0",
    "sonner": "^1.4.0",
    "zod": "^3.22.4",
    "groq-sdk": "^0.1.0",
    "@mardillu/us-cities-utils": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.1.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.3.0",
    "tailwindcss-animate": "^1.0.7",
    "postcss": "^8.4.31",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.53.0",
    "eslint-config-next": "15.0.3"
  }
}
```

---

## 🚦 API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/ai` | POST | Generates AI analysis using Groq |
| `/api/risk` | POST | Calculates deterministic risk score |
| `/api/fortyguard/heatmap` | POST | Fetches heatmap data from FortyGuard |
| `/api/fortyguard/environmental` | POST | Fetches environmental parameters |
| `/api/fortyguard/status` | GET | Polls activity status |
| `/api/recommendations` | POST | Generates recommendations |
| `/api/forecast` | POST | Generates temperature forecast |
| `/api/demo` | GET | Returns demo data |

---

## 🧪 Testing

```bash
# Run linting
npm run lint

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

---

## 📱 Responsive Design

| Device | Breakpoint | Status |
|--------|------------|--------|
| Desktop | > 1024px | ✅ Fully supported |
| Tablet | 768px - 1024px | ✅ Fully supported |
| Mobile | < 768px | ✅ Fully supported |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is created for **FortyGuard Hackathon '26**.

---

## 👥 Team

**Team Ultimate** 🔥

| Name | Role | 
|------|------|--------|
| **Basit Ali** | Team Lead / Full Stack Developer | 
| **Rida Punnakkotil** | AI/ML Developer & Data Analyst | 
| **Farheena Farooq** | Technical Writer & Presenter | 

---

## 🙏 Acknowledgments

- [FortyGuard](https://fortyguard.com) - Temperature API
- [Groq](https://groq.com) - AI API
- [shadcn/ui](https://ui.shadcn.com) - UI Components
- [Leaflet](https://leafletjs.com) - Interactive Maps
- [Next.js](https://nextjs.org) - React Framework

---

## 📞 Support

For issues and questions, please open an issue in the GitHub repository.

---

**Made with ❤️ by Team Ultimate for FortyGuard Hackathon '26**