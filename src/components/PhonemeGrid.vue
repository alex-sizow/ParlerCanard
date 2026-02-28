<script setup lang="ts">
import type { WordResult } from '@/composables/usePronunciation'

defineProps<{
  results: WordResult[]
}>()

const colorMap: Record<string, string> = {
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-error)',
}
</script>

<template>
<div class="phoneme-grid">
  <div v-for="(result, index) in results" :key="index" class="phoneme-grid__item animate-fade-in" :style="{
    backgroundColor: colorMap[result.color] ?? 'var(--color-lavender-light)',
    animationDelay: `${index * 80}ms`,
  }">
    <span class="phoneme-grid__word">{{ result.word }}</span>
    <span class="phoneme-grid__score">{{ result.score }}%</span>
  </div>
</div>
</template>

<style scoped>
.phoneme-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.phoneme-grid__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  color: var(--color-white);
  min-width: 64px;
  animation-fill-mode: both;
}

.phoneme-grid__word {
  font-family: var(--font-primary);
  font-weight: 600;
  font-size: 14px;
}

.phoneme-grid__score {
  font-family: var(--font-phonetic);
  font-weight: 500;
  font-size: 11px;
  opacity: 0.9;
}
</style>
