# Graph Report - FactStamp  (2026-09-04)

## Corpus Check
- 84 files · ~69,237 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 608 nodes · 1303 edges · 29 communities (24 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1270500b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Admin.tsx
- VerifyQueue.tsx
- UI-UX Search & BM25 Core
- App.tsx
- dependencies
- scripts
- Submit.tsx
- compilerOptions
- ui-ux-pro-max
- seed-db.mjs
- SignUp.tsx
- FactStamp Development Changelog & Architecture Milestones
- VerifyDetail.tsx
- ClaimDetail.tsx
- Home.tsx
- VerdictPill.tsx
- Claim
- utils.ts
- Navbar.tsx
- Profile.tsx
- cn
- DashboardChart.tsx
- create-user.mjs
- create-admin.mjs
- Gemini Development Instructions
- Enterprise Firebase Security Rules

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

## Communities (29 total, 2 thin omitted)

### Community 0 - "Admin.tsx"
Cohesion: 0.05
Nodes (83): TYPE_CONFIG, ClaimDetailSkeleton(), NotificationListSkeleton(), AuthContext, AuthContextValue, AuthProvider(), defaultAuthContext, ClaimsContext (+75 more)

### Community 1 - "VerifyQueue.tsx"
Cohesion: 0.24
Nodes (9): VerifyQueue, useClaims(), ClaimDossierCard(), ConsensusStepper(), FILTERS, SORT_OPTIONS, SortMode, timeRemaining() (+1 more)

### Community 2 - "UI-UX Search & BM25 Core"
Cohesion: 0.05
Nodes (42): BM25, detect_domain(), _load_csv(), Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query, Load CSV and return list of dicts, Core search function using BM25 (+34 more)

### Community 3 - "App.tsx"
Cohesion: 0.07
Nodes (43): Admin, App(), ClaimDetail, Dashboard, Home, SignIn, VerifyDetail, AdminRoute() (+35 more)

### Community 4 - "dependencies"
Cohesion: 0.04
Nodes (47): clsx, FactStamp Design System, Design System Master Tokens, Dashboard Page Design Specs, Home Page Design Specs, Verdict Pill Visual System, Warm Editorial Palette, Docker Compose Environment (+39 more)

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

### Community 10 - "SignUp.tsx"
Cohesion: 0.07
Nodes (21): SignUp, ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, CELL, CROSSFADE, defaultLabels, defaultPasswordRules (+13 more)

### Community 11 - "FactStamp Development Changelog & Architecture Milestones"
Cohesion: 0.25
Nodes (7): FactStamp Development Changelog & Architecture Milestones, Milestone 1: Admin Command Center Dark / Light Theme Toggle, Milestone 2: Graphify Codebase Knowledge Graph Integration, Milestone 3: Universal Sliding Dual-Icon Theme Toggle Across All Pages, Milestone 4: Verification Queue Settlement & Dynamic Replenishment, Milestone 5: Authentication Security Hardening & Rate Limiting System, Milestone 6: High-Trust Pan-Indic Typography Architecture

### Community 12 - "VerifyDetail.tsx"
Cohesion: 0.15
Nodes (15): ClaimCard, CategoryBadge, QUALITY_CONFIG, SourceQualityDot, SourceQualityDotProps, VerdictPill, VERDICT_ICONS, VerdictStamp (+7 more)

### Community 13 - "ClaimDetail.tsx"
Cohesion: 0.15
Nodes (14): NotFound, Seo(), SeoProps, Button, ButtonProps, Size, sizeClasses, Variant (+6 more)

### Community 14 - "Home.tsx"
Cohesion: 0.15
Nodes (11): FlowButton, FlowButtonProps, Marquee(), MarqueeProps, ShimmerText(), ShimmerTextProps, ShimmerVariant, variantMap (+3 more)

### Community 15 - "VerdictPill.tsx"
Cohesion: 0.17
Nodes (14): Badge, BadgeProps, BadgeSize, BadgeVariant, sizeClasses, variantClasses, CATEGORY_CONFIG, CategoryBadgeProps (+6 more)

### Community 16 - "Claim"
Cohesion: 0.15
Nodes (15): ClaimCardProps, collectDomains(), FactCheckCard(), FactCheckCardProps, P, truncateText(), VERDICT_ICONS, AddClaimInput (+7 more)

### Community 17 - "utils.ts"
Cohesion: 0.53
Nodes (5): convertOklchInString(), parseOklabToRgb(), parseOklchToRgb(), replaceBalancedFn(), ClaimDetail()

### Community 18 - "Navbar.tsx"
Cohesion: 0.24
Nodes (7): NotificationBell(), Avatar(), AvatarProps, dotSizeClasses, sizeClasses, InteractiveHoverButton, InteractiveHoverButtonProps

### Community 19 - "Profile.tsx"
Cohesion: 0.19
Nodes (14): Profile, AnimatedCounter, AnimatedCounterProps, Breadcrumbs(), BreadcrumbsProps, LABEL_MAP, useUsers(), formatDistanceToNow() (+6 more)

### Community 20 - "cn"
Cohesion: 0.16
Nodes (12): OnlineStatusBar(), Input, InputProps, Textarea, TextareaProps, Modal(), ModalProps, SpotlightCard() (+4 more)

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
- **210 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+205 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 270 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `FactStamp HTML Entrypoint` connect `dependencies` to `App.tsx`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _210 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05124685426675818 - nodes in this community are weakly interconnected._
- **Should `UI-UX Search & BM25 Core` be split into smaller, more focused modules?**
  _Cohesion score 0.05388471177944862 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._