import { useEffect } from 'react'

/** Public site origin (no trailing slash). Set via VITE_SITE_URL; defaulted in vite.config.ts. */
export const SITE_URL: string = import.meta.env.VITE_SITE_URL || 'https://fact-stamp.vercel.app'
export const SITE_HOST = new URL(SITE_URL).host

const BASE_TITLE = 'FactStamp — India\'s Misinformation Fact-Checker'
const DEFAULT_DESC =
  'FactStamp helps Indians verify viral WhatsApp forwards with transparent, community-driven fact-checks and clear verdicts.'

interface SeoProps {
  title?: string
  description?: string
}

export function Seo({ title, description = DEFAULT_DESC }: SeoProps) {
  useEffect(() => {
    const fullTitle = !title ? BASE_TITLE : /factstamp/i.test(title) ? title : `${title} · FactStamp`
    document.title = fullTitle

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) metaDesc.setAttribute('content', description)

    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) ogTitle.setAttribute('content', fullTitle)

    const ogDesc = document.querySelector('meta[property="og:description"]')
    if (ogDesc) ogDesc.setAttribute('content', description)

    for (const sel of ['meta[name="twitter:title"]', 'meta[name="twitter:description"]']) {
      document.querySelector(sel)?.setAttribute('content', sel.includes('title') ? fullTitle : description)
    }

    const ogUrl = document.querySelector('meta[property="og:url"]')
    if (ogUrl) ogUrl.setAttribute('content', SITE_URL + window.location.pathname)
  }, [title, description])

  return null
}
