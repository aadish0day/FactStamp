import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertTriangle, Upload, Loader2, CheckCircle2, Trash2, ExternalLink, RotateCcw } from 'lucide-react'
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

    // Validation
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
    // Simulate submission delay
    await new Promise((r) => setTimeout(r, 1000))

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
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string)
      simulateExtraction()
    }
    reader.readAsDataURL(file)
  }

  const simulateExtraction = () => {
    setExtracting(true)
    setTimeout(() => {
      setClaimText('Government scholarship scheme offering ₹50,000 for students studying in government schools. Apply before deadline.')
      setExtracting(false)
    }, 2000)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Seo title="Submit a Claim" description="Paste a suspicious WhatsApp forward or upload a screenshot. We'll check if it's been verified before." />
      <Breadcrumbs currentLabel="Submit claim" className="px-0 pt-0 mb-4" />
      <h1 className="text-3xl font-bold text-[var(--color-fg)] mb-2">
        Submit a claim for verification
      </h1>
      <p className="text-[var(--color-fg-2)] mb-8">
        Paste the text forward or upload a screenshot. We'll check if it's been verified before.
      </p>

      {/* Tab Selector */}
      <div className="flex border-b border-[var(--color-border)] mb-6">
        <button
          className={cn(
            'flex-1 py-3 text-center font-medium transition-colors border-b-2',
            activeTab === 'text'
              ? 'border-[var(--color-brand)] text-[var(--color-brand)]'
              : 'border-transparent text-[var(--color-fg-2)] hover:text-[var(--color-fg)]'
          )}
          onClick={() => setActiveTab('text')}
        >
          Text forward
        </button>
        <button
          className={cn(
            'flex-1 py-3 text-center font-medium transition-colors border-b-2',
            activeTab === 'image'
              ? 'border-[var(--color-brand)] text-[var(--color-brand)]'
              : 'border-transparent text-[var(--color-fg-2)] hover:text-[var(--color-fg)]'
          )}
          onClick={() => setActiveTab('image')}
        >
          Screenshot
        </button>
      </div>

      {/* Text Tab */}
      {activeTab === 'text' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="claim-text" className="block text-sm font-medium mb-2">
              Claim text
            </label>
            <Textarea
              id="claim-text"
              placeholder="Paste the WhatsApp forward text here (use three dots for continuation)…"
              value={claimText}
              onChange={(e) => {
                setClaimText(e.target.value)
                if (errors.text) setErrors({})
              }}
              onBlur={checkDuplicate}
              error={!!errors.text}
              rows={6}
              aria-describedby="char-count"
            />
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex items-center gap-2">
                <span
                  id="char-count"
                  className={cn(
                    'text-xs font-mono tabular-nums',
                    claimText.length < 20
                      ? 'text-[var(--color-fg-muted)]'
                      : claimText.length > 500
                      ? 'text-[var(--color-v-false)]'
                      : 'text-[var(--color-fg-2)]'
                  )}
                >
                  {claimText.length} / 500
                </span>
                {claimText.length > 40 && (
                  <span className="text-xs text-[var(--color-accent)] font-medium flex items-center gap-1 animate-pop-in">
                    ✓ Looks like a WhatsApp forward
                  </span>
                )}
              </div>
              {errors.text && (
                <span className="text-xs text-[var(--color-v-false)]">
                  {errors.text}
                </span>
              )}
            </div>
          </div>

          {/* Duplicate Detection Alert */}
          {duplicateFound && (
            <div
              className="p-4 rounded-lg bg-[var(--color-v-mislead-bg)] border border-[var(--color-v-mislead-border)] animate-pop-in"
              role="alert"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[var(--color-v-mislead)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[var(--color-v-mislead)]">
                    Similar claim already verified
                  </p>
                  <p className="text-sm text-[var(--color-fg-2)] mt-1">
                    This claim matches an existing verification ({Math.round(duplicateFound.similarity * 100)}% similar). View the verdict instead of submitting a duplicate.
                  </p>
                  <div className="mt-2 text-sm text-[var(--color-fg-2)] italic line-clamp-2">
                    &quot;{duplicateFound.text}&quot;
                  </div>
                  <Button
                    intent="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => navigate(`/claim/${duplicateFound.id}`)}
                  >
                    View existing verdict
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Category Select */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ClaimCategory)}
              className="w-full min-h-[44px] px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-subtle)] focus:border-[var(--color-accent)]"
            >
              <option value="health">Health</option>
              <option value="political">Political</option>
              <option value="religious">Religious</option>
              <option value="financial">Financial</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            intent="primary"
            size="lg"
            className="w-full"
            disabled={claimText.trim().length < 20 || claimText.trim().length > 500 || !!duplicateFound || loading}
            loading={loading}
          >
            Submit claim for verification
          </Button>
        </form>
      )}

      {/* Image Tab */}
      {activeTab === 'image' && (
        <div className="space-y-6">
          <div
            className={cn(
              'border-2 border-dashed rounded-[var(--radius-lg)] p-12 text-center transition-colors',
              dragActive
                ? 'border-[var(--color-brand)] bg-[var(--color-brand-subtle)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-brand)]'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-[var(--color-fg-muted)]" aria-hidden="true" />
            <p className="text-sm font-medium text-[var(--color-fg)]">
              Drag and drop a screenshot here
            </p>
            <p className="text-xs text-[var(--color-fg-muted)] mt-1">
              or tap to browse files
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
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold whitespace-nowrap select-none px-4 py-2 text-sm h-10 min-h-[44px] md:min-h-0 bg-[var(--color-surface)] text-[var(--color-fg)] border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] hover:border-[var(--color-border)] shadow-[var(--shadow-xs)] transition-transform duration-150 ease-out active:scale-[0.96] cursor-pointer mt-4"
            >
              Choose file
            </label>
          </div>

          {uploadedImage && (
            <div className="relative">
              <img
                src={uploadedImage}
                alt="Uploaded screenshot"
                className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
              />
              {extracting && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg)]/80 rounded-[var(--radius-lg)]">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[var(--color-brand)]" />
                    <p className="text-sm text-[var(--color-fg)]">Extracting text from image (use three dots for continuation)…</p>
                    <Button
                      intent="ghost"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setUploadedImage(null)
                        setExtracting(false)
                        setClaimText('')
                      }}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {uploadedImage && !extracting && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                intent="primary"
                size="lg"
                className="flex-1"
                onClick={() => {
                  checkDuplicate()
                  setActiveTab('text')
                }}
              >
                Continue with extracted text
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
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                Remove image
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Success Modal */}
      <Modal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        size="sm"
      >
        <div className="flex flex-col items-center text-center py-4">
          {/* Animated checkmark */}
          <div className="w-16 h-16 rounded-full bg-[var(--color-v-true-bg)] flex items-center justify-center mb-5">
            <CheckCircle2 className="w-9 h-9 text-[var(--color-v-true)]" aria-hidden="true" />
          </div>

          <h3 className="text-xl font-bold text-[var(--color-fg)] mb-1">
            Claim submitted!
          </h3>
          <p className="text-sm text-[var(--color-fg-2)] mb-6 max-w-xs">
            Your claim is now in the verification queue. We'll notify you when it's been fact-checked by the community.
          </p>

          {/* Claim preview */}
          <div className="w-full bg-[var(--color-bg)] rounded-xl p-4 mb-6 text-left border border-[var(--color-border-soft)]">
            <div className="flex items-center gap-2 mb-2">
              <CategoryBadge category={category} />
            </div>
            <p className="text-sm text-[var(--color-fg)] leading-relaxed line-clamp-3">
              &quot;{claimText}&quot;
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              intent="primary"
              className="flex-1"
              onClick={() => {
                setShowSuccessModal(false)
                if (submittedClaimId) navigate(`/claim/${submittedClaimId}`)
              }}
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              View claim
            </Button>
            <Button
              intent="secondary"
              className="flex-1"
              onClick={() => {
                setShowSuccessModal(false)
                resetForm()
              }}
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Submit another
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
