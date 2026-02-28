import { ref, readonly } from 'vue'
import type { Model, KaldiRecognizer } from 'vosk-browser'

import type { ServerMessageResult, ServerMessagePartialResult, RecognizerMessage } from 'vosk-browser/dist/interfaces'

export interface VoskWord {
  word: string
  conf: number
  start: number
  end: number
}

export interface VoskResult {
  text: string
  words: VoskWord[]
}

const MODEL_CACHE_NAME = 'vosk-models'

const isModelLoaded = ref(false)
const isModelLoading = ref(false)
const modelLoadProgress = ref(0)
const modelError = ref<string | null>(null)

let modelInstance: Model | null = null

function getModelUrl (): string {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base}vosk-model-small-fr.tar.gz`
}

async function getCachedModelUrl (): Promise<string | null> {
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

async function cacheModelBlob (url: string, blob: Blob): Promise<void> {
  try {
    const cache = await caches.open(MODEL_CACHE_NAME)
    await cache.put(url, new Response(blob.slice(0)))
  } catch {
    // Non-critical — model will just re-download next time
  }
}

async function fetchModelWithProgress (url: string): Promise<string> {
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
      modelLoadProgress.value = Math.round((received / total) * 100)
    }
  }

  const blob = new Blob(chunks, { type: 'application/gzip' })

  // Cache the blob for next visits
  await cacheModelBlob(url, blob)

  return URL.createObjectURL(blob)
}

export async function initModel (): Promise<Model> {
  if (modelInstance && isModelLoaded.value) return modelInstance

  if (isModelLoading.value) {
    // Wait for in-flight load
    return new Promise((resolve, reject) => {
      const check = setInterval(() => {
        if (isModelLoaded.value && modelInstance) {
          clearInterval(check)
          resolve(modelInstance)
        }
        if (modelError.value) {
          clearInterval(check)
          reject(new Error(modelError.value))
        }
      }, 200)
    })
  }

  isModelLoading.value = true
  modelLoadProgress.value = 0
  modelError.value = null

  try {
    const Vosk = await import('vosk-browser')

    // Try cached model first
    let blobUrl = await getCachedModelUrl()

    if (!blobUrl) {
      const url = getModelUrl()
      blobUrl = await fetchModelWithProgress(url)
    } else {
      modelLoadProgress.value = 100
    }

    modelInstance = await Vosk.createModel(blobUrl)
    modelInstance.setLogLevel(-1) // Suppress verbose logs

    isModelLoaded.value = true
    modelLoadProgress.value = 100
    return modelInstance
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load Vosk model'
    modelError.value = msg
    throw new Error(msg)
  } finally {
    isModelLoading.value = false
  }
}

export function createRecognizerSession (
  model: Model,
  stream: MediaStream,
): { promise: Promise<VoskResult>; stop: () => void } {
  const audioContext = new AudioContext({ sampleRate: 16000 })
  const source = audioContext.createMediaStreamSource(stream)

  const recognizer: KaldiRecognizer = new model.KaldiRecognizer(audioContext.sampleRate)
  recognizer.setWords(true)

  // ScriptProcessorNode is deprecated but vosk-browser requires AudioBuffer input
  const processor = audioContext.createScriptProcessor(4096, 1, 1)

  let finalResult: VoskResult | null = null
  let partialText = ''
  let stopped = false

  let stopCallback: (() => void) | null = null

  const promise = new Promise<VoskResult>((resolve) => {
    recognizer.on('result', (message: RecognizerMessage) => {
      const msg = message as ServerMessageResult
      if (msg.result.text) {
        finalResult = {
          text: msg.result.text,
          words: (msg.result.result ?? []) as VoskWord[],
        }
      }
    })

    recognizer.on('partialresult', (message: RecognizerMessage) => {
      const msg = message as ServerMessagePartialResult
      partialText = msg.result.partial
    })

    processor.onaudioprocess = (event: AudioProcessingEvent) => {
      if (!stopped) {
        try {
          recognizer.acceptWaveform(event.inputBuffer)
        } catch {
          // Recognizer may be removed already
        }
      }
    }

    source.connect(processor)
    processor.connect(audioContext.destination)

    function waitForFinal () {
      // Give Vosk time to flush final result
      setTimeout(() => {
        try {
          recognizer.retrieveFinalResult()
        } catch {
          // Ignore
        }

        // Wait a bit for the final result event
        setTimeout(() => {
          const result = finalResult ?? { text: partialText, words: [] }
          cleanup()
          resolve(result)
        }, 300)
      }, 200)
    }

    // Keep reference to cleanup/resolve for stop()
    stopCallback = waitForFinal
  })

  function cleanup () {
    try {
      source.disconnect()
      processor.disconnect()
      recognizer.remove()
      audioContext.close()
    } catch {
      // Cleanup errors are non-critical
    }
  }

  function stop () {
    if (stopped) return
    stopped = true
    if (stopCallback) stopCallback()
  }

  return { promise, stop }
}

export function useVoskEngine () {
  return {
    isModelLoaded: readonly(isModelLoaded),
    isModelLoading: readonly(isModelLoading),
    modelLoadProgress: readonly(modelLoadProgress),
    modelError: readonly(modelError),
    initModel,
    createRecognizerSession,
  }
}
