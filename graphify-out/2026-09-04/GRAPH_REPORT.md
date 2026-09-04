# Graph Report - FactStamp  (2026-09-04)

## Corpus Check
- 90 files · ~80,766 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1718 nodes · 3628 edges · 93 communities (57 shown, 33 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 210 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3a5effd8`
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
- Profile.tsx
- NotificationsContext.tsx
- Continuous Integration Workflow
- Admin.tsx
- worker.min.js
- App.tsx
- FactStamp Design System
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
- r
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
- Ha
- r
- $h
- Jh
- Ha
- write
- ErrorBoundary.tsx
- $h
- package.json
- B
- ui
- La
- La
- La
- O
- DashboardChart.tsx
- vercel.json
- yi
- duplicateDetection.ts
- ui
- ui
- Aa
- hi
- ti
- V
- wi
- xi

## God Nodes (most connected - your core abstractions)
1. `S()` - 67 edges
2. `S()` - 67 edges
3. `S()` - 67 edges
4. `cn()` - 54 edges
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

## Communities (93 total, 33 thin omitted)

### Community 0 - "firebaseService.ts"
Cohesion: 0.07
Nodes (59): AuthContext, AuthContextValue, AuthProvider(), defaultAuthContext, AddVerificationInput, ClaimsContext, ClaimsProvider(), computeUpdatedClaim() (+51 more)

### Community 1 - "FactStamp Platform"
Cohesion: 0.13
Nodes (15): Dashboard Page Design Specs, Home Page Design Specs, Content Security Policy and Security Headers, FactStamp HTML Entrypoint, React Root Mount Point, Early Theme Initialization Script, FactStamp Shield Icon, FactStamp Social OG Cover (+7 more)

### Community 2 - "UI-UX Search & BM25 Core"
Cohesion: 0.05
Nodes (42): BM25, detect_domain(), _load_csv(), Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query, Load CSV and return list of dicts, Core search function using BM25 (+34 more)

### Community 3 - "security.ts"
Cohesion: 0.18
Nodes (21): AdminRoute(), AdminRouteProps, ALLOWED_IMAGE_EXTENSIONS, ALLOWED_IMAGE_MIMES, checkLoginRateLimit(), ExplanationValidationResult, FileValidationResult, formatLockoutRemaining() (+13 more)

### Community 4 - "dependencies"
Cohesion: 0.08
Nodes (25): clsx, firebase, framer-motion, html-to-image, lucide-react, dependencies, clsx, firebase (+17 more)

### Community 5 - "devDependencies"
Cohesion: 0.12
Nodes (17): firebase-tools, devDependencies, firebase-tools, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, typescript (+9 more)

### Community 6 - "Submit.tsx"
Cohesion: 0.13
Nodes (22): Submit, CategoryBadgeProps, Modal(), ModalProps, compressImageToDataUrl(), estimateBytes(), validateImageUpload(), ClaimCategory (+14 more)

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

### Community 12 - "Profile.tsx"
Cohesion: 0.09
Nodes (39): NotFound, VerifyQueue, AnimatedCounter, AnimatedCounterProps, Seo(), SeoProps, Avatar(), AvatarProps (+31 more)

### Community 13 - "NotificationsContext.tsx"
Cohesion: 0.16
Nodes (15): NotificationBell(), TYPE_CONFIG, ClaimDetailSkeleton(), NotificationListSkeleton(), DEFAULT_SEED_NOTIFICATIONS, defaultNotificationsContext, NotificationsContext, NotificationsContextValue (+7 more)

### Community 14 - "Continuous Integration Workflow"
Cohesion: 0.33
Nodes (6): Docker Compose Environment, Continuous Integration Workflow, Superseded Run Cancellation Strategy, Validate Docker Compose Job, Clean Docker Compose Validation Rationale, Typecheck & Production Build Job

### Community 15 - "Admin.tsx"
Cohesion: 0.08
Nodes (39): ClaimCardProps, collectDomains(), FactCheckCard(), FactCheckCardProps, P, truncateText(), VERDICT_ICONS, Badge (+31 more)

### Community 16 - "worker.min.js"
Cohesion: 0.10
Nodes (69): C, h(), a(), B(), c(), a(), s(), ct() (+61 more)

### Community 17 - "App.tsx"
Cohesion: 0.08
Nodes (26): Admin, ClaimDetail, Dashboard, Profile, SignIn, SignUp, VerifyDetail, AuthLayout() (+18 more)

### Community 18 - "FactStamp Design System"
Cohesion: 0.50
Nodes (4): FactStamp Design System, Design System Master Tokens, Verdict Pill Visual System, Warm Editorial Palette

### Community 19 - "cn"
Cohesion: 0.07
Nodes (41): Home, Breadcrumbs(), BreadcrumbsProps, LABEL_MAP, ClaimCard, OnlineStatusBar(), FlowButton, FlowButtonProps (+33 more)

### Community 20 - "tesseract-core-lstm.wasm.js"
Cohesion: 0.05
Nodes (26): Aa, B(), chown(), fchmod(), fchown(), Fg(), fstat(), hi() (+18 more)

### Community 21 - "tesseract-core.wasm.js"
Cohesion: 0.04
Nodes (22): Aa, B(), fchmod(), fchown(), hi(), Ih(), ji(), ki() (+14 more)

### Community 22 - "create-user.mjs"
Cohesion: 0.25
Nodes (9): api(), env, isAdmin, positionalArgs, rawArgs, run(), toField(), toFields() (+1 more)

### Community 23 - "create-admin.mjs"
Cohesion: 0.33
Nodes (7): api(), args, env, run(), toField(), toFields(), updateMask()

### Community 24 - "tesseract-core-simd-lstm.wasm.js"
Cohesion: 0.06
Nodes (29): Bb(), chmod(), create(), Db(), gb(), hb(), hg(), ji() (+21 more)

### Community 40 - "E"
Cohesion: 0.11
Nodes (6): E(), J(), L(), Q(), Rf(), zi()

### Community 41 - "E"
Cohesion: 0.11
Nodes (6): E(), J(), L(), Q(), Rf(), zi()

### Community 42 - "E"
Cohesion: 0.11
Nodes (8): E(), J(), L(), Lf(), Nf(), og(), Q(), zi()

### Community 43 - "O"
Cohesion: 0.11
Nodes (4): bi(), O(), pi(), si()

### Community 44 - "A"
Cohesion: 0.17
Nodes (23): A(), Jg(), Kb(), Kg(), c(), d(), Lb(), Mh() (+15 more)

### Community 45 - "z"
Cohesion: 0.34
Nodes (14): Ab(), Cb(), chdir(), Eb(), Fb(), Jb(), lookup(), nb() (+6 more)

### Community 47 - "A"
Cohesion: 0.18
Nodes (21): A(), chown(), Jg(), Lb(), lchown(), Mh(), Nh(), Oh() (+13 more)

### Community 49 - "M"
Cohesion: 0.09
Nodes (5): gb(), hb(), M(), Mb(), Uf()

### Community 51 - "open"
Cohesion: 0.16
Nodes (14): Bb(), chmod(), create(), Db(), lchmod(), lh(), mkdir(), open() (+6 more)

### Community 54 - "r"
Cohesion: 0.16
Nodes (15): close(), Fg(), fsync(), a(), Ja(), lstat(), r(), Rb() (+7 more)

### Community 55 - "A"
Cohesion: 0.13
Nodes (19): A(), chown(), Fg(), Fh(), fstat(), Gg(), c(), d() (+11 more)

### Community 56 - "open"
Cohesion: 0.17
Nodes (15): Bb(), chmod(), create(), Db(), gb(), hb(), lchmod(), Mb() (+7 more)

### Community 57 - "O"
Cohesion: 0.11
Nodes (4): bi(), O(), pi(), si()

### Community 58 - "r"
Cohesion: 0.11
Nodes (19): Bg(), close(), fsync(), isFile(), Ja(), Jf(), lstat(), oh() (+11 more)

### Community 59 - "bi"
Cohesion: 0.13
Nodes (5): bi(), pi(), sg(), si(), T()

### Community 60 - "z"
Cohesion: 0.20
Nodes (21): Ab(), bg(), Cb(), chdir(), createNode(), Eb(), Fb(), isFIFO() (+13 more)

### Community 61 - "write"
Cohesion: 0.17
Nodes (10): bg(), eg(), isFile(), Nf(), Pf(), sg(), T(), tg() (+2 more)

### Community 62 - "z"
Cohesion: 0.20
Nodes (20): Ab(), Cb(), chdir(), createNode(), dg(), Eb(), Fb(), Gf() (+12 more)

### Community 63 - "LoadingButton.tsx"
Cohesion: 0.18
Nodes (8): AsyncActionStatus, CELL, CROSSFADE, INSTANT, LoadingButton(), LoadingButtonProps, useAsyncAction(), UseAsyncActionOptions

### Community 64 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, create:admin, create:user, dev, emulators, emulators:export, emulators:persist (+3 more)

### Community 65 - "Ha"
Cohesion: 0.18
Nodes (4): Ha(), ii(), ri(), vi()

### Community 66 - "Ha"
Cohesion: 0.18
Nodes (4): Ha(), ii(), ri(), vi()

### Community 67 - "r"
Cohesion: 0.20
Nodes (11): close(), fsync(), Ja(), lstat(), Qb(), r(), Rb(), readFile() (+3 more)

### Community 68 - "$h"
Cohesion: 0.17
Nodes (7): createNode(), $h(), a(), hg(), isFIFO(), Kf(), symlink()

### Community 70 - "Ha"
Cohesion: 0.18
Nodes (4): Ha(), ii(), ri(), vi()

### Community 71 - "write"
Cohesion: 0.25
Nodes (6): eg(), Nf(), sg(), T(), wg(), write()

### Community 72 - "ErrorBoundary.tsx"
Cohesion: 0.20
Nodes (3): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState

### Community 74 - "package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 75 - "B"
Cohesion: 0.25
Nodes (9): B(), fchmod(), fchown(), fstat(), Kb(), Kg(), c(), d() (+1 more)

### Community 81 - "DashboardChart.tsx"
Cohesion: 0.33
Nodes (4): CATEGORY_COLORS, CustomTooltipProps, DashboardChart(), DashboardChartProps

### Community 82 - "vercel.json"
Cohesion: 0.33
Nodes (5): cleanUrls, headers, rewrites, $schema, trailingSlash

### Community 84 - "duplicateDetection.ts"
Cohesion: 0.80
Nodes (4): findDuplicate(), jaccardSimilarity(), normalize(), tokenize()

## Knowledge Gaps
- **218 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+213 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 695 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `f()` connect `worker.min.js` to `A`, `A`, `A`?**
  _High betweenness centrality (0.224) - this node is a cross-community bridge._
- **Why does `A()` connect `A` to `r`, `$h`, `z`, `worker.min.js`, `tesseract-core-lstm.wasm.js`, `open`, `write`, `S`?**
  _High betweenness centrality (0.151) - this node is a cross-community bridge._
- **Why does `A()` connect `A` to `B`, `worker.min.js`, `r`, `tesseract-core-simd-lstm.wasm.js`, `z`, `S`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _218 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `firebaseService.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06971153846153846 - nodes in this community are weakly interconnected._
- **Should `FactStamp Platform` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `UI-UX Search & BM25 Core` be split into smaller, more focused modules?**
  _Cohesion score 0.05388471177944862 - nodes in this community are weakly interconnected._