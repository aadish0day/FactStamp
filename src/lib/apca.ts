/* ── APCA Contrast Verification (browser-compatible) ── */
// Ported from scripts/verify-apca.mjs

export interface OklchColor {
  l: number
  c: number
  h: number
  alpha: number
}

export interface PairResult {
  label: string
  fgKey: string
  bgKey: string
  fgHex: string
  bgHex: string
  lc: number
  threshold: number
  pass: boolean
  note?: string
}

/* ── Color helpers ── */

/** Parse oklch(L C H) or oklch(L C H / alpha) → { l, c, h, alpha } */
export function parseOklch(str: string): OklchColor {
  const clean = str.trim()
  const match = clean.match(/^oklch\(([^)]+)\)$/)
  if (!match) throw new Error(`Cannot parse: ${clean}`)
  const parts = match[1].trim().split(/\s+/)
  const slashIdx = parts.indexOf('/')
  return {
    l: parseFloat(parts[0]),
    c: parseFloat(parts[1]),
    h: parseFloat(parts[2]),
    alpha: slashIdx !== -1 ? parseFloat(parts[slashIdx + 1]) : 1,
  }
}

/** Linear sRGB → #hex */
function linSrgbToHex(rgb: { r: number; g: number; b: number }): string {
  const to8bit = (v: number) => {
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
 * Oklch → linear sRGB (pure math).
 * Steps: oklch → oklab → linear sRGB with gamut clamping.
 */
export function oklchToLinSrgb(l: number, c: number, h: number): { r: number; g: number; b: number } {
  const hRad = (h * Math.PI) / 180
  const La = l
  const a = c * Math.cos(hRad)
  const b = c * Math.sin(hRad)

  // Oklab → LMS
  const l_ = La + 0.3963377774 * a + 0.2158037573 * b
  const m_ = La - 0.1055613458 * a - 0.0638541728 * b
  const s_ = La - 0.0894841775 * a - 1.2914855480 * b

  // LMS linear → LMS perceptual (cube)
  const l3 = l_ * l_ * l_
  const m3 = m_ * m_ * m_
  const s3 = s_ * s_ * s_

  // LMS → linear sRGB (Oklab→sRGB matrix)
  const r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3
  const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3
  const b_ = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3

  return {
    r: Math.max(0, Math.min(1, r)),
    g: Math.max(0, Math.min(1, g)),
    b: Math.max(0, Math.min(1, b_)),
  }
}

/** Convert oklch string to #hex (opaque only) */
export function oklchToHex(str: string): string {
  const { l, c, h } = parseOklch(str)
  return linSrgbToHex(oklchToLinSrgb(l, c, h))
}

/** Alpha-composite a translucent oklch color over a solid background → #hex */
export function oklchToHexComposite(fgStr: string, bgStr: string): string {
  const fg = parseOklch(fgStr)
  if (fg.alpha >= 1) return oklchToHex(fgStr)

  const bg = parseOklch(bgStr)
  const fgLin = oklchToLinSrgb(fg.l, fg.c, fg.h)
  const bgLin = oklchToLinSrgb(bg.l, bg.c, bg.h)

  const a = fg.alpha
  const composited = {
    r: fgLin.r * a + bgLin.r * (1 - a),
    g: fgLin.g * a + bgLin.g * (1 - a),
    b: fgLin.b * a + bgLin.b * (1 - a),
  }

  return linSrgbToHex(composited)
}

/* ── Design Tokens ── */

export const TOKENS_LIGHT: Record<string, string> = {
  '--color-bg': 'oklch(0.970 0.012 55)',
  '--color-surface': 'oklch(0.996 0.004 55)',
  '--color-surface-2': 'oklch(0.945 0.014 55)',
  '--color-border': 'oklch(0.865 0.016 55)',
  '--color-border-soft': 'oklch(0.905 0.012 55)',

  '--color-brand': 'oklch(0.50 0.18 48)',
  '--color-brand-fg': 'oklch(0.995 0.003 55)',
  '--color-brand-subtle': 'oklch(0.50 0.18 48 / 0.08)',

  '--color-accent': 'oklch(0.44 0.10 195)',
  '--color-accent-fg': 'oklch(0.995 0.003 195)',
  '--color-accent-subtle': 'oklch(0.44 0.10 195 / 0.10)',

  '--color-fg': 'oklch(0.14 0.020 55)',
  '--color-fg-2': 'oklch(0.38 0.016 55)',
  '--color-fg-muted': 'oklch(0.55 0.014 55)',
  '--color-fg-soft': 'oklch(0.72 0.010 55)',

  '--color-v-true': 'oklch(0.42 0.12 145)',
  '--color-v-true-bg': 'oklch(0.42 0.12 145 / 0.07)',
  '--color-v-false': 'oklch(0.48 0.16 25)',
  '--color-v-false-bg': 'oklch(0.48 0.16 25 / 0.07)',
  '--color-v-mislead': 'oklch(0.62 0.13 65)',
  '--color-v-mislead-bg': 'oklch(0.62 0.13 65 / 0.09)',
  '--color-v-unverif': 'oklch(0.50 0.02 195)',
  '--color-v-unverif-bg': 'oklch(0.50 0.02 195 / 0.07)',
  '--color-v-contested': 'oklch(0.48 0.10 240)',
  '--color-v-contested-bg': 'oklch(0.48 0.10 240 / 0.07)',

  '--color-sq-high': 'oklch(0.42 0.12 145)',
  '--color-sq-med': 'oklch(0.62 0.13 65)',
  '--color-sq-low': 'oklch(0.48 0.16 25)',
}

export const TOKENS_DARK: Record<string, string> = {
  '--color-bg': 'oklch(0.115 0.018 55)',
  '--color-surface': 'oklch(0.18 0.020 55)',
  '--color-surface-2': 'oklch(0.22 0.022 55)',
  '--color-border': 'oklch(0.275 0.020 55)',
  '--color-border-soft': 'oklch(0.225 0.018 55)',

  '--color-brand': 'oklch(0.72 0.18 48)',
  '--color-brand-fg': 'oklch(0.10 0.02 55)',
  '--color-brand-subtle': 'oklch(0.72 0.18 48 / 0.10)',

  '--color-accent': 'oklch(0.72 0.10 195)',
  '--color-accent-fg': 'oklch(0.10 0.02 195)',
  '--color-accent-subtle': 'oklch(0.72 0.10 195 / 0.10)',

  '--color-fg': 'oklch(0.96 0.006 55)',
  '--color-fg-2': 'oklch(0.78 0.008 55)',
  '--color-fg-muted': 'oklch(0.60 0.010 55)',
  '--color-fg-soft': 'oklch(0.50 0.010 55)',

  '--color-v-true': 'oklch(0.62 0.14 145)',
  '--color-v-true-bg': 'oklch(0.62 0.14 145 / 0.09)',
  '--color-v-false': 'oklch(0.70 0.16 25)',
  '--color-v-false-bg': 'oklch(0.70 0.16 25 / 0.09)',
  '--color-v-mislead': 'oklch(0.72 0.13 65)',
  '--color-v-mislead-bg': 'oklch(0.72 0.13 65 / 0.09)',
  '--color-v-unverif': 'oklch(0.62 0.02 195)',
  '--color-v-unverif-bg': 'oklch(0.62 0.02 195 / 0.09)',
  '--color-v-contested': 'oklch(0.60 0.10 240)',
  '--color-v-contested-bg': 'oklch(0.60 0.10 240 / 0.09)',

  '--color-sq-high': 'oklch(0.62 0.14 145)',
  '--color-sq-med': 'oklch(0.72 0.13 65)',
  '--color-sq-low': 'oklch(0.70 0.16 25)',
}

/* ── Test Pairs ── */

export interface TestPair {
  fg: string
  bg: string
  label: string
  threshold: number
  compositeBg?: string
}

export const PAIRS: TestPair[] = [
  // Text on page bg
  { fg: '--color-fg', bg: '--color-bg', label: 'Primary text on page bg', threshold: 75 },
  { fg: '--color-fg-2', bg: '--color-bg', label: 'Secondary text on page bg', threshold: 60 },
  { fg: '--color-fg-muted', bg: '--color-bg', label: 'Muted text on page bg', threshold: 45 },
  { fg: '--color-fg-soft', bg: '--color-bg', label: 'Placeholder text on page bg', threshold: 30 },

  // Text on surfaces
  { fg: '--color-fg', bg: '--color-surface', label: 'Primary text on card surface', threshold: 75 },
  { fg: '--color-fg-2', bg: '--color-surface', label: 'Secondary text on card surface', threshold: 60 },

  // Brand on surfaces
  { fg: '--color-brand', bg: '--color-bg', label: 'Brand text on page bg', threshold: 60 },
  { fg: '--color-brand-fg', bg: '--color-brand', label: 'Brand FG on brand bg (CTA btn)', threshold: 60 },

  // Accent on surfaces
  { fg: '--color-accent', bg: '--color-bg', label: 'Accent text on page bg', threshold: 60 },
  { fg: '--color-accent-fg', bg: '--color-accent', label: 'Accent FG on accent bg', threshold: 60 },

  // Verdict text on card surface
  { fg: '--color-v-true', bg: '--color-surface', label: 'True verdict on card surface', threshold: 45 },
  { fg: '--color-v-false', bg: '--color-surface', label: 'False verdict on card surface', threshold: 45 },
  { fg: '--color-v-mislead', bg: '--color-surface', label: 'Misleading on card surface', threshold: 45 },

  // Verdict text on its composited bg tint (APCA threshold for badge pill text = 30)
  { fg: '--color-v-true', bg: '--color-v-true-bg', label: 'True verdict on tinted bg', threshold: 30, compositeBg: '--color-surface' },
  { fg: '--color-v-false', bg: '--color-v-false-bg', label: 'False verdict on tinted bg', threshold: 30, compositeBg: '--color-surface' },
  { fg: '--color-v-mislead', bg: '--color-v-mislead-bg', label: 'Misleading on tinted bg', threshold: 30, compositeBg: '--color-surface' },
  { fg: '--color-v-unverif', bg: '--color-v-unverif-bg', label: 'Unverifiable on tinted bg', threshold: 30, compositeBg: '--color-surface' },
  { fg: '--color-v-contested', bg: '--color-v-contested-bg', label: 'Contested on tinted bg', threshold: 30, compositeBg: '--color-surface' },

  // Borders on surfaces (APCA threshold for non-text structural lines = 5-10)
  { fg: '--color-border', bg: '--color-surface', label: 'Border on card surface', threshold: 5 },
  { fg: '--color-border-soft', bg: '--color-surface', label: 'Soft border on card surface', threshold: 3 },
  { fg: '--color-border', bg: '--color-bg', label: 'Border on page bg', threshold: 5 },
  { fg: '--color-border-soft', bg: '--color-bg', label: 'Soft border on page bg', threshold: 3 },

  // Source quality dots on surfaces
  { fg: '--color-sq-high', bg: '--color-surface', label: 'Source dot (high) on card surface', threshold: 45 },
  { fg: '--color-sq-med', bg: '--color-surface', label: 'Source dot (med) on card surface', threshold: 45 },
  { fg: '--color-sq-low', bg: '--color-surface', label: 'Source dot (low) on card surface', threshold: 45 },

  // Brand/accent subtle tint (tested with brand/accent text color)
  { fg: '--color-brand', bg: '--color-brand-subtle', label: 'Brand text on subtle tint', threshold: 45, compositeBg: '--color-surface' },
  { fg: '--color-accent', bg: '--color-accent-subtle', label: 'Accent text on subtle tint', threshold: 45, compositeBg: '--color-surface' },
]

/* ── Resolve token → hex ── */

function resolve(key: string, tokens: Record<string, string>, compositeBgKey?: string): string {
  const raw = tokens[key]
  if (!raw) throw new Error(`Token "${key}" not found`)

  const { alpha } = parseOklch(raw)

  if (alpha >= 1 || !compositeBgKey) return oklchToHex(raw)

  const bgRaw = tokens[compositeBgKey]
  if (!bgRaw) throw new Error(`Composite bg "${compositeBgKey}" not found`)

  return oklchToHexComposite(raw, bgRaw)
}

/* ── APCA contrast (hex-based) ── */

function apcaContrast(fg: string, bg: string): number {
  const hexToLum = (hex: string) => {
    const clean = hex.replace('#', '')
    const r = parseInt(clean.slice(0, 2), 16)
    const g = parseInt(clean.slice(2, 4), 16)
    const b = parseInt(clean.slice(4, 6), 16)
    const srgbToLin = (v: number) =>
      v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    return 0.2126 * srgbToLin(r / 255) + 0.7152 * srgbToLin(g / 255) + 0.0722 * srgbToLin(b / 255)
  }

  const lFG = hexToLum(fg)
  const lBG = hexToLum(bg)
  const isLightOnDark = lBG > lFG
  const lighter = Math.max(lFG, lBG)
  const darker = Math.min(lFG, lBG)

  const sapc = Math.pow(lighter, 0.56) - Math.pow(darker, 0.57)
  const raw = sapc * 114 * (isLightOnDark ? 1 : -1)
  return Math.round(Math.abs(raw) * 10) / 10
}

export function apcaVerdict(abs: number): string {
  if (abs >= 90) return 'Excellent'
  if (abs >= 75) return 'Good — body text OK'
  if (abs >= 60) return 'Fair — large text OK'
  if (abs >= 45) return 'Marginal — non-text UI OK'
  if (abs >= 30) return 'Low — large bold only'
  return 'Fail'
}

/* ── Run full check ── */

export function runCheck(mode: 'light' | 'dark'): PairResult[] {
  const tokens = mode === 'light' ? TOKENS_LIGHT : TOKENS_DARK
  return PAIRS.map((pair) => {
    const fgHex = resolve(pair.fg, tokens, pair.compositeBg)
    const bgHex = resolve(pair.bg, tokens, pair.compositeBg)
    const lc = apcaContrast(fgHex, bgHex)
    const pass = lc >= pair.threshold
    return {
      label: pair.label,
      fgKey: pair.fg,
      bgKey: pair.bg,
      fgHex,
      bgHex,
      lc,
      threshold: pair.threshold,
      pass,
      note: pair.compositeBg ? `composited over ${pair.compositeBg}` : undefined,
    }
  })
}
