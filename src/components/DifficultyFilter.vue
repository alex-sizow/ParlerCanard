<script setup lang="ts">
import type { DifficultyFilter } from '@/data/types'
import { difficultyColors } from '@/data/constants'

const props = withDefaults(defineProps<{
  modelValue: DifficultyFilter
  counts?: Partial<Record<DifficultyFilter, number>>
  labels?: Partial<Record<DifficultyFilter, string>>
  useColoredTags?: boolean
}>(), {
  useColoredTags: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: DifficultyFilter]
}>()

const levels: { key: DifficultyFilter; label: string }[] = [
  { key: 'all', label: 'All Levels' },
  { key: 'beginner', label: 'Beginner' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced', label: 'Advanced' },
]

const getLabel = (key: DifficultyFilter) => props.labels?.[key] ?? levels.find(l => l.key === key)!.label
const getTagType = (key: DifficultyFilter) =>
  props.modelValue !== key ? 'default' : (props.useColoredTags && key !== 'all') ? difficultyColors[key] : 'primary'
</script>

<template>
<div class="difficulty-filter surface-card">
  <div class="difficulty-filter__row">
    <van-tag v-for="{ key } in levels" :key="key"
      :type="(getTagType(key) as 'primary' | 'success' | 'warning' | 'danger' | 'default')" :plain="modelValue !== key"
      round size="medium" class="difficulty-filter__tag" @click="emit('update:modelValue', key)">
      {{ getLabel(key) }}
      <van-badge v-if="counts?.[key] !== undefined" :content="String(counts[key])" class="difficulty-filter__badge" />
    </van-tag>
  </div>
</div>
</template>

<style scoped>
.difficulty-filter {
  padding: var(--space-md);
}

.difficulty-filter__row {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.difficulty-filter__tag {
  cursor: pointer;
  transition: all 0.2s ease;
}

.difficulty-filter__badge {
  margin-left: 4px;
}
</style>
