import { useState, useCallback } from 'react'
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
  ScanLine
} from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { Textarea } from '@/components/ui/Input'
import { useClaims } from '@/contexts/ClaimsContext'
import { useAuth } from '@/contexts/AuthContext'
import { findDuplicate } from '@/lib/duplicateDetection'
import { cn } from '@/lib/utils'
import type { ClaimCategory } from '@/lib/types'

type Tab = 'text' | 'image'

const CATEGORY_OPTIONS: { id: ClaimCategory; label: string; desc: string; icon: typeof HeartPulse; color: string }[] = [
  { id: 'health', label: 'Health & Medical', desc: 'Home remedies, cures, diseases', icon: HeartPulse, color: '#16a34a' },
  { id: 'political', label: 'Political & Govt', desc: 'Elections, policies, laws', icon: Landmark, color: '#dc2626' },
  { id: 'financial', label: 'Financial & Loans', desc: 'Bank schemes, free money, UPI', icon: Coins, color: '#d97706' },
  { id: 'religious', label: 'Religious & Culture', desc: 'Festivals, heritage, beliefs', icon: Flame, color: '#7c3aed' },
  { id: 'other', label: 'Other Topics', desc: 'Scams, tech, general viral news', icon: HelpCircle, color: '#0284c7' },
]

const SAMPLE_FORWARDS = [
  'Government has made it mandatory for every voter to link mobile phone with Voter ID or vote will be rejected.',
  'Drinking kadha with ginger, tulsi and black pepper every morning cures COVID-19 completely. Share with family!',
  'Reserve Bank of India is closing all ATMs from 12 PM tonight due to system upgrade. Withdraw cash now!',
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
  const [extracting, setExtracting] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [submittedClaimId, setSubmittedClaimId] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setClaimText('')
    setCategory('health')
    setErrors({})
    setDuplicateFound(null)
    setUploadedImage(null)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
      return
    }
    if (duplicateFound) {
      toast.error('Duplicate claim', {
        description: 'This claim has already been verified by the community. View the existing verdict instead.',
      })
      return
    }

    setLoading(true)
    await new Promise((r) => setTimeout(r, 900))

    const newClaim = addClaim({
      text: claimText.trim(),
      category,
      submittedBy: user?.uid || 'u1',
      submittedByName: user?.displayName || 'Anonymous',
    })

    setLoading(false)
    setSubmittedClaimId(newClaim.id)
    setShowSuccessModal(true)
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

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file', { description: 'Please select an image file (.jpg, .png, .webp).' })
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string)
      simulateExtraction()
    }
    reader.readAsDataURL(file)
  }

  const simulateExtraction = () => {
    setExtracting(true)
    setOcrProgress(15)

    const interval = setInterval(() => {
      setOcrProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 25
      })
    }, 400)

    setTimeout(() => {
      clearInterval(interval)
      setOcrProgress(100)
      setClaimText('IIT Madras offering ₹50,000 scholarship for all government school students scoring above 90% in Class 12. Apply before deadline.')
      setExtracting(false)
      toast.success('Text extracted!', {
        description: 'Extracted text from screenshot. Review and select category.',
        icon: <ScanLine className="w-4 h-4 text-[var(--color-brand)]" />,
      })
    }, 1800)
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
          <form onSubmit={handleSubmit} className="space-y-6">
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
                      claimText.length < 20
                        ? 'text-[var(--color-fg-muted)]'
                        : claimText.length > 500
                        ? 'text-[var(--color-v-false)]'
                        : 'text-[var(--color-v-true)]'
                    )}
                  >
                    {claimText.length} / 500 chars
                  </span>
                  {claimText.length >= 20 && claimText.length <= 500 && (
                    <span className="text-xs text-[var(--color-v-true)] font-semibold flex items-center gap-1 animate-pop-in">
                      ✓ Valid forward length
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
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-fg-muted)] block mb-2">
                  💡 Or try a sample viral forward:
                </span>
                <div className="flex flex-col gap-1.5">
                  {SAMPLE_FORWARDS.map((f, i) => (
                    <button
                      key={i}
                      type="button"
                      className="text-left text-xs p-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface-2)]/60 border border-[var(--color-border-soft)] text-[var(--color-fg-2)] hover:text-[var(--color-fg)] hover:border-[var(--color-brand-subtle)] hover:bg-[var(--color-brand-subtle)] transition-all cursor-pointer truncate"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {CATEGORY_OPTIONS.map((c) => {
                  const Icon = c.icon
                  const selected = category === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-[var(--radius-lg)] border text-left transition-all cursor-pointer select-none',
                        selected
                          ? 'bg-[var(--color-surface-2)] border-[var(--color-brand)] shadow-[var(--shadow-sm)] ring-1 ring-[var(--color-brand)]'
                          : 'bg-[var(--color-surface)] border-[var(--color-border-soft)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface-2)]/50'
                      )}
                      onClick={() => setCategory(c.id)}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: `${c.color}15`, color: c.color }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--color-fg)]">{c.label}</p>
                        <p className="text-[10px] text-[var(--color-fg-muted)] truncate">{c.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              intent="primary"
              size="lg"
              className="w-full font-bold shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all cursor-pointer"
              disabled={claimText.trim().length < 20 || claimText.trim().length > 500 || !!duplicateFound || loading}
              loading={loading}
            >
              Submit Claim for Community Verification
            </Button>
          </form>
        )}

        {/* Image / OCR Tab */}
        {activeTab === 'image' && (
          <div className="space-y-6">
            <div
              className={cn(
                'border-2 border-dashed rounded-[var(--radius-xl)] p-8 lg:p-12 text-center transition-all',
                dragActive
                  ? 'border-[var(--color-brand)] bg-[var(--color-brand-subtle)]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-brand)] bg-[var(--color-surface-2)]/30'
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="w-14 h-14 rounded-full bg-[var(--color-brand-subtle)] flex items-center justify-center mx-auto mb-4">
                <Upload className="w-7 h-7 text-[var(--color-brand)]" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-[var(--color-fg)]">
                Drag &amp; drop a WhatsApp screenshot here
              </h3>
              <p className="text-xs text-[var(--color-fg-muted)] mt-1.5 max-w-sm mx-auto leading-relaxed">
                Our AI OCR will automatically extract text from your chat screenshot, newspaper clipping, or image forward.
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold whitespace-nowrap select-none px-5 py-2.5 text-xs bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] shadow-[var(--shadow-sm)] transition-all cursor-pointer mt-5"
              >
                Browse Files
              </label>
            </div>

            {uploadedImage && (
              <div className="relative rounded-[var(--radius-xl)] overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
                <img
                  src={uploadedImage}
                  alt="Uploaded screenshot"
                  className="w-full max-h-80 object-contain rounded-lg"
                />
                {extracting && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg)]/85 backdrop-blur-xs rounded-[var(--radius-xl)] p-6">
                    <div className="text-center max-w-xs">
                      <Loader2 className="w-9 h-9 animate-spin mx-auto mb-3 text-[var(--color-brand)]" />
                      <p className="text-sm font-bold text-[var(--color-fg)] mb-1">Extracting text with AI OCR...</p>
                      <div className="w-full h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden mb-4">
                        <div
                          className="h-full bg-[var(--color-brand)] transition-all duration-300 ease-out"
                          style={{ width: `${ocrProgress}%` }}
                        />
                      </div>
                      <Button
                        intent="ghost"
                        size="sm"
                        onClick={() => {
                          setUploadedImage(null)
                          setExtracting(false)
                          setClaimText('')
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 me-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {uploadedImage && !extracting && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-v-true-bg)] border border-[var(--color-v-true-border)] flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[var(--color-v-true)] flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-[var(--color-v-true)]">OCR Text Extracted Successfully:</span>
                    <p className="text-[var(--color-fg-2)] mt-1 italic leading-relaxed">&ldquo;{claimText}&rdquo;</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Button
                    intent="primary"
                    size="lg"
                    className="flex-1 font-bold"
                    onClick={() => {
                      checkDuplicate()
                      setActiveTab('text')
                    }}
                  >
                    Continue with Extracted Text
                  </Button>
                  <Button
                    intent="secondary"
                    size="lg"
                    onClick={() => {
                      setUploadedImage(null)
                      setClaimText('')
                      setDragActive(false)
                      toast('Image removed', {
                        description: 'You can upload a different screenshot.',
                      })
                    }}
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

      {/* Success Modal */}
      <Modal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        size="sm"
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 rounded-full bg-[var(--color-v-true-bg)] border border-[var(--color-v-true-border)] flex items-center justify-center mb-4 animate-pop-in">
            <CheckCircle2 className="w-9 h-9 text-[var(--color-v-true)]" aria-hidden="true" />
          </div>

          <h3 className="text-xl font-extrabold text-[var(--color-fg)] mb-1">
            Claim Submitted Successfully!
          </h3>
          <p className="text-xs text-[var(--color-fg-2)] mb-5 max-w-xs leading-relaxed">
            Your claim is now in the community queue. Verifiers will evaluate sources and assign a verdict stamp.
          </p>

          <div className="w-full bg-[var(--color-surface-2)] rounded-xl p-4 mb-6 text-left border border-[var(--color-border-soft)]">
            <div className="flex items-center gap-2 mb-2">
              <CategoryBadge category={category} />
              <span className="text-[10px] font-mono text-[var(--color-brand)] font-bold">Status: Pending Verification</span>
            </div>
            <p className="text-xs text-[var(--color-fg)] leading-relaxed italic line-clamp-3">
              &quot;{claimText}&quot;
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full">
            <Button
              intent="primary"
              className="flex-1 font-bold"
              onClick={() => {
                setShowSuccessModal(false)
                if (submittedClaimId) navigate(`/claim/${submittedClaimId}`)
              }}
            >
              <ExternalLink className="w-4 h-4 me-1" aria-hidden="true" />
              View Claim Card
            </Button>
            <Button
              intent="secondary"
              className="flex-1 font-semibold"
              onClick={() => {
                setShowSuccessModal(false)
                resetForm()
              }}
            >
              <RotateCcw className="w-4 h-4 me-1" aria-hidden="true" />
              Submit Another
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
