# FactStamp — WhatsApp Misinformation Debunker

> **Stop WhatsApp fake news before it spreads.** FactStamp is a decentralized, community-driven fact-checking platform built to verify viral WhatsApp forwards using a weighted 3-verifier quorum consensus engine and downloadable fact-check PNG cards.

---

## Key Features

* **Weighted 3-Verifier Quorum Engine**: Requires at least 3 independent verifications backed by official sources (WHO, Ministry of Health, government portals) before issuing a final verdict (`TRUE`, `FALSE`, `MISLEADING`, `UNVERIFIED`).
* **Shareable PNG Fact-Check Cards**: Instantly generate and download WhatsApp-optimized PNG verdict cards using `html2canvas` to share back directly into fast-moving group chats.
* **Instant Duplicate Engine**: Prevents redundant work by matching incoming forwards against existing claims in real time.
* **Misinformation Intelligence Dashboard**: Real-time analytics, category distributions, weekly trending reports, and top verifier reputation leaderboards powered by Recharts.
* **Enterprise Security & Firebase Rules**: Strict Firestore security rules (`firestore.rules`) and Storage security rules (`storage.rules`) enforcing data validation, user authentication, and rate limiting.
* **Docker & Firebase Emulator Support**: Fully containerized environment with hot-reload development target and Nginx production target.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Core Framework** | [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/) + [TypeScript 5.5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + Custom Design Tokens |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Icons & UI** | [Lucide React](https://lucide.dev/) + [Sonner](https://sonner.emilkowal.si/) |
| **Data Visualization** | [Recharts](https://recharts.org/) |
| **Card Export** | [html2canvas](https://html2canvas.hertzen.com/) |
| **Backend & DB** | [Firebase v12](https://firebase.google.com/) (Auth, Firestore, Storage, Emulators) |
| **Deployment** | Docker + Docker Compose + Nginx |

---

## Quick Start

### 1. Prerequisites

Ensure you have installed:
* **Node.js**: `v18.0.0` or higher
* **npm**: `v9.0.0` or higher

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/aadish0day/FactStamp.git
cd FactStamp
npm install
```

### 3. Environment Setup

Copy `.env.example` to create your local `.env` file:

```bash
cp .env.example .env
```

*(Note: The app includes fallback demo keys for local development if `.env` is not set).*

### 4. Run Development Server

Start Vite development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Local Firebase Emulators & Database Seeding

To run completely offline with the Firebase Local Emulator Suite:

```bash
# Start Firebase Emulators (Firestore, Auth, Storage)
npm run emulators

# Seed mock database with claims and verifiers
npm run seed:db
```

---

## Docker Deployment

### Development Mode (with Hot Reloading)

```bash
docker compose up dev
```
Access at [http://localhost:5174](http://localhost:5174).

### Production Nginx Build

```bash
docker compose up prod
```
Access production Nginx container at [http://localhost:8080](http://localhost:8080).

---

## Project Structure

```
FactStamp/
├── .agent/                  # Custom design skills & UI tools
├── design-system/           # Master design rules & page overrides
├── public/                  # Static assets & icons
├── scripts/                 # Database seed scripts
├── src/
│   ├── components/          # Reusable UI components & stamps
│   │   └── ui/              # Atom components (Buttons, Cards, Badges)
│   ├── contexts/            # React state contexts (Auth, Claims, Users)
│   ├── lib/                 # Core utilities, types, & Firebase init
│   ├── pages/               # Route pages (Home, Submit, ClaimDetail, Dashboard, Profile)
│   ├── App.tsx              # Application routes & layout wrapper
│   ├── index.css            # Tailwind v4 theme tokens & styles
│   └── main.tsx             # Application entry point
├── Dockerfile               # Multi-stage Docker build
├── docker-compose.yml       # Docker compose setup (dev & prod)
├── firestore.rules          # Firestore security rules
├── storage.rules            # Firebase storage security rules
└── package.json             # NPM scripts & dependencies
```

---

## Scripts & Commands

| Command | Action |
|---|---|
| `npm run dev` | Starts Vite development server with HMR |
| `npm run build` | Compiles TypeScript and builds production bundle |
| `npm run typecheck` | Runs `tsc --noEmit` to verify type safety |
| `npm run preview` | Previews local production build |
| `npm run emulators` | Starts Firebase Local Emulator Suite |
| `npm run seed:db` | Populates local DB with sample claims & verifications |

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
