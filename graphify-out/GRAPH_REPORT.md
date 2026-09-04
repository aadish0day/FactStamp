# Graph Report - FactStamp  (2026-09-04)

## Corpus Check
- 84 files · ~68,645 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 607 nodes · 1300 edges · 31 communities (23 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1270500b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- firebaseService.ts
- FactStamp Platform
- UI-UX Search & BM25 Core
- App.tsx
- dependencies
- scripts
- Submit.tsx
- compilerOptions
- ui-ux-pro-max
- seed-db.mjs
- PasswordStrength.tsx
- FactStamp Development Changelog & Architecture Milestones
- ErrorBoundary.tsx
- ClaimDetail.tsx
- Continuous Integration Workflow
- Admin.tsx
- Claim
- ThemeContext.tsx
- FactStamp Design System
- cn
- framer-motion
- DashboardChart.tsx
- create-user.mjs
- create-admin.mjs
- html-to-image
- Gemini Development Instructions
- Enterprise Firebase Security Rules
- react-router-dom

## God Nodes (most connected - your core abstractions)
1. `cn()` - 54 edges
2. `useAuth()` - 33 edges
3. `Button` - 18 edges
4. `compilerOptions` - 18 edges
5. `useClaims()` - 17 edges
6. `formatDistanceToNow()` - 17 edges
7. `ClaimsProvider()` - 14 edges
8. `Claim` - 13 edges
9. `Admin()` - 13 edges
10. `Seo()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Typecheck & Production Build Job` --references--> `dependencies`  [INFERRED]
  .github/workflows/ci.yml → package.json
- `FactStamp Shield Icon` --conceptually_related_to--> `FactStamp Platform`  [INFERRED]
  public/favicon.svg → README.md
- `FactStamp Social OG Cover` --conceptually_related_to--> `FactStamp Platform`  [INFERRED]
  public/og-cover.svg → README.md
- `Early Theme Initialization Script` --shares_data_with--> `ThemeProvider()`  [INFERRED]
  index.html → src/contexts/ThemeContext.tsx
- `FactStamp HTML Entrypoint` --references--> `FactStamp Shield Icon`  [EXTRACTED]
  index.html → public/favicon.svg

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **CI Automated Verification Pipeline** — github_workflows_ci_ci_workflow, github_workflows_ci_typecheck_and_build, github_workflows_ci_docker_compose_config [EXTRACTED 1.00]
- **FactStamp Consensus and Verification Flow** — readme_factstamp, readme_quorum_consensus_engine, readme_shareable_png_cards [INFERRED 0.85]
- **Theme Synchronization and Zero-FOUC Pipeline** — index_theme_initializer, src_contexts_themecontext_themeprovider, src_components_ui_themetoggle [INFERRED 0.85]

## Communities (31 total, 5 thin omitted)

### Community 0 - "firebaseService.ts"
Cohesion: 0.07
Nodes (62): AuthContext, AuthContextValue, AuthProvider(), defaultAuthContext, ClaimsContext, ClaimsProvider(), computeUpdatedClaim(), defaultClaimsContext (+54 more)

### Community 1 - "FactStamp Platform"
Cohesion: 0.18
Nodes (12): Dashboard Page Design Specs, Home Page Design Specs, Content Security Policy and Security Headers, FactStamp HTML Entrypoint, React Root Mount Point, FactStamp Shield Icon, FactStamp Social OG Cover, FactStamp Platform (+4 more)

### Community 2 - "UI-UX Search & BM25 Core"
Cohesion: 0.05
Nodes (42): BM25, detect_domain(), _load_csv(), Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query, Load CSV and return list of dicts, Core search function using BM25 (+34 more)

### Community 3 - "App.tsx"
Cohesion: 0.06
Nodes (50): Admin, App(), Dashboard, Home, NotFound, Profile, SignIn, SignUp (+42 more)

### Community 4 - "dependencies"
Cohesion: 0.12
Nodes (17): clsx, firebase, lucide-react, dependencies, clsx, firebase, lucide-react, react (+9 more)

### Community 5 - "scripts"
Cohesion: 0.06
Nodes (32): firebase-tools, devDependencies, firebase-tools, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, typescript (+24 more)

### Community 6 - "Submit.tsx"
Cohesion: 0.11
Nodes (20): Submit, AsyncActionStatus, CELL, CROSSFADE, INSTANT, LoadingButton(), LoadingButtonProps, useAsyncAction() (+12 more)

### Community 7 - "compilerOptions"
Cohesion: 0.08
Nodes (23): DOM, DOM.Iterable, ES2020, src, compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules (+15 more)

### Community 8 - "ui-ux-pro-max"
Cohesion: 0.07
Nodes (29): Accessibility, Available Domains, Available Stacks, Common Rules for Professional UI, Example Workflow, How to Use This Skill, Icons & Visual Elements, Interaction (+21 more)

### Community 9 - "seed-db.mjs"
Cohesion: 0.18
Nodes (14): api(), buildSeedNotifications(), deleteCollection(), ensureAccount(), env, main(), PENDING_SEEDS, SEED_CLAIMS (+6 more)

### Community 10 - "PasswordStrength.tsx"
Cohesion: 0.15
Nodes (14): CELL, CROSSFADE, defaultLabels, defaultPasswordRules, EvaluatedRule, INSTANT, PasswordRule, PasswordStrength() (+6 more)

### Community 11 - "FactStamp Development Changelog & Architecture Milestones"
Cohesion: 0.25
Nodes (7): FactStamp Development Changelog & Architecture Milestones, Milestone 1: Admin Command Center Dark / Light Theme Toggle, Milestone 2: Graphify Codebase Knowledge Graph Integration, Milestone 3: Universal Sliding Dual-Icon Theme Toggle Across All Pages, Milestone 4: Verification Queue Settlement & Dynamic Replenishment, Milestone 5: Authentication Security Hardening & Rate Limiting System, Milestone 6: High-Trust Pan-Indic Typography Architecture

### Community 12 - "ErrorBoundary.tsx"
Cohesion: 0.20
Nodes (3): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState

### Community 13 - "ClaimDetail.tsx"
Cohesion: 0.09
Nodes (23): ClaimDetail, collectDomains(), FactCheckCard(), P, truncateText(), VERDICT_ICONS, ButtonProps, Size (+15 more)

### Community 14 - "Continuous Integration Workflow"
Cohesion: 0.33
Nodes (6): Docker Compose Environment, Continuous Integration Workflow, Superseded Run Cancellation Strategy, Validate Docker Compose Job, Clean Docker Compose Validation Rationale, Typecheck & Production Build Job

### Community 15 - "Admin.tsx"
Cohesion: 0.10
Nodes (33): Badge, BadgeProps, BadgeSize, BadgeVariant, sizeClasses, variantClasses, CATEGORY_CONFIG, CategoryBadge (+25 more)

### Community 16 - "Claim"
Cohesion: 0.20
Nodes (10): ClaimCardProps, FactCheckCardProps, AddClaimInput, ClaimsContextValue, Claim, CATEGORY_ORDER, computeWeeklyReport(), WeeklyCategoryCount (+2 more)

### Community 17 - "ThemeContext.tsx"
Cohesion: 0.33
Nodes (5): Early Theme Initialization Script, Theme, ThemeContext, ThemeContextValue, ThemeProvider()

### Community 18 - "FactStamp Design System"
Cohesion: 0.50
Nodes (4): FactStamp Design System, Design System Master Tokens, Verdict Pill Visual System, Warm Editorial Palette

### Community 19 - "cn"
Cohesion: 0.05
Nodes (64): VerifyQueue, AnimatedCounter, AnimatedCounterProps, AuthLayoutProps, BENEFITS, STATS, Breadcrumbs(), BreadcrumbsProps (+56 more)

### Community 21 - "DashboardChart.tsx"
Cohesion: 0.33
Nodes (4): CATEGORY_COLORS, CustomTooltipProps, DashboardChart(), DashboardChartProps

### Community 22 - "create-user.mjs"
Cohesion: 0.25
Nodes (9): api(), env, isAdmin, positionalArgs, rawArgs, run(), toField(), toFields() (+1 more)

### Community 23 - "create-admin.mjs"
Cohesion: 0.33
Nodes (7): api(), args, env, run(), toField(), toFields(), updateMask()

## Knowledge Gaps
- **209 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 269 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `FactStamp HTML Entrypoint` connect `FactStamp Platform` to `ThemeContext.tsx`, `App.tsx`?**
  _High betweenness centrality (0.155) - this node is a cross-community bridge._
- **Why does `FactStamp Platform` connect `FactStamp Platform` to `FactStamp Design System`, `Continuous Integration Workflow`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Why does `Docker Compose Environment` connect `Continuous Integration Workflow` to `FactStamp Platform`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _209 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `firebaseService.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06521739130434782 - nodes in this community are weakly interconnected._
- **Should `UI-UX Search & BM25 Core` be split into smaller, more focused modules?**
  _Cohesion score 0.05388471177944862 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06340326340326341 - nodes in this community are weakly interconnected._