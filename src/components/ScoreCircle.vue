<script setup lang="ts">
import { computed } from 'vue'
import { scoreCssColor, SCORE_THRESHOLDS } from '@/data/constants'

const props = defineProps<{ score: number; size?: number }>()
const color = computed(() => scoreCssColor(props.score))
const label = computed(() =>
  props.score >= SCORE_THRESHOLDS.excellent ? 'Excellent!' : props.score >= SCORE_THRESHOLDS.good ? 'Good' : 'Keep trying',
)
</script>

<template>
<div class="score-circle">
  <van-circle :current-rate="props.score" :rate="100" :size="props.size ?? 100" :color="color"
    layer-color="var(--color-lavender-light)" :stroke-width="60" :speed="80">
    <div class="score-circle__content">
      <span class="score-circle__value">{{ props.score }}%</span>
      <span class="score-circle__label">{{ label }}</span>
    </div>
  </van-circle>
</div>
</template>

<style scoped>
.score-circle {
  display: flex;
  justify-content: center;
}

.score-circle__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.score-circle__value,
.score-circle__label {
  font-family: var(--font-primary);
}

.score-circle__value {
  font-weight: 700;
  font-size: 22px;
  color: var(--color-text);
}

.score-circle__label {
  font-size: 11px;
  color: var(--color-text-secondary);
}
</style>
