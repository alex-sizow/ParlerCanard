import { ref, readonly } from 'vue'
import { delay } from '@/utils/helpers'

/**
 * Cached voices list — populated once the browser finishes loading voices.
 * Chrome loads voices asynchronously, so getVoices() returns [] on first call.
 */
let cachedVoices: SpeechSynthesisVoice[] = []
let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null
let warmupDone = false

function loadVoices (): Promise<SpeechSynthesisVoice[]> {
  if (voicesReady) return voicesReady

  voicesReady = new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([])
      return
    }

    const synth = window.speechSynthesis
    const voices = synth.getVoices()

    if (voices.length > 0) {
      cachedVoices = voices
      resolve(voices)
      return
    }

    // Chrome fires this event when voices are actually available
    const onVoicesChanged = () => {
      cachedVoices = synth.getVoices()
      resolve(cachedVoices)
    }
    synth.addEventListener('voiceschanged', onVoicesChanged, { once: true })

    // Safety timeout — resolve with whatever we have after 3 s
    setTimeout(() => {
      synth.removeEventListener('voiceschanged', onVoicesChanged)
      cachedVoices = synth.getVoices()
      resolve(cachedVoices)
    }, 3000)
  })

  return voicesReady
}

// Start loading voices immediately on module import
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices()
}

function pickFrenchVoice (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return (
    voices.find(v => v.lang.startsWith('fr') && v.name.toLowerCase().includes('google')) ??
    voices.find(v => v.lang.startsWith('fr') && !v.localService) ??
    voices.find(v => v.lang.startsWith('fr'))
  )
}

/**
 * Chrome requires a user-gesture-triggered speech call to "unlock" the synth.
 * We do a silent warmup on the first real speak() call.
 */
function warmup () {
  if (warmupDone) return
  warmupDone = true
  const u = new SpeechSynthesisUtterance('')
  u.volume = 0
  u.lang = 'fr-FR'
  window.speechSynthesis.speak(u)
}

export function useAudio () {
  const isSpeaking = ref(false)
  const isPlaying = ref(false)

  let currentUtterance: SpeechSynthesisUtterance | null = null
  let currentAudioEl: HTMLAudioElement | null = null
  let resumeTimer: ReturnType<typeof setInterval> | null = null

  /**
   * Chrome pauses long utterances after ~15 s of speech.
   * Periodically calling resume() keeps the audio alive.
   */
  function startResumeWorkaround () {
    stopResumeWorkaround()
    resumeTimer = setInterval(() => {
      const synth = window.speechSynthesis
      if (synth.speaking && !synth.paused) {
        synth.pause()
        synth.resume()
      }
    }, 5_000)
  }

  function stopResumeWorkaround () {
    if (resumeTimer !== null) {
      clearInterval(resumeTimer)
      resumeTimer = null
    }
  }

  /**
   * Speak text using the Web Speech Synthesis API with a French voice.
   *
   * Chrome workarounds applied:
   * 1. Voices loaded via voiceschanged event (async).
   * 2. Silent warmup utterance to unlock audio on first user gesture.
   * 3. Delay after cancel() — Chrome drops speak() called right after cancel().
   * 4. Periodic pause/resume to prevent Chrome killing long utterances.
   * 5. Timeout safety net — if onstart never fires within 3 s, retry once.
   */
  async function speak (text: string, rate = 0.85): Promise<void> {
    if (!('speechSynthesis' in window)) {
      throw new Error('Speech synthesis not supported')
    }

    const synth = window.speechSynthesis

    // Cancel any ongoing speech
    synth.cancel()
    stopResumeWorkaround()

    // Give Chrome time to actually cancel (critical!)
    await delay(100)

    // Warmup on first call (needs user gesture context)
    warmup()
    await delay(50)

    // Ensure voices are loaded
    const voices = cachedVoices.length > 0 ? cachedVoices : await loadVoices()

    // Retry wrapper — Chrome sometimes silently drops the first utterance
    const attemptSpeak = (attempt: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Make sure synth is in clean state
        synth.cancel()

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'fr-FR'
        utterance.rate = rate
        utterance.pitch = 1
        utterance.volume = 1

        const frenchVoice = pickFrenchVoice(voices)
        if (frenchVoice) {
          utterance.voice = frenchVoice
        }

        let started = false
        let finished = false

        const cleanup = () => {
          finished = true
          isSpeaking.value = false
          currentUtterance = null
          stopResumeWorkaround()
          clearTimeout(startTimeout)
        }

        utterance.onstart = () => {
          started = true
          isSpeaking.value = true
          startResumeWorkaround()
        }

        utterance.onend = () => {
          if (finished) return
          cleanup()
          resolve()
        }

        utterance.onerror = (event) => {
          if (finished) return
          // "interrupted" / "canceled" fire when we call cancel() — ignore
          if (event.error === 'interrupted' || event.error === 'canceled') {
            if (!started) return // will be retried or timed out
            cleanup()
            resolve()
            return
          }
          cleanup()
          reject(new Error(`Speech error: ${event.error}`))
        }

        currentUtterance = utterance

        // Safety: if onstart doesn't fire within 3 s, retry once
        const startTimeout = setTimeout(() => {
          if (!started && !finished) {
            synth.cancel()
            finished = true
            isSpeaking.value = false
            currentUtterance = null

            if (attempt < 1) {
              // Retry once after a longer pause
              delay(250).then(() => attemptSpeak(attempt + 1).then(resolve, reject))
            } else {
              // Give up — resolve silently to not break UI
              resolve()
            }
          }
        }, 3000)

        // Speak! (tiny delay to let cancel() settle)
        setTimeout(() => {
          if (!finished) {
            synth.speak(utterance)
          }
        }, 50)
      })
    }

    return attemptSpeak(0)
  }

  /**
   * Play an audio blob (e.g., recorded audio).
   */
  function playBlob (blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      stopPlayback()

      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      currentAudioEl = audio

      audio.onplay = () => {
        isPlaying.value = true
      }

      audio.onended = () => {
        isPlaying.value = false
        URL.revokeObjectURL(url)
        currentAudioEl = null
        resolve()
      }

      audio.onerror = () => {
        isPlaying.value = false
        URL.revokeObjectURL(url)
        currentAudioEl = null
        reject(new Error('Audio playback failed'))
      }

      audio.play().catch(reject)
    })
  }

  /**
   * Stop any ongoing speech or audio playback.
   */
  function stopPlayback () {
    if (currentUtterance) {
      window.speechSynthesis.cancel()
      isSpeaking.value = false
      currentUtterance = null
      stopResumeWorkaround()
    }
    if (currentAudioEl) {
      currentAudioEl.pause()
      currentAudioEl.currentTime = 0
      isPlaying.value = false
      currentAudioEl = null
    }
  }

  return {
    isSpeaking: readonly(isSpeaking),
    isPlaying: readonly(isPlaying),
    speak,
    playBlob,
    stopPlayback,
  }
}
