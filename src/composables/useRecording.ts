import { ref, readonly, shallowRef } from 'vue'

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent {
  error: string
  message: string
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

export function useRecording () {
  const isRecording = ref(false)
  const isProcessing = ref(false)
  const transcript = ref('')
  const confidence = ref(0)
  const error = ref<string | null>(null)
  const recordedBlob = shallowRef<Blob | null>(null)
  const mediaStream = shallowRef<MediaStream | null>(null)

  const hasSpeechRecognition = typeof window !== 'undefined'
    && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  const hasMediaRecorder = typeof window !== 'undefined'
    && 'MediaRecorder' in window && 'mediaDevices' in navigator

  const isSupported = ref(hasSpeechRecognition || hasMediaRecorder)

  let recognition: SpeechRecognitionInstance | null = null
  let mediaRecorder: MediaRecorder | null = null
  let audioChunks: Blob[] = []

  function createRecognition (): SpeechRecognitionInstance | null {
    if (!hasSpeechRecognition) return null
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const inst = new SR()
    Object.assign(inst, { lang: 'fr-FR', continuous: false, interimResults: false, maxAlternatives: 1 })
    return inst
  }

  async function acquireMicrophone (): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaStream.value = stream
    return stream
  }

  function releaseMicrophone () {
    if (mediaStream.value) {
      mediaStream.value.getTracks().forEach(t => t.stop())
      mediaStream.value = null
    }
  }

  function startMediaRecorder (stream: MediaStream): Promise<Blob> {
    return new Promise((resolve, reject) => {
      audioChunks = []
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType })
      } catch {
        mediaRecorder = new MediaRecorder(stream)
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: mediaRecorder?.mimeType ?? 'audio/webm' })
        resolve(blob)
      }

      mediaRecorder.onerror = () => {
        reject(new Error('MediaRecorder error'))
      }

      mediaRecorder.start()
    })
  }

  function startRecording (): Promise<{ transcript: string; confidence: number; blob: Blob | null }> {
    return new Promise((resolve, reject) => {
      error.value = null
      transcript.value = ''
      confidence.value = 0
      recordedBlob.value = null

      if (!isSupported.value) {
        error.value = 'Recording is not supported in this browser. Try Chrome, Edge, or Safari.'
        reject(new Error(error.value))
        return
      }

      let recognitionDone = !hasSpeechRecognition
      let recorderDone = !hasMediaRecorder
      let blobResult: Blob | null = null
      let recognitionError: Error | null = null

      function tryFinish () {
        if (!recognitionDone || !recorderDone) return

        isRecording.value = false
        isProcessing.value = false
        releaseMicrophone()

        if (recognitionError && !blobResult) {
          reject(recognitionError)
          return
        }

        recordedBlob.value = blobResult
        resolve({
          transcript: transcript.value,
          confidence: confidence.value,
          blob: blobResult,
        })
      }

      acquireMicrophone()
        .then((stream) => {
          isRecording.value = true
          isProcessing.value = false

          if (hasMediaRecorder) {
            startMediaRecorder(stream)
              .then((blob) => { blobResult = blob; recorderDone = true; tryFinish() })
              .catch(() => { recorderDone = true; tryFinish() })
          }

          if (hasSpeechRecognition) {
            recognition = createRecognition()
            if (!recognition) { recognitionDone = true; tryFinish(); return }

            recognition.onresult = (event: SpeechRecognitionEvent) => {
              const result = event.results[0]
              const alt = result?.[0]
              if (alt) {
                transcript.value = alt.transcript
                confidence.value = Math.round(alt.confidence * 100)
              }
            }

            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
              const msgs: Record<string, string> = {
                'no-speech': 'No speech detected. Please try again.',
                'not-allowed': 'Microphone access denied. Please allow microphone permissions.',
                'network': 'Network error. Please check your connection.',
              }
              if (event.error !== 'aborted') error.value = msgs[event.error] ?? `Recognition error: ${event.error}`
              recognitionError = new Error(error.value ?? event.error)
            }

            recognition.onend = () => {
              recognitionDone = true
              tryFinish()
            }

            try {
              recognition.start()
            } catch (err) {
              recognitionDone = true
              recognitionError = err as Error
              error.value = 'Failed to start speech recognition.'
              tryFinish()
            }
          }
        })
        .catch((err) => {
          isRecording.value = false
          isProcessing.value = false
          if (err instanceof DOMException && err.name === 'NotAllowedError') {
            error.value = 'Microphone access denied. Please allow microphone permissions.'
          } else {
            error.value = 'Failed to access microphone. Please try again.'
          }
          reject(new Error(error.value))
        })
    })
  }

  function stopRecording () {
    if (!isRecording.value) return

    isProcessing.value = true

    if (recognition) {
      recognition.stop()
    }

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
  }

  return {
    isRecording: readonly(isRecording),
    isProcessing: readonly(isProcessing),
    transcript: readonly(transcript),
    confidence: readonly(confidence),
    error: readonly(error),
    isSupported: readonly(isSupported),
    recordedBlob: readonly(recordedBlob),
    mediaStream: readonly(mediaStream),
    startRecording,
    stopRecording,
  }
}
