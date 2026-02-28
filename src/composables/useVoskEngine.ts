import { ref, readonly } from 'vue'
import type { Model, KaldiRecognizer } from 'vosk-browser'
import { getModelUrl, getCachedModelUrl, fetchModelWithProgress } from '@/services/voskModelLoader'

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

const isModelLoaded = ref(false)
const isModelLoading = ref(false)
const modelLoadProgress = ref(0)
const modelError = ref<string | null>(null)

let modelInstance: Model | null = null

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
      blobUrl = await fetchModelWithProgress(url, (p) => { modelLoadProgress.value = p })
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

/**
 * Build synthetic VoskWord entries from plain text when Vosk only provides a
 * partial transcript without word-level data. Uses default confidence 0.5.
 */
function buildSyntheticWords (text: string): VoskWord[] {
  const tokens = text.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return []
  // Estimate 0.4s per word, evenly spaced
  return tokens.map((word, i) => ({
    word,
    conf: 0.5,
    start: i * 0.4,
    end: (i + 1) * 0.4,
  }))
}

export function createRecognizerSession (
  model: Model,
  stream: MediaStream,
  sharedAudioContext?: AudioContext,
): { promise: Promise<VoskResult>; stop: () => void } {
  // Use shared AudioContext when provided; create a dedicated 16kHz one otherwise
  const ownsContext = !sharedAudioContext
  const audioContext = sharedAudioContext ?? new AudioContext({ sampleRate: 16000 })
  const source = audioContext.createMediaStreamSource(stream)

  const targetSampleRate = 16000
  const recognizer: KaldiRecognizer = new model.KaldiRecognizer(targetSampleRate)
  recognizer.setWords(true)

  // ScriptProcessorNode is deprecated but vosk-browser requires AudioBuffer input
  const bufferSize = 4096
  const processor = audioContext.createScriptProcessor(bufferSize, 1, 1)

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
          const inputBuffer = event.inputBuffer
          // Downsample to 16kHz if the AudioContext runs at a different rate
          if (audioContext.sampleRate !== targetSampleRate) {
            const inputData = inputBuffer.getChannelData(0)
            const ratio = audioContext.sampleRate / targetSampleRate
            const outputLength = Math.floor(inputData.length / ratio)
            const outputData = new Float32Array(outputLength)
            for (let i = 0; i < outputLength; i++) {
              outputData[i] = inputData[Math.floor(i * ratio)]!
            }
            // Create a new AudioBuffer at target rate for Vosk
            const offlineCtx = new OfflineAudioContext(1, outputLength, targetSampleRate)
            const buffer = offlineCtx.createBuffer(1, outputLength, targetSampleRate)
            buffer.getChannelData(0).set(outputData)
            recognizer.acceptWaveform(buffer)
          } else {
            recognizer.acceptWaveform(inputBuffer)
          }
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

        // Wait for the final result event — longer timeout for slower devices
        const checkInterval = setInterval(() => {
          if (finalResult) {
            clearInterval(checkInterval)
            clearTimeout(safetyTimeout)
            cleanup()
            resolve(finalResult)
          }
        }, 100)

        // Safety timeout — if final result never arrives, use partial with synthetic words
        const safetyTimeout = setTimeout(() => {
          clearInterval(checkInterval)
          const text = finalResult?.text ?? partialText
          const words = finalResult?.words ?? buildSyntheticWords(text)
          cleanup()
          resolve({ text, words })
        }, 2000)
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
      // Only close the AudioContext if we created it ourselves
      if (ownsContext) audioContext.close()
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
