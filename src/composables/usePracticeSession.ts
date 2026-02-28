import { ref, provide, inject, type Ref, type InjectionKey, type DeepReadonly } from 'vue'
import { useRecording } from './useRecording'
import { useAudio } from './useAudio'
import { useAchievements } from './useAchievements'
import { useAuth } from './useAuth'
import { useStudentRecordings } from './useStudentRecordings'
import { useProgress } from './useProgress'
import { useVoskEngine } from './useVoskEngine'
import { analyzePronunciation, type PronunciationAnalysis } from '@/utils/pronunciation'
import type { PracticeItem, ItemType } from '@/data/types'
import { SCORE_THRESHOLDS } from '@/utils/helpers'
import { showToast } from 'vant'

export type { PronunciationAnalysis } from '@/utils/pronunciation'
export type { WordResult } from '@/utils/pronunciation'

// ── Context shared via provide/inject ────────────────────────────

export interface PracticeContext {
  activeItem: Ref<PracticeItem | null>
  show: Ref<boolean>
  analysis: Ref<PronunciationAnalysis | null>
  isRecording: DeepReadonly<Ref<boolean>>
  isProcessing: DeepReadonly<Ref<boolean>>
  transcript: DeepReadonly<Ref<string>>
  isSupported: DeepReadonly<Ref<boolean>>
  recordedBlob: DeepReadonly<Ref<Blob | null>>
  mediaStream: DeepReadonly<Ref<MediaStream | null>>
  analyserNode: DeepReadonly<Ref<AnalyserNode | null>>
  isPlaying: DeepReadonly<Ref<boolean>>
  isSpeaking: DeepReadonly<Ref<boolean>>
  isModelLoading: DeepReadonly<Ref<boolean>>
  modelLoadProgress: DeepReadonly<Ref<number>>
  listen: () => void
  record: () => void
  playRecording: () => void
  stopPlayback: () => void
  close: () => void
}

const PRACTICE_KEY: InjectionKey<PracticeContext> = Symbol('practice')

/** Inject practice context inside PracticePopup or child components */
export function usePractice (): PracticeContext {
  const ctx = inject(PRACTICE_KEY)
  if (!ctx) throw new Error('usePractice() requires usePracticeSession() in a parent component')
  return ctx
}

// ── Composable for pages ─────────────────────────────────────────

interface PracticeSessionOptions {
  itemType: ItemType
  markCompleted: (id: string) => void
  speakRate?: number
}

export function usePracticeSession<T extends PracticeItem = PracticeItem> (options: PracticeSessionOptions) {
  const {
    isRecording, isProcessing, transcript, error: recordingError,
    isSupported, recordedBlob, mediaStream, analyserNode, startRecording, stopRecording,
    preloadModel,
  } = useRecording()
  const { speak, playBlob, isPlaying, isSpeaking, stopPlayback } = useAudio()
  const { checkAchievements, getAchievementById } = useAchievements()
  const { currentUser } = useAuth()
  const { saveRecording } = useStudentRecordings()
  const { recordAttempt } = useProgress()
  const { isModelLoading, modelLoadProgress } = useVoskEngine()

  const activeItem = ref<PracticeItem | null>(null)
  const show = ref(false)
  const analysis = ref<PronunciationAnalysis | null>(null)

  function selectItem (item: PracticeItem) {
    activeItem.value = item
    show.value = true
    analysis.value = null
    preloadModel()
  }

  function close () {
    show.value = false
    activeItem.value = null
    analysis.value = null
    stopPlayback()
  }

  async function listenTo (text: string, rate?: number) {
    try {
      await speak(text, rate ?? options.speakRate ?? 0.85)
    } catch {
      showToast({ message: 'Audio playback failed', type: 'fail' })
    }
  }

  async function record () {
    if (isRecording.value || isProcessing.value) { stopRecording(); return }

    try {
      const result = await startRecording()
      if (!activeItem.value) return

      if (!result.transcript) {
        showToast({ message: 'No speech detected. Please try again.', type: 'fail' })
        return
      }

      const a = analyzePronunciation(
        activeItem.value.text, result.transcript, result.words, result.pitchContour,
      )
      analysis.value = a
      recordAttempt(activeItem.value.id, a.overallScore)

      if (a.overallScore >= SCORE_THRESHOLDS.good) options.markCompleted(activeItem.value.id)

      if (currentUser.value?.role === 'student' && result.blob) {
        saveRecording({
          studentId: currentUser.value.id, studentName: currentUser.value.name,
          itemId: activeItem.value.id, itemText: activeItem.value.text,
          itemType: options.itemType, difficulty: activeItem.value.difficulty,
          transcript: result.transcript, score: a.overallScore, blob: result.blob,
        })
      }

      for (const id of checkAchievements()) {
        const ach = getAchievementById(id)
        if (ach) showToast({ message: `${ach.icon} ${ach.title}`, type: 'success', duration: 3000 })
      }
    } catch {
      if (recordingError.value) showToast({ message: recordingError.value, type: 'fail' })
    }
  }

  const playRecording = () => { if (recordedBlob.value) playBlob(recordedBlob.value) }
  const listen = () => { if (activeItem.value) listenTo(activeItem.value.text) }

  // Provide context so PracticePopup can inject it (no prop drilling)
  provide(PRACTICE_KEY, {
    activeItem, show, analysis,
    isRecording, isProcessing, transcript, isSupported,
    recordedBlob, mediaStream, analyserNode,
    isPlaying, isSpeaking,
    isModelLoading, modelLoadProgress,
    listen, record, playRecording, stopPlayback, close,
  })

  // Return only what pages need for their own templates
  return {
    activeItem: activeItem as Ref<T | null>,
    isSupported,
    selectItem: selectItem as (item: T) => void,
    listenTo,
  }
}
