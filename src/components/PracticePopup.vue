<script setup lang="ts">
import type { PracticeItem } from '@/data/types'
import type { WordResult } from '@/composables/usePronunciation'
import RecordButton from './RecordButton.vue'
import ScoreCircle from './ScoreCircle.vue'
import PhonemeGrid from './PhonemeGrid.vue'
import AudioVisualizer from './AudioVisualizer.vue'

defineProps<{
  show: boolean
  item: PracticeItem | null
  score: number | null
  wordResults: WordResult[]
  isRecording: boolean
  isProcessing: boolean
  isSupported: boolean
  recordedBlob: Blob | null
  mediaStream: MediaStream | null
  transcript: string
  isPlaying: boolean
  isSpeaking: boolean
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

<template><van-popup :show="show" position="bottom" round :style="{ maxHeight: maxHeight ?? '85vh' }" closeable
  @update:show="emit('update:show', $event)" @close="emit('close')">
  <div v-if="item" class="practice-popup">
    <h2 class="text-h2 practice-popup__title">{{ item.text }}</h2>
    <p class="text-phonetic practice-popup__ipa">{{ item.ipa }}</p>
    <p class="text-caption practice-popup__translation">{{ item.translation }}</p>

    <van-button type="primary" size="small" round icon="volume-o" :loading="isSpeaking" @click="emit('listen')">
      {{ listenLabel ?? 'Listen' }}
    </van-button>

    <slot name="extra" />

    <div class="practice-popup__recorder">
      <AudioVisualizer :is-active="isRecording" :stream="mediaStream" />
      <RecordButton :is-recording="isRecording" :is-processing="isProcessing" :disabled="!isSupported"
        @press="emit('record')" />
    </div>

    <div v-if="transcript || recordedBlob" class="practice-popup__transcript surface-card">
      <p v-if="transcript" class="text-caption">You said:</p>
      <p v-if="transcript" class="text-body">{{ transcript }}</p>
      <van-button v-if="recordedBlob" type="primary" plain size="small" round
        :icon="isPlaying ? 'pause-circle-o' : 'play-circle-o'" style="margin-top: 8px;"
        @click="isPlaying ? emit('stopPlayback') : emit('playRecording')">
        {{ isPlaying ? 'Stop' : 'Play My Recording' }}
      </van-button>
    </div>

    <div v-if="score !== null" class="practice-popup__results animate-fade-in">
      <ScoreCircle :score="score" />
      <PhonemeGrid v-if="wordResults.length > 0" :results="wordResults" />
    </div>
  </div>
</van-popup>
</template>

<style scoped>
.practice-popup {
  padding: var(--space-xl) var(--space-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  overflow-y: auto;
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

.practice-popup__recorder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  width: 100%;
  margin-top: var(--space-sm);
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
</style>
