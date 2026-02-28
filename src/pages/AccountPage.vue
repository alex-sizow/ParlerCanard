<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useProgress } from '@/composables/useProgress'
import { useAchievements } from '@/composables/useAchievements'
import { words } from '@/data/words'
import { sentences } from '@/data/sentences'
import { achievements } from '@/data/achievements'
import StreakCard from '@/components/StreakCard.vue'
import StatsGrid from '@/components/StatsGrid.vue'
import { scoreCssColor } from '@/data/constants'
import { showDialog } from 'vant'

const router = useRouter()
const { currentUser, isTeacher, allUsers, logout } = useAuth()
const { learnedWords, completedSentences, attempts, getAverageAccuracy, getBestAccuracy, getAccuracyTrend } = useProgress()
const { streakDays, bestStreak, isUnlocked } = useAchievements()

const memberSince = computed(() => {
  if (!currentUser.value) return ''
  const d = new Date(currentUser.value.joinedAt)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const progressPercent = computed(() => {
  const total = words.length + sentences.length
  const done = learnedWords.value.length + completedSentences.value.length
  if (total === 0) return 0
  return Math.round((done / total) * 100)
})

const unlockedCount = computed(() =>
  achievements.filter(a => isUnlocked(a.id)).length,
)

const recentScores = computed(() => getAccuracyTrend(5))

const statsCards = computed(() => [
  { icon: '🪶', label: 'Words', value: `${learnedWords.value.length} / ${words.length}` },
  { icon: '💬', label: 'Sentences', value: `${completedSentences.value.length} / ${sentences.length}` },
  { icon: '🦆', label: 'Attempts', value: String(attempts.value.length) },
  { icon: '🎯', label: 'Avg Score', value: `${getAverageAccuracy()}%` },
  { icon: '⭐', label: 'Best Score', value: `${getBestAccuracy()}%` },
  { icon: '🏆', label: 'Achievements', value: `${unlockedCount.value} / ${achievements.length}` },
])

// Teacher-only: student list
const studentList = computed(() =>
  allUsers.value.filter(u => u.role === 'student'),
)

async function handleLogout() {
  try {
    await showDialog({
      title: 'Log Out',
      message: 'Are you sure you want to log out?',
      showCancelButton: true,
      confirmButtonText: 'Log Out',
      confirmButtonColor: 'var(--color-error)',
    })
    logout()
    router.replace('/login')
  } catch {
    // cancelled
  }
}
</script>

<template>
<div class="account-page">
  <van-nav-bar title="🦆 Account" :border="false" />

  <div class="account-page__content">
    <!-- Profile Card -->
    <div class="profile-card surface-card-elevated">
      <div class="profile-card__avatar">
        {{ currentUser?.avatar ?? '👤' }}
      </div>
      <div class="profile-card__info">
        <h2 class="text-h2" style="margin: 0;">{{ currentUser?.name }}</h2>
        <div class="profile-card__meta">
          <van-tag :type="isTeacher ? 'warning' : 'primary'" round size="medium">
            {{ isTeacher ? '👩‍🏫 Teacher' : '🧑‍🎓 Student' }}
          </van-tag>
          <span class="text-caption">Since {{ memberSince }}</span>
        </div>
      </div>
    </div>

    <!-- Overall Progress -->
    <div class="progress-section surface-card">
      <div class="progress-section__header">
        <h3 class="text-h3" style="margin: 0;">Overall Progress</h3>
        <span class="text-h3" style="color: var(--color-primary);">{{ progressPercent }}%</span>
      </div>
      <van-progress :percentage="progressPercent" :stroke-width="10" color="var(--color-primary)"
        track-color="var(--color-lavender-light)" />
    </div>

    <!-- Streak -->
    <StreakCard :current-streak="streakDays" :best-streak="bestStreak" />

    <!-- Stats Grid -->
    <StatsGrid :stats="statsCards" :columns="3" />

    <!-- Recent Scores -->
    <div v-if="recentScores.length > 0" class="recent-section surface-card">
      <h3 class="text-h3" style="margin: 0 0 12px;">Recent Scores</h3>
      <div class="recent-scores">
        <div v-for="(score, i) in recentScores" :key="i" class="recent-scores__bar">
          <div class="recent-scores__fill" :style="{
            height: `${score}%`,
            backgroundColor: scoreCssColor(score),
          }" />
          <span class="recent-scores__label text-caption">{{ score }}%</span>
        </div>
      </div>
    </div>

    <!-- Teacher Admin Panel -->
    <div v-if="isTeacher" class="teacher-panel surface-card-elevated">
      <h3 class="text-h3" style="margin: 0 0 8px;">
        👩‍🏫 Teacher Panel
      </h3>
      <p class="text-caption" style="margin: 0 0 16px;">
        Registered students: {{ studentList.length }}
      </p>

      <div v-if="studentList.length === 0" class="text-caption" style="text-align: center; padding: 16px 0;">
        No students registered yet
      </div>

      <div v-for="student in studentList" :key="student.id" class="teacher-panel__student">
        <span class="teacher-panel__avatar">{{ student.avatar }}</span>
        <div class="teacher-panel__student-info">
          <span class="text-body" style="font-weight: 500;">{{ student.name }}</span>
          <span class="text-caption">Joined {{ student.joinedAt }}</span>
        </div>
      </div>
    </div>

    <!-- Logout -->
    <van-button type="default" block round size="large" class="account-page__logout" @click="handleLogout">
      Log Out
    </van-button>
  </div>
</div>
</template>

<style scoped>
.account-page__content {
  padding: 0 var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding-bottom: var(--space-xl);
}

.profile-card {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.profile-card__avatar {
  font-size: 56px;
  line-height: 1;
}

.profile-card__info {
  flex: 1;
}

.profile-card__meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-xs);
}

.progress-section {
  padding: var(--space-lg);
}

.progress-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.recent-section {
  padding: var(--space-lg);
}

.recent-scores {
  display: flex;
  gap: var(--space-sm);
  align-items: flex-end;
  height: 100px;
}

.recent-scores__bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
  justify-content: flex-end;
}

.recent-scores__fill {
  width: 100%;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  transition: height 0.5s ease;
  min-height: 4px;
}

.recent-scores__label {
  font-size: 11px;
}

.teacher-panel {
  border: 2px solid oklch(0.75 0.12 85 / 0.4);
}

.teacher-panel__student {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--color-lavender-light);
}

.teacher-panel__student:last-child {
  border-bottom: none;
}

.teacher-panel__avatar {
  font-size: 28px;
}

.teacher-panel__student-info {
  display: flex;
  flex-direction: column;
}

.account-page__logout {
  margin-top: var(--space-md);
  color: var(--color-error);
  border-color: var(--color-error);
}
</style>
