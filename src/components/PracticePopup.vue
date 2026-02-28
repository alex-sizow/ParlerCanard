<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { usePractice } from '@/composables/usePracticeSession'
import RecordButton from './RecordButton.vue'
import ScoreCircle from './ScoreCircle.vue'
import PhonemeGrid from './PhonemeGrid.vue'
import AudioVisualizer from './AudioVisualizer.vue'
import ScoreBreakdown from './ScoreBreakdown.vue'
import PlaybackWaveform from './PlaybackWaveform.vue'
import ReferencePlayer from './ReferencePlayer.vue'

defineProps<{ listenLabel?: string }>()

const {
  activeItem: item, show, analysis,
  isRecording, isProcessing, isSupported,
  recordedBlob, mediaStream, analyserNode, transcript,
  isPlaying, isSpeaking,
  isModelLoading, modelLoadProgress,
  listen, record, playRecording, stopPlayback, close,
} = usePractice()

/* ─── Swipe-to-close logic ─── */
const sheetRef = ref<HTMLElement | null>(null)
const dragOffset = ref(0)
const isDragging = ref(false)
const isSwipeClosing = ref(false)
let startY = 0
let currentY = 0

function onTouchStart(e: TouchEvent) {
  if (isSwipeClosing.value) return
  // Only allow drag from the header area (first 48px)
  const touch = e.touches[0]!
  const rect = sheetRef.value?.getBoundingClientRect()
  if (!rect) return
  const relY = touch.clientY - rect.top
  if (relY > 52) return // ignore if touch starts below header

  startY = touch.clientY
  currentY = startY
  isDragging.value = true
}

function onTouchMove(e: TouchEvent) {
  if (!isDragging.value) return
  currentY = e.touches[0]!.clientY
  const delta = currentY - startY
  // Only allow dragging down
  dragOffset.value = Math.max(0, delta)
}

function onTouchEnd() {
  if (!isDragging.value) return
  isDragging.value = false
  // If dragged more than 100px, animate slide-out then close
  if (dragOffset.value > 100) {
    swipeClose()
  } else {
    dragOffset.value = 0
  }
}

function swipeClose() {
  isSwipeClosing.value = true
  // Animate to full off-screen
  const sheetHeight = sheetRef.value?.offsetHeight ?? window.innerHeight
  dragOffset.value = sheetHeight + 40
  // Wait for the CSS transition to finish, then actually close
  setTimeout(() => {
    dragOffset.value = 0
    isSwipeClosing.value = false
    close()
  }, 320) // matches .sheet transition duration
}

function onOverlayClick() {
  close()
}

// Lock body scroll when open
watch(show, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})
onBeforeUnmount(() => { document.body.style.overflow = '' })
</script>

<template><!-- Overlay -->
<Teleport to="body">
  <transition name="sheet-overlay">
    <div v-if="show" class="sheet-overlay" @click="onOverlayClick" />
  </transition>

  <transition name="sheet-slide">
    <div v-if="show" ref="sheetRef" class="sheet"
      :class="{ 'sheet--dragging': isDragging, 'sheet--swipe-closing': isSwipeClosing }"
      :style="{ transform: `translateY(${dragOffset}px)` }" @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove" @touchend="onTouchEnd">

      <!-- Header: drag handle + close button -->
      <div class="sheet__header">
        <div class="sheet__handle" />
        <button class="sheet__close" aria-label="Close" @click="close">
          <van-icon name="cross" size="18" />
        </button>
      </div>

      <!-- Scrollable content -->
      <div v-if="item" class="sheet__body">
        <h2 class="text-h2 sheet__title">{{ item.text }}</h2>
        <p class="text-phonetic sheet__ipa">{{ item.ipa }}</p>
        <p class="text-caption sheet__translation">{{ item.translation }}</p>

        <ReferencePlayer :text="item.text" :is-speaking="isSpeaking" @play="listen" @stop="stopPlayback" />

        <slot name="extra" />

        <div class="sheet__recorder">
          <AudioVisualizer :is-active="isRecording" :stream="mediaStream" :analyser="analyserNode" />

          <div v-if="isModelLoading" class="sheet__model-loading surface-card">
            <p class="text-caption">Loading speech model (first time only)...</p>
            <van-progress :percentage="modelLoadProgress" stroke-width="6" color="var(--color-primary)" />
          </div>

          <RecordButton :is-recording="isRecording" :is-processing="isProcessing" :disabled="!isSupported"
            @press="record" />
        </div>

        <transition name="result-slide">
          <div v-if="transcript || recordedBlob" class="sheet__transcript surface-card">
            <p v-if="transcript" class="text-caption">You said:</p>
            <p v-if="transcript" class="text-body">{{ transcript }}</p>
            <PlaybackWaveform v-if="recordedBlob" :blob="recordedBlob" :is-playing="isPlaying" @play="playRecording"
              @stop="stopPlayback" />
          </div>
        </transition>

        <transition name="score-pop">
          <div v-if="analysis" class="sheet__results">
            <ScoreCircle :score="analysis.overallScore" />
            <ScoreBreakdown :accuracy="analysis.accuracyScore" :confidence="analysis.confidenceScore"
              :intonation="analysis.intonationScore" :fluency="analysis.fluencyScore" />
            <PhonemeGrid v-if="analysis.wordResults.length > 0" :results="analysis.wordResults" />
          </div>
        </transition>
      </div>
    </div>
  </transition>
</Teleport>
</template>

<style scoped>
.sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  -webkit-tap-highlight-color: transparent;
}

.sheet-overlay-enter-active {
  transition: opacity 0.35s ease;
}

.sheet-overlay-leave-active {
  transition: opacity 0.25s ease;
}

.sheet-overlay-enter-from,
.sheet-overlay-leave-to {
  opacity: 0;
}

.sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2001;
  height: 88dvh;
  max-height: 88dvh;
  background: var(--color-white);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.12);
  will-change: transform;
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  max-width: 480px;
  margin: 0 auto;
}

.sheet--dragging {
  transition: none !important;
}

.sheet--swipe-closing {
  transition: transform 0.3s cubic-bezier(0.4, 0, 1, 1) !important;
}

.sheet-slide-enter-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}

.sheet-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 1, 1);
}

.sheet-slide-enter-from,
.sheet-slide-leave-to {
  transform: translateY(100%) !important;
}

.sheet__header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px 8px;
  touch-action: none;
  cursor: grab;
  user-select: none;
}

.sheet__header:active {
  cursor: grabbing;
}

.sheet__handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--color-lavender);
  opacity: 0.55;
}

.sheet__close {
  position: absolute;
  right: 14px;
  top: 10px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.sheet__close:active {
  transform: scale(0.85);
  background: var(--color-lavender-light);
}

.sheet__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: var(--space-sm) var(--space-lg) calc(var(--space-xl) + env(safe-area-inset-bottom, 0px) + 24px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.sheet__title {
  margin: 0;
  text-align: center;
}

.sheet__ipa {
  margin: 0;
  color: var(--color-primary);
}

.sheet__translation {
  margin: 0 0 var(--space-xs);
}

.sheet__recorder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  width: 100%;
  margin-top: var(--space-sm);
}

.sheet__model-loading {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.sheet__transcript {
  width: 100%;
  padding: var(--space-md);
}

.sheet__results {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
  width: 100%;
}

.result-slide-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.result-slide-leave-active {
  transition: all 0.25s ease;
}

.result-slide-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.result-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.score-pop-enter-active {
  animation: bounce-in 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.score-pop-leave-active {
  transition: opacity 0.2s ease;
}

.score-pop-leave-to {
  opacity: 0;
}
</style>
