import type { Difficulty, DifficultyFilter, PracticeItem } from '@/data/types'

// ── Score Utilities ──────────────────────────────────────────────

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

// ── Difficulty Helpers ───────────────────────────────────────────

export const countByDifficulty = <T extends PracticeItem>(items: T[]) => ({
  all: items.length,
  ...(['beginner', 'intermediate', 'advanced'] as Difficulty[]).reduce(
    (acc, d) => ({ ...acc, [d]: items.filter(i => i.difficulty === d).length }),
    {} as Record<Difficulty, number>,
  ),
})

export const filterByDifficulty = <T extends PracticeItem>(items: T[], filter: DifficultyFilter) =>
  filter === 'all' ? items : items.filter(i => i.difficulty === filter)

// ── Blob / Encoding ─────────────────────────────────────────────

export const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const r = new FileReader()
  r.onloadend = () => resolve(r.result as string)
  r.onerror = reject
  r.readAsDataURL(blob)
})

export function base64ToBlob (dataUrl: string): Blob {
  const [header = '', data = ''] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'audio/webm'
  const binary = atob(data)
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  return new Blob([bytes], { type: mime })
}

// ── Date Formatting ─────────────────────────────────────────────

export function formatDate (ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Misc ─────────────────────────────────────────────────────────

export function delay (ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}
