<script setup lang="ts">
import type { PracticeItem } from '@/data/types'
import type { WordResult } from '@/composables/usePronunciation'
import RecordButton from './RecordButton.vue'
import ScoreCircle from './ScoreCircle.vue'
import PhonemeGrid from './PhonemeGrid.vue'
import AudioVisualizer from './AudioVisualizer.vue'
import ScoreBreakdown from './ScoreBreakdown.vue'

defineProps<{
  show: boolean
  item: PracticeItem | null
  score: number | null
  wordResults: WordResult[]
  accuracyScore: number | null
  confidenceScore: number | null
  intonationScore: number | null
  fluencyScore: number | null
  isRecording: boolean
  isProcessing: boolean
  isSupported: boolean
  recordedBlob: Blob | null
  mediaStream: MediaStream | null
  analyserNode: AnalyserNode | null
  transcript: string
  isPlaying: boolean
  isSpeaking: boolean
  isModelLoading?: boolean
  modelLoadProgress?: number
  listenLabel?: string
  maxHeight?: string
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  close: []
  listen: []
  record: []
  playRecording: []
  stopPlayback: []
}>()
</script>

<template><van-popup :show="show" position="bottom" round :style="{ height: maxHeight ?? '92vh', maxHeight: '92vh' }" closeable
  class="practice-popup-shell" @update:show="emit('update:show', $event)" @close="emit('close')">
  <div v-if="item" class="practice-popup">
    <h2 class="text-h2 practice-popup__title animate-fade-in-up">{{ item.text }}</h2>
    <p class="text-phonetic practice-popup__ipa animate-fade-in-up" style="animation-delay: 50ms;">{{ item.ipa }}</p>
    <p class="text-caption practice-popup__translation animate-fade-in-up" style="animation-delay: 100ms;">{{
      item.translation }}</p>

    <div class="practice-popup__listen-btn animate-scale-in" style="animation-delay: 150ms;">
      <van-button type="primary" size="small" round icon="volume-o" :loading="isSpeaking" @click="emit('listen')">
        {{ listenLabel ?? 'Listen' }}
      </van-button>
    </div>

    <slot name="extra" />

    <div class="practice-popup__recorder">
      <AudioVisualizer :is-active="isRecording" :stream="mediaStream" :analyser="analyserNode" />

      <div v-if="isModelLoading" class="practice-popup__model-loading surface-card animate-fade-in">
        <p class="text-caption">Loading speech model (first time only)...</p>
        <van-progress :percentage="modelLoadProgress ?? 0" stroke-width="6" color="var(--color-primary)" />
      </div>

      <RecordButton :is-recording="isRecording" :is-processing="isProcessing" :disabled="!isSupported"
        @press="emit('record')" />
    </div>

    <transition name="result-slide">
      <div v-if="transcript || recordedBlob" class="practice-popup__transcript surface-card">
        <p v-if="transcript" class="text-caption">You said:</p>
        <p v-if="transcript" class="text-body">{{ transcript }}</p>
        <van-button v-if="recordedBlob" type="primary" plain size="small" round
          :icon="isPlaying ? 'pause-circle-o' : 'play-circle-o'" style="margin-top: 8px;"
          @click="isPlaying ? emit('stopPlayback') : emit('playRecording')">
          {{ isPlaying ? 'Stop' : 'Play My Recording' }}
        </van-button>
      </div>
    </transition>

    <transition name="score-pop">
      <div v-if="score !== null" class="practice-popup__results">
        <ScoreCircle :score="score" />
        <ScoreBreakdown v-if="accuracyScore !== null" :accuracy="accuracyScore!" :confidence="confidenceScore!"
          :intonation="intonationScore!" :fluency="fluencyScore!" />
        <PhonemeGrid v-if="wordResults.length > 0" :results="wordResults" />
      </div>
    </transition>
  </div>
</van-popup>
</template>

<style scoped>
.practice-popup {
  padding: var(--space-xl) var(--space-lg);
  padding-bottom: calc(var(--space-xl) + env(safe-area-inset-bottom, 0px) + 24px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  height: 100%;
  /* Prevent layout shift — always fill the popup height */
  min-height: 0;
}

.practice-popup__title {
  margin: 0;
  text-align: center;
}

.practice-popup__ipa {
  margin: 0;
  color: var(--color-primary);
}

.practice-popup__translation {
  margin: 0 0 var(--space-sm);
}

.practice-popup__listen-btn {
  animation-fill-mode: both;
}

.practice-popup__recorder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  width: 100%;
  margin-top: var(--space-sm);
}

.practice-popup__model-loading {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.practice-popup__transcript {
  width: 100%;
  padding: var(--space-md);
}

.practice-popup__results {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
  width: 100%;
}

/* Result slide-in transition */
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

/* Score pop-in transition */
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
