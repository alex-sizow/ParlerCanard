import { ref, type Ref } from 'vue'
import { useRecording } from './useRecording'
import { useAudio } from './useAudio'
import { useAchievements } from './useAchievements'
import { useAuth } from './useAuth'
import { useStudentRecordings } from './useStudentRecordings'
import { useProgress } from './useProgress'
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
    isSupported, recordedBlob, mediaStream, startRecording, stopRecording,
  } = useRecording()
  const { speak, playBlob, isPlaying, isSpeaking, stopPlayback } = useAudio()
  const { checkAchievements, getAchievementById } = useAchievements()
  const { currentUser } = useAuth()
  const { saveRecording } = useStudentRecordings()
  const { recordAttempt } = useProgress()

  const activeItem = ref<T | null>(null) as Ref<T | null>
  const showPractice = ref(false)
  const score = ref<number | null>(null)
  const wordResults = ref<WordResult[]>([])

  function selectItem (item: T) {
    activeItem.value = item; showPractice.value = true
    score.value = null; wordResults.value = []
  }

  function closePractice () {
    showPractice.value = false; activeItem.value = null
    score.value = null; wordResults.value = []
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
    if (isRecording.value) {
      stopRecording()
      return
    }

    try {
      const result = await startRecording()

      if (activeItem.value && result.transcript) {
        const analysis = analyzePronunciation(activeItem.value.text, result.transcript)
        score.value = analysis.overallScore
        wordResults.value = analysis.wordResults

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
    isPlaying,
    isSpeaking,
    stopPlayback,
  }
}
