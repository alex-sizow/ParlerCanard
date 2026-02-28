import { ref, type Ref } from 'vue'
import { useRecording } from './useRecording'
import { useAudio } from './useAudio'
import { useAchievements } from './useAchievements'
import { useAuth } from './useAuth'
import { useStudentRecordings } from './useStudentRecordings'
import { useProgress } from './useProgress'
import { useVoskEngine } from './useVoskEngine'
import { analyzePronunciation, type WordResult } from './usePronunciation'
import type { PracticeItem, ItemType } from '@/data/types'
import { SCORE_THRESHOLDS } from '@/data/constants'
import { showToast } from 'vant'

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
  const { isModelLoaded, isModelLoading, modelLoadProgress } = useVoskEngine()

  const activeItem = ref<T | null>(null) as Ref<T | null>
  const showPractice = ref(false)
  const score = ref<number | null>(null)
  const wordResults = ref<WordResult[]>([])
  const accuracyScore = ref<number | null>(null)
  const confidenceScore = ref<number | null>(null)
  const intonationScore = ref<number | null>(null)
  const fluencyScore = ref<number | null>(null)

  function selectItem (item: T) {
    activeItem.value = item; showPractice.value = true
    score.value = null; wordResults.value = []
    accuracyScore.value = null; confidenceScore.value = null
    intonationScore.value = null; fluencyScore.value = null
    // Pre-load Vosk model in background so it's ready when user hits Record
    preloadModel()
  }

  function closePractice () {
    showPractice.value = false; activeItem.value = null
    score.value = null; wordResults.value = []
    accuracyScore.value = null; confidenceScore.value = null
    intonationScore.value = null; fluencyScore.value = null
    stopPlayback()
  }

  async function listenTo (text: string, rate?: number) {
    try {
      await speak(text, rate ?? options.speakRate ?? 0.85)
    } catch {
      showToast({ message: 'Audio playback failed', type: 'fail' })
    }
  }

  async function handleRecord () {
    if (isRecording.value || isProcessing.value) {
      stopRecording()
      return
    }

    try {
      const result = await startRecording()

      if (!activeItem.value) return

      // If transcript is empty, show a helpful message instead of silently doing nothing
      if (!result.transcript) {
        showToast({ message: 'No speech detected. Please try again.', type: 'fail' })
        return
      }

      const analysis = analyzePronunciation(
        activeItem.value.text,
        result.transcript,
        result.words,
        result.pitchContour,
      )
      score.value = analysis.overallScore
      wordResults.value = analysis.wordResults
      accuracyScore.value = analysis.accuracyScore
      confidenceScore.value = analysis.confidenceScore
      intonationScore.value = analysis.intonationScore
      fluencyScore.value = analysis.fluencyScore

      recordAttempt(activeItem.value.id, analysis.overallScore)

      if (analysis.overallScore >= SCORE_THRESHOLDS.good) {
        options.markCompleted(activeItem.value.id)
      }

      if (currentUser.value?.role === 'student' && result.blob) {
        saveRecording({
          studentId: currentUser.value.id, studentName: currentUser.value.name,
          itemId: activeItem.value.id, itemText: activeItem.value.text,
          itemType: options.itemType, difficulty: activeItem.value.difficulty,
          transcript: result.transcript, score: analysis.overallScore, blob: result.blob,
        })
      }

      for (const id of checkAchievements()) {
        const a = getAchievementById(id)
        if (a) showToast({ message: `${a.icon} ${a.title}`, type: 'success', duration: 3000 })
      }
    } catch {
      if (recordingError.value) {
        showToast({ message: recordingError.value, type: 'fail' })
      }
    }
  }

  const playRecording = () => { if (recordedBlob.value) playBlob(recordedBlob.value) }

  return {
    activeItem,
    showPractice,
    score,
    wordResults,
    accuracyScore,
    confidenceScore,
    intonationScore,
    fluencyScore,
    selectItem,
    closePractice,
    listenTo,
    handleRecord,
    playRecording,
    isRecording,
    isProcessing,
    transcript,
    isSupported,
    recordedBlob,
    mediaStream,
    analyserNode,
    isPlaying,
    isSpeaking,
    stopPlayback,
    isModelLoaded,
    isModelLoading,
    modelLoadProgress,
  }
}
