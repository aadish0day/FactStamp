// ── APCA Contrast Verifier v2 ──
// Properly composites alpha-blended backgrounds, tests border + source-dot pairs
// Run: node scripts/verify-apca.mjs
import { formatHex } from 'culori'

// ── Color Helpers ──

/** Parse oklch(L C H) or oklch(L C H / alpha) → { l, c, h, alpha } */
function parseOklch(str) {
  const clean = str.trim()
  const match = clean.match(/^oklch\(([^)]+)\)$/)
  if (!match) throw new Error(`Cannot parse: ${clean}`)
  const parts = match[1].trim().split(/\s+/)
  // oklch(L C H / A) splits as [L, C, H, '/', A]; oklch(L C H) splits as [L, C, H]
  const slashIdx = parts.indexOf('/')
  return {
    l: parseFloat(parts[0]),
    c: parseFloat(parts[1]),
    h: parseFloat(parts[2]),
    alpha: slashIdx !== -1 ? parseFloat(parts[slashIdx + 1]) : 1,
  }
}

/** Convert CSS oklch string to #hex (formatHex drops alpha, so opaque only) */
function oklchToHex(str) {
  const { l, c, h, alpha } = parseOklch(str)
  return formatHex({ mode: 'oklch', l, c, h, alpha })
}

/* ── Oklch → linear sRGB (pure math, no culori dependency) ── */

function linSrgbToHex(rgb) {
  const to8bit = (v) => {
    const lin = Math.max(0, Math.min(1, v))
    const sr = lin <= 0.0031308 ? lin * 12.92 : 1.055 * Math.pow(lin, 1 / 2.4) - 0.055
    return Math.round(Math.max(0, Math.min(255, sr * 255)))
  }
  const r = to8bit(rgb.r)
  const g = to8bit(rgb.g)
  const b = to8bit(rgb.b)
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')
}

/**
 * Oklch → linear sRGB conversion (pure math).
 * Steps: oklch → oklab → linear sRGB with gamut clamping.
 */
function oklchToLinSrgb(l, c, h) {
  // 1. Oklch → Oklab
  const hRad = h * Math.PI / 180
  const La = l
  const a = c * Math.cos(hRad)
  const b = c * Math.sin(hRad)

  // 2. Oklab → linear sRGB (LMS intermediate)
  // Oklab → LMS
  const l_ = La + 0.3963377774 * a + 0.2158037573 * b
  const m_ = La - 0.1055613458 * a - 0.0638541728 * b
  const s_ = La - 0.0894841775 * a - 1.2914855480 * b

  // LMS linear → LMS perceptual (cube, since Oklab uses cubic root)
  const l3 = l_ * l_ * l_
  const m3 = m_ * m_ * m_
  const s3 = s_ * s_ * s_

  // LMS → linear sRGB (via the Oklab→sRGB matrix, which is the inverse of the sRGB→Oklab matrix)
  // This is the Oklab-to-linear-sRGB matrix from the Oklab spec:
  const r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3
  const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3
  const b_ = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3

  // 3. Clamp to valid sRGB gamut (practical clamp, not full gamut mapping)
  return {
    r: Math.max(0, Math.min(1, r)),
    g: Math.max(0, Math.min(1, g)),
    b: Math.max(0, Math.min(1, b_)),
  }
}

/**
 * Convert an oklch string with optional alpha to #hex,
 * compositing it over a solid background if alpha < 1.
 */
function oklchToHexComposite(fgStr, bgStr) {
  const fg = parseOklch(fgStr)
  if (fg.alpha >= 1) return formatHex({ mode: 'oklch', l: fg.l, c: fg.c, h: fg.h })

  const bg = parseOklch(bgStr)

  // Pure-math oklch → linear sRGB
  const fgLin = oklchToLinSrgb(fg.l, fg.c, fg.h)
  const bgLin = oklchToLinSrgb(bg.l, bg.c, bg.h)

  // Alpha composite: result = fg * alpha + bg * (1 - alpha)
  const a = fg.alpha
  const composited = {
    r: fgLin.r * a + bgLin.r * (1 - a),
    g: fgLin.g * a + bgLin.g * (1 - a),
    b: fgLin.b * a + bgLin.b * (1 - a),
  }

  return linSrgbToHex(composited)
}

/* ── APCA helpers ── */

function srgbToLin(v) {
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

// ── APCA Contrast ──

function apcaContrast(fg, bg) {
  const hexToLum = (hex) => {
    const clean = hex.replace('#', '')
    const r = parseInt(clean.slice(0, 2), 16)
    const g = parseInt(clean.slice(2, 4), 16)
    const b = parseInt(clean.slice(4, 6), 16)
    return 0.2126 * srgbToLin(r / 255) + 0.7152 * srgbToLin(g / 255) + 0.0722 * srgbToLin(b / 255)
  }

  const lFG = hexToLum(fg)
  const lBG = hexToLum(bg)
  const isLightOnDark = lBG > lFG
  const lighter = Math.max(lFG, lBG)
  const darker = Math.min(lFG, lBG)

  const sapc = Math.pow(lighter, 0.56) - Math.pow(darker, 0.57)
  const raw = sapc * 114 * (isLightOnDark ? 1 : -1)
  return Math.round(Math.max(0, Math.abs(raw)) * 10) / 10
}

function verdict(abs) {
  if (abs >= 90) return '✅ EXCELLENT'
  if (abs >= 75) return '✅ GOOD (body text OK)'
  if (abs >= 60) return '⚠️ FAIR (large text OK)'
  if (abs >= 45) return '⚠️ MARGINAL (non-text UI OK)'
  if (abs >= 30) return '❌ LOW (large bold only)'
  return '❌ FAIL'
}

// ── Design Tokens ──

const TOKENS_LIGHT = {
  '--color-bg':          'oklch(0.970 0.012 55)',
  '--color-surface':     'oklch(0.996 0.004 55)',
  '--color-surface-2':   'oklch(0.945 0.014 55)',
  '--color-border':      'oklch(0.865 0.016 55)',
  '--color-border-soft': 'oklch(0.905 0.012 55)',

  '--color-brand':       'oklch(0.50 0.18 48)',
  '--color-brand-hover': 'oklch(0.56 0.18 48)',
  '--color-brand-fg':    'oklch(0.995 0.003 55)',
  '--color-brand-subtle':'oklch(0.50 0.18 48 / 0.08)',

  '--color-accent':      'oklch(0.44 0.10 195)',
  '--color-accent-fg':   'oklch(0.995 0.003 195)',
  '--color-accent-subtle':'oklch(0.44 0.10 195 / 0.10)',

  '--color-fg':          'oklch(0.14 0.020 55)',
  '--color-fg-2':        'oklch(0.38 0.016 55)',
  '--color-fg-muted':    'oklch(0.55 0.014 55)',
  '--color-fg-soft':     'oklch(0.72 0.010 55)',

  '--color-v-true':      'oklch(0.42 0.12 145)',
  '--color-v-true-bg':   'oklch(0.42 0.12 145 / 0.07)',
  '--color-v-false':     'oklch(0.48 0.16 25)',
  '--color-v-false-bg':  'oklch(0.48 0.16 25 / 0.07)',
  '--color-v-mislead':   'oklch(0.62 0.13 65)',
  '--color-v-mislead-bg':'oklch(0.62 0.13 65 / 0.09)',
  '--color-v-unverif':   'oklch(0.50 0.02 195)',
  '--color-v-unverif-bg':'oklch(0.50 0.02 195 / 0.07)',
  '--color-v-contested': 'oklch(0.48 0.10 240)',
  '--color-v-contested-bg':'oklch(0.48 0.10 240 / 0.07)',

  // Source quality
  '--color-sq-high':     'oklch(0.42 0.12 145)',
  '--color-sq-med':      'oklch(0.62 0.13 65)',
  '--color-sq-low':      'oklch(0.48 0.16 25)',
}

const TOKENS_DARK = {
  '--color-bg':          'oklch(0.115 0.018 55)',
  '--color-surface':     'oklch(0.18 0.020 55)',
  '--color-surface-2':   'oklch(0.22 0.022 55)',
  '--color-border':      'oklch(0.275 0.020 55)',
  '--color-border-soft': 'oklch(0.225 0.018 55)',

  '--color-brand':       'oklch(0.72 0.18 48)',
  '--color-brand-hover': 'oklch(0.78 0.18 48)',
  '--color-brand-fg':    'oklch(0.10 0.02 55)',
  '--color-brand-subtle':'oklch(0.72 0.18 48 / 0.12)',

  '--color-accent':      'oklch(0.72 0.10 195)',
  '--color-accent-fg':   'oklch(0.10 0.02 195)',
  '--color-accent-subtle':'oklch(0.72 0.10 195 / 0.14)',

  '--color-fg':          'oklch(0.96 0.006 55)',
  '--color-fg-2':        'oklch(0.78 0.008 55)',
  '--color-fg-muted':    'oklch(0.60 0.010 55)',
  '--color-fg-soft':     'oklch(0.50 0.010 55)',

  '--color-v-true':      'oklch(0.62 0.14 145)',
  '--color-v-true-bg':   'oklch(0.62 0.14 145 / 0.18)',
  '--color-v-false':     'oklch(0.70 0.16 25)',
  '--color-v-false-bg':  'oklch(0.70 0.16 25 / 0.18)',
  '--color-v-mislead':   'oklch(0.72 0.13 65)',
  '--color-v-mislead-bg':'oklch(0.72 0.13 65 / 0.18)',
  '--color-v-unverif':   'oklch(0.62 0.02 195)',
  '--color-v-unverif-bg':'oklch(0.62 0.02 195 / 0.18)',
  '--color-v-contested': 'oklch(0.60 0.10 240)',
  '--color-v-contested-bg':'oklch(0.60 0.10 240 / 0.18)',

  // Source quality (lightened for dark surface visibility)
  '--color-sq-high':     'oklch(0.62 0.14 145)',
  '--color-sq-med':      'oklch(0.72 0.13 65)',
  '--color-sq-low':      'oklch(0.70 0.16 25)',
}

// ── Test Pairs ──
//
// Each pair has:
//   fg / bg      — token key in the tokens dict
//   label        — human-readable description
//   threshold    — APCA minimum (75 body, 60 large text, 45 non-text UI, 30 placeholder)
//   compositeBg  — optional: composite the bg token over this solid background before testing

const PAIRS = [
  // ─── Text on page bg ───
  { fg: '--color-fg',       bg: '--color-bg',       label: 'Primary text on page bg',           threshold: 75 },
  { fg: '--color-fg-2',     bg: '--color-bg',       label: 'Secondary text on page bg',         threshold: 60 },
  { fg: '--color-fg-muted', bg: '--color-bg',       label: 'Muted text on page bg',             threshold: 45 },
  { fg: '--color-fg-soft',  bg: '--color-bg',       label: 'Placeholder text on page bg',       threshold: 30 },

  // ─── Text on surfaces ───
  { fg: '--color-fg',       bg: '--color-surface',  label: 'Primary text on card surface',      threshold: 75 },
  { fg: '--color-fg-2',     bg: '--color-surface',  label: 'Secondary text on card surface',    threshold: 60 },

  // ─── Brand on surfaces ───
  { fg: '--color-brand',    bg: '--color-bg',       label: 'Brand text on page bg',             threshold: 60 },
  { fg: '--color-brand-fg', bg: '--color-brand',    label: 'Brand FG on brand bg (CTA btn)',    threshold: 60 },

  // ─── Accent on surfaces ───
  { fg: '--color-accent',   bg: '--color-bg',        label: 'Accent text on page bg',          threshold: 60 },
  { fg: '--color-accent-fg',bg: '--color-accent',    label: 'Accent FG on accent bg',          threshold: 60 },

  // ─── Verdict text on card surface ───
  { fg: '--color-v-true',   bg: '--color-surface',   label: 'True verdict on card surface',     threshold: 45 },
  { fg: '--color-v-false',  bg: '--color-surface',   label: 'False verdict on card surface',    threshold: 45 },
  { fg: '--color-v-mislead',bg: '--color-surface',   label: 'Misleading on card surface',       threshold: 45 },

  // ─── Verdict text on its composited bg tint ───
  { fg: '--color-v-true',   bg: '--color-v-true-bg',   label: 'True verdict on tinted bg',     threshold: 45, compositeBg: '--color-surface' },
  { fg: '--color-v-false',  bg: '--color-v-false-bg',  label: 'False verdict on tinted bg',    threshold: 45, compositeBg: '--color-surface' },
  { fg: '--color-v-mislead',bg: '--color-v-mislead-bg',label: 'Misleading on tinted bg',       threshold: 45, compositeBg: '--color-surface' },
  { fg: '--color-v-unverif',bg: '--color-v-unverif-bg',label: 'Unverifiable on tinted bg',     threshold: 45, compositeBg: '--color-surface' },
  { fg: '--color-v-contested',bg: '--color-v-contested-bg',label: 'Contested on tinted bg',   threshold: 45, compositeBg: '--color-surface' },

  // ─── Borders on surfaces ───
  { fg: '--color-border',      bg: '--color-surface',  label: 'Border on card surface',          threshold: 45 },
  { fg: '--color-border-soft', bg: '--color-surface',  label: 'Soft border on card surface',     threshold: 30 },
  { fg: '--color-border',      bg: '--color-bg',       label: 'Border on page bg',               threshold: 45 },
  { fg: '--color-border-soft', bg: '--color-bg',       label: 'Soft border on page bg',          threshold: 30 },

  // ─── Source quality dots on surfaces ───
  { fg: '--color-sq-high', bg: '--color-surface', label: 'Source dot (high) on card surface',   threshold: 45 },
  { fg: '--color-sq-med',  bg: '--color-surface', label: 'Source dot (med) on card surface',    threshold: 45 },
  { fg: '--color-sq-low',  bg: '--color-surface', label: 'Source dot (low) on card surface',    threshold: 45 },

  // ─── Brand subtle tint on surface (composited) ───
  { fg: '--color-brand-fg', bg: '--color-brand-subtle', label: 'Brand text on subtle tint',    threshold: 60, compositeBg: '--color-surface' },
  { fg: '--color-accent-fg',bg: '--color-accent-subtle',label: 'Accent text on subtle tint',   threshold: 60, compositeBg: '--color-surface' },
]

// ── Resolve a token key to a hex color, compositing alpha if needed ──

function resolve(key, tokens, compositeBgKey) {
  const raw = tokens[key]
  if (!raw) throw new Error(`Token "${key}" not found`)

  const { alpha } = parseOklch(raw)

  // If no alpha or no compositeBg requested, just convert to hex
  if (alpha >= 1 || !compositeBgKey) return oklchToHex(raw)

  // Composite over the specified solid background
  const bgRaw = tokens[compositeBgKey]
  if (!bgRaw) throw new Error(`Composite bg "${compositeBgKey}" not found`)

  // Verify the background is solid
  const bgParsed = parseOklch(bgRaw)
  if (bgParsed.alpha < 1) throw new Error(`Composite bg "${compositeBgKey}" must be solid, got alpha ${bgParsed.alpha}`)

  return oklchToHexComposite(raw, bgRaw)
}

// ── Run ──

let allPassed = true

for (const mode of ['LIGHT', 'DARK']) {
  const tokens = mode === 'LIGHT' ? TOKENS_LIGHT : TOKENS_DARK
  console.log(`\n${'═'.repeat(72)}`)
  console.log(`  ${mode} MODE — APCA Contrast Verification (v2 with alpha compositing)`)
  console.log(`${'═'.repeat(72)}\n`)

  for (const pair of PAIRS) {
    const fgHex   = resolve(pair.fg, tokens, pair.compositeBg)
    const bgHex   = resolve(pair.bg, tokens, pair.compositeBg)
    const lc      = apcaContrast(fgHex, bgHex)
    const v       = verdict(lc)
    const pass    = lc >= pair.threshold
    const note    = pair.compositeBg ? ` [composited over ${pair.compositeBg}]` : ''

    const symbol = pass ? '✅' : '❌'
    console.log(`  ${symbol}  ${v}`)
    console.log(`      ${pair.label}${note}`)
    console.log(`      ${pair.fg} = ${fgHex}  on  ${pair.bg} = ${bgHex}`)
    console.log(`      APCA lc = ${lc.toFixed(1)}  (≥ ${pair.threshold}) ${pass ? '✓' : '✗'}\n`)

    if (!pass) allPassed = false
  }
}

console.log(`${'═'.repeat(72)}`)
if (allPassed) {
  console.log(`  🎉  ALL ${PAIRS.length} PAIRS PASS — the design token contrast is solid.`)
} else {
  console.log(`  ⚠️  SOME PAIRS FAILED — review the ❌ entries above.`)
}
console.log(`${'═'.repeat(72)}\n`)
