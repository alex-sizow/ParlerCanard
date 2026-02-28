import type { Difficulty } from './types'

export const difficultyColors: Record<Difficulty, 'success' | 'warning' | 'danger'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'danger',
}

export const difficultyLabels: Record<Difficulty, string> = {
  beginner: 'Начальный',
  intermediate: 'Средний',
  advanced: 'Продвинутый',
}

// Re-export from utils/helpers for backward compatibility
export { SCORE_THRESHOLDS, scoreColor, scoreCssColor } from '@/utils/helpers'
