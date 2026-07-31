import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* ── APCA Contrast Check ── */

/**
 * Calculate APCA (Accessible Perceptual Contrast Algorithm) contrast.
 * Uses the simplified SAPC (S-LUV) method from the APCA spec.
 *
 * Usage:
 *   const lc = apcaContrast('#ffffff', '#1a1a1a')
 *   // lc >= 75 → body text OK
 *   // lc >= 60 → large text OK
 *   // lc >= 45 → non-text UI OK
 */
export function apcaContrast(fg: string, bg: string): number {
  const sRGBtoLin = (ch: number) => {
    const v = ch / 255
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }

  const hexToLuminance = (hex: string): number => {
    const clean = hex.replace('#', '')
    const r = parseInt(clean.slice(0, 2), 16)
    const g = parseInt(clean.slice(2, 4), 16)
    const b = parseInt(clean.slice(4, 6), 16)
    return 0.2126 * sRGBtoLin(r) + 0.7152 * sRGBtoLin(g) + 0.0722 * sRGBtoLin(b)
  }

  const lFG = hexToLuminance(fg)
  const lBG = hexToLuminance(bg)

  // Determine text polarity: light-on-dark or dark-on-light
  const lighter = Math.max(lFG, lBG)
  const darker = Math.min(lFG, lBG)
  const isLightOnDark = lBG > lFG

  // SAPC (S-LUV) base
  const sapc = Math.pow(lighter, 0.56) - Math.pow(darker, 0.57)

  // Scale and return (light-on-dark positive, dark-on-light negative)
  const raw = sapc * 114 * (isLightOnDark ? 1 : -1)
  return Math.round(Math.abs(raw) * 10) / 10 * (isLightOnDark ? 1 : -1)
}

/**
 * Convert OKLCH color string (e.g., "oklch(0.5 0.18 48 / 0.8)") to standard sRGB string ("rgb(r,g,b)" or "rgba(r,g,b,a)").
 * Required because html2canvas internal parser does not support CSS Color Level 4 OKLCH syntax.
 */
export function parseOklchToRgb(oklchStr: string): string {
  try {
    const inner = oklchStr.replace(/^oklch\(\s*/i, '').replace(/\s*\)$/, '')
    let parts: string[] = []

    if (inner.includes('/')) {
      const [colorPart, alphaPart] = inner.split('/')
      const colorTokens = colorPart.trim().split(/[\s,]+/)
      parts = [...colorTokens, alphaPart.trim()]
    } else {
      parts = inner.trim().split(/[\s,]+/)
    }

    if (parts.length < 3) return oklchStr

    let L = parseFloat(parts[0])
    if (parts[0].endsWith('%') || L > 1) {
      L = L / 100
    }

    let C = parseFloat(parts[1])
    if (parts[1].endsWith('%')) {
      C = parseFloat(parts[1]) / 100
    }

    let H = parseFloat(parts[2])
    if (isNaN(H)) H = 0

    let alpha = 1
    if (parts[3]) {
      if (parts[3].endsWith('%')) {
        alpha = parseFloat(parts[3]) / 100
      } else {
        alpha = parseFloat(parts[3])
      }
    }

    const hRad = (H * Math.PI) / 180
    const a = C * Math.cos(hRad)
    const b = C * Math.sin(hRad)

    const l_ = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3)
    const m_ = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3)
    const s_ = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3)

    const rLin = +4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_
    const gLin = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_
    const bLin = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_

    const gamma = (x: number) => {
      const clamped = Math.max(0, x)
      return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055
    }

    const r = Math.min(255, Math.max(0, Math.round(gamma(rLin) * 255)))
    const g = Math.min(255, Math.max(0, Math.round(gamma(gLin) * 255)))
    const bComp = Math.min(255, Math.max(0, Math.round(gamma(bLin) * 255)))

    if (isNaN(r) || isNaN(g) || isNaN(bComp)) return 'rgb(0, 0, 0)'

    if (alpha < 1) {
      return `rgba(${r}, ${g}, ${bComp}, ${alpha.toFixed(2)})`
    }
    return `rgb(${r}, ${g}, ${bComp})`
  } catch {
    return oklchStr
  }
}

export function parseOklabToRgb(oklabStr: string): string {
  try {
    const inner = oklabStr.replace(/^oklab\(\s*/i, '').replace(/\s*\)$/, '')
    let parts: string[] = []

    if (inner.includes('/')) {
      const [colorPart, alphaPart] = inner.split('/')
      const colorTokens = colorPart.trim().split(/[\s,]+/)
      parts = [...colorTokens, alphaPart.trim()]
    } else {
      parts = inner.trim().split(/[\s,]+/)
    }

    if (parts.length < 3) return oklabStr

    let L = parseFloat(parts[0])
    if (parts[0].endsWith('%') || L > 1) {
      L = L / 100
    }

    let a = parseFloat(parts[1])
    if (parts[1].endsWith('%')) {
      a = parseFloat(parts[1]) / 100
    }

    let b = parseFloat(parts[2])
    if (parts[2].endsWith('%')) {
      b = parseFloat(parts[2]) / 100
    }

    let alpha = 1
    if (parts[3]) {
      if (parts[3].endsWith('%')) {
        alpha = parseFloat(parts[3]) / 100
      } else {
        alpha = parseFloat(parts[3])
      }
    }

    const l_ = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3)
    const m_ = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3)
    const s_ = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3)

    const rLin = +4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_
    const gLin = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_
    const bLin = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_

    const gamma = (x: number) => {
      const clamped = Math.max(0, x)
      return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055
    }

    const r = Math.min(255, Math.max(0, Math.round(gamma(rLin) * 255)))
    const g = Math.min(255, Math.max(0, Math.round(gamma(gLin) * 255)))
    const bComp = Math.min(255, Math.max(0, Math.round(gamma(bLin) * 255)))

    if (isNaN(r) || isNaN(g) || isNaN(bComp)) return 'rgb(0, 0, 0)'

    if (alpha < 1) {
      return `rgba(${r}, ${g}, ${bComp}, ${alpha.toFixed(2)})`
    }
    return `rgb(${r}, ${g}, ${bComp})`
  } catch {
    return oklabStr
  }
}

/**
 * Replace all occurrences of oklch(...), oklab(...), and
 * color-mix(in oklab/oklch, ...) inside a CSS string.
 *
 * Uses a balanced-parenthesis matcher so nested functions like
 * calc() inside color values are handled correctly.
 */
export function convertOklchInString(str: string): string {
  if (!str || typeof str !== 'string') return str
  let res = str

  // 1. Handle color-mix(in oklab, ...) / color-mix(in oklch, ...)
  //    Tailwind v4 generates these for opacity modifiers. We resolve
  //    them to simple rgb()/rgba() by evaluating the mix.
  if (res.includes('color-mix')) {
    res = res.replace(
      /color-mix\(\s*in\s+ok(?:lab|lch)\s*,\s*([^,]+?)\s*,\s*([^)]+?)\s*\)/gi,
      (_match, color1Raw: string, color2Raw: string) => {
        try {
          // Parse optional percentage from each color stop
          const parseStop = (raw: string) => {
            const trimmed = raw.trim()
            const pctMatch = trimmed.match(/^(.+?)\s+([\d.]+)%$/s)
            if (pctMatch) {
              return { color: pctMatch[1].trim(), pct: parseFloat(pctMatch[2]) / 100 }
            }
            return { color: trimmed, pct: null as number | null }
          }

          const s1 = parseStop(color1Raw)
          const s2 = parseStop(color2Raw)

          // Resolve percentages (CSS spec: default 50/50)
          const p1 = s1.pct ?? (s2.pct != null ? 1 - s2.pct : 0.5)

          // For "transparent" (commonly color-mix(in oklab, color 95%, transparent)),
          // just convert color1 with adjusted alpha
          if (s2.color === 'transparent') {
            const converted = convertOklchInString(s1.color)
            const rgbMatch = converted.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/)
            if (rgbMatch) {
              const baseAlpha = rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1
              const newAlpha = (baseAlpha * p1).toFixed(2)
              return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${newAlpha})`
            }
            return converted
          }

          // For general case, convert both colors and mix
          const c1 = convertOklchInString(s1.color)
          const c2 = convertOklchInString(s2.color)
          const parseRgb = (c: string) => {
            const m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/)
            if (!m) return null
            return { r: +m[1], g: +m[2], b: +m[3], a: m[4] ? parseFloat(m[4]) : 1 }
          }

          const rgb1 = parseRgb(c1)
          const rgb2 = parseRgb(c2)
          if (rgb1 && rgb2) {
            const mix = (a: number, b: number) => Math.round(a * p1 + b * (1 - p1))
            const r = Math.min(255, Math.max(0, mix(rgb1.r, rgb2.r)))
            const g = Math.min(255, Math.max(0, mix(rgb1.g, rgb2.g)))
            const b = Math.min(255, Math.max(0, mix(rgb1.b, rgb2.b)))
            const a = rgb1.a * p1 + rgb2.a * (1 - p1)
            if (a < 1) return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`
            return `rgb(${r}, ${g}, ${b})`
          }

          // Fallback: return first color converted
          return c1
        } catch {
          return _match
        }
      }
    )
  }

  // 2. Handle oklch(...) — use balanced-paren matching for nested functions
  if (res.includes('oklch')) {
    res = replaceBalancedFn(res, 'oklch', parseOklchToRgb)
  }

  // 3. Handle oklab(...) — same approach
  if (res.includes('oklab')) {
    res = replaceBalancedFn(res, 'oklab', parseOklabToRgb)
  }

  return res
}

/**
 * Find all occurrences of `fnName(...)` in `str` using balanced-parenthesis
 * matching (so nested `calc()` etc. inside are handled), and replace each
 * with the result of `converter(match)`.
 */
function replaceBalancedFn(
  str: string,
  fnName: string,
  converter: (match: string) => string,
): string {
  const needle = fnName + '('
  let result = ''
  let searchFrom = 0

  while (searchFrom < str.length) {
    const idx = str.indexOf(needle, searchFrom)
    if (idx === -1) {
      result += str.slice(searchFrom)
      break
    }

    // Append everything before this match
    result += str.slice(searchFrom, idx)

    // Walk forward from the opening '(' to find the balanced closing ')'
    let depth = 0
    let end = idx + fnName.length // points at the '('
    for (; end < str.length; end++) {
      if (str[end] === '(') depth++
      else if (str[end] === ')') {
        depth--
        if (depth === 0) {
          end++ // include the closing ')'
          break
        }
      }
    }

    const fullMatch = str.slice(idx, end)
    result += converter(fullMatch)
    searchFrom = end
  }

  return result
}
