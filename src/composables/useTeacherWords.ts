import { computed } from 'vue'
import { useCloudPersistence } from './useCloudPersistence'
import type { Word } from '@/data/words'

interface TeacherWordsState {
  words: Word[]
}

const state = useCloudPersistence<TeacherWordsState>('parler-teacher-words', {
  words: [],
})

export function useTeacherWords () {
  const teacherWords = computed(() => state.words)

  function addWord (word: Omit<Word, 'id'>): Word {
    const newWord: Word = {
      ...word,
      id: `tw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }
    state.words.push(newWord)
    return newWord
  }

  function removeWord (id: string) {
    const idx = state.words.findIndex(w => w.id === id)
    if (idx !== -1) {
      state.words.splice(idx, 1)
    }
  }

  return {
    teacherWords,
    addWord,
    removeWord,
  }
}
