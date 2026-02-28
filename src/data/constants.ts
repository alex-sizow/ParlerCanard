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

export const SCORE_THRESHOLDS = {
  excellent: 85,
  good: 70,
} as const

export function scoreColor (score: number): 'success' | 'warning' | 'danger' {
  if (score >= SCORE_THRESHOLDS.excellent) return 'success'
  if (score >= SCORE_THRESHOLDS.good) return 'warning'
  return 'danger'
}

export function scoreCssColor (score: number): string {
  if (score >= SCORE_THRESHOLDS.excellent) return 'var(--color-success)'
  if (score >= SCORE_THRESHOLDS.good) return 'var(--color-warning)'
  return 'var(--color-error)'
}
