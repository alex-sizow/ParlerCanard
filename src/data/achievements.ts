export type AchievementCategory = 'milestone' | 'streak' | 'accuracy' | 'mastery'

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: AchievementCategory
  condition: (stats: AchievementStats) => boolean
}

export interface AchievementStats {
  wordsLearned: number
  sentencesCompleted: number
  totalAttempts: number
  averageAccuracy: number
  bestAccuracy: number
  streakDays: number
  perfectScores: number
}

export const achievements: Achievement[] = [
  // ─── Milestone ───
  {
    id: 'a-first-word',
    title: 'Premier Mot',
    description: 'Complete your first word practice',
    icon: '🎯',
    category: 'milestone',
    condition: (s) => s.wordsLearned >= 1,
  },
  {
    id: 'a-ten-words',
    title: 'Vocabulaire',
    description: 'Learn 10 words',
    icon: '📖',
    category: 'milestone',
    condition: (s) => s.wordsLearned >= 10,
  },
  {
    id: 'a-twenty-five-words',
    title: 'Polyglotte',
    description: 'Learn 25 words',
    icon: '🌍',
    category: 'milestone',
    condition: (s) => s.wordsLearned >= 25,
  },
  {
    id: 'a-first-sentence',
    title: 'Première Phrase',
    description: 'Complete your first sentence practice',
    icon: '💬',
    category: 'milestone',
    condition: (s) => s.sentencesCompleted >= 1,
  },

  // ─── Streak ───
  {
    id: 'a-streak-3',
    title: 'Régulier',
    description: 'Practice 3 days in a row',
    icon: '🔥',
    category: 'streak',
    condition: (s) => s.streakDays >= 3,
  },
  {
    id: 'a-streak-7',
    title: 'Dévoué',
    description: 'Practice 7 days in a row',
    icon: '⚡',
    category: 'streak',
    condition: (s) => s.streakDays >= 7,
  },
  {
    id: 'a-streak-30',
    title: 'Invincible',
    description: 'Practice 30 days in a row',
    icon: '👑',
    category: 'streak',
    condition: (s) => s.streakDays >= 30,
  },

  // ─── Accuracy ───
  {
    id: 'a-accuracy-70',
    title: 'En Progrès',
    description: 'Achieve 70% average accuracy',
    icon: '📈',
    category: 'accuracy',
    condition: (s) => s.averageAccuracy >= 70,
  },
  {
    id: 'a-accuracy-85',
    title: 'Compétent',
    description: 'Achieve 85% average accuracy',
    icon: '🎖️',
    category: 'accuracy',
    condition: (s) => s.averageAccuracy >= 85,
  },
  {
    id: 'a-accuracy-95',
    title: 'Parfait',
    description: 'Achieve 95% average accuracy',
    icon: '💎',
    category: 'accuracy',
    condition: (s) => s.averageAccuracy >= 95,
  },
  {
    id: 'a-perfect-score',
    title: 'Sans Faute',
    description: 'Get a perfect 100% score',
    icon: '✨',
    category: 'accuracy',
    condition: (s) => s.bestAccuracy >= 100,
  },

  // ─── Mastery ───
  {
    id: 'a-ten-attempts',
    title: 'Pratiquant',
    description: 'Complete 10 practice attempts',
    icon: '🏋️',
    category: 'mastery',
    condition: (s) => s.totalAttempts >= 10,
  },
  {
    id: 'a-fifty-attempts',
    title: 'Expert',
    description: 'Complete 50 practice attempts',
    icon: '🏆',
    category: 'mastery',
    condition: (s) => s.totalAttempts >= 50,
  },
  {
    id: 'a-five-perfects',
    title: 'Maître',
    description: 'Get 5 perfect scores',
    icon: '🌟',
    category: 'mastery',
    condition: (s) => s.perfectScores >= 5,
  },
]
