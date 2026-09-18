/**
 * Client-side image compression for screenshot uploads.
 *
 * Screenshots are compressed to base64 data URLs. Cloud Storage requires the
 * paid Blaze plan, so the full image lives in its own `claim_media/{claimId}`
 * document, fetched only when a claim is opened, and the claim itself carries
 * just a small thumbnail for list views.
 *
 * Firestore documents are limited to ~1 MiB, so we downscale the image to a
 * sensible max dimension and step the JPEG quality down until the encoded
 * payload fits comfortably under the limit.
 */

const MAX_DIMENSION = 1280
const MAX_BYTES = 700_000 // ~0.7 MiB — leaves headroom inside the 1 MiB doc
const START_QUALITY = 0.72
const MIN_QUALITY = 0.4

/**
 * Compress an image File into a base64 JPEG data URL.
 *
 * Returns `null` when the file is not a decodable image (e.g. a corrupt or
 * unsupported file) so callers can fall back gracefully to text-only claims.
 */
export async function compressImageToDataUrl(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onerror = () => resolve(null)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => resolve(null)
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
        const width = Math.max(1, Math.round(img.width * scale))
        const height = Math.max(1, Math.round(img.height * scale))

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)

        // Step quality down until the data URL fits the size budget.
        let quality = START_QUALITY
        let dataUrl = canvas.toDataURL('image/jpeg', quality)
        while (estimateBytes(dataUrl) > MAX_BYTES && quality > MIN_QUALITY) {
          quality -= 0.08
          dataUrl = canvas.toDataURL('image/jpeg', quality)
        }

        resolve(dataUrl)
      }
      img.src = reader.result as string
    }

    reader.readAsDataURL(file)
  })
}

/** Rough byte estimate of a base64 data URL (base64 adds ~33% overhead). */
function estimateBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  if (comma === -1) return dataUrl.length
  // data:...;base64,XXXX — payload chars * 0.75 ≈ decoded bytes
  return Math.round((dataUrl.length - comma - 1) * 0.75)
}

const THUMB_DIMENSION = 160
const THUMB_QUALITY = 0.6

/**
 * Shrink an already-compressed data URL to a list-view thumbnail (~5-10 KB).
 *
 * The full screenshot is stored separately; this is what rides along on the
 * claim document, so it must stay small — every claim in a list carries one.
 */
export async function createThumbnailDataUrl(dataUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onerror = () => resolve(null)
    img.onload = () => {
      const scale = Math.min(1, THUMB_DIMENSION / Math.max(img.width, img.height))
      const width = Math.max(1, Math.round(img.width * scale))
      const height = Math.max(1, Math.round(img.height * scale))

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', THUMB_QUALITY))
    }
    img.src = dataUrl
  })
}
