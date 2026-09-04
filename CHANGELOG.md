# FactStamp Development Changelog & Architecture Milestones

This document logs major functional enhancements, architectural milestones, and security updates delivered to the FactStamp platform.

────────────────────────────────────────────────────────────

### Milestone 1: Admin Command Center Dark / Light Theme Toggle

* **Problem Addressed:** The administrative console at `/admin` operates as a standalone operational surface separate from the public layout. Administrators working extended investigative shifts required an accessible, non-disruptive way to toggle theme appearance across the console.
* **Key Implementations:**
  * **Header Segmented Control:** Integrated a segmented pill toggle (`Admin.tsx:624-663`) directly into the persistent Command Center top header alongside live sync status and datastore indicators.
  * **System Tools Preference Card:** Added a dedicated "Console Theme" utility card in the Tools tab (`Admin.tsx:1532-1568`) displaying current theme state and quick-action buttons.
  * **Admin Gate Integration:** Added a theme toggle button to `AdminRoute.tsx:117-135` allowing administrators to switch themes directly from the password lock screen.
  * **Theme Context Expansion:** Updated `ThemeContext.tsx:4-44` to expose `setTheme` alongside `toggleTheme` for direct programmatic and segmented control.
* **Key Files Touched:**
  * [`src/pages/Admin.tsx`](file:///home/aadish/Documents/Github/FactStamp/src/pages/Admin.tsx)
  * [`src/components/AdminRoute.tsx`](file:///home/aadish/Documents/Github/FactStamp/src/components/AdminRoute.tsx)
  * [`src/contexts/ThemeContext.tsx`](file:///home/aadish/Documents/Github/FactStamp/src/contexts/ThemeContext.tsx)

────────────────────────────────────────────────────────────

### Milestone 2: Graphify Codebase Knowledge Graph Integration

* **Problem Addressed:** As the FactStamp codebase scaled across complex consensus providers, verification queues, and security policies, understanding cross-file relationships, god-node centrality, and architectural clustering required automated topological analysis.
* **Key Implementations:**
  * **CLI Engine Setup:** Installed `graphifyy` via `uv` tool environment and registered the `graphify gemini install` hook.
  * **Topology Extraction:** Analyzed 91 source files, generating a graph with **630+ nodes**, **1,350+ edges**, and **29 architectural communities**.
  * **Interactive Graph Outputs:** Created interactive visual explorer (`graphify-out/graph.html`), structured JSON (`graphify-out/graph.json`), and comprehensive architectural audit (`graphify-out/GRAPH_REPORT.md`).
  * **Automated Sync Rule:** Embedded mandatory `graphify update .` hook in [`GEMINI.md`](file:///home/aadish/Documents/Github/FactStamp/GEMINI.md) to keep the graph synchronized with code changes at zero API cost.
* **Key Files Touched:**
  * [`GEMINI.md`](file:///home/aadish/Documents/Github/FactStamp/GEMINI.md)
  * `graphify-out/graph.json`
  * `graphify-out/graph.html`
  * `graphify-out/GRAPH_REPORT.md`

────────────────────────────────────────────────────────────

### Milestone 3: Universal Sliding Dual-Icon Theme Toggle Across All Pages

* **Problem Addressed:** Replace plain, inconsistent icon buttons with a unified, tactile dual-icon sliding pill toggle across every surface of the application.
* **Key Implementations:**
  * **Component Architecture (`<ThemeToggle />`):**
    * Built compact pill container (`w-16 h-8 p-1 rounded-full`) with `zinc-950` dark border and `zinc-200` light border.
    * Animated sliding thumb (`w-6 h-6 rounded-full`) with smooth `translate-x-8` transitions (`duration-300`).
    * Dual-state Lucide vector icons (`Sun` and `Moon`) displaying both active and background states.
    * Complete keyboard accessibility (`role="button"`, `tabIndex={0}`, `aria-label`, Enter and Space listeners).
    * Re-exported through both [`ThemeToggle.tsx`](file:///home/aadish/Documents/Github/FactStamp/src/components/ui/ThemeToggle.tsx) and [`theme-toggle.tsx`](file:///home/aadish/Documents/Github/FactStamp/src/components/ui/theme-toggle.tsx).
  * **Universal Placement Matrix:**
    * Desktop Navbar & Mobile Navigation Drawer ([`src/components/Navbar.tsx`](file:///home/aadish/Documents/Github/FactStamp/src/components/Navbar.tsx))
    * Admin Command Center Header & Tools Grid ([`src/pages/Admin.tsx`](file:///home/aadish/Documents/Github/FactStamp/src/pages/Admin.tsx))
    * Admin Authentication Gate ([`src/components/AdminRoute.tsx`](file:///home/aadish/Documents/Github/FactStamp/src/components/AdminRoute.tsx))
    * Sign In & Sign Up Auth Panels ([`src/components/AuthLayout.tsx`](file:///home/aadish/Documents/Github/FactStamp/src/components/AuthLayout.tsx))
    * Global Brand Footer ([`src/components/Footer.tsx`](file:///home/aadish/Documents/Github/FactStamp/src/components/Footer.tsx))
* **Key Files Touched:**
  * [`src/components/ui/ThemeToggle.tsx`](file:///home/aadish/Documents/Github/FactStamp/src/components/ui/ThemeToggle.tsx)
  * [`src/components/ui/theme-toggle.tsx`](file:///home/aadish/Documents/Github/FactStamp/src/components/ui/theme-toggle.tsx)
  * [`src/components/Navbar.tsx`](file:///home/aadish/Documents/Github/FactStamp/src/components/Navbar.tsx)
  * [`src/components/Footer.tsx`](file:///home/aadish/Documents/Github/FactStamp/src/components/Footer.tsx)
  * [`src/components/AuthLayout.tsx`](file:///home/aadish/Documents/Github/FactStamp/src/components/AuthLayout.tsx)

────────────────────────────────────────────────────────────

### Milestone 4: Verification Queue Settlement & Dynamic Replenishment

* **Problem Addressed:** Investigated why `http://localhost:5174/verify` intermittently displayed zero claims. Identified that overdue consensus settlement (`applyLocalExpiry`) automatically resolved unverified claims after 7 days into `CONTESTED` status, leaving 0 items in `status === 'pending'`.
* **Key Implementations:**
  * **Dynamic Seed Deadlines:** Updated [`scripts/seed-db.mjs`](file:///home/aadish/Documents/Github/FactStamp/scripts/seed-db.mjs) to generate claims with dynamic future deadlines (3 to 6 days ahead) relative to current execution time.
  * **Automatic Queue Replenishment:** Modified `applyLocalExpiry` in [`src/contexts/ClaimsContext.tsx`](file:///home/aadish/Documents/Github/FactStamp/src/contexts/ClaimsContext.tsx) to automatically replenish active pending claims whenever the database expires all pending items. The verification queue is guaranteed to never be empty.
  * **Resilient Snapshot Fallback:** Fixed listener cleanup in `subscribeClaimsRealtime` ([`src/services/firebaseService.ts`](file:///home/aadish/Documents/Github/FactStamp/src/services/firebaseService.ts)) to safely manage both primary ordered query and fallback unindexed streams.
* **Key Files Touched:**
  * [`src/contexts/ClaimsContext.tsx`](file:///home/aadish/Documents/Github/FactStamp/src/contexts/ClaimsContext.tsx)
  * [`src/services/firebaseService.ts`](file:///home/aadish/Documents/Github/FactStamp/src/services/firebaseService.ts)
  * [`scripts/seed-db.mjs`](file:///home/aadish/Documents/Github/FactStamp/scripts/seed-db.mjs)

────────────────────────────────────────────────────────────

### Milestone 5: Authentication Security Hardening & Rate Limiting System

* **Problem Addressed:** Safeguard verifier credentials and administrative privileges against automated brute-force attacks, dictionary attacks, and credential stuffing.
* **Key Implementations:**
  * **Multi-Tiered Rate Limiter (`src/lib/security.ts:200-315`):**
    * Dual-level tracking: Tracks attempts both per-account (`fs_login_attempts_<email>`) and globally per-client.
    * Cross-session persistence: Uses `localStorage` with `sessionStorage` fallback so browser tab closures or reloads cannot evade lockouts.
    * 5-Attempt Threshold: Allows up to 5 attempts; triggers a strict 15-minute lockout (`LOCKOUT_DURATION_MS = 15 * 60 * 1000`).
    * Real-Time Clock: Added `formatLockoutRemaining()` to render live ticking MM:SS countdowns (`14:59` down to `00:00`).
    * Automatic Reset: `resetLoginAttempts()` clears failure counters immediately upon successful authentication.
  * **Interactive Lockout UI (`src/pages/SignIn.tsx`):**
    * Proactive Lockout Enforcement: Verifies rate-limit state before dispatching network requests to Firebase Auth.
    * Active Lockout Banner: High-contrast alert banner with ticking clock icon and automatic unlock once the countdown reaches zero.
    * Brute-Force Status Pill: Subtle indicator showing `X/5 attempts left` before lockout is triggered.
    * Anti-Enumeration Error Standardization: Standardized all invalid credential errors into generic `Invalid email or password` copy.
    * Demo Accounts Accordion: Added collapsible quick-fill drawer with seeded verifier profiles for rapid evaluation.
* **Key Files Touched:**
  * [`src/lib/security.ts`](file:///home/aadish/Documents/Github/FactStamp/src/lib/security.ts)
  * [`src/pages/SignIn.tsx`](file:///home/aadish/Documents/Github/FactStamp/src/pages/SignIn.tsx)
  * [`src/components/AdminRoute.tsx`](file:///home/aadish/Documents/Github/FactStamp/src/components/AdminRoute.tsx)
  * [`src/services/firebaseService.ts`](file:///home/aadish/Documents/Github/FactStamp/src/services/firebaseService.ts)

────────────────────────────────────────────────────────────

### Milestone 6: High-Trust Pan-Indic Typography Architecture

* **Problem Addressed:** Previous font configuration loaded 3 separate Google Font families (`DM Sans`, `JetBrains Mono`, `Lora`) totaling over 120 KB across 12 files. It suffered from Indic script failure (broken baselines on Hindi/Marathi forwards), conferred unearned literary prestige to misinformation via Victorian serifs, and imposed developer-terminal monospace fonts on ordinary mobile users.
* **Key Implementations:**
  * **Single Variable Latin Stack:** Replaced `DM Sans` with **`Plus Jakarta Sans`** (variable 400..800) for crisp, authoritative newsroom tone loaded via a single lightweight variable file.
  * **Native Vernacular Support:** Integrated **`Noto Sans Devanagari`** (400, 500, 600, 700) for native Hindi and Marathi forward rendering with zero broken baselines.
  * **Native CSS Tabular Figures:** Replaced `JetBrains Mono` with native `font-variant-numeric: tabular-nums` and `font-feature-settings: "kern" 1, "liga" 1, "tnum" 1;` on the primary sans font. All consensus ratios (`0/3`), case IDs (`#C19`), and countdown timers (`5d 23h left`) align with fixed-width tabular metrics at **0 KB extra network payload**.
  * **Quarantined Forward Quotes:** Removed `Lora` serif styling from viral forward quotes in favor of clean message typography.
* **Key Files Touched:**
  * [`index.html`](file:///home/aadish/Documents/Github/FactStamp/index.html)
  * [`src/index.css`](file:///home/aadish/Documents/Github/FactStamp/src/index.css)
  * [`src/pages/Submit.tsx`](file:///home/aadish/Documents/Github/FactStamp/src/pages/Submit.tsx)
  * [`DESIGN.md`](file:///home/aadish/Documents/Github/FactStamp/DESIGN.md)
  * [`README.md`](file:///home/aadish/Documents/Github/FactStamp/README.md)

────────────────────────────────────────────────────────────
