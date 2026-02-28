import { computed } from 'vue'
import { usePersistence } from './usePersistence'
import { achievements } from '@/data/achievements'
import type { AchievementStats } from '@/data/achievements'
import { useProgress } from './useProgress'

interface AchievementsState {
  unlocked: string[]
  streakDays: number
  bestStreak: number
  lastStreakDate: string | null
  notifiedIds: string[]
}

const state = usePersistence<AchievementsState>('parler-achievements', {
  unlocked: [],
  streakDays: 0,
  bestStreak: 0,
  lastStreakDate: null,
  notifiedIds: [],
})

export function useAchievements () {
  const progress = useProgress()

  const unlockedAchievements = computed(() =>
    achievements.filter(a => state.unlocked.includes(a.id)),
  )

  const lockedAchievements = computed(() =>
    achievements.filter(a => !state.unlocked.includes(a.id)),
  )

  function updateStreak () {
    const today = new Date().toISOString().split('T')[0]!
    if (state.lastStreakDate === today) return

    if (state.lastStreakDate) {
      const diff = Math.floor((new Date(today).getTime() - new Date(state.lastStreakDate).getTime()) / 864e5)
      state.streakDays = diff === 1 ? state.streakDays + 1 : 1
    } else {
      state.streakDays = 1
    }
    state.lastStreakDate = today
    state.bestStreak = Math.max(state.bestStreak, state.streakDays)
  }

  function buildStats (): AchievementStats {
    return {
      wordsLearned: progress.learnedWords.value.length,
      sentencesCompleted: progress.completedSentences.value.length,
      totalAttempts: progress.attempts.value.length,
      averageAccuracy: progress.getAverageAccuracy(),
      bestAccuracy: progress.getBestAccuracy(),
      streakDays: state.streakDays,
      perfectScores: progress.getPerfectScores(),
    }
  }

  function checkAchievements (): string[] {
    updateStreak()
    const stats = buildStats()
    return achievements.reduce<string[]>((acc, a) => {
      if (!state.unlocked.includes(a.id) && a.condition(stats)) {
        state.unlocked.push(a.id)
        acc.push(a.id)
      }
      return acc
    }, [])
  }

  const getAchievementById = (id: string) => achievements.find(a => a.id === id)
  const isUnlocked = (id: string) => state.unlocked.includes(id)

  return {
    streakDays: computed(() => state.streakDays),
    bestStreak: computed(() => state.bestStreak),
    unlockedAchievements,
    lockedAchievements,
    checkAchievements,
    getAchievementById,
    isUnlocked,
  }
}
