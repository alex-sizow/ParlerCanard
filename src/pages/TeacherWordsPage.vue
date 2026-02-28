<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTeacherWords } from '@/composables/useTeacherWords'
import { useAuth } from '@/composables/useAuth'
import type { Word } from '@/data/words'
import type { DifficultyFilter as DifficultyFilterType } from '@/data/types'
import type { Difficulty } from '@/data/types'
import { difficultyColors, difficultyLabels } from '@/data/constants'
import DifficultyFilter from '@/components/DifficultyFilter.vue'
import { showToast, showDialog } from 'vant'

const { isTeacher } = useAuth()
const { teacherWords, addWord, removeWord } = useTeacherWords()

const showAddForm = ref(false)
const filterDifficulty = ref<DifficultyFilterType>('all')

const form = ref({
  text: '',
  ipa: '',
  translation: '',
  difficulty: 'beginner' as Word['difficulty'],
})

const filteredWords = computed(() => {
  if (filterDifficulty.value === 'all') return teacherWords.value
  return teacherWords.value.filter(w => w.difficulty === filterDifficulty.value)
})

const counts = computed(() => ({
  all: teacherWords.value.length,
  beginner: teacherWords.value.filter(w => w.difficulty === 'beginner').length,
  intermediate: teacherWords.value.filter(w => w.difficulty === 'intermediate').length,
  advanced: teacherWords.value.filter(w => w.difficulty === 'advanced').length,
}))

function resetForm() {
  form.value = { text: '', ipa: '', translation: '', difficulty: 'beginner' }
}

function handleAdd() {
  const { text, ipa, translation, difficulty } = form.value
  if (!text.trim()) {
    showToast({ message: 'Введите слово', type: 'fail' })
    return
  }
  if (!translation.trim()) {
    showToast({ message: 'Введите перевод', type: 'fail' })
    return
  }

  addWord({ text: text.trim(), ipa: ipa.trim() || '—', translation: translation.trim(), difficulty })
  showToast({ message: `Слово «${text.trim()}» добавлено`, type: 'success' })
  resetForm()
  showAddForm.value = false
}

async function handleRemove(word: Word) {
  try {
    await showDialog({
      title: 'Удалить слово',
      message: `Удалить «${word.text}» из списка?`,
      showCancelButton: true,
      confirmButtonText: 'Удалить',
      cancelButtonText: 'Отмена',
      confirmButtonColor: 'var(--color-error)',
    })
    removeWord(word.id)
    showToast({ message: 'Слово удалено', type: 'success' })
  } catch {
    // cancelled
  }
}

const difficultyOptions = (['beginner', 'intermediate', 'advanced'] as Difficulty[]).map(d => ({
  text: difficultyLabels[d],
  value: d,
}))

const filterLabels = { all: 'Все', ...difficultyLabels }
</script>

<template>
<div class="teacher-words">
  <van-nav-bar title="Управление словами" :border="false" />

  <div v-if="!isTeacher" class="teacher-words__denied">
    <van-empty description="Доступ только для преподавателя" image="error" />
  </div>

  <div v-else class="teacher-words__content">
    <!-- Filter -->
    <DifficultyFilter v-model="filterDifficulty" :counts="counts" :labels="filterLabels" use-colored-tags />

    <!-- Add button -->
    <van-button type="primary" block round icon="plus" @click="showAddForm = true">
      Добавить слово
    </van-button>

    <!-- Words list -->
    <div class="teacher-words__list">
      <van-empty v-if="filteredWords.length === 0" description="Нет добавленных слов" image="search" />

      <div v-for="word in filteredWords" :key="word.id" class="teacher-word-card surface-card-elevated">
        <div class="teacher-word-card__header">
          <van-tag :type="(difficultyColors[word.difficulty] as 'success' | 'warning' | 'danger')" round size="medium">
            {{ difficultyLabels[word.difficulty] }}
          </van-tag>
          <van-button type="danger" plain size="mini" round icon="delete-o" @click="handleRemove(word)" />
        </div>
        <h3 class="text-h2" style="margin: 8px 0 4px;">{{ word.text }}</h3>
        <p class="text-phonetic" style="margin: 0 0 4px; color: var(--color-primary);">{{ word.ipa }}</p>
        <p class="text-caption" style="margin: 0;">{{ word.translation }}</p>
      </div>
    </div>
  </div>

  <!-- Add Word Popup -->
  <van-popup v-model:show="showAddForm" position="bottom" round closeable :style="{ maxHeight: '85vh' }"
    @close="resetForm">
    <div class="add-form">
      <h2 class="text-h2" style="margin: 0 0 16px; text-align: center;">Новое слово</h2>

      <van-cell-group inset>
        <van-field v-model="form.text" label="Слово" placeholder="Bonjour" clearable />
        <van-field v-model="form.ipa" label="IPA" placeholder="/bɔ̃.ʒuʁ/" clearable />
        <van-field v-model="form.translation" label="Перевод" placeholder="Здравствуйте" clearable />
      </van-cell-group>

      <div class="add-form__difficulty">
        <p class="text-body" style="margin: 0 0 8px; font-weight: 600;">Уровень сложности</p>
        <van-radio-group v-model="form.difficulty" direction="horizontal">
          <van-radio v-for="opt in difficultyOptions" :key="opt.value" :name="opt.value">
            {{ opt.text }}
          </van-radio>
        </van-radio-group>
      </div>

      <van-button type="primary" block round size="large" :disabled="!form.text.trim() || !form.translation.trim()"
        @click="handleAdd">
        Добавить
      </van-button>
    </div>
  </van-popup>
</div>
</template>

<style scoped>
.teacher-words__content {
  padding: 0 var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding-bottom: calc(var(--space-xl) * 3);
}

.teacher-words__denied {
  padding: var(--space-xl);
}

.teacher-words__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.teacher-word-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.add-form {
  padding: var(--space-xl) var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.add-form__difficulty {
  padding: 0 var(--space-md);
}
</style>
