# Design System: FactStamp

This document establishes the semantic design system and visual guidelines for FactStamp. It serves as the single source of truth for UI layouts, styles, and interactions, ensuring design consistency and premium, high-agency engineering.

---

## 1. Visual Theme & Atmosphere

* **Mood & Essence:** A clinical yet warm, editorial-grade verification environment. It acts as an authoritative, high-integrity trust index rather than a generic tech platform. Think of it as a hybrid between a declassified intelligence document and a well-curated print journal.
* **Density Profile:** **Balanced Daily App (5/10)** — Clean breathing room between analytical cards. Information is grouped in clear hierarchy to avoid cognitive overload.
* **Variance Profile:** **Offset Asymmetric (7/10)** — Avoids rigid grids in favor of off-center headers, asymmetric column splits, and unexpected margins that draw attention to critical facts.
* **Motion Profile:** **Tactile & Kinetic (6/10)** — Transitions mimic physical stamps and tactile clicks, featuring heavy cubic-bezier curves and spring physics.

---

## 2. Color Palette & Roles

FactStamp uses a warm-toned, high-contrast palette based on OKLCH mappings. Pure black (`#000000`) is strictly banned.

### Neutrals (Warm Tint, Hue ~55°)
* **Warm Cream Background:** `oklch(0.970 0.012 55)` (#F5F3ED) — Primary canvas background. Soft on the eyes, reduces fatigue, feels organic.
* **Paper Off-White Surface:** `oklch(0.996 0.004 55)` (#FAF9F7) — Main card background, popups, and elevated containers.
* **Card Hover Surface:** `oklch(0.945 0.014 55)` (#EAE7DF) — Highlighted and focused list items.
* **Visible Border:** `oklch(0.865 0.016 55)` (#D3CEBF) — Structural 1px outlines for components, cards, and input boundaries.
* **Subtle Divider Border:** `oklch(0.905 0.012 55)` (#E1DDD1) — Fine separators, table dividers, and background grids.
* **Charcoal Ink Text (Primary):** `oklch(0.14 0.020 55)` (#23221E) — Deep, warm charcoal for headings and high-contrast text.
* **Muted Steel Text (Secondary):** `oklch(0.38 0.016 55)` (#5B5953) — Descriptive copy, metadata, and labels.
* **Disabled text (Muted):** `oklch(0.55 0.014 55)` (#86837C) — Inline timestamps and placeholder texts.

### Brand & Accents
* **Deep Saffron (Brand CTA):** `oklch(0.50 0.18 48)` (#BA3E03) — Primary action buttons, brand signatures, and high-impact UI highlights.
* **Deep Saffron Hover:** `oklch(0.56 0.18 48)` (#CE4A0B) — Saffron button hover states.
* **Deep Saffron Active:** `oklch(0.44 0.18 48)` (#9E3300) — Pressed button state.
* **Deep Ink Teal (Accent):** `oklch(0.44 0.10 195)` (#1C5560) — Secondary actions, navigation highlights, and verification tooltips.

### Verdict Semantic System (Double-Encoded with Icons)
* **True Emerald:** `oklch(0.42 0.12 145)` (#047857) — Applied to verified forwards.
* **False Crimson:** `oklch(0.48 0.16 25)` (#B91C1C) — Applied to debunked forwards.
* **Misleading Amber:** `oklch(0.62 0.13 65)` (#B45309) — Applied to partially true, out-of-context claims.
* **Unverified Slate:** `oklch(0.50 0.02 195)` (#475569) — Applied to newly submitted or contested claims pending consensus.
* **Contested Blue:** `oklch(0.48 0.10 240)` (#1D4ED8) — Applied to active debate or disputed quorums.

---

## 3. Typography Rules

* **Display/Headlines:** **DM Sans** — High-weight (700), tight letter-spacing (`-0.02em`), and balanced line-height (`1.2`). Titles speak with quiet authority; they do not shout.
* **Body/Paragraphs:** **DM Sans** — Regular/Medium weight, relaxed leading (`1.6`), max line width of 65 characters (`max-w-[65ch]`) to ensure comfortable editorial reading.
* **Mono/Numbers:** **JetBrains Mono** — Applied strictly to database indexes, consensus ratios, reputation points, timestamps, and verifier identity hashes.
* **Typography Scaling:** Powered by fluid CSS clamps:
  * `h1`: `clamp(2.5rem, 2vw + 2.00rem, 3.75rem)`
  * `h2`: `clamp(2rem, 1.5vw + 1.50rem, 3rem)`
  * `h3`: `clamp(1.5rem, 1vw + 1.25rem, 2.25rem)`
  * `body`: `clamp(1.00rem, 0.2vw + 0.90rem, 1.125rem)`
* **Banned:** `Inter` is banned to prevent generic-looking UI. Generic serif fonts are banned.

---

## 4. Component Stylings

### Buttons
* **Shape & Sizing:** Clean corners with standard radius (`radius-md` = `0.625rem`/`10px`). Tap target is always at least `44px` vertically.
* **Feedback:** Flat color fills, strictly no neon shadows or outer glows. Active state uses a physical tactile depression of 1px (`active:translate-y-[1px]` or `active:scale-[0.99]`).
* **Roles:** Primary saffron fill (`--color-brand`), secondary ghost outline (`--color-border` with text-charcoal), utility teal ghost button (`--color-accent-subtle`).

### Cards & Surfaces
* **Corner Radius:** Concentric radius system. Outer containers use `radius-lg` (`1rem`/`16px`), internal elements use `radius-md` (`0.625rem`/`10px`), and badges use `radius-sm` (`0.375rem`/`6px`).
* **Whisper Shadow:** Border shadow system utilizing ambient and direct components to match the physical paper layout:
  ```css
  box-shadow: 0px 0px 0px 1px rgba(0, 0, 0, 0.06), 
              0px 1px 2px -1px rgba(0, 0, 0, 0.06), 
              0px 2px 4px 0px rgba(0, 0, 0, 0.04);
  ```
* **Elevation:** Cards are only used when grouping data fields to build a hierarchy. In dashboard lists, cards are replaced with minimalist border-top dividers to avoid "card-in-card" nesting clutter.

### Inputs & Forms
* **Labels:** Placed above the input container in a clear, smaller font size.
* **Input Fields:** Generously sized with `radius-md`. Background colors match `--color-bg` (sunken state). On focus, border transitions to `--color-accent` (deep ink) with a crisp offset ring. Bouncing, floating placeholder labels are banned.
* **Errors:** Inline error blocks rendered directly below the input field in crimson.

### System Indicators
* **Loaders:** High-fidelity skeletal shimmer loaders matching the exact structural grid of the content block. Generic spinning progress circles are banned.
* **Empty States:** Composed editorial compositions detailing the action needed (e.g., a diagram of a forward being evaluated, not just a bare text alert).

### Charts & Data Visualizations (Recharts)
* **Canvas Integration:** Chart gridlines and ticks must use `--color-border-soft` (#E1DDD1) with `strokeDasharray="4 4"` and a stroke width of `1px`. Default solid black/gray lines are banned.
* **Color Palette Mapping:** Use only system token colors: primary brand saffron (`--color-brand`, #BA3E03) for volume graphs, accent deep teal (`--color-accent`, #1C5560) for comparative bars, and semantic verdict colors (Emerald for true, Crimson for false, Amber for misleading) for status distribution pies or stacks.
* **Tooltip Cards:** Recharts default hover tooltips are banned. Use custom React tooltip components wrapped in `--color-surface` (#FAF9F7) with standard structural borders `--color-border` (#D3CEBF) and a Concentric Whisper Shadow. Font styling in tooltips must use monospace `JetBrains Mono` for data parameters.
* **Area/Line Gradient Fills:** Line graphs must use a soft OKLCH gradient fade underneath the curve (e.g., brand opacity scaling down to 0% at the bottom boundary). Solid fills or high-opacity overlays are banned.

---

## 5. Layout Principles

* **Zero Overlapping:** Absolute-positioned offsets that cause layout overlaps are banned. Every text block, metric, and verification card occupies its own clean spatial coordinate.
* **Asymmetric Hero Section:** Centered hero structures are banned. Layouts must employ a split-screen system, a 2-column asymmetric layout (e.g., 60% verification status + 40% forward metadata), or heavy left-alignment.
* **Grid Hierarchy:** The generic "three equal cards" row is banned. Instead, grids must combine varying widths (e.g., a 2/3 primary card next to a 1/3 sidebar widget) to establish visual interest and reading cadence.
* **Containment:** Max width is capped at `1400px` (`max-w-7xl`) centered with responsive lateral margins (`px-6`).
* **Mobile Responsiveness:** All columns collapse to a clean single column at `768px` (`md:`). Layout items stack in reading order (Header → Claim Card → Verifier Log). Tap target spacing increases dynamically on touch devices.

---

## 6. Motion & Interaction

* **Spring Physics:** All animations are weighted and organic. Easing defaults to smooth deceleration:
  ```css
  transition-timing-function: cubic-bezier(0.25, 1, 0.5, 1); /* ease-out-quart */
  ```
* **Signature Stamp Impact:** Verification badges mount with a simulated physical impact animation:
  * Scale down from `1.35x` to `1.0x` and rotate slightly (`-6deg` to `0deg`) with a fast-in, slow-out deceleration to mimic an inked stamp hitting paper.
* **Performance:** Animations must target hardware-accelerated properties (`transform` and `opacity`). Animating layout recalculation properties (`top`, `left`, `width`, `height`) is banned.
* **Staggered Orchestration:** List data reveals cascade with a 40ms stagger delay per item to guide reading flow.

---

## 7. Anti-Patterns (Banned)

* **No Emojis:** Do not use emojis in headers, list items, or status tags. Use custom Lucide vector icons or official labels.
* **No Pure Black:** Banish `#000000` entirely from canvas backgrounds and typography. Use off-black `oklch(0.14 0.020 55)` (#23221E) to preserve the soft warm aesthetic.
* **No Bouncing Chevrons:** Bouncing arrows or filler text like "Scroll to explore" are banned.
* **No AI Copywriting Clichés:** Ban terms like "seamlessly", "elevate", "unleash", "next-gen", and "revolutionize" in all text headers and interfaces.
* **No 3-Column Equal Grids:** Avoid layouts containing 3 identical side-by-side cards. Always offset the sizes or use a vertical list layout.
* **No Neon Shadows:** Glow colors behind text and buttons are banned. Shadows must remain natural, soft, and tinted using the background hue.
* **No Custom Mouse Cursors:** Rely on standard browser pointer states to guarantee user accessibility.
* **No Broken Links:** All image placeholders must use structured local SVG vectors or stable `picsum.photos` mappings.
