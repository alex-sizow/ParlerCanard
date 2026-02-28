<script setup lang="ts">
defineProps<{
  description?: string
}>()
</script>

<template>
<div class="empty-state animate-fade-in">
  <van-empty :description="description ?? 'No items found'" image="search" />
</div>
</template>

<style scoped>
.empty-state {
  padding: var(--space-xl) 0;
}
</style>
