<script setup lang="ts">
import { ref, watch, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps<{
  blob: Blob | null
  isPlaying?: boolean
}>()

const emit = defineEmits<{
  play: []
  stop: []
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const waveformReady = ref(false)
const decodeFailed = ref(false)
const progress = ref(0)
const audioDuration = ref(0)

let audioBuffer: AudioBuffer | null = null
let animationId: number | null = null
let playStartTime = 0

function formatTime(seconds: number): string {
  const s = Math.round(seconds)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// Downsample audio data into bars for drawing
function getSamples(buffer: AudioBuffer, barCount: number): number[] {
  const raw = buffer.getChannelData(0)
  const blockSize = Math.floor(raw.length / barCount)
  const samples: number[] = []

  for (let i = 0; i < barCount; i++) {
    let sum = 0
    const start = i * blockSize
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(raw[start + j]!)
    }
    samples.push(sum / blockSize)
  }

  // Normalize
  const max = Math.max(...samples, 0.01)
  return samples.map(s => s / max)
}

function drawWaveform(progressFraction = 0) {
  const canvas = canvasRef.value
  if (!canvas || !audioBuffer) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const w = rect.width
  const h = rect.height
  const barGap = 2
  const barWidth = 3
  const barCount = Math.floor(w / (barWidth + barGap))

  const samples = getSamples(audioBuffer, barCount)

  const style = getComputedStyle(canvas)
  const primary = style.getPropertyValue('--color-primary').trim() || 'oklch(0.55 0.15 250)'
  const muted = style.getPropertyValue('--color-lavender').trim() || '#c4c0d4'

  ctx.clearRect(0, 0, w, h)

  const progressBar = Math.floor(progressFraction * barCount)

  for (let i = 0; i < samples.length; i++) {
    const barH = Math.max(2, samples[i]! * (h - 4))
    const x = i * (barWidth + barGap)
    const y = (h - barH) / 2

    ctx.fillStyle = i <= progressBar && progressFraction > 0 ? primary : muted
    ctx.beginPath()
    ctx.roundRect(x, y, barWidth, barH, 1.5)
    ctx.fill()
  }
}

async function decodeBlob(blob: Blob) {
  decodeFailed.value = false
  try {
    const arrayBuffer = await blob.arrayBuffer()
    const audioCtx = new AudioContext()
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
    audioDuration.value = audioBuffer.duration
    await audioCtx.close()

    waveformReady.value = true
    await nextTick()
    drawWaveform(0)
  } catch {
    // Fallback: show simple play button if decoding fails
    waveformReady.value = false
    decodeFailed.value = true

    // Try to get duration via Audio element
    try {
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      await new Promise<void>((resolve) => {
        audio.onloadedmetadata = () => {
          audioDuration.value = audio.duration
          resolve()
        }
        audio.onerror = () => resolve()
      })
      URL.revokeObjectURL(url)
    } catch { /* ignore */ }
  }
}

// Animate progress during playback
function startProgressAnimation() {
  playStartTime = performance.now()
  progress.value = 0

  function step() {
    if (!props.isPlaying) return
    const elapsed = (performance.now() - playStartTime) / 1000
    progress.value = Math.min(elapsed / (audioDuration.value || 1), 1)
    drawWaveform(progress.value)

    if (progress.value < 1) {
      animationId = requestAnimationFrame(step)
    }
  }

  animationId = requestAnimationFrame(step)
}

function stopProgressAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  // Keep the progress where it stopped, redraw
  drawWaveform(progress.value >= 0.98 ? 0 : progress.value)
  if (progress.value >= 0.98) progress.value = 0
}

function handleClick() {
  if (props.isPlaying) {
    emit('stop')
  } else {
    progress.value = 0
    drawWaveform(0)
    emit('play')
  }
}

watch(() => props.blob, (blob) => {
  waveformReady.value = false
  decodeFailed.value = false
  audioBuffer = null
  progress.value = 0
  if (blob) decodeBlob(blob)
}, { immediate: true })

watch(() => props.isPlaying, (playing) => {
  if (playing) {
    startProgressAnimation()
  } else {
    stopProgressAnimation()
  }
})

// Redraw on resize
let resizeObserver: ResizeObserver | null = null

watch(canvasRef, (canvas) => {
  if (resizeObserver) resizeObserver.disconnect()
  if (!canvas) return
  resizeObserver = new ResizeObserver(() => drawWaveform(progress.value))
  resizeObserver.observe(canvas)
})

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<template>
<div v-if="waveformReady || decodeFailed" class="playback-waveform" @click="handleClick">
  <button class="playback-waveform__btn" :class="{ 'playback-waveform__btn--playing': isPlaying }">
    <van-icon :name="isPlaying ? 'pause-circle-o' : 'play-circle-o'" size="24" />
  </button>
  <canvas v-if="waveformReady" ref="canvasRef" class="playback-waveform__canvas" />
  <div v-else class="playback-waveform__bars">
    <span v-for="i in 24" :key="i" class="playback-waveform__bar"
      :style="{ height: `${10 + Math.sin(i * 0.7) * 14 + Math.random() * 8}px` }" />
  </div>
  <span class="playback-waveform__time text-caption">
    {{ formatTime(isPlaying ? progress * audioDuration : audioDuration) }}
  </span>
</div>
</template>

<style scoped>
.playback-waveform {
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

.playback-waveform:active {
  background: var(--color-lavender-light, #eae8f0);
}

.playback-waveform__btn {
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

.playback-waveform__btn:active {
  transform: scale(0.9);
}

.playback-waveform__btn--playing {
  background: var(--color-accent);
}

.playback-waveform__canvas {
  flex: 1;
  height: 40px;
  min-width: 0;
}

.playback-waveform__bars {
  flex: 1;
  height: 40px;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 2px;
}

.playback-waveform__bar {
  flex: 1;
  min-width: 2px;
  max-width: 4px;
  border-radius: 1.5px;
  background: var(--color-lavender);
  transition: background 0.2s ease;
}

.playback-waveform__time {
  flex-shrink: 0;
  min-width: 32px;
  text-align: right;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}
</style>
