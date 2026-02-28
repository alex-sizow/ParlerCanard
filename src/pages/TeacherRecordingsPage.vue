<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useStudentRecordings } from '@/composables/useStudentRecordings'
import { useAudio } from '@/composables/useAudio'
import type { StudentRecording } from '@/composables/useStudentRecordings'
import type { DifficultyFilter as DifficultyFilterType } from '@/data/types'
import { difficultyColors, difficultyLabels, scoreCssColor } from '@/data/constants'
import { formatDate } from '@/utils/helpers'
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
  <van-nav-bar title="Записи учеников" :border="false" />

  <div v-if="!isTeacher" class="teacher-recordings__denied">
    <van-empty description="Доступ только для преподавателя" image="error" />
  </div>

  <div v-else class="teacher-recordings__content">
    <!-- Filters -->
    <div class="teacher-recordings__filters surface-card">
      <p class="section-label">Фильтры</p>

      <!-- Student filter -->
      <div class="teacher-recordings__filter-row">
        <van-tag :type="filterStudent === 'all' ? 'primary' : 'default'" :plain="filterStudent !== 'all'" round
          size="medium" @click="filterStudent = 'all'">
          Все
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
        <span class="teacher-recordings__stat-value">{{ recordings.length }}</span>
        <span class="text-caption">Всего</span>
      </div>
      <div class="teacher-recordings__stat">
        <span class="teacher-recordings__stat-value">{{ students.length }}</span>
        <span class="text-caption">Учеников</span>
      </div>
      <div class="teacher-recordings__stat">
        <span class="teacher-recordings__stat-value">{{ filteredRecordings.length }}</span>
        <span class="text-caption">По фильтру</span>
      </div>
    </div>

    <!-- Recordings list -->
    <div class="teacher-recordings__list">
      <van-empty v-if="filteredRecordings.length === 0" description="Нет записей" image="search" />

      <transition-group name="card-list" tag="div" class="teacher-recordings__cards">
        <div v-for="(rec, idx) in filteredRecordings" :key="rec.id" class="recording-card animate-stagger"
          :style="{ '--stagger-index': idx }">
          <!-- Top accent stripe based on score -->
          <div class="recording-card__accent" :style="{ background: scoreCssColor(rec.score) }" />

          <div class="recording-card__body">
            <!-- Row 1: Student + meta -->
            <div class="recording-card__row recording-card__row--top">
              <div class="recording-card__student">
                <span class="recording-card__avatar">🧑‍🎓</span>
                <div class="recording-card__student-info">
                  <span class="recording-card__student-name">{{ rec.studentName }}</span>
                  <span class="recording-card__date">{{ formatDate(rec.recordedAt) }}</span>
                </div>
              </div>
              <div class="recording-card__badges">
                <van-tag :type="(difficultyColors[rec.difficulty] as 'success' | 'warning' | 'danger')" round
                  size="medium">
                  {{ difficultyLabels[rec.difficulty] }}
                </van-tag>
                <van-tag type="default" round size="medium">
                  {{ rec.itemType === 'word' ? 'слово' : 'фраза' }}
                </van-tag>
              </div>
            </div>

            <!-- Row 2: Word / phrase prominently -->
            <div class="recording-card__word-block">
              <h3 class="recording-card__word-text">{{ rec.itemText }}</h3>
            </div>

            <!-- Row 3: Score bar + transcript -->
            <div class="recording-card__metrics">
              <div class="recording-card__score-row">
                <span class="recording-card__score-label">Оценка</span>
                <div class="recording-card__score-bar-track">
                  <div class="recording-card__score-bar-fill" :style="{
                    width: `${rec.score}%`,
                    background: scoreCssColor(rec.score),
                  }" />
                </div>
                <span class="recording-card__score-value" :style="{ color: scoreCssColor(rec.score) }">
                  {{ rec.score }}%
                </span>
              </div>

              <div v-if="rec.transcript" class="recording-card__transcript-block">
                <span class="recording-card__transcript-label">Распознано:</span>
                <span class="recording-card__transcript-text">{{ rec.transcript }}</span>
              </div>
            </div>

            <!-- Row 4: Actions -->
            <div class="recording-card__actions">
              <van-button type="primary" size="mini" round block
                :icon="playingId === rec.id && isPlaying ? 'pause-circle-o' : 'play-circle-o'" @click="handlePlay(rec)">
                {{ playingId === rec.id && isPlaying ? 'Стоп' : 'Прослушать' }}
              </van-button>
              <van-button type="danger" plain size="mini" round icon="delete-o" @click="handleRemove(rec)">
                Удалить
              </van-button>
            </div>
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</div>
</template>

<style scoped>
.teacher-recordings__content {
  padding: 0 var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding-bottom: calc(var(--space-xl) * 3);
}

.teacher-recordings__denied {
  padding: var(--space-lg);
}

.teacher-recordings__filters {
  padding: var(--space-sm) var(--space-md);
}

.teacher-recordings__filter-row {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.teacher-recordings__filter-row .van-tag {
  cursor: pointer;
}

.teacher-recordings__stats {
  display: flex;
  justify-content: space-around;
  padding: var(--space-sm) var(--space-md);
  text-align: center;
}

.teacher-recordings__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.teacher-recordings__stat-value {
  font-weight: 700;
  font-size: 20px;
  color: var(--color-text);
}

.teacher-recordings__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.teacher-recordings__cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.recording-card {
  background: var(--color-white);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid oklch(0.72 0.16 85 / 0.08);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
}

.recording-card:active {
  transform: scale(0.985);
  box-shadow: var(--shadow-sm);
}

.recording-card__accent {
  height: 3px;
  width: 100%;
}

.recording-card__body {
  padding: var(--space-sm) var(--space-md) var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.recording-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs);
}

.recording-card__row--top {
  flex-wrap: wrap;
}

.recording-card__student {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.recording-card__avatar {
  font-size: 20px;
  line-height: 1;
}

.recording-card__student-info {
  display: flex;
  flex-direction: column;
}

.recording-card__student-name {
  font-weight: 600;
  font-size: 13px;
  color: var(--color-text);
}

.recording-card__date {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.recording-card__badges {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.recording-card__word-block {
  padding: 2px 0;
}

.recording-card__word-text {
  margin: 0;
  font-weight: 700;
  font-size: 18px;
  line-height: 1.3;
  color: var(--color-text);
  word-break: break-word;
}

.recording-card__metrics {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.recording-card__score-row {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.recording-card__score-label {
  width: 44px;
  flex-shrink: 0;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.recording-card__score-bar-track {
  flex: 1;
  height: 6px;
  background: var(--color-lavender-light);
  border-radius: 3px;
  overflow: hidden;
}

.recording-card__score-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.recording-card__score-value {
  font-family: var(--font-phonetic);
  font-weight: 700;
  font-size: 14px;
  width: 40px;
  text-align: right;
}

.recording-card__transcript-block {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.recording-card__transcript-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.recording-card__transcript-text {
  font-size: 13px;
  color: var(--color-text);
  word-break: break-word;
}

.recording-card__actions {
  display: flex;
  gap: var(--space-xs);
}

.recording-card__actions .van-button:first-child {
  flex: 1;
}
</style>
