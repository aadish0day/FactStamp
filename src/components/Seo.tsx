import { useEffect } from 'react'

const BASE_TITLE = 'FactStamp — India\'s Misinformation Fact-Checker'
const DEFAULT_DESC =
  'FactStamp helps Indians verify viral WhatsApp forwards with transparent, community-driven fact-checks and clear verdicts.'

interface SeoProps {
  title?: string
  description?: string
}

export function Seo({ title, description = DEFAULT_DESC }: SeoProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} · FactStamp` : BASE_TITLE
    document.title = fullTitle

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) metaDesc.setAttribute('content', description)

    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) ogTitle.setAttribute('content', fullTitle)

    const ogDesc = document.querySelector('meta[property="og:description"]')
    if (ogDesc) ogDesc.setAttribute('content', description)
  }, [title, description])

  return null
}
