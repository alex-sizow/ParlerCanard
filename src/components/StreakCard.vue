<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  currentStreak: number
  bestStreak: number
}>()

const cards = computed(() => [
  { icon: '🦆', value: props.currentStreak, label: 'Current Streak' },
  { icon: '🏆', value: props.bestStreak, label: 'Best Streak' },
])
</script>

<template>
<div class="streak-cards">
  <div v-for="card in cards" :key="card.label" class="streak-card surface-card-elevated">
    <span class="streak-card__icon">{{ card.icon }}</span>
    <div class="streak-card__content">
      <span class="streak-card__value">{{ card.value }}</span>
      <span class="streak-card__label text-caption">{{ card.label }}</span>
    </div>
  </div>
</div>
</template>

<style scoped>
.streak-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-sm);
}

.streak-card {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
}

.streak-card__icon {
  font-size: 24px;
  line-height: 1;
}

.streak-card__content {
  display: flex;
  flex-direction: column;
}

.streak-card__value {
  font-family: var(--font-primary);
  font-weight: 700;
  font-size: 22px;
  line-height: 1;
  color: var(--color-text);
}

.streak-card__label {
  margin-top: 1px;
  font-size: 12px;
}
</style>
