<script setup lang="ts">
import type { Achievement } from '@/data/achievements'

defineProps<{
  achievement: Achievement
  unlocked: boolean
}>()
</script>

<template>
<div class="achievement-card surface-card" :class="{ 'achievement-card--locked': !unlocked }">
  <div class="achievement-card__icon">
    {{ achievement.icon }}
  </div>
  <div class="achievement-card__info">
    <h4 class="achievement-card__title">
      {{ achievement.title }}
    </h4>
    <p class="achievement-card__desc text-caption">
      {{ achievement.description }}
    </p>
  </div>
  <van-icon v-if="unlocked" name="checked" color="var(--color-success)" size="20" />
  <van-icon v-else name="lock" color="var(--color-lavender)" size="20" />
</div>
</template>

<style scoped>
.achievement-card {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  transition: opacity 0.2s ease;
}

.achievement-card--locked {
  opacity: 0.45;
}

.achievement-card__icon {
  font-size: 22px;
  line-height: 1;
  flex-shrink: 0;
}

.achievement-card__info {
  flex: 1;
  min-width: 0;
}

.achievement-card__title {
  font-family: var(--font-primary);
  font-weight: 600;
  font-size: 13px;
  margin: 0;
  color: var(--color-text);
}

.achievement-card__desc {
  margin: 1px 0 0;
  font-size: 12px;
}
</style>
