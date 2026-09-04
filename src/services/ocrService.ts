import { createWorker } from 'tesseract.js'
import type { ClaimCategory } from '@/lib/types'

export interface OcrProgressCallback {
  (progress: number, status: string): void
}

export type OcrEngine = 'tesseract'

export interface OcrResult {
  rawText: string
  cleanedText: string
  confidence: number
  engine: OcrEngine
  detectedCategory: ClaimCategory
  wordCount: number
  lineCount: number
}

export interface OcrOptions {
  preferLocal?: boolean
}

/**
 * Remove WhatsApp chat chrome, phone status bar artifacts, timestamps,
 * and delivery checkmarks to isolate the core forwarded text.
 */
export function cleanExtractedOcrText(raw: string): string {
  if (!raw) return ''

  const lines = raw.split(/\r?\n/)
  const cleanedLines: string[] = []

  const ignorePatterns = [
    /^\s*([↪\->*#]+\s*)?forwarded\s*(many\s*times)?\s*$/i,
    /^\s*(today|yesterday|\d{1,2}\/\d{1,2}\/\d{2,4})\s*$/i,
    /^\s*\[?\d{1,2}[:. ]?\d{2}\s*(am|pm|mm|fm|a|p|ame)?\]?\s*([✓✔]+)?\s*$/i,
    /^\s*(lte|4g|5g|volte|vo-wifi|wifi|jio|airtel|vi|bsnl|vodafone)\s*$/i,
    /^\s*\d{1,3}%\s*$/,
    /^\s*(type a message|message|unread messages?)\s*$/i,
    /^\s*[✓✔•·\-_=~+]{1,5}\s*$/,
    /^\s*(status|chats|calls|updates|communities)\s*$/i,
  ]

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (ignorePatterns.some((pattern) => pattern.test(trimmed))) continue
    cleanedLines.push(trimmed)
  }

  // Assemble into coherent text
  let text = cleanedLines.join('\n')

  // Strip trailing time like '10:45 AM', '0845 Mm', or checkmarks from end of text
  text = text.replace(/[\s\n]+\[?\d{1,2}[:. ]?\d{2}\s*(am|pm|mm|fm|a|p|ame)?\]?\s*([✓✔]+)?\s*$/i, '')
  text = text.replace(/[\s\n]+[✓✔]+\s*$/, '')

  // Format paragraphs by combining lines that don't end in punctuation
  const rawParagraphs = text.split('\n')
  const paragraphs: string[] = []
  let currentParagraph = ''

  for (const line of rawParagraphs) {
    const trimmed = line.trim()
    if (!trimmed) {
      if (currentParagraph) {
        paragraphs.push(currentParagraph)
        currentParagraph = ''
      }
      continue
    }

    if (!currentParagraph) {
      currentParagraph = trimmed
    } else {
      currentParagraph += ' ' + trimmed
    }
  }

  if (currentParagraph) {
    paragraphs.push(currentParagraph)
  }

  const result = paragraphs.join('\n\n').trim()
  return result || raw.trim()
}

/**
 * Intelligent topic classification based on keywords in Indian WhatsApp forwards.
 */
export function detectClaimCategory(text: string): ClaimCategory {
  const t = text.toLowerCase()

  if (
    /\b(covid|corona|doctor|hospital|medicine|ayurveda|cure|treatment|vaccine|disease|kadha|health|remedy|remedies|cancer|heart attack|immunity|ginger|tulsi|virus|fever|infection)\b/i.test(
      t
    )
  ) {
    return 'health'
  }

  if (
    /\b(rbi|bank|loan|upi|paytm|rupees|rs|cash|subsidy|scheme|free money|account|atm|tax|financial|invest|fund|rupee|₹|bonus|modi yojana|lottery|pension)\b/i.test(
      t
    )
  ) {
    return 'financial'
  }

  if (
    /\b(court|judge|supreme court|police|government|govt|election|vote|voter|modi|minister|parliament|bill|act|order|law|protest|arrest|bjp|congress|aap|official notice|curfew|section 144)\b/i.test(
      t
    )
  ) {
    return 'political'
  }

  if (
    /\b(temple|mandir|masjid|church|puja|namaz|festival|ramadan|diwali|eid|christmas|hindu|muslim|christian|holy|god|religion|shrine|prophet|ram|krishna|allah)\b/i.test(
      t
    )
  ) {
    return 'religious'
  }

  return 'other'
}

/**
 * Built-in Client-Side AI OCR using WebAssembly (Tesseract.js).
 * Runs 100% locally in the browser with ZERO external API setup required.
 */
async function extractWithTesseract(
  imageSource: string | File | Blob,
  onProgress?: OcrProgressCallback
): Promise<OcrResult> {
  onProgress?.(10, 'Initializing AI OCR engine...')

  let worker: Awaited<ReturnType<typeof createWorker>> | null = null

  try {
    // Attempt local bundled assets first for 100% offline & fast execution
    try {
      worker = await createWorker('eng', 1, {
        workerPath: '/tesseract/worker.min.js',
        corePath: '/tesseract',
        langPath: '/tesseract',
        gzip: true,
        logger: (m) => {
          if (m.status === 'loading tesseract core') {
            onProgress?.(25, 'Loading WebAssembly OCR core...')
          } else if (m.status === 'initializing tesseract') {
            onProgress?.(40, 'Initializing OCR neural model...')
          } else if (m.status === 'loading language traineddata') {
            onProgress?.(55, 'Loading language dictionaries...')
          } else if (m.status === 'recognizing text') {
            const pct = Math.min(95, Math.max(60, Math.round(m.progress * 100)))
            onProgress?.(pct, `Scanning image text (${Math.round(m.progress * 100)}%)...`)
          }
        },
      })
    } catch (localErr) {
      console.warn('Local Tesseract assets failed to load, falling back to CDN worker:', localErr)
      onProgress?.(20, 'Loading OCR engine...')
      worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const pct = Math.min(95, Math.max(60, Math.round(m.progress * 100)))
            onProgress?.(pct, `Scanning image text (${Math.round(m.progress * 100)}%)...`)
          } else {
            onProgress?.(35, `Setting up OCR engine: ${m.status}...`)
          }
        },
      })
    }

    onProgress?.(70, 'Analyzing screenshot content...')
    const result = await worker.recognize(imageSource)
    const rawText = result.data.text || ''
    const confidence = Math.round(result.data.confidence || 0)

    onProgress?.(92, 'Cleaning up WhatsApp forward artifacts...')
    const cleanedText = cleanExtractedOcrText(rawText)

    if (!cleanedText && !rawText.trim()) {
      throw new Error(
        'No readable text found in this screenshot. Please ensure the image is clear and well-lit, or type the claim manually.'
      )
    }

    const detectedCategory = detectClaimCategory(cleanedText)
    const wordCount = cleanedText.split(/\s+/).filter(Boolean).length
    const lineCount = cleanedText.split('\n').filter(Boolean).length

    onProgress?.(100, 'OCR text extraction complete!')

    return {
      rawText,
      cleanedText,
      confidence,
      engine: 'tesseract',
      detectedCategory,
      wordCount,
      lineCount,
    }
  } finally {
    if (worker) {
      try {
        await worker.terminate()
      } catch {
        // Ignored
      }
    }
  }
}

/**
 * Main OCR Extraction function.
 * Runs 100% client-side in the browser using WebAssembly (Tesseract.js).
 * Zero external API setup required.
 */
export async function extractTextFromImage(
  imageSource: string | File | Blob,
  _options: OcrOptions = {},
  onProgress?: OcrProgressCallback
): Promise<OcrResult> {
  return await extractWithTesseract(imageSource, onProgress)
}

