import { ref, readonly, shallowRef } from 'vue'
import { initModel, createRecognizerSession, type VoskWord } from './useVoskEngine'
import { startPitchTracking, type PitchPoint } from './usePitchAnalysis'

export type { VoskWord, PitchPoint }

export interface RecordingResult {
  transcript: string
  confidence: number
  blob: Blob | null
  words: VoskWord[]
  pitchContour: PitchPoint[]
}

export function useRecording () {
  const isRecording = ref(false)
  const isProcessing = ref(false)
  const transcript = ref('')
  const confidence = ref(0)
  const error = ref<string | null>(null)
  const recordedBlob = shallowRef<Blob | null>(null)
  const mediaStream = shallowRef<MediaStream | null>(null)
  const analyserNode = shallowRef<AnalyserNode | null>(null)

  const hasMediaRecorder = typeof window !== 'undefined'
    && 'MediaRecorder' in window && 'mediaDevices' in navigator

  const isSupported = ref(hasMediaRecorder)

  let mediaRecorder: MediaRecorder | null = null
  let audioChunks: Blob[] = []
  let stopVosk: (() => void) | null = null
  let stopPitch: (() => PitchPoint[]) | null = null
  let audioContext: AudioContext | null = null

  // Fix race condition: if user clicks stop before resolveRecording is set,
  // we store the pending flag and trigger resolution as soon as it becomes available
  let resolveRecording: (() => void) | null = null
  let pendingStop = false

  async function acquireMicrophone (): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
    })
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

  /**
   * Pre-load the Vosk model in the background.
   * Call this early (e.g. when practice popup opens) so the model is ready
   * by the time the user hits Record.
   */
  function preloadModel () {
    initModel().catch(() => {
      // Non-critical — will retry when recording starts
    })
  }

  async function startRecording (): Promise<RecordingResult> {
    error.value = null
    transcript.value = ''
    confidence.value = 0
    recordedBlob.value = null
    pendingStop = false
    resolveRecording = null

    if (!isSupported.value) {
      error.value = 'Recording is not supported in this browser. Try Chrome, Edge, or Safari.'
      throw new Error(error.value)
    }

    // Load model FIRST (before isRecording = true) so user sees "Processing..."
    // not a stuck recording state
    isProcessing.value = true
    let model: Awaited<ReturnType<typeof initModel>> | null = null
    try {
      model = await initModel()
    } catch {
      // Will proceed without Vosk — empty transcript
    }
    isProcessing.value = false

    // If user clicked stop while we were loading the model, abort
    if (pendingStop) {
      pendingStop = false
      return { transcript: '', confidence: 0, blob: null, words: [], pitchContour: [] }
    }

    let stream: MediaStream
    try {
      stream = await acquireMicrophone()
    } catch (err) {
      isRecording.value = false
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        error.value = 'Microphone access denied. Please allow microphone permissions.'
      } else {
        error.value = 'Failed to access microphone. Please try again.'
      }
      throw new Error(error.value)
    }

    isRecording.value = true

    // Set up shared AudioContext + AnalyserNode for pitchy and AudioVisualizer
    audioContext = new AudioContext()
    const sourceNode = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 2048
    sourceNode.connect(analyser)
    analyserNode.value = analyser

    // Start pitch tracking
    const pitchTracker = startPitchTracking(analyser, audioContext.sampleRate)
    stopPitch = pitchTracker.stop

    // Start Vosk recognizer (model already loaded above)
    let voskPromise: Promise<{ text: string; words: VoskWord[] }>
    if (model) {
      const session = createRecognizerSession(model, stream)
      stopVosk = session.stop
      voskPromise = session.promise
    } else {
      voskPromise = Promise.resolve({ text: '', words: [] })
    }

    // Start MediaRecorder for blob capture
    const blobPromise = hasMediaRecorder
      ? startMediaRecorder(stream).catch(() => null as Blob | null)
      : Promise.resolve(null as Blob | null)

    return new Promise((resolve) => {
      const capturedStopVosk = stopVosk

      const doResolve = async () => {
        isProcessing.value = true

        // Stop pitch tracking
        const pitchContour = stopPitch ? stopPitch() : []
        stopPitch = null

        // Stop Vosk
        if (capturedStopVosk) capturedStopVosk()
        stopVosk = null

        // Stop MediaRecorder
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop()
        }

        // Await results with a safety timeout so the UI never gets stuck
        let voskResult: { text: string; words: VoskWord[] } = { text: '', words: [] }
        let blob: Blob | null = null

        try {
          const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Vosk timed out')), 5000),
          )
          const [v, b] = await Promise.race([
            Promise.all([voskPromise, blobPromise]),
            timeout.then(() => { throw new Error('timeout') }),
          ])
          voskResult = v
          blob = b
        } catch {
          // If Vosk times out or errors, still try to get the blob
          try { blob = await Promise.race([blobPromise, new Promise<null>(r => setTimeout(() => r(null), 1000))]) } catch { /* ignore */ }
        }

        transcript.value = voskResult.text
        const avgConf = voskResult.words.length > 0
          ? voskResult.words.reduce((sum, w) => sum + w.conf, 0) / voskResult.words.length
          : 0
        confidence.value = Math.round(avgConf * 100)
        recordedBlob.value = blob

        // Clean up AudioContext
        try {
          sourceNode.disconnect()
          if (audioContext) { await audioContext.close(); audioContext = null }
        } catch { /* cleanup errors non-critical */ }
        analyserNode.value = null

        isRecording.value = false
        isProcessing.value = false
        releaseMicrophone()

        resolve({
          transcript: voskResult.text,
          confidence: confidence.value,
          blob,
          words: voskResult.words,
          pitchContour,
        })
      }

      // Set the resolve callback — stopRecording() will call it
      resolveRecording = doResolve

      // If stopRecording() was called while we were still setting up, trigger now
      if (pendingStop) {
        pendingStop = false
        resolveRecording = null
        doResolve()
      }
    })
  }

  function stopRecording () {
    if (!isRecording.value && !isProcessing.value) return

    if (resolveRecording) {
      const fn = resolveRecording
      resolveRecording = null
      fn()
    } else {
      // resolveRecording not set yet — model still loading or setup in progress
      pendingStop = true
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
    analyserNode: readonly(analyserNode),
    startRecording,
    stopRecording,
    preloadModel,
  }
}
