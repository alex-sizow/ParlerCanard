<script setup lang="ts">
import { scoreCssColor } from '@/utils/helpers'

defineProps<{
  accuracy: number
  confidence: number
  intonation: number
  fluency: number
}>()

const items = [
  { key: 'accuracy', label: 'Accuracy', icon: '🎯', weight: '40%' },
  { key: 'confidence', label: 'Clarity', icon: '🔊', weight: '30%' },
  { key: 'intonation', label: 'Intonation', icon: '🎵', weight: '20%' },
  { key: 'fluency', label: 'Fluency', icon: '💨', weight: '10%' },
] as const
</script>

<template>
<div class="score-breakdown surface-card">
  <div v-for="(item, idx) in items" :key="item.key" class="score-breakdown__row animate-stagger"
    :style="{ '--stagger-index': idx }">
    <span class="score-breakdown__icon">{{ item.icon }}</span>
    <span class="score-breakdown__label text-caption">{{ item.label }}</span>
    <div class="score-breakdown__bar-track">
      <div class="score-breakdown__bar-fill" :style="{
        width: `${$props[item.key]}%`,
        backgroundColor: scoreCssColor($props[item.key]),
        transitionDelay: `${idx * 100}ms`,
      }" />
    </div>
    <span class="score-breakdown__value text-caption">{{ $props[item.key] }}%</span>
  </div>
</div>
</template>

<style scoped>
.score-breakdown {
  width: 100%;
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.score-breakdown__row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.score-breakdown__icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.score-breakdown__label {
  width: 72px;
  flex-shrink: 0;
  color: var(--color-text-secondary);
}

.score-breakdown__bar-track {
  flex: 1;
  height: 8px;
  background: var(--color-lavender-light);
  border-radius: 4px;
  overflow: hidden;
}

.score-breakdown__bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

.score-breakdown__value {
  width: 36px;
  text-align: right;
  font-weight: 600;
  font-family: var(--font-phonetic);
}
</style>
