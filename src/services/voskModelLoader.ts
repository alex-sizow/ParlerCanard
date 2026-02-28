const MODEL_CACHE_NAME = 'vosk-models'

export function getModelUrl (): string {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base}vosk-model-small-fr.tar.gz`
}

export async function getCachedModelUrl (): Promise<string | null> {
  try {
    const cache = await caches.open(MODEL_CACHE_NAME)
    const url = getModelUrl()
    const cached = await cache.match(url)
    if (cached) {
      const blob = await cached.blob()
      return URL.createObjectURL(blob)
    }
  } catch {
    // Cache API unavailable or error — fall through
  }
  return null
}

export async function cacheModelBlob (url: string, blob: Blob): Promise<void> {
  try {
    const cache = await caches.open(MODEL_CACHE_NAME)
    await cache.put(url, new Response(blob.slice(0)))
  } catch {
    // Non-critical — model will just re-download next time
  }
}

export async function fetchModelWithProgress (
  url: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch model: ${response.status}`)

  const contentLength = response.headers.get('Content-Length')
  const total = contentLength ? parseInt(contentLength, 10) : 0

  if (!response.body || !total) {
    // Can't track progress — just return the URL and let vosk fetch it directly
    return url
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array<ArrayBuffer>[] = []
  let received = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      chunks.push(value as Uint8Array<ArrayBuffer>)
      received += value.length
      onProgress?.(Math.round((received / total) * 100))
    }
  }

  const blob = new Blob(chunks, { type: 'application/gzip' })

  // Cache the blob for next visits
  await cacheModelBlob(url, blob)

  return URL.createObjectURL(blob)
}
