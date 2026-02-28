<script setup lang="ts">
defineProps<{
  isRecording: boolean
  isProcessing: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  press: []
}>()
</script>

<template><button class="record-btn" :class="{
  'record-btn--recording': isRecording,
  'record-btn--processing': isProcessing,
  'record-btn--disabled': disabled,
}" :disabled="disabled || isProcessing" @click="emit('press')">
  <van-icon v-if="isProcessing" name="loading" size="28" class="record-btn__spinner" />
  <van-icon v-else-if="isRecording" name="stop-circle-o" size="28" />
  <van-icon v-else name="audio" size="28" />
  <span class="record-btn__label">
    {{ isProcessing ? 'Processing...' : isRecording ? 'Stop' : 'Record' }}
  </span>
</button>
</template>

<style scoped>
.record-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid var(--color-lavender);
  background: var(--color-white);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  font-family: var(--font-primary);
  font-size: 11px;
  font-weight: 500;
  box-shadow: var(--shadow-md);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.record-btn:active:not(.record-btn--disabled) {
  transform: scale(0.88);
  box-shadow: var(--shadow-sm);
}

.record-btn--recording {
  border-color: var(--color-accent);
  color: var(--color-accent);
  animation: pulse-recording 1.5s ease-in-out infinite;
  transform: scale(1.05);
}

.record-btn--recording:active {
  transform: scale(0.95) !important;
}

.record-btn--processing {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.record-btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.record-btn__label {
  line-height: 1;
}

.record-btn__spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
