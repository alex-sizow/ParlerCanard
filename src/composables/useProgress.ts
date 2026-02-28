import { toRefs } from 'vue'
import { usePersistence } from './usePersistence'

interface ProgressState {
  learnedWords: string[]
  completedSentences: string[]
  attempts: { id: string; score: number; timestamp: number }[]
  totalSessions: number
  lastPracticeDate: string | null
}

const state = usePersistence<ProgressState>('parler-progress', {
  learnedWords: [],
  completedSentences: [],
  attempts: [],
  totalSessions: 0,
  lastPracticeDate: null,
})

export function useProgress () {
  const addUnique = (arr: string[], id: string) => { if (!arr.includes(id)) arr.push(id) }
  const markWordLearned = (id: string) => addUnique(state.learnedWords, id)
  const markSentenceCompleted = (id: string) => addUnique(state.completedSentences, id)

  function recordAttempt (id: string, score: number) {
    state.attempts.push({ id, score, timestamp: Date.now() })
    state.totalSessions++
    state.lastPracticeDate = new Date().toISOString().split('T')[0]
  }

  const scores = () => state.attempts.map(a => a.score)
  const getAverageAccuracy = () => state.attempts.length === 0 ? 0 : Math.round(scores().reduce((a, b) => a + b, 0) / state.attempts.length)
  const getBestAccuracy = () => state.attempts.length === 0 ? 0 : Math.max(...scores())
  const getPerfectScores = () => state.attempts.filter(a => a.score >= 100).length
  const getAccuracyTrend = (last = 10) => state.attempts.slice(-last).map(a => a.score)
  const isWordLearned = (id: string) => state.learnedWords.includes(id)
  const isSentenceCompleted = (id: string) => state.completedSentences.includes(id)

  return {
    ...toRefs(state),
    markWordLearned,
    markSentenceCompleted,
    recordAttempt,
    getAverageAccuracy,
    getBestAccuracy,
    getPerfectScores,
    getAccuracyTrend,
    isWordLearned,
    isSentenceCompleted,
  }
}
