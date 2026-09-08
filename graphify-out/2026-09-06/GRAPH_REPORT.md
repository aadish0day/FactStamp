# Graph Report - FactStamp  (2026-09-06)

## Corpus Check
- 89 files · ~78,796 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1743 nodes · 3640 edges · 94 communities (65 shown, 26 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 206 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `60e83da0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- firebaseService.ts
- FactStamp Platform
- UI-UX Search & BM25 Core
- security.ts
- dependencies
- devDependencies
- Submit.tsx
- compilerOptions
- ui-ux-pro-max
- seed-db.mjs
- PasswordStrength.tsx
- FactStamp Development Changelog & Architecture Milestones
- VerifyDetail.tsx
- Admin.tsx
- Continuous Integration Workflow
- Claim
- worker.min.js
- App.tsx
- NotificationsContext.tsx
- cn
- tesseract-core-lstm.wasm.js
- tesseract-core.wasm.js
- create-user.mjs
- create-admin.mjs
- tesseract-core-simd-lstm.wasm.js
- Gemini Development Instructions
- Enterprise Firebase Security Rules
- S
- S
- S
- F
- F
- I
- I
- I
- F
- Ai
- E
- E
- E
- O
- A
- z
- M
- A
- M
- M
- $h
- open
- Ai
- Ai
- .bg
- A
- open
- O
- r
- bi
- z
- write
- z
- LoadingButton.tsx
- scripts
- Ha
- Design System Master File
- r
- $h
- write
- Page-Specific Rules
- write
- ErrorBoundary.tsx
- $h
- package.json
- Ha
- B
- La
- Page-Specific Rules
- La
- Aa
- hi
- vercel.json
- .GetDawg
- ti
- ui
- V
- wi
- xi
- B
- T
- DashboardChart.tsx
- duplicateDetection.ts
- ui

## God Nodes (most connected - your core abstractions)
1. `S()` - 67 edges
2. `S()` - 67 edges
3. `S()` - 67 edges
4. `cn()` - 52 edges
5. `I()` - 47 edges
6. `I()` - 47 edges
7. `I()` - 47 edges
8. `useAuth()` - 33 edges
9. `t()` - 32 edges
10. `i()` - 32 edges

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

## Communities (94 total, 26 thin omitted)

### Community 0 - "firebaseService.ts"
Cohesion: 0.07
Nodes (56): AuthContext, AuthContextValue, AuthProvider(), defaultAuthContext, ClaimsContext, ClaimsProvider(), computeUpdatedClaim(), defaultClaimsContext (+48 more)

### Community 1 - "FactStamp Platform"
Cohesion: 0.12
Nodes (16): FactStamp Design System, Verdict Pill Visual System, Warm Editorial Palette, Content Security Policy and Security Headers, FactStamp HTML Entrypoint, React Root Mount Point, Early Theme Initialization Script, FactStamp Shield Icon (+8 more)

### Community 2 - "UI-UX Search & BM25 Core"
Cohesion: 0.05
Nodes (42): BM25, detect_domain(), _load_csv(), Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query, Load CSV and return list of dicts, Core search function using BM25 (+34 more)

### Community 3 - "security.ts"
Cohesion: 0.14
Nodes (25): SignIn, AdminRoute(), AdminRouteProps, Input, InputProps, Textarea, TextareaProps, ALLOWED_IMAGE_EXTENSIONS (+17 more)

### Community 4 - "dependencies"
Cohesion: 0.08
Nodes (25): clsx, firebase, framer-motion, html-to-image, lucide-react, dependencies, clsx, firebase (+17 more)

### Community 5 - "devDependencies"
Cohesion: 0.12
Nodes (17): firebase-tools, devDependencies, firebase-tools, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, typescript (+9 more)

### Community 6 - "Submit.tsx"
Cohesion: 0.15
Nodes (17): Submit, compressImageToDataUrl(), estimateBytes(), validateImageUpload(), CATEGORY_OPTIONS, SAMPLE_FORWARDS, SAMPLE_SCREENSHOTS, Submit() (+9 more)

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

### Community 12 - "VerifyDetail.tsx"
Cohesion: 0.07
Nodes (38): NotFound, VerifyQueue, Breadcrumbs(), BreadcrumbsProps, LABEL_MAP, Seo(), SeoProps, Button (+30 more)

### Community 13 - "Admin.tsx"
Cohesion: 0.08
Nodes (38): Profile, AuthLayout(), AuthLayoutProps, BENEFITS, STATS, ClaimCardProps, Badge, BadgeProps (+30 more)

### Community 14 - "Continuous Integration Workflow"
Cohesion: 0.33
Nodes (6): Docker Compose Environment, Continuous Integration Workflow, Superseded Run Cancellation Strategy, Validate Docker Compose Job, Clean Docker Compose Validation Rationale, Typecheck & Production Build Job

### Community 15 - "Claim"
Cohesion: 0.17
Nodes (13): collectDomains(), FactCheckCard(), FactCheckCardProps, P, truncateText(), VERDICT_ICONS, AddClaimInput, ClaimsContextValue (+5 more)

### Community 16 - "worker.min.js"
Cohesion: 0.11
Nodes (67): a(), B(), c(), a(), s(), ct(), d(), dt() (+59 more)

### Community 17 - "App.tsx"
Cohesion: 0.16
Nodes (12): Admin, ClaimDetail, SignUp, VerifyDetail, Footer(), OnlineStatusBar(), ProtectedRoute(), ProtectedRouteProps (+4 more)

### Community 18 - "NotificationsContext.tsx"
Cohesion: 0.15
Nodes (16): NotificationBell(), TYPE_CONFIG, ClaimDetailSkeleton(), NotificationListSkeleton(), DEFAULT_SEED_NOTIFICATIONS, defaultNotificationsContext, NotificationsContext, NotificationsContextValue (+8 more)

### Community 19 - "cn"
Cohesion: 0.08
Nodes (39): Dashboard, Home, AnimatedCounter, AnimatedCounterProps, ClaimCard, Navbar(), Avatar(), AvatarProps (+31 more)

### Community 20 - "tesseract-core-lstm.wasm.js"
Cohesion: 0.06
Nodes (29): Bb(), chmod(), create(), Db(), gb(), hb(), hg(), ji() (+21 more)

### Community 21 - "tesseract-core.wasm.js"
Cohesion: 0.04
Nodes (24): Aa, B(), fchmod(), fchown(), gb(), hb(), hi(), Ih() (+16 more)

### Community 22 - "create-user.mjs"
Cohesion: 0.25
Nodes (9): api(), env, isAdmin, positionalArgs, rawArgs, run(), toField(), toFields() (+1 more)

### Community 23 - "create-admin.mjs"
Cohesion: 0.33
Nodes (7): api(), args, env, run(), toField(), toFields(), updateMask()

### Community 24 - "tesseract-core-simd-lstm.wasm.js"
Cohesion: 0.05
Nodes (22): Aa, chown(), gb(), hb(), hi(), ji(), ki(), La (+14 more)

### Community 34 - "F"
Cohesion: 0.15
Nodes (3): F(), G(), r()

### Community 38 - "F"
Cohesion: 0.10
Nodes (4): F(), G(), O(), ui()

### Community 40 - "E"
Cohesion: 0.11
Nodes (6): E(), J(), L(), Q(), Rf(), zi()

### Community 41 - "E"
Cohesion: 0.11
Nodes (6): E(), J(), L(), Q(), Rf(), zi()

### Community 42 - "E"
Cohesion: 0.14
Nodes (5): E(), J(), L(), Nf(), Q()

### Community 43 - "O"
Cohesion: 0.11
Nodes (4): bi(), O(), pi(), si()

### Community 44 - "A"
Cohesion: 0.18
Nodes (21): A(), chown(), Jg(), Lb(), lchown(), Mh(), Nh(), Oh() (+13 more)

### Community 45 - "z"
Cohesion: 0.20
Nodes (21): Ab(), bg(), Cb(), chdir(), createNode(), Eb(), Fb(), isFIFO() (+13 more)

### Community 47 - "A"
Cohesion: 0.20
Nodes (19): A(), Jg(), Lb(), Mh(), Nh(), Oh(), ph(), qh() (+11 more)

### Community 50 - "$h"
Cohesion: 0.15
Nodes (7): createNode(), $h(), a(), hg(), isFIFO(), Kf(), symlink()

### Community 51 - "open"
Cohesion: 0.17
Nodes (16): Bb(), chmod(), create(), Db(), lchmod(), lh(), Mb(), mkdir() (+8 more)

### Community 53 - "Ai"
Cohesion: 0.11
Nodes (7): Ai(), Ha(), ii(), Ja(), ri(), vi(), yi()

### Community 54 - ".bg"
Cohesion: 0.33
Nodes (7): bg(), Fg(), Rb(), read(), Sb(), C, h()

### Community 55 - "A"
Cohesion: 0.13
Nodes (19): A(), chown(), Fg(), Fh(), fstat(), Gg(), c(), d() (+11 more)

### Community 56 - "open"
Cohesion: 0.20
Nodes (14): Bb(), chmod(), create(), Db(), lchmod(), Mb(), mkdir(), open() (+6 more)

### Community 57 - "O"
Cohesion: 0.11
Nodes (4): bi(), O(), pi(), si()

### Community 58 - "r"
Cohesion: 0.19
Nodes (11): Bg(), Ja(), lstat(), r(), Rb(), read(), readFile(), Sb() (+3 more)

### Community 59 - "bi"
Cohesion: 0.13
Nodes (5): bi(), pi(), sg(), si(), T()

### Community 60 - "z"
Cohesion: 0.34
Nodes (14): Ab(), Cb(), chdir(), Eb(), Fb(), Jb(), lookup(), nb() (+6 more)

### Community 61 - "write"
Cohesion: 0.25
Nodes (6): eg(), Nf(), sg(), T(), wg(), write()

### Community 62 - "z"
Cohesion: 0.34
Nodes (14): Ab(), Cb(), chdir(), Eb(), Fb(), Jb(), lookup(), nb() (+6 more)

### Community 63 - "LoadingButton.tsx"
Cohesion: 0.18
Nodes (8): AsyncActionStatus, CELL, CROSSFADE, INSTANT, LoadingButton(), LoadingButtonProps, useAsyncAction(), UseAsyncActionOptions

### Community 64 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, create:admin, create:user, dev, emulators, emulators:export, emulators:persist (+3 more)

### Community 65 - "Ha"
Cohesion: 0.18
Nodes (4): Ha(), ii(), ri(), vi()

### Community 66 - "Design System Master File"
Cohesion: 0.12
Nodes (16): Additional Forbidden Patterns, Anti-Patterns (Do NOT Use), Buttons, Cards, Color Palette, Component Specs, Design System Master File, Global Rules (+8 more)

### Community 67 - "r"
Cohesion: 0.16
Nodes (15): close(), Fg(), fsync(), a(), Ja(), lstat(), r(), Rb() (+7 more)

### Community 69 - "write"
Cohesion: 0.20
Nodes (10): ag(), close(), fsync(), isFile(), Jf(), Lf(), oh(), write() (+2 more)

### Community 70 - "Page-Specific Rules"
Cohesion: 0.20
Nodes (9): Color Overrides, Component Overrides, Dashboard Page Overrides, Layout Overrides, Page-Specific Components, Page-Specific Rules, Recommendations, Spacing Overrides (+1 more)

### Community 71 - "write"
Cohesion: 0.18
Nodes (11): close(), eg(), fsync(), isFile(), lstat(), Nf(), Pf(), readFile() (+3 more)

### Community 72 - "ErrorBoundary.tsx"
Cohesion: 0.20
Nodes (3): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState

### Community 73 - "$h"
Cohesion: 0.17
Nodes (7): createNode(), dg(), Gf(), $h(), a(), isFIFO(), symlink()

### Community 74 - "package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 75 - "Ha"
Cohesion: 0.18
Nodes (4): Ha(), ii(), ri(), vi()

### Community 76 - "B"
Cohesion: 0.25
Nodes (9): B(), fchmod(), fchown(), fstat(), Kb(), Kg(), c(), d() (+1 more)

### Community 78 - "Page-Specific Rules"
Cohesion: 0.20
Nodes (9): Color Overrides, Component Overrides, Home Page Overrides, Layout Overrides, Page-Specific Components, Page-Specific Rules, Recommendations, Spacing Overrides (+1 more)

### Community 82 - "vercel.json"
Cohesion: 0.33
Nodes (5): cleanUrls, headers, rewrites, $schema, trailingSlash

### Community 89 - "B"
Cohesion: 0.25
Nodes (9): B(), fchmod(), fchown(), fstat(), Kb(), Kg(), c(), d() (+1 more)

### Community 90 - "T"
Cohesion: 0.33
Nodes (4): sg(), T(), tg(), wg()

### Community 91 - "DashboardChart.tsx"
Cohesion: 0.33
Nodes (4): CATEGORY_COLORS, CustomTooltipProps, DashboardChart(), DashboardChartProps

### Community 92 - "duplicateDetection.ts"
Cohesion: 0.80
Nodes (4): findDuplicate(), jaccardSimilarity(), normalize(), tokenize()

## Knowledge Gaps
- **241 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+236 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 721 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `f()` connect `worker.min.js` to `A`, `A`, `A`?**
  _High betweenness centrality (0.217) - this node is a cross-community bridge._
- **Why does `A()` connect `A` to `r`, `B`, `z`, `worker.min.js`, `tesseract-core-lstm.wasm.js`, `S`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **Why does `A()` connect `A` to `open`, `write`, `worker.min.js`, `$h`, `.bg`, `tesseract-core-simd-lstm.wasm.js`, `B`, `T`, `z`, `S`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _241 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `firebaseService.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0745637228979376 - nodes in this community are weakly interconnected._
- **Should `FactStamp Platform` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `UI-UX Search & BM25 Core` be split into smaller, more focused modules?**
  _Cohesion score 0.05388471177944862 - nodes in this community are weakly interconnected._