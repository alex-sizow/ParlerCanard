<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue'

const props = defineProps<{
  text: string
  isSpeaking: boolean
}>()

const emit = defineEmits<{
  play: []
  stop: []
}>()

const BAR_COUNT = 40
const progress = ref(0)
let animationId: number | null = null
let startTime = 0

/**
 * Generate deterministic waveform heights from text.
 * Uses a simple hash so the same text always produces the same pattern,
 * but different texts look visually distinct.
 */
const bars = computed(() => {
  const text = props.text
  const result: number[] = []

  // Simple seed from text
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0
  }

  for (let i = 0; i < BAR_COUNT; i++) {
    // LCG pseudo-random from hash + index
    hash = (hash * 1103515245 + 12345) | 0
    const v = ((hash >>> 16) & 0x7fff) / 0x7fff

    // Shape: louder in the middle, quieter at edges (speech-like envelope)
    const pos = i / BAR_COUNT
    const envelope = Math.sin(pos * Math.PI) * 0.6 + 0.4
    result.push(Math.max(0.08, v * envelope))
  }

  // Normalize to 0..1
  const max = Math.max(...result)
  return result.map(v => v / max)
})

// Estimated duration: ~60ms per character at rate 0.85
const estimatedDuration = computed(() => Math.max(1, props.text.length * 0.06))

function startAnimation() {
  startTime = performance.now()
  progress.value = 0

  function step() {
    if (!props.isSpeaking) return
    const elapsed = (performance.now() - startTime) / 1000
    progress.value = Math.min(elapsed / estimatedDuration.value, 1)

    if (progress.value < 1) {
      animationId = requestAnimationFrame(step)
    }
  }

  animationId = requestAnimationFrame(step)
}

function stopAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  // Reset when done
  progress.value = 0
}

function handleClick() {
  if (props.isSpeaking) {
    emit('stop')
  } else {
    emit('play')
  }
}

watch(() => props.isSpeaking, (speaking) => {
  if (speaking) startAnimation()
  else stopAnimation()
})

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId)
})
</script>

<template>
<div class="ref-player" @click="handleClick">
  <button class="ref-player__btn" :class="{ 'ref-player__btn--speaking': isSpeaking }">
    <van-icon :name="isSpeaking ? 'pause-circle-o' : 'volume-o'" size="22" />
  </button>

  <div class="ref-player__bars">
    <span v-for="(h, i) in bars" :key="i" class="ref-player__bar" :class="{
      'ref-player__bar--active': isSpeaking && (i / BAR_COUNT) <= progress,
      'ref-player__bar--idle': !isSpeaking,
    }" :style="{ height: `${4 + h * 28}px` }" />
  </div>

  <span class="ref-player__label text-caption">Référence</span>
</div>
</template>

<style scoped>
.ref-player {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  transition: background 0.2s ease;
}

.ref-player:active {
  background: var(--color-lavender-light, #eae8f0);
}

.ref-player__btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--color-primary);
  color: var(--color-white);
  cursor: pointer;
  transition: transform 0.15s ease, background 0.2s ease;
}

.ref-player__btn:active {
  transform: scale(0.9);
}

.ref-player__btn--speaking {
  background: var(--color-accent);
}

.ref-player__bars {
  flex: 1;
  height: 36px;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 2px;
}

.ref-player__bar {
  flex: 1;
  min-width: 2px;
  max-width: 4px;
  border-radius: 1.5px;
  background: var(--color-lavender);
  transition: background 0.15s ease;
}

.ref-player__bar--active {
  background: var(--color-primary);
}

.ref-player__bar--idle {
  opacity: 0.7;
}

.ref-player__label {
  flex-shrink: 0;
  color: var(--color-text-secondary);
  font-size: 11px;
}
</style>
