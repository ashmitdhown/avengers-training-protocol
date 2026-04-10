# Avengers Training Protocol (ATP)

A tactical fitness and nutrition tracking dashboard designed for S.H.I.E.L.D. operatives and Avengers recruits. 

The ATP system serves as a centralized hub to monitor physical performance, log training sessions, track nutritional intake, and set mission-critical objectives. Built for speed and reliability, the application runs entirely on the client side using a custom persistent storage architecture.

## Features

- **Agent Authentication:** Secure simulation of login and registration flows, complete with credential verification and persistent session tracking.
- **Mission Objectives (Goals):** Set, track, and complete fitness targets across different categories (Strength, Endurance, etc.) with real-time SVG progress rings.
- **Training Logs:** Record specific workout sessions including sets, reps, weight, and duration.
- **Nutrition Center:** Track macros, monitor daily hydration via the interactive Water Station, and log meals.
- **Smart Calorie Scanner:** Includes an integrated vision engine utility that processes uploaded food images and calculates an estimated nutritional profile.
- **Commendations System:** Auto-unlocking achievement badges based on user progression and activity consistency.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Custom Vanilla CSS (No Tailwind) with a specialized HUD/Dark mode design system.
- **Data Visualization:** Recharts
- **Icons:** Lucide-React


## Getting Started

### Prerequisites
Node.js 18.x or higher installed on your machine.

### Installation

1. Clone the repository
```bash
git clone https://github.com/ashmitdhown/avengers-training-protocol.git
cd avengers-training-protocol
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open `http://localhost:3000` in your browser.

## Architecture Notes
To ensure immediate readiness for demo scenarios without relying on paid third-party backend services, this application utilizes a headless data pattern. All user profiles, training logs, and session tokens are strictly maintained inside the browser's local storage. This allows for zero-latency data aggregation while maintaining the illusion of a full-scale database. 

## Development
- `app/` - Next.js routing and primary page components
- `components/` - Shared UI logic (Nav, Toast, CustomCursor)
- `lib/` - Internal operations, data schema abstractions, and the image analysis engine

---

