<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useStudentRecordings } from '@/composables/useStudentRecordings'
import { useAudio } from '@/composables/useAudio'
import type { StudentRecording } from '@/composables/useStudentRecordings'
import type { DifficultyFilter as DifficultyFilterType } from '@/data/types'
import { difficultyColors, difficultyLabels, scoreCssColor } from '@/data/constants'
import DifficultyFilter from '@/components/DifficultyFilter.vue'
import { showToast, showDialog } from 'vant'

const { isTeacher, allUsers } = useAuth()
const {
  recordings,
  getRecordingBlob,
  removeRecording,
} = useStudentRecordings()
const { playBlob, isPlaying, stopPlayback } = useAudio()

const filterStudent = ref('all')
const filterDifficulty = ref<DifficultyFilterType>('all')
const playingId = ref<string | null>(null)

const students = computed(() =>
  allUsers.value.filter(u => u.role === 'student'),
)

const filteredRecordings = computed(() => {
  let list = [...recordings.value]

  if (filterStudent.value !== 'all') {
    list = list.filter(r => r.studentId === filterStudent.value)
  }

  if (filterDifficulty.value !== 'all') {
    list = list.filter(r => r.difficulty === filterDifficulty.value)
  }

  // Sort by newest first
  return list.sort((a, b) => b.recordedAt - a.recordedAt)
})

function formatDate(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function handlePlay(recording: StudentRecording) {
  if (playingId.value === recording.id && isPlaying.value) {
    stopPlayback()
    playingId.value = null
    return
  }

  try {
    stopPlayback()
    const blob = getRecordingBlob(recording)
    playingId.value = recording.id
    await playBlob(blob)
    playingId.value = null
  } catch {
    playingId.value = null
    showToast({ message: 'Ошибка воспроизведения', type: 'fail' })
  }
}

async function handleRemove(recording: StudentRecording) {
  try {
    await showDialog({
      title: 'Удалить запись',
      message: `Удалить запись «${recording.itemText}» от ${recording.studentName}?`,
      showCancelButton: true,
      confirmButtonText: 'Удалить',
      cancelButtonText: 'Отмена',
      confirmButtonColor: 'var(--color-error)',
    })
    removeRecording(recording.id)
    showToast({ message: 'Запись удалена', type: 'success' })
  } catch {
    // cancelled
  }
}

const filterLabelsWithAll = { all: 'Все уровни', ...difficultyLabels }
</script>

<template>
<div class="teacher-recordings">
  <van-nav-bar title="🦆 Записи учеников" :border="false" />

  <div v-if="!isTeacher" class="teacher-recordings__denied">
    <van-empty description="Доступ только для преподавателя" image="error" />
  </div>

  <div v-else class="teacher-recordings__content">
    <!-- Filters -->
    <div class="teacher-recordings__filters surface-card">
      <p class="text-body" style="margin: 0 0 8px; font-weight: 600;">Фильтры</p>

      <!-- Student filter -->
      <div class="teacher-recordings__filter-row">
        <van-tag :type="filterStudent === 'all' ? 'primary' : 'default'" :plain="filterStudent !== 'all'" round
          size="medium" @click="filterStudent = 'all'">
          Все ученики
        </van-tag>
        <van-tag v-for="student in students" :key="student.id"
          :type="filterStudent === student.id ? 'primary' : 'default'" :plain="filterStudent !== student.id" round
          size="medium" @click="filterStudent = student.id">
          {{ student.avatar }} {{ student.name }}
        </van-tag>
      </div>

      <!-- Difficulty filter -->
      <DifficultyFilter v-model="filterDifficulty" :labels="filterLabelsWithAll" use-colored-tags />
    </div>

    <!-- Stats -->
    <div class="teacher-recordings__stats surface-card">
      <div class="teacher-recordings__stat">
        <span class="text-h2">{{ recordings.length }}</span>
        <span class="text-caption">Всего записей</span>
      </div>
      <div class="teacher-recordings__stat">
        <span class="text-h2">{{ students.length }}</span>
        <span class="text-caption">Учеников</span>
      </div>
      <div class="teacher-recordings__stat">
        <span class="text-h2">{{ filteredRecordings.length }}</span>
        <span class="text-caption">По фильтру</span>
      </div>
    </div>

    <!-- Recordings list -->
    <div class="teacher-recordings__list">
      <van-empty v-if="filteredRecordings.length === 0" description="Нет записей" image="search" />

      <div v-for="rec in filteredRecordings" :key="rec.id" class="recording-card surface-card-elevated">
        <div class="recording-card__header">
          <div class="recording-card__student">
            <span style="font-size: 20px;">🧑‍🎓</span>
            <span class="text-body" style="font-weight: 600;">{{ rec.studentName }}</span>
          </div>
          <van-tag :type="(difficultyColors[rec.difficulty] as 'success' | 'warning' | 'danger')" round size="small">
            {{ difficultyLabels[rec.difficulty] }}
          </van-tag>
        </div>

        <div class="recording-card__word">
          <h3 class="text-h2" style="margin: 0;">{{ rec.itemText }}</h3>
          <van-tag type="default" round size="small">
            {{ rec.itemType === 'word' ? 'слово' : 'фраза' }}
          </van-tag>
        </div>

        <div class="recording-card__details">
          <div class="recording-card__score">
            <span class="text-caption">Оценка:</span>
            <span class="text-body" :style="{ color: scoreCssColor(rec.score), fontWeight: 700 }">
              {{ rec.score }}%
            </span>
          </div>
          <div v-if="rec.transcript" class="recording-card__transcript">
            <span class="text-caption">Распознано:</span>
            <span class="text-body">{{ rec.transcript }}</span>
          </div>
          <span class="text-caption">{{ formatDate(rec.recordedAt) }}</span>
        </div>

        <div class="recording-card__actions">
          <van-button type="primary" size="small" round
            :icon="playingId === rec.id && isPlaying ? 'pause-circle-o' : 'play-circle-o'" @click="handlePlay(rec)">
            {{ playingId === rec.id && isPlaying ? 'Стоп' : 'Прослушать' }}
          </van-button>
          <van-button type="danger" plain size="small" round icon="delete-o" @click="handleRemove(rec)">
            Удалить
          </van-button>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<style scoped>
.teacher-recordings__content {
  padding: 0 var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding-bottom: calc(var(--space-xl) * 3);
}

.teacher-recordings__denied {
  padding: var(--space-xl);
}

.teacher-recordings__filters {
  padding: var(--space-md);
}

.teacher-recordings__filter-row {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.teacher-recordings__filter-row .van-tag {
  cursor: pointer;
}

.teacher-recordings__stats {
  display: flex;
  justify-content: space-around;
  padding: var(--space-md);
  text-align: center;
}

.teacher-recordings__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.teacher-recordings__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.recording-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.recording-card__student {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.recording-card__word {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.recording-card__details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: var(--space-md);
}

.recording-card__score {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.recording-card__transcript {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.recording-card__actions {
  display: flex;
  gap: var(--space-sm);
}
</style>
