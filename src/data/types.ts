export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type DifficultyFilter = 'all' | Difficulty
export type ItemType = 'word' | 'sentence'

export interface PracticeItem {
  id: string
  text: string
  ipa: string
  translation: string
  difficulty: Difficulty
}

export interface StatItem {
  icon: string
  value: string | number
  label: string
}
