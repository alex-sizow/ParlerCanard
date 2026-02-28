import { ref, computed } from 'vue'
import { words } from '@/data/words'
import { sentences } from '@/data/sentences'
import { useTeacherWords } from '@/composables/useTeacherWords'
import { countByDifficulty, filterByDifficulty } from '@/utils/helpers'
import type { DifficultyFilter } from '@/data/types'

const wordDifficulty = ref<DifficultyFilter>('all')
const sentenceDifficulty = ref<DifficultyFilter>('all')

export function useDifficulty () {
  const { teacherWords } = useTeacherWords()
  const allWords = computed(() => [...words, ...teacherWords.value])

  return {
    wordDifficulty,
    sentenceDifficulty,
    filteredWords: computed(() => filterByDifficulty(allWords.value, wordDifficulty.value)),
    filteredSentences: computed(() => filterByDifficulty(sentences, sentenceDifficulty.value)),
    wordCounts: computed(() => countByDifficulty(allWords.value)),
    sentenceCounts: computed(() => countByDifficulty(sentences)),
  }
}
