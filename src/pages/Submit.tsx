import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlertTriangle,
  Upload,
  Loader2,
  CheckCircle2,
  Trash2,
  ExternalLink,
  RotateCcw,
  FileText,
  Image as ImageIcon,
  Sparkles,
  ShieldAlert,
  HeartPulse,
  Landmark,
  Flame,
  Coins,
  HelpCircle,
  Forward,
  ScanLine,
  Lightbulb,
  Check,
  LayoutDashboard,
  Copy,
  RefreshCw,
  Cpu,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { Modal } from '@/components/ui/Modal'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { Textarea } from '@/components/ui/Input'
import { useClaims } from '@/contexts/ClaimsContext'
import { useAuth } from '@/contexts/AuthContext'
import { findDuplicate } from '@/lib/duplicateDetection'
import { cn } from '@/lib/utils'
import { compressImageToDataUrl } from '@/lib/imageCompression'
import { validateImageUpload, sanitizeTextInput } from '@/lib/security'
import {
  extractTextFromImage,
  type OcrResult,
} from '@/services/ocrService'
import type { ClaimCategory } from '@/lib/types'

type Tab = 'text' | 'image'

const CATEGORY_OPTIONS: {
  id: ClaimCategory
  label: string
  desc: string
  icon: typeof HeartPulse
  iconBg: string
  iconColor: string
}[] = [
  {
    id: 'health',
    label: 'Health & Medical',
    desc: 'Home remedies, cures, diseases',
    icon: HeartPulse,
    iconBg: 'bg-[var(--color-v-true-bg)]',
    iconColor: 'text-[var(--color-v-true)]',
  },
  {
    id: 'political',
    label: 'Political & Govt',
    desc: 'Elections, policies, laws',
    icon: Landmark,
    iconBg: 'bg-[var(--color-v-false-bg)]',
    iconColor: 'text-[var(--color-v-false)]',
  },
  {
    id: 'financial',
    label: 'Financial & Loans',
    desc: 'Bank schemes, free money, UPI',
    icon: Coins,
    iconBg: 'bg-[var(--color-v-mislead-bg)]',
    iconColor: 'text-[var(--color-v-mislead)]',
  },
  {
    id: 'religious',
    label: 'Religious & Culture',
    desc: 'Festivals, heritage, beliefs',
    icon: Flame,
    iconBg: 'bg-[var(--color-accent-subtle)]',
    iconColor: 'text-[var(--color-accent)]',
  },
  {
    id: 'other',
    label: 'Other Topics',
    desc: 'Scams, tech, general viral news',
    icon: HelpCircle,
    iconBg: 'bg-[var(--color-brand-subtle)]',
    iconColor: 'text-[var(--color-brand)]',
  },
]

const SAMPLE_FORWARDS = [
  'Government has made it mandatory for every voter to link mobile phone with Voter ID or vote will be rejected.',
  'Drinking kadha with ginger, tulsi and black pepper every morning cures COVID-19 completely. Share with family!',
  'Reserve Bank of India is closing all ATMs from 12 PM tonight due to system upgrade. Withdraw cash now!',
]

const SAMPLE_SCREENSHOTS = [
  {
    title: 'Sample 1: Health Forward',
    desc: 'Ginger & Tulsi respiratory remedy forward',
    path: '/samples/whatsapp-health-sample.png',
    badge: 'Health',
  },
  {
    title: 'Sample 2: Govt Grant Scheme',
    desc: 'Education Ministry student DBT grant notice',
    path: '/samples/whatsapp-scheme-sample.png',
    badge: 'Financial',
  },
]

export function Submit() {
  const navigate = useNavigate()
  const { addClaim, claims } = useClaims()
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<Tab>('text')
  const [claimText, setClaimText] = useState('')
  const [category, setCategory] = useState<ClaimCategory>('health')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [duplicateFound, setDuplicateFound] = useState<{ id: string; text: string; similarity: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrStatus, setOcrStatus] = useState('')
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [currentFile, setCurrentFile] = useState<File | Blob | null>(null)
  const [showEngineModal, setShowEngineModal] = useState(false)
  const [viewRawOcr, setViewRawOcr] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [submittedClaimId, setSubmittedClaimId] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setClaimText('')
    setCategory('health')
    setErrors({})
    setDuplicateFound(null)
    setUploadedImage(null)
    setScreenshotUrl(null)
    setCurrentFile(null)
    setOcrResult(null)
    setOcrError(null)
    setOcrProgress(0)
    setOcrStatus('')
    setViewRawOcr(false)
    setActiveTab('text')
  }, [])

  const checkDuplicate = useCallback(() => {
    if (claimText.trim().length < 20) return
    const result = findDuplicate(claimText, claims.map((c) => ({ id: c.id, text: c.text })))
    if (result && !duplicateFound) {
      toast('Similar claim found', {
        description: `This matches an existing claim (${Math.round(result.similarity * 100)}% similar). View the existing verdict to avoid duplication.`,
        icon: <AlertTriangle className="w-5 h-5 text-[var(--color-v-mislead)]" />,
      })
    }
    setDuplicateFound(result)
  }, [claimText, claims, duplicateFound])

  const handleSubmitAction = async () => {
    const newErrors: Record<string, string> = {}
    if (claimText.trim().length < 20) {
      newErrors.text = 'Claim text must be at least 20 characters'
    }
    if (claimText.trim().length > 500) {
      newErrors.text = 'Claim text must be under 500 characters'
    }
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the errors', {
        description: newErrors.text,
      })
      throw new Error(newErrors.text)
    }
    if (duplicateFound) {
      toast.error('Duplicate claim', {
        description: 'This claim has already been verified by the community. View the existing verdict instead.',
      })
      throw new Error('Duplicate claim')
    }

    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 900))

      const newClaim = await addClaim({
        text: sanitizeTextInput(claimText.trim()),
        category,
        submittedBy: user?.uid || '',
        submittedByName: sanitizeTextInput(user?.displayName || 'Anonymous'),
        imageUrl: screenshotUrl || undefined,
      })

      setSubmittedClaimId(newClaim.id)
      setShowSuccessModal(true)
    } finally {
      setLoading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const processOcr = useCallback(
    async (fileOrBlob: File | Blob) => {
      setExtracting(true)
      setOcrProgress(10)
      setOcrStatus('Initializing AI OCR engine...')
      setOcrError(null)

      try {
        const result = await extractTextFromImage(
          fileOrBlob,
          {},
          (progress, status) => {
            setOcrProgress(progress)
            setOcrStatus(status)
          }
        )

        setOcrResult(result)
        setClaimText(result.cleanedText)
        if (result.detectedCategory) {
          setCategory(result.detectedCategory)
        }

        toast.success('Text extracted successfully!', {
          description: `Extracted ${result.wordCount} words with ${result.confidence}% confidence. Category auto-selected.`,
          icon: <ScanLine className="w-4 h-4 text-[var(--color-brand)]" />,
        })
      } catch (err: unknown) {
        console.error('OCR Extraction error:', err)
        const message =
          err instanceof Error ? err.message : 'Could not extract text from this screenshot.'
        setOcrError(message)
        toast.error('OCR Extraction failed', {
          description: message,
        })
      } finally {
        setExtracting(false)
      }
    },
    []
  )

  const handleFile = useCallback(
    async (file: File) => {
      // 17. File Upload Attack: Triple-layer validation (extension + MIME + magic bytes + size)
      const validation = await validateImageUpload(file)
      if (!validation.valid) {
        toast.error('File rejected', { description: validation.error })
        return
      }

      setCurrentFile(file)
      setOcrError(null)

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setUploadedImage(dataUrl)
        compressImageToDataUrl(file).then((compressedUrl) => {
          setScreenshotUrl(compressedUrl)
          if (!compressedUrl) {
            toast.warning('Screenshot not saved', {
              description:
                'The image will only exist as a local preview — the claim text can still be submitted.',
            })
          }
        })
        processOcr(file)
      }
      reader.readAsDataURL(file)
    },
    [processOcr]
  )

  const handleLoadSample = useCallback(
    async (samplePath: string, sampleTitle: string) => {
      try {
        setExtracting(true)
        setOcrProgress(5)
        setOcrStatus(`Loading ${sampleTitle}...`)
        setOcrError(null)

        const res = await fetch(samplePath)
        if (!res.ok) throw new Error('Could not fetch sample image file')
        const blob = await res.blob()
        const filename = samplePath.split('/').pop() || 'sample.png'
        const sampleFile = new File([blob], filename, { type: 'image/png' })

        setCurrentFile(sampleFile)

        const reader = new FileReader()
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string
          setUploadedImage(dataUrl)
          setScreenshotUrl(dataUrl)
        }
        reader.readAsDataURL(blob)

        await processOcr(sampleFile)
      } catch (err: unknown) {
        setExtracting(false)
        const msg = err instanceof Error ? err.message : 'Could not fetch sample image'
        toast.error('Failed to load sample', { description: msg })
      }
    },
    [processOcr]
  )

  const handleCopyText = async () => {
    const textToCopy = viewRawOcr && ocrResult ? ocrResult.rawText : claimText
    if (!textToCopy) return
    try {
      await navigator.clipboard.writeText(textToCopy)
      setIsCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  // Paste screenshot handler (Ctrl+V anywhere on submit page when not focused in input)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return
      }
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            e.preventDefault()
            setActiveTab('image')
            handleFile(file)
            toast.info('Image pasted from clipboard', {
              description: 'Extracting text with AI OCR...',
            })
            break
          }
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [handleFile])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <Seo title="Sign In Required — Submit Claim" description="Sign in to FactStamp to submit WhatsApp forwards for community verification." />
        <Breadcrumbs currentLabel="Submit claim" className="px-0 pt-0 mb-4" />

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-8 text-center shadow-[var(--shadow-lg)]">
          <div className="w-16 h-16 rounded-full bg-[var(--color-brand-subtle)] border border-[var(--color-brand-subtle)] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-[var(--color-brand)]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[var(--color-fg)] mb-2">Sign in to submit claims</h2>
          <p className="text-xs lg:text-sm text-[var(--color-fg-2)] mb-6 leading-relaxed">
            To prevent spam and maintain community accuracy, you must be signed in to submit a WhatsApp forward for verification.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              intent="primary"
              size="lg"
              className="flex-1 font-bold shadow-[var(--shadow-sm)]"
              onClick={() => navigate('/signin', { state: { from: '/submit' } })}
            >
              Sign In to Submit
            </Button>
            <Button
              intent="outline"
              size="lg"
              className="flex-1 font-semibold"
              onClick={() => navigate('/signup', { state: { from: '/submit' } })}
            >
              Create Account
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Seo title="Submit a Claim" description="Paste a suspicious WhatsApp forward or upload a screenshot for community fact-checking." />
      <Breadcrumbs currentLabel="Submit claim" className="px-0 pt-0 mb-4" />

      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[var(--color-brand)] bg-[var(--color-brand-subtle)] border border-[var(--color-brand-subtle)] mb-3">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Community Verification Queue</span>
        </div>
        <h1 className="text-3xl lg:text-4xl font-extrabold text-[var(--color-fg)] tracking-tight mb-2">
          Submit a claim for verification
        </h1>
        <p className="text-sm lg:text-base text-[var(--color-fg-2)] leading-relaxed">
          Paste a suspicious WhatsApp forward text or upload a screenshot. We&apos;ll check if it&apos;s already verified or add it to the community queue.
        </p>
      </div>

      {/* Main Form Container Card */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-6 lg:p-8">
        {/* Tab Selector */}
        <div className="flex items-center p-1 rounded-[var(--radius-lg)] bg-[var(--color-surface-2)] border border-[var(--color-border-soft)] mb-7">
          <button
            type="button"
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs lg:text-sm font-bold rounded-[calc(var(--radius-lg)-2px)] transition-all cursor-pointer select-none',
              activeTab === 'text'
                ? 'bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-sm)] border border-[var(--color-border-soft)]'
                : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
            )}
            onClick={() => setActiveTab('text')}
          >
            <FileText className="w-4 h-4 text-[var(--color-brand)]" />
            <span>Text Forward</span>
          </button>
          <button
            type="button"
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs lg:text-sm font-bold rounded-[calc(var(--radius-lg)-2px)] transition-all cursor-pointer select-none',
              activeTab === 'image'
                ? 'bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-sm)] border border-[var(--color-border-soft)]'
                : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
            )}
            onClick={() => setActiveTab('image')}
          >
            <ImageIcon className="w-4 h-4 text-[var(--color-accent)]" />
            <span>Screenshot (OCR)</span>
            <span className="text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">
              AI OCR
            </span>
          </button>
        </div>

        {/* Text Tab */}
        {activeTab === 'text' && (
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="claim-text" className="block text-xs font-bold uppercase tracking-wider text-[var(--color-fg-2)]">
                  WhatsApp Forward Content
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText()
                      if (text) {
                        setClaimText(text)
                        setErrors({})
                        setDuplicateFound(null)
                        toast.success('Pasted from clipboard!', {
                          description: 'Inserted message text into the input field.',
                        })
                      } else {
                        toast.info('Clipboard empty', {
                          description: 'No text found in your clipboard to paste.',
                        })
                      }
                    } catch (err) {
                      toast.error('Clipboard access denied', {
                        description: 'Please allow clipboard permissions in your browser or paste manually (Ctrl+V).',
                      })
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] bg-transparent border-none cursor-pointer transition-colors"
                >
                  <Forward className="w-3.5 h-3.5" />
                  <span>Paste from clipboard</span>
                </button>
              </div>

              {/* Chat Bubble Styled Textarea Container */}
              <div className="relative rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1 focus-within:border-[var(--color-accent)] focus-within:ring-2 focus-within:ring-[var(--color-accent-subtle)] transition-all">
                <Textarea
                  id="claim-text"
                  placeholder="Paste the message forward here... (e.g., 'Government scheme offering ₹50,000 scholarship...')"
                  value={claimText}
                  onChange={(e) => {
                    setClaimText(e.target.value)
                    if (errors.text) setErrors({})
                  }}
                  onBlur={checkDuplicate}
                  error={!!errors.text}
                  rows={6}
                  aria-describedby="char-count"
                  className="border-0 focus:ring-0 bg-transparent text-sm leading-relaxed p-3"
                />
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <span
                    id="char-count"
                    className={cn(
                      'text-xs font-mono font-bold tabular-nums',
                      claimText.trim().length < 20
                        ? 'text-[var(--color-fg-muted)]'
                        : claimText.trim().length > 500
                        ? 'text-[var(--color-v-false)]'
                        : 'text-[var(--color-v-true)]'
                    )}
                  >
                    {claimText.trim().length} / 500 chars
                  </span>
                  {claimText.trim().length >= 20 && claimText.trim().length <= 500 && (
                    <span className="text-xs text-[var(--color-v-true)] font-semibold flex items-center gap-1 animate-pop-in">
                      <Check className="w-3.5 h-3.5 text-[var(--color-v-true)]" aria-hidden="true" />
                      Valid forward length
                    </span>
                  )}
                </div>
                {errors.text && (
                  <span className="text-xs font-semibold text-[var(--color-v-false)]">
                    {errors.text}
                  </span>
                )}
              </div>

              {/* Sample Forward Quick Pills */}
              <div className="mt-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-fg-muted)] flex items-center gap-1 mb-2">
                  <Lightbulb className="w-3.5 h-3.5 text-[var(--color-brand)]" aria-hidden="true" />
                  Or try a sample viral forward:
                </span>
                <div className="flex flex-col gap-1.5">
                  {SAMPLE_FORWARDS.map((f, i) => (
                    <button
                      key={i}
                      type="button"
                      className="text-left text-xs p-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface-2)]/60 border border-[var(--color-border-soft)] text-[var(--color-fg-2)] hover:text-[var(--color-fg)] hover:border-[var(--color-brand-subtle)] hover:bg-[var(--color-brand-subtle)] active:scale-[0.98] transition-all duration-150 ease-out cursor-pointer truncate"
                      onClick={() => {
                        setClaimText(f)
                        setErrors({})
                        setDuplicateFound(null)
                      }}
                    >
                      <span className="font-semibold text-[var(--color-brand)] me-1.5">Sample #{i + 1}:</span>
                      &ldquo;{f}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Duplicate Detection Alert */}
            {duplicateFound && (
              <div
                className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-v-mislead-bg)] border border-[var(--color-v-mislead-border)] animate-pop-in"
                role="alert"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[var(--color-v-mislead)] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-sm text-[var(--color-v-mislead)]">
                      Similar claim already in system ({Math.round(duplicateFound.similarity * 100)}% match)
                    </p>
                    <p className="text-xs text-[var(--color-fg-2)] mt-1 leading-relaxed">
                      This claim has already been submitted and fact-checked. View the existing verdict instead of creating a duplicate.
                    </p>
                    <div className="mt-2 text-xs text-[var(--color-fg)] italic bg-[var(--color-surface)]/80 p-2.5 rounded-md border border-[var(--color-border-soft)] line-clamp-2">
                      &quot;{duplicateFound.text}&quot;
                    </div>
                    <Button
                      intent="outline"
                      size="sm"
                      className="mt-3 font-semibold"
                      onClick={() => navigate(`/claim/${duplicateFound.id}`)}
                    >
                      <ExternalLink className="w-3.5 h-3.5 me-1" />
                      View Existing Verdict Card
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Visual Category Grid Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-fg-2)] mb-2.5">
                Select Claim Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {CATEGORY_OPTIONS.map((c) => {
                  const Icon = c.icon
                  const selected = category === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={cn(
                        'relative flex items-start gap-3 p-3.5 rounded-[var(--radius-lg)] border text-left cursor-pointer select-none transition-all duration-200 ease-out',
                        selected
                          ? 'bg-[var(--color-brand-subtle)]/40 border-[var(--color-brand)] shadow-[var(--shadow-xs)]'
                          : 'bg-[var(--color-surface)] border-[var(--color-border-soft)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface-2)]/60'
                      )}
                      onClick={() => setCategory(c.id)}
                    >
                      <div
                        className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border border-black/5 dark:border-white/5 transition-transform duration-200',
                          selected && 'scale-105',
                          c.iconBg,
                          c.iconColor
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className={cn('text-xs font-bold transition-colors', selected ? 'text-[var(--color-brand)]' : 'text-[var(--color-fg)]')}>
                            {c.label}
                          </p>
                          {selected && (
                            <span className="w-2 h-2 rounded-full bg-[var(--color-brand)] flex-shrink-0 animate-pop-in" />
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--color-fg-muted)] truncate mt-0.5">{c.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Submit Button */}
            <LoadingButton
              onAction={handleSubmitAction}
              disabled={claimText.trim().length < 20 || claimText.trim().length > 500 || !!duplicateFound || loading}
              pendingLabel="Submitting Claim for Verification..."
              successLabel="Claim Submitted Successfully!"
              errorLabel="Failed to Submit"
              className="mt-6"
            >
              Submit Claim for Community Verification
            </LoadingButton>
          </form>
        )}

        {/* Image / OCR Tab */}
        {activeTab === 'image' && (
          <div className="space-y-6">
            {/* Engine Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-2)]/60 border border-[var(--color-border-soft)]">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-[var(--color-v-true)] animate-pulse" />
                <span className="font-bold text-[var(--color-fg-2)]">OCR Engine:</span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1 rounded-md bg-[var(--color-surface)] border border-[var(--color-border-soft)] text-[var(--color-brand)] font-bold">
                  <Cpu className="w-3 h-3 text-[var(--color-brand)]" />
                  Neural WebAssembly OCR (100% Offline & Local)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowEngineModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-fg-muted)] hover:text-[var(--color-brand)] transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>About OCR Engine</span>
              </button>
            </div>

            {/* Dropzone Area (Shown when no image is uploaded yet) */}
            {!uploadedImage && (
              <div className="space-y-6">
                <div
                  className={cn(
                    'border-2 border-dashed rounded-[var(--radius-xl)] p-8 lg:p-12 text-center transition-all cursor-pointer',
                    dragActive
                      ? 'border-[var(--color-brand)] bg-[var(--color-brand-subtle)] scale-[1.01]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-brand)] bg-[var(--color-surface-2)]/30'
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <div className="w-16 h-16 rounded-full bg-[var(--color-brand-subtle)] border border-[var(--color-brand-subtle)] flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-105">
                    <Upload className="w-8 h-8 text-[var(--color-brand)]" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--color-fg)]">
                    Drag &amp; drop a WhatsApp screenshot here
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--color-fg-muted)] mt-1.5 max-w-md mx-auto leading-relaxed">
                    Our AI OCR will automatically extract text from your chat screenshot, newspaper clipping, or image forward.
                  </p>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                  />

                  <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        document.getElementById('file-input')?.click()
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold whitespace-nowrap select-none px-5 py-2.5 text-xs bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] shadow-[var(--shadow-sm)] transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Browse Files
                    </button>
                    <span className="text-[11px] font-mono text-[var(--color-fg-muted)]">
                      Supports PNG, JPG, WebP (Max 5MB)
                    </span>
                  </div>

                  <p className="text-[11px] font-mono text-[var(--color-fg-muted)] mt-4">
                    💡 Tip: You can also paste screenshots directly with <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-border-soft)] font-bold">Ctrl+V</kbd>
                  </p>
                </div>

                {/* Instant Sample Screenshots for Testing */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-fg-muted)] flex items-center gap-1.5 mb-2.5">
                    <Lightbulb className="w-3.5 h-3.5 text-[var(--color-brand)]" aria-hidden="true" />
                    Or test instantly with a sample forward screenshot:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SAMPLE_SCREENSHOTS.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={extracting}
                        onClick={() => handleLoadSample(s.path, s.title)}
                        className="flex items-center gap-3 p-3 text-left rounded-[var(--radius-lg)] bg-[var(--color-surface-2)]/70 hover:bg-[var(--color-brand-subtle)] border border-[var(--color-border-soft)] hover:border-[var(--color-brand)] transition-all cursor-pointer group disabled:opacity-50"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-black/5 border border-[var(--color-border-soft)]">
                          <img
                            src={s.path}
                            alt={s.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-[var(--color-fg)] group-hover:text-[var(--color-brand)] transition-colors truncate">
                              {s.title}
                            </span>
                            <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border-soft)] text-[var(--color-brand)]">
                              {s.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--color-fg-muted)] truncate mt-0.5">
                            {s.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* When an image is uploaded: Show Preview + OCR Processing or Results */}
            {uploadedImage && (
              <div className="space-y-6 animate-fade-in">
                {/* Screenshot Display Card */}
                <div className="relative rounded-[var(--radius-xl)] overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
                  <img
                    src={uploadedImage}
                    alt="Uploaded screenshot"
                    className="w-full max-h-80 object-contain rounded-lg mx-auto"
                  />

                  {/* Extraction Progress Overlay */}
                  {extracting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg)]/90 backdrop-blur-xs rounded-[var(--radius-xl)] p-6">
                      <div className="text-center max-w-sm w-full">
                        <div className="relative w-14 h-14 mx-auto mb-3 flex items-center justify-center">
                          <Loader2 className="w-12 h-12 animate-spin text-[var(--color-brand)]" />
                          <ScanLine className="w-6 h-6 text-[var(--color-fg)] absolute" />
                        </div>
                        <p className="text-base font-extrabold text-[var(--color-fg)] mb-1">
                          Extracting text with AI OCR...
                        </p>
                        <p className="text-xs text-[var(--color-fg-2)] mb-4">
                          {ocrStatus || 'Analyzing image and recognizing text...'}
                        </p>
                        <div className="w-full h-2 rounded-full bg-[var(--color-border)] overflow-hidden mb-2">
                          <div
                            className="h-full bg-[var(--color-brand)] transition-all duration-300 ease-out"
                            style={{ width: `${ocrProgress}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-[var(--color-brand)] block mb-4">
                          {ocrProgress}% completed
                        </span>
                        <Button
                          intent="ghost"
                          size="sm"
                          onClick={() => {
                            setUploadedImage(null)
                            setScreenshotUrl(null)
                            setExtracting(false)
                            setClaimText('')
                            setOcrResult(null)
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 me-1" />
                          Cancel Extraction
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* OCR Error State */}
                {ocrError && !extracting && (
                  <div
                    className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-v-false-bg)] border border-[var(--color-v-false-border)] flex items-start gap-3 animate-pop-in"
                    role="alert"
                  >
                    <AlertTriangle className="w-5 h-5 text-[var(--color-v-false)] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-sm text-[var(--color-v-false)]">
                        OCR Extraction Issue
                      </p>
                      <p className="text-xs text-[var(--color-fg-2)] mt-1">
                        {ocrError}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button
                          intent="outline"
                          size="sm"
                          onClick={() => currentFile && processOcr(currentFile)}
                        >
                          <RefreshCw className="w-3.5 h-3.5 me-1" />
                          Retry OCR
                        </Button>
                        <Button
                          intent="ghost"
                          size="sm"
                          onClick={() => setActiveTab('text')}
                        >
                          Switch to Manual Text Input
                        </Button>
                        <Button
                          intent="ghost"
                          size="sm"
                          onClick={resetForm}
                        >
                          Upload Different Image
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Extracted Text Review & Edit Card */}
                {ocrResult && !extracting && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Top Stats Banner */}
                    <div className="p-4 rounded-[var(--radius-xl)] bg-[var(--color-v-true-bg)] border border-[var(--color-v-true-border)] flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-v-true)]/20 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-[var(--color-v-true)]" />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-[var(--color-v-true)] block">
                            OCR Text Extracted Successfully
                          </span>
                          <span className="text-[11px] font-mono text-[var(--color-fg-muted)]">
                            {ocrResult.wordCount} words • {claimText.length} characters • via WebAssembly OCR
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-soft)] text-[var(--color-v-true)]">
                          <CheckCircle2 className="w-3 h-3" />
                          {ocrResult.confidence}% confidence
                        </span>
                        <CategoryBadge category={category} />
                      </div>
                    </div>

                    {/* Direct-Editable Text Area */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="ocr-extracted-text"
                          className="block text-xs font-bold uppercase tracking-wider text-[var(--color-fg-2)]"
                        >
                          Review &amp; Polish Extracted Forward
                        </label>
                        <span className="text-[11px] text-[var(--color-fg-muted)]">
                          Click to edit any typos directly before submitting
                        </span>
                      </div>

                      <div className="relative rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1 focus-within:border-[var(--color-accent)] focus-within:ring-2 focus-within:ring-[var(--color-accent-subtle)] transition-all">
                        <Textarea
                          id="ocr-extracted-text"
                          rows={6}
                          value={viewRawOcr ? ocrResult.rawText : claimText}
                          onChange={(e) => {
                            if (!viewRawOcr) setClaimText(e.target.value)
                          }}
                          readOnly={viewRawOcr}
                          placeholder="Extracted message forward..."
                          className="border-0 focus:ring-0 bg-transparent text-sm leading-relaxed p-3"
                        />
                      </div>

                      {/* Character Count & Action Sub-bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'text-xs font-mono font-bold tabular-nums',
                              claimText.trim().length < 20
                                ? 'text-[var(--color-fg-muted)]'
                                : claimText.trim().length > 500
                                ? 'text-[var(--color-v-false)]'
                                : 'text-[var(--color-v-true)]'
                            )}
                          >
                            {claimText.trim().length} / 500 chars
                          </span>
                          {claimText.trim().length >= 20 && claimText.trim().length <= 500 && (
                            <span className="text-xs text-[var(--color-v-true)] font-semibold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              Valid claim length
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewRawOcr(!viewRawOcr)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] bg-transparent border-none cursor-pointer"
                          >
                            {viewRawOcr ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Show Cleaned Forward</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>Show Raw OCR Output</span>
                              </>
                            )}
                          </button>
                          <span className="text-[var(--color-border)]">|</span>
                          <button
                            type="button"
                            onClick={handleCopyText}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] bg-transparent border-none cursor-pointer"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCopied ? 'Copied!' : 'Copy Text'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Primary CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                      <Button
                        intent="primary"
                        size="lg"
                        className="flex-1 font-bold shadow-[var(--shadow-sm)]"
                        disabled={claimText.trim().length < 20}
                        onClick={() => {
                          checkDuplicate()
                          setActiveTab('text')
                          toast.info('Extracted text loaded', {
                            description: 'Review category and submit for verification.',
                          })
                        }}
                      >
                        <Forward className="w-4 h-4 me-1.5" />
                        Continue to Submit Claim
                      </Button>
                      <Button
                        intent="secondary"
                        size="lg"
                        onClick={resetForm}
                      >
                        <Trash2 className="w-4 h-4 me-1" />
                        Remove Image
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* About OCR Engine Informational Modal */}
      <Modal
        open={showEngineModal}
        onClose={() => setShowEngineModal(false)}
        size="md"
      >
        <div className="py-2 px-1 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-subtle)] border border-[var(--color-brand-subtle)] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-[var(--color-brand)]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--color-fg)]">
                About OCR Engine
              </h3>
              <p className="text-xs text-[var(--color-fg-muted)]">
                Neural WebAssembly OCR (100% Offline &amp; Local)
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-[var(--color-fg-2)] leading-relaxed">
            <div className="p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-surface-2)]/60 border border-[var(--color-border-soft)] space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[var(--color-fg)]">
                  Client-Side WebAssembly Processing
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-v-true-bg)] text-[var(--color-v-true)] font-bold">
                  100% Private &amp; Offline
                </span>
              </div>
              <p>
                FactStamp processes screenshots directly in your browser using neural LSTM WebAssembly. Your screenshots and media never leave your device.
              </p>
            </div>

            <div className="p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-surface-2)]/60 border border-[var(--color-border-soft)] space-y-1.5">
              <span className="font-bold text-[var(--color-fg)]">
                Zero Configuration &amp; No API Keys Required
              </span>
              <p>
                No third-party cloud accounts, tokens, or external API keys are needed. Everything is bundled and executed locally with zero latency or privacy leakage.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-[var(--color-border-soft)]">
            <Button
              intent="primary"
              size="sm"
              onClick={() => setShowEngineModal(false)}
            >
              Got it
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        size="md"
      >
        <div className="flex flex-col items-center text-center py-2 px-1">
          {/* Glowing Animated Icon Badge */}
          <div className="relative mb-4 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[var(--color-brand)]/20 blur-xl scale-150" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-brand-subtle)] via-[var(--color-surface)] to-[var(--color-brand-subtle)] border border-[var(--color-brand-subtle)] shadow-[var(--shadow-sm)] flex items-center justify-center animate-pop-in">
              <CheckCircle2 className="w-8 h-8 text-[var(--color-brand)]" aria-hidden="true" />
            </div>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-[var(--color-fg)] tracking-tight leading-tight mb-2">
            Claim Submitted Successfully!
          </h3>
          <p className="text-xs sm:text-sm text-[var(--color-fg-2)] mb-6 max-w-md leading-relaxed">
            Your claim has been added to the community verification queue. Independent verifiers will now review sources and submit consensus verdicts.
          </p>

          {/* Elevated Claim Preview Card */}
          <div className="w-full text-left rounded-2xl bg-[var(--color-surface-2)]/80 border border-[var(--color-border-soft)] p-4 sm:p-5 shadow-[var(--shadow-sm)] mb-6 space-y-3.5">
            {/* Top Bar: Category + Status Pill */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-soft)] pb-3">
              <CategoryBadge category={category} />
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand)] border border-[var(--color-brand)]/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-brand)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-brand)]" />
                </span>
                Status: Pending (0/3 Verifications)
              </span>
            </div>

            {/* Submitted Text Quote Box */}
            <div className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-soft)] shadow-2xs">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[var(--color-fg-muted)] block mb-1">
                Submitted Forward Content
              </span>
              <p className="text-sm sm:text-base text-[var(--color-fg)] font-normal leading-relaxed line-clamp-3">
                &ldquo;{claimText}&rdquo;
              </p>
            </div>

            {/* Bottom Info Bar */}
            <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-fg-muted)] pt-0.5">
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-[var(--color-brand)]" />
                3 Verifiers Quorum Required
              </span>
              <span className="text-[var(--color-v-true)] font-bold">
                +2 Rep On Completion
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 w-full">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                intent="primary"
                size="lg"
                className="flex-1 font-bold shadow-[var(--shadow-sm)]"
                onClick={() => {
                  setShowSuccessModal(false)
                  if (submittedClaimId) navigate(`/claim/${submittedClaimId}`)
                }}
              >
                <ExternalLink className="w-4 h-4 me-1.5" aria-hidden="true" />
                View Claim Card
              </Button>
              <Button
                intent="secondary"
                size="lg"
                className="flex-1 font-semibold"
                onClick={() => {
                  setShowSuccessModal(false)
                  navigate('/dashboard')
                }}
              >
                <LayoutDashboard className="w-4 h-4 me-1.5" aria-hidden="true" />
                Go to Dashboard
              </Button>
            </div>
            <Button
              intent="ghost"
              size="sm"
              className="w-full text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] py-2"
              onClick={() => {
                setShowSuccessModal(false)
                resetForm()
              }}
            >
              <RotateCcw className="w-3.5 h-3.5 me-1.5" aria-hidden="true" />
              Submit Another Forward
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
