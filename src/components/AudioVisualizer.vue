<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'

const props = defineProps<{
  isActive: boolean
  stream?: MediaStream | null
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationId: number | null = null
let analyser: AnalyserNode | null = null
let audioContext: AudioContext | null = null

function startVisualization() {
  if (!props.stream || !canvasRef.value) return

  audioContext = new AudioContext()
  analyser = audioContext.createAnalyser()
  analyser.fftSize = 256
  audioContext.createMediaStreamSource(props.stream).connect(analyser)

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const style = getComputedStyle(canvas)
  const bg = style.getPropertyValue('--color-surface').trim() || '#f8f6f0'
  const fg = style.getPropertyValue('--color-primary').trim() || 'oklch(0.55 0.15 250)'
  const data = new Uint8Array(analyser.frequencyBinCount)
  const slice = canvas.width / data.length

  function draw() {
    if (!analyser || !ctx) return
    animationId = requestAnimationFrame(draw)
    analyser.getByteTimeDomainData(data)

    ctx.fillStyle = bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.lineWidth = 2
    ctx.strokeStyle = fg
    ctx.beginPath()

    for (let i = 0; i < data.length; i++) {
      const y = (data[i] / 128.0) * canvas.height / 2
      i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(i * slice, y)
    }
    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.stroke()
  }
  draw()
}

function stopVisualization() {
  if (animationId) { cancelAnimationFrame(animationId); animationId = null }
  if (audioContext) { audioContext.close(); audioContext = null }
  analyser = null
}

watch(() => props.isActive, active => active ? startVisualization() : stopVisualization())
onBeforeUnmount(stopVisualization)
</script>

<template>
<div class="audio-visualizer" :class="{ 'audio-visualizer--active': isActive }">
  <canvas ref="canvasRef" class="audio-visualizer__canvas" width="300" height="60" />
  <div v-if="!isActive" class="audio-visualizer__idle">
    <div class="audio-visualizer__line" />
  </div>
</div>
</template>

<style scoped>
.audio-visualizer {
  position: relative;
  width: 100%;
  height: 60px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  overflow: hidden;
}

.audio-visualizer__canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.audio-visualizer__idle {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.audio-visualizer__line {
  width: 80%;
  height: 2px;
  background: var(--color-lavender);
  border-radius: 1px;
}

.audio-visualizer--active .audio-visualizer__idle {
  display: none;
}
</style>
