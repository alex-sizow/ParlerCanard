<script setup lang="ts">
import type { PracticeItem } from '@/data/types'
import { difficultyColors } from '@/data/constants'

const props = defineProps<{ item: PracticeItem; isLearned?: boolean }>()
const emit = defineEmits<{ listen: []; record: []; select: [] }>()
</script>

<template>
<div class="practice-card surface-card-elevated" :class="{ 'practice-card--learned': props.isLearned }"
  @click="emit('select')">
  <div class="practice-card__header">
    <van-tag :type="(difficultyColors[props.item.difficulty] as 'success' | 'warning' | 'danger')" round size="medium">
      {{ props.item.difficulty }}
    </van-tag>
    <transition name="check-pop">
      <van-icon v-if="props.isLearned" name="checked" color="var(--color-success)" size="20" />
    </transition>
  </div>

  <h2 class="practice-card__text text-h2">
    {{ props.item.text }}
  </h2>

  <p class="practice-card__ipa text-phonetic">
    {{ props.item.ipa }}
  </p>

  <p class="practice-card__translation text-caption">
    {{ props.item.translation }}
  </p>

  <div class="practice-card__actions">
    <van-button type="primary" size="small" round icon="volume-o" @click.stop="emit('listen')">
      Listen
    </van-button>
    <van-button type="default" size="small" round icon="audio" @click.stop="emit('record')">
      Record
    </van-button>
  </div>
</div>
</template>

<style scoped>
.practice-card {
  cursor: pointer;
  padding: var(--space-md);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.3s ease;
  will-change: transform;
}

.practice-card:active {
  transform: scale(0.975);
  box-shadow: var(--shadow-sm);
}

.practice-card--learned {
  border-left: 3px solid var(--color-success);
}

.practice-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xs);
}

.practice-card__text {
  margin: 0 0 2px;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
}

.practice-card__ipa {
  margin: 0 0 2px;
  color: var(--color-primary);
  font-size: 15px;
}

.practice-card__translation {
  margin: 0 0 var(--space-sm);
  font-size: 13px;
}

.practice-card__actions {
  display: flex;
  gap: var(--space-xs);
}
</style>
