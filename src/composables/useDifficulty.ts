import { ref, computed } from 'vue'
import { words } from '@/data/words'
import { sentences } from '@/data/sentences'
import { useTeacherWords } from '@/composables/useTeacherWords'
import type { Difficulty, DifficultyFilter, PracticeItem } from '@/data/types'

const wordDifficulty = ref<DifficultyFilter>('all')
const sentenceDifficulty = ref<DifficultyFilter>('all')

const countByDifficulty = <T extends PracticeItem>(items: T[]) => ({
  all: items.length,
  ...(['beginner', 'intermediate', 'advanced'] as Difficulty[]).reduce(
    (acc, d) => ({ ...acc, [d]: items.filter(i => i.difficulty === d).length }),
    {} as Record<Difficulty, number>,
  ),
})

const filterBy = <T extends PracticeItem>(items: T[], filter: DifficultyFilter) =>
  filter === 'all' ? items : items.filter(i => i.difficulty === filter)

export function useDifficulty () {
  const { teacherWords } = useTeacherWords()
  const allWords = computed(() => [...words, ...teacherWords.value])

  return {
    wordDifficulty,
    sentenceDifficulty,
    filteredWords: computed(() => filterBy(allWords.value, wordDifficulty.value)),
    filteredSentences: computed(() => filterBy(sentences, sentenceDifficulty.value)),
    wordCounts: computed(() => countByDifficulty(allWords.value)),
    sentenceCounts: computed(() => countByDifficulty(sentences)),
  }
}
