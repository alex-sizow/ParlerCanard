<script setup lang="ts">
import { computed } from 'vue'
import { useAchievements } from '@/composables/useAchievements'
import { useProgress } from '@/composables/useProgress'
import { achievements } from '@/data/achievements'
import type { AchievementCategory } from '@/data/achievements'
import StreakCard from '@/components/StreakCard.vue'
import AchievementCard from '@/components/AchievementCard.vue'
import StatsGrid from '@/components/StatsGrid.vue'

const { streakDays, bestStreak, isUnlocked } = useAchievements()
const { learnedWords, completedSentences, attempts, getAverageAccuracy } = useProgress()

const stats = computed(() => [
  { label: 'Words Learned', value: learnedWords.value.length, icon: '🪶' },
  { label: 'Sentences Done', value: completedSentences.value.length, icon: '💬' },
  { label: 'Total Attempts', value: attempts.value.length, icon: '🦆' },
  { label: 'Avg Accuracy', value: `${getAverageAccuracy()}%`, icon: '🎯' },
])

const categoryLabels: Record<AchievementCategory, string> = {
  milestone: '🎯 Milestones',
  streak: '🔥 Streak',
  accuracy: '📈 Accuracy',
  mastery: '🏆 Mastery',
}

const groupedAchievements = computed(() => {
  const groups: { category: AchievementCategory; label: string; items: typeof achievements }[] = []
  const cats: AchievementCategory[] = ['milestone', 'streak', 'accuracy', 'mastery']

  for (const cat of cats) {
    const items = achievements.filter(a => a.category === cat)
    if (items.length > 0) {
      groups.push({
        category: cat,
        label: categoryLabels[cat],
        items,
      })
    }
  }

  return groups
})

const unlockedCount = computed(() =>
  achievements.filter(a => isUnlocked(a.id)).length,
)
</script>

<template>
<div class="achievements-page">
  <van-nav-bar title="🦆 Progress & Achievements" :border="false" />

  <div class="achievements-page__content">
    <!-- Streak -->
    <StreakCard :current-streak="streakDays" :best-streak="bestStreak" />

    <!-- Stats -->
    <StatsGrid :stats="stats" />

    <!-- Achievements -->
    <div class="achievements-section">
      <div class="achievements-section__header">
        <h3 class="text-h3">Achievements</h3>
        <van-tag type="primary" round>
          {{ unlockedCount }} / {{ achievements.length }}
        </van-tag>
      </div>

      <div v-for="group in groupedAchievements" :key="group.category" class="achievement-group">
        <h4 class="achievement-group__title text-caption" style="font-weight: 600; color: var(--color-text);">
          {{ group.label }}
        </h4>
        <div class="achievement-group__list">
          <AchievementCard v-for="achievement in group.items" :key="achievement.id" :achievement="achievement"
            :unlocked="isUnlocked(achievement.id)" />
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<style scoped>
.achievements-page__content {
  padding: 0 var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.achievements-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.achievements-section__header h3 {
  margin: 0;
}

.achievement-group {
  margin-top: var(--space-md);
}

.achievement-group__title {
  margin: 0 0 var(--space-sm);
}

.achievement-group__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}
</style>
