# Graph Report - FactStamp  (2026-09-30)

## Corpus Check
- 93 files · ~86,168 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 37 file(s) not represented in the graph (top: .csv 24, (none) 4, .wasm 3)

## Summary
- 1850 nodes · 4035 edges · 98 communities (74 shown, 24 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 226 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2debedbb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ClaimsContext.tsx
- FactStamp Platform
- DesignSystemGenerator
- SignIn.tsx
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
- cn
- NotificationsContext.tsx
- App.tsx
- tesseract-core-lstm.wasm.js
- tesseract-core.wasm.js
- firebaseService.ts
- Dashboard.tsx
- tesseract-core-simd-lstm.wasm.js
- Gemini Development Instructions
- Enterprise Firebase Security Rules
- VerifyQueue.tsx
- index.js
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
- createNode
- open
- Ai
- Ai
- r
- A
- open
- bi
- r
- write
- z
- write
- z
- LoadingButton.tsx
- scripts
- Ha
- Design System Master File
- r
- $h
- createNode
- Page-Specific Rules
- write
- ErrorBoundary
- $h
- package.json
- Ha
- createNode
- La
- Page-Specific Rules
- La
- test-rules.mjs
- AuthContext.tsx
- vercel.json
- .GetDawg
- design_system.py
- ui
- Wf
- core.py
- Ha
- Kg
- UsersContext.tsx
- DashboardChart.tsx
- duplicateDetection.ts
- BM25
- search.py
- generate_design_system
- firebase.ts
- La

## God Nodes (most connected - your core abstractions)
1. `S()` - 67 edges
2. `S()` - 67 edges
3. `S()` - 67 edges
4. `cn()` - 52 edges
5. `I()` - 47 edges
6. `I()` - 47 edges
7. `I()` - 47 edges
8. `react` - 43 edges
9. `t()` - 34 edges
10. `i()` - 33 edges

## Surprising Connections (you probably didn't know these)
- `Typecheck & Production Build Job` --references--> `dependencies`  [INFERRED]
  .github/workflows/ci.yml → package.json
- `Early Theme Initialization Script` --shares_data_with--> `ThemeProvider()`  [INFERRED]
  index.html → src/contexts/ThemeContext.tsx
- `Milestone 4: Verification Queue Settlement & Dynamic Replenishment` --references--> `subscribeClaimsRealtime()`  [INFERRED]
  CHANGELOG.md → src/services/firebaseService.ts
- `FactStamp Shield Icon` --conceptually_related_to--> `FactStamp Platform`  [INFERRED]
  public/favicon.svg → README.md
- `FactStamp Social OG Cover` --conceptually_related_to--> `FactStamp Platform`  [INFERRED]
  public/og-cover.svg → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **CI Automated Verification Pipeline** — github_workflows_ci_ci_workflow, github_workflows_ci_typecheck_and_build, github_workflows_ci_docker_compose_config [EXTRACTED 1.00]
- **FactStamp Consensus and Verification Flow** — readme_factstamp, readme_quorum_consensus_engine, readme_shareable_png_cards [INFERRED 0.85]
- **Theme Synchronization and Zero-FOUC Pipeline** — index_theme_initializer, src_contexts_themecontext_themeprovider, src_components_ui_themetoggle [INFERRED 0.85]

## Communities (98 total, 24 thin omitted)

### Community 0 - "ClaimsContext.tsx"
Cohesion: 0.14
Nodes (24): Milestone 4: Verification Queue Settlement & Dynamic Replenishment, AddVerificationInput, ClaimsContext, ClaimsProvider(), computeUpdatedClaim(), defaultClaimsContext, NOTE: overdue pending claims are deliberately NOT rewritten here. Doing, NOTE: These getters are called during render (e.g. ClaimDetail), so they (+16 more)

### Community 1 - "FactStamp Platform"
Cohesion: 0.15
Nodes (14): FactStamp Design System, Verdict Pill Visual System, Warm Editorial Palette, Content Security Policy and Security Headers, FactStamp HTML Entrypoint, React Root Mount Point, Early Theme Initialization Script, FactStamp Shield Icon (+6 more)

### Community 2 - "DesignSystemGenerator"
Cohesion: 0.13
Nodes (13): detect_domain(), Auto-detect the most relevant domain from query, Main search function with auto-domain detection, search(), DesignSystemGenerator, Select best matching result based on priority keywords., Extract results list from search result dict., Generate complete design system recommendation. (+5 more)

### Community 3 - "SignIn.tsx"
Cohesion: 0.13
Nodes (27): Milestone 5: Authentication Security Hardening & Rate Limiting System, sonner, AdminRoute(), AdminRouteProps, Input, InputProps, Textarea, TextareaProps (+19 more)

### Community 4 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, clsx, firebase, framer-motion, html-to-image, lucide-react, react, react-dom (+5 more)

### Community 5 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, firebase-tools, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, typescript, vite (+1 more)

### Community 6 - "Submit.tsx"
Cohesion: 0.14
Nodes (19): tesseract.js, Submit, compressImageToDataUrl(), createThumbnailDataUrl(), validateImageUpload(), CATEGORY_OPTIONS, SAMPLE_FORWARDS, SAMPLE_SCREENSHOTS (+11 more)

### Community 7 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+11 more)

### Community 8 - "ui-ux-pro-max"
Cohesion: 0.07
Nodes (29): Accessibility, Available Domains, Available Stacks, Common Rules for Professional UI, Example Workflow, How to Use This Skill, Icons & Visual Elements, Interaction (+21 more)

### Community 9 - "seed-db.mjs"
Cohesion: 0.06
Nodes (39): ref_node_fs, ref_node_path, api(), APPLY, args, env, EXPECTED_ADMINS, main() (+31 more)

### Community 10 - "PasswordStrength.tsx"
Cohesion: 0.15
Nodes (14): CELL, CROSSFADE, defaultLabels, defaultPasswordRules, EvaluatedRule, INSTANT, PasswordRule, PasswordStrength() (+6 more)

### Community 11 - "FactStamp Development Changelog & Architecture Milestones"
Cohesion: 0.33
Nodes (5): FactStamp Development Changelog & Architecture Milestones, Milestone 1: Admin Command Center Dark / Light Theme Toggle, Milestone 2: Graphify Codebase Knowledge Graph Integration, Milestone 3: Universal Sliding Dual-Icon Theme Toggle Across All Pages, Milestone 6: High-Trust Pan-Indic Typography Architecture

### Community 12 - "VerifyDetail.tsx"
Cohesion: 0.12
Nodes (23): ClaimDetail, Breadcrumbs(), BreadcrumbsProps, LABEL_MAP, Seo(), SeoProps, ErrorState(), ErrorStateProps (+15 more)

### Community 13 - "Admin.tsx"
Cohesion: 0.09
Nodes (38): react, AnimatedCounter, AnimatedCounterProps, Badge, BadgeProps, BadgeSize, BadgeVariant, sizeClasses (+30 more)

### Community 14 - "Continuous Integration Workflow"
Cohesion: 0.33
Nodes (6): Docker Compose Environment, Continuous Integration Workflow, Superseded Run Cancellation Strategy, Validate Docker Compose Job, Clean Docker Compose Validation Rationale, Typecheck & Production Build Job

### Community 15 - "Claim"
Cohesion: 0.24
Nodes (10): ClaimCardProps, collectDomains(), FactCheckCard(), FactCheckCardProps, P, truncateText(), VERDICT_ICONS, AddClaimInput (+2 more)

### Community 16 - "worker.min.js"
Cohesion: 0.11
Nodes (67): a(), B(), c(), a(), s(), ct(), d(), dt() (+59 more)

### Community 17 - "cn"
Cohesion: 0.15
Nodes (17): ClaimCard, NotificationBell(), TYPE_CONFIG, OnlineStatusBar(), Marquee(), MarqueeProps, ClaimDetailSkeleton(), NotificationListSkeleton() (+9 more)

### Community 18 - "NotificationsContext.tsx"
Cohesion: 0.25
Nodes (10): DEFAULT_SEED_NOTIFICATIONS, defaultNotificationsContext, NotificationsContext, NotificationsContextValue, NotificationsProvider(), isFirebaseConfigured, AppNotification, markAllNotificationsRead() (+2 more)

### Community 19 - "App.tsx"
Cohesion: 0.07
Nodes (36): lucide-react, react-dom, react-router-dom, Admin, App(), Dashboard, Profile, SignIn (+28 more)

### Community 20 - "tesseract-core-lstm.wasm.js"
Cohesion: 0.04
Nodes (28): Aa, B(), chown(), fchmod(), fchown(), fstat(), gb(), hb() (+20 more)

### Community 21 - "tesseract-core.wasm.js"
Cohesion: 0.04
Nodes (25): Aa, B(), fchmod(), fchown(), fstat(), gb(), hb(), hi() (+17 more)

### Community 22 - "firebaseService.ts"
Cohesion: 0.08
Nodes (30): useUsers(), src_lib_firebase_adddoc, src_lib_firebase_collection, src_lib_firebase_createuserwithemailandpassword, src_lib_firebase_deletedoc, src_lib_firebase_deletefield, src_lib_firebase_firebasesignout, src_lib_firebase_getdoc (+22 more)

### Community 23 - "Dashboard.tsx"
Cohesion: 0.11
Nodes (21): framer-motion, Home, FlowButton, FlowButtonProps, ShimmerText(), ShimmerTextProps, ShimmerVariant, variantMap (+13 more)

### Community 24 - "tesseract-core-simd-lstm.wasm.js"
Cohesion: 0.05
Nodes (26): Aa, B(), chown(), fchmod(), fchown(), fstat(), gb(), hb() (+18 more)

### Community 27 - "VerifyQueue.tsx"
Cohesion: 0.10
Nodes (20): NotFound, VerifyQueue, ErrorBoundaryProps, ErrorBoundaryState, Button, ButtonProps, Size, sizeClasses (+12 more)

### Community 29 - "index.js"
Cohesion: 0.13
Nodes (20): applyReputation(), awardVerificationReputation, clamp(), db, majorityVerdict(), scoreAgainst(), snippet(), wasScored() (+12 more)

### Community 34 - "F"
Cohesion: 0.10
Nodes (4): F(), G(), O(), ui()

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
Cohesion: 0.13
Nodes (5): E(), J(), L(), Nf(), Q()

### Community 43 - "O"
Cohesion: 0.11
Nodes (4): bi(), O(), pi(), si()

### Community 44 - "A"
Cohesion: 0.20
Nodes (19): A(), Jg(), Lb(), Mh(), Nh(), Oh(), ph(), qh() (+11 more)

### Community 45 - "z"
Cohesion: 0.34
Nodes (14): Ab(), Cb(), chdir(), Eb(), Fb(), Jb(), lookup(), nb() (+6 more)

### Community 47 - "A"
Cohesion: 0.20
Nodes (19): A(), Jg(), Lb(), Mh(), Nh(), Oh(), ph(), qh() (+11 more)

### Community 50 - "createNode"
Cohesion: 0.17
Nodes (7): createNode(), $h(), a(), hg(), isFIFO(), Kf(), symlink()

### Community 51 - "open"
Cohesion: 0.17
Nodes (16): Bb(), chmod(), create(), Db(), lchmod(), lh(), Mb(), mkdir() (+8 more)

### Community 54 - "r"
Cohesion: 0.17
Nodes (14): close(), Fg(), fsync(), Ja(), lstat(), r(), Rb(), read() (+6 more)

### Community 55 - "A"
Cohesion: 0.14
Nodes (18): A(), chown(), Fg(), Fh(), Gg(), c(), d(), Kb() (+10 more)

### Community 56 - "open"
Cohesion: 0.20
Nodes (14): Bb(), chmod(), create(), Db(), lchmod(), Mb(), mkdir(), open() (+6 more)

### Community 57 - "bi"
Cohesion: 0.13
Nodes (6): bi(), pi(), sg(), si(), T(), tg()

### Community 58 - "r"
Cohesion: 0.16
Nodes (15): Bg(), close(), fsync(), Ja(), lstat(), oh(), r(), Rb() (+7 more)

### Community 59 - "write"
Cohesion: 0.12
Nodes (7): ag(), bi(), pi(), sg(), si(), T(), write()

### Community 60 - "z"
Cohesion: 0.34
Nodes (14): Ab(), Cb(), chdir(), Eb(), Fb(), Jb(), lookup(), nb() (+6 more)

### Community 61 - "write"
Cohesion: 0.17
Nodes (10): bg(), eg(), isFile(), Nf(), Pf(), sg(), T(), tg() (+2 more)

### Community 62 - "z"
Cohesion: 0.34
Nodes (14): Ab(), Cb(), chdir(), Eb(), Fb(), Jb(), lookup(), nb() (+6 more)

### Community 63 - "LoadingButton.tsx"
Cohesion: 0.18
Nodes (8): AsyncActionStatus, CELL, CROSSFADE, INSTANT, LoadingButton(), LoadingButtonProps, useAsyncAction(), UseAsyncActionOptions

### Community 64 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, audit:admins, build, create:admin, create:user, dev, emulators, emulators:export (+5 more)

### Community 65 - "Ha"
Cohesion: 0.18
Nodes (4): Ha(), ii(), ri(), vi()

### Community 66 - "Design System Master File"
Cohesion: 0.12
Nodes (16): Additional Forbidden Patterns, Anti-Patterns (Do NOT Use), Buttons, Cards, Color Palette, Component Specs, Design System Master File, Global Rules (+8 more)

### Community 67 - "r"
Cohesion: 0.17
Nodes (14): close(), Fg(), fsync(), Ja(), lstat(), r(), Rb(), read() (+6 more)

### Community 69 - "createNode"
Cohesion: 0.22
Nodes (10): createNode(), dg(), Gf(), a(), isFIFO(), isFile(), Jf(), Lf() (+2 more)

### Community 70 - "Page-Specific Rules"
Cohesion: 0.20
Nodes (9): Color Overrides, Component Overrides, Dashboard Page Overrides, Layout Overrides, Page-Specific Components, Page-Specific Rules, Recommendations, Spacing Overrides (+1 more)

### Community 71 - "write"
Cohesion: 0.25
Nodes (7): bg(), eg(), isFile(), Nf(), Pf(), wg(), write()

### Community 74 - "package.json"
Cohesion: 0.12
Nodes (16): name, private, type, version, clsx, firebase-tools, html-to-image, ref_path (+8 more)

### Community 75 - "Ha"
Cohesion: 0.18
Nodes (4): Ha(), ii(), ri(), vi()

### Community 76 - "createNode"
Cohesion: 0.24
Nodes (10): createNode(), a(), hg(), isFIFO(), Kb(), Kf(), Kg(), c() (+2 more)

### Community 78 - "Page-Specific Rules"
Cohesion: 0.20
Nodes (9): Color Overrides, Component Overrides, Home Page Overrides, Layout Overrides, Page-Specific Components, Page-Specific Rules, Recommendations, Spacing Overrides (+1 more)

### Community 80 - "test-rules.mjs"
Cohesion: 0.24
Nodes (17): arr, arr9, B(), call(), fields(), I(), mask(), media() (+9 more)

### Community 81 - "AuthContext.tsx"
Cohesion: 0.20
Nodes (17): AuthContext, AuthProvider(), defaultAuthContext, src_lib_firebase_doc, src_lib_firebase_onauthstatechanged, src_lib_firebase_onsnapshot, clearSecuritySession(), isSessionExpired() (+9 more)

### Community 82 - "vercel.json"
Cohesion: 0.33
Nodes (5): cleanUrls, headers, rewrites, $schema, trailingSlash

### Community 84 - "design_system.py"
Cohesion: 0.19
Nodes (13): _detect_page_type(), format_master_md(), format_page_override_md(), _generate_intelligent_overrides(), persist_design_system(), Detect page type from context and search results., Design System Generator - Aggregates search results and applies reasoning to…, Persist design system to design-system/<project>/ folder using Master +… (+5 more)

### Community 86 - "Wf"
Cohesion: 0.20
Nodes (14): Bb(), chmod(), create(), Db(), lchmod(), Mb(), mkdir(), open() (+6 more)

### Community 87 - "core.py"
Cohesion: 0.18
Nodes (12): _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Search stack-specific guidelines, UI/UX Pro Max Core - BM25 search engine for UI/UX style guides, _search_csv(), search_stack(), collections (+4 more)

### Community 88 - "Ha"
Cohesion: 0.18
Nodes (4): Ha(), ii(), ri(), vi()

### Community 89 - "Kg"
Cohesion: 0.67
Nodes (4): Kb(), Kg(), c(), d()

### Community 90 - "UsersContext.tsx"
Cohesion: 0.29
Nodes (9): AuthContextValue, defaultUsersContext, UsersContext, UsersContextValue, UsersProvider(), User, adminUpdateUserDoc(), deleteUserFromFirestore() (+1 more)

### Community 91 - "DashboardChart.tsx"
Cohesion: 0.25
Nodes (5): recharts, CATEGORY_COLORS, CustomTooltipProps, DashboardChart(), DashboardChartProps

### Community 92 - "duplicateDetection.ts"
Cohesion: 0.80
Nodes (4): findDuplicate(), jaccardSimilarity(), normalize(), tokenize()

### Community 93 - "BM25"
Cohesion: 0.28
Nodes (5): BM25, Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query, BM25 ranking algorithm for text search

### Community 94 - "search.py"
Cohesion: 0.25
Nodes (7): format_output(), UI/UX Pro Max Search - BM25 search engine for UI/UX style guides Usage: python…, Format results for Claude consumption (token-optimized), argparse, io, json, sys

### Community 95 - "generate_design_system"
Cohesion: 0.29
Nodes (6): format_ascii_box(), format_markdown(), generate_design_system(), Format design system as ASCII box with emojis (MCP-style)., Format design system as markdown., Main entry point for design system generation. Args: query: Search query (e.g.,…

### Community 96 - "firebase.ts"
Cohesion: 0.29
Nodes (6): firebase, auth, COLLECTIONS, db, firebaseConfig, googleProvider

## Knowledge Gaps
- **263 isolated node(s):** `db`, `name`, `description`, `type`, `main` (+258 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 778 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `f()` connect `worker.min.js` to `A`, `A`, `tesseract-core-lstm.wasm.js`, `tesseract-core.wasm.js`, `A`, `tesseract-core-simd-lstm.wasm.js`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `S()` connect `S` to `F`, `E`, `M`, `tesseract-core-simd-lstm.wasm.js`, `bi`, `Ha`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `S()` connect `S` to `Ha`, `F`, `E`, `O`, `M`, `tesseract-core-lstm.wasm.js`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `db`, `name`, `description` to the rest of the system?**
  _263 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ClaimsContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13538461538461538 - nodes in this community are weakly interconnected._
- **Should `DesignSystemGenerator` be split into smaller, more focused modules?**
  _Cohesion score 0.12857142857142856 - nodes in this community are weakly interconnected._
- **Should `SignIn.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1310483870967742 - nodes in this community are weakly interconnected._