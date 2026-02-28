<script setup lang="ts">
import type { StatItem } from '@/data/types'

withDefaults(defineProps<{
  stats: StatItem[]
  columns?: 2 | 3
}>(), {
  columns: 2,
})
</script>

<template>
<div class="stats-grid" :class="`stats-grid--${columns}col`">
  <div v-for="stat in stats" :key="stat.label" class="stat-card surface-card">
    <span class="stat-card__icon">{{ stat.icon }}</span>
    <span class="stat-card__value">{{ stat.value }}</span>
    <span class="stat-card__label text-caption">{{ stat.label }}</span>
  </div>
</div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  gap: var(--space-sm);
}

.stats-grid--2col {
  grid-template-columns: 1fr 1fr;
}

.stats-grid--3col {
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--space-sm);
}

.stat-card__icon {
  font-size: 20px;
}

.stat-card__value {
  font-family: var(--font-primary);
  font-weight: 700;
  font-size: 18px;
  color: var(--color-text);
}

.stat-card__label {
  text-align: center;
  font-size: 11px;
}

.stats-grid--3col .stat-card {
  padding: var(--space-sm) var(--space-xs);
}

.stats-grid--3col .stat-card__icon {
  font-size: 18px;
}

.stats-grid--3col .stat-card__value {
  font-size: 15px;
}

.stats-grid--3col .stat-card__label {
  font-size: 10px;
}
</style>
