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
    document.title = title ? `${title} · FactStamp` : BASE_TITLE

    // Update meta description
    const meta = document.querySelector('meta[name="description"]')
    if (meta) {
      meta.setAttribute('content', description)
    }
  }, [title, description])

  return null
}
