<script setup lang="ts">
import { useDifficulty } from '@/composables/useDifficulty'
import { useProgress } from '@/composables/useProgress'
import { usePracticeSession } from '@/composables/usePracticeSession'
import type { Word } from '@/data/words'
import DifficultyFilter from '@/components/DifficultyFilter.vue'
import PracticeCard from '@/components/PracticeCard.vue'
import OnboardingCard from '@/components/OnboardingCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import PracticePopup from '@/components/PracticePopup.vue'

const { wordDifficulty, filteredWords, wordCounts } = useDifficulty()
const { markWordLearned, isWordLearned } = useProgress()

const {
  activeItem, showPractice, score, wordResults,
  accuracyScore, confidenceScore, intonationScore, fluencyScore,
  selectItem, closePractice, listenTo, handleRecord,
  isRecording, isProcessing, transcript, isSupported,
  recordedBlob, mediaStream, analyserNode, isPlaying, isSpeaking,
  playRecording, stopPlayback,
  isModelLoading, modelLoadProgress,
} = usePracticeSession<Word>({
  itemType: 'word',
  markCompleted: markWordLearned,
})
</script>

<template>
<div class="words-page">
  <van-nav-bar title="🦆 Practice Words" :border="false" />

  <div class="words-page__content">
    <OnboardingCard />

    <DifficultyFilter v-model="wordDifficulty" :counts="wordCounts" />

    <div v-if="!isSupported" class="words-page__warning surface-card">
      <van-icon name="warning-o" color="var(--color-warning)" size="20" />
      <span class="text-caption">Speech recognition is not supported in this browser. Try Chrome, Edge, or
        Safari.</span>
    </div>

    <div class="words-page__list">
      <EmptyState v-if="filteredWords.length === 0" description="No words match this difficulty level" />
      <transition-group name="card-list" tag="div" class="words-page__cards">
        <PracticeCard v-for="(word, idx) in filteredWords" :key="word.id" :item="word"
          :is-learned="isWordLearned(word.id)" class="animate-stagger" :style="{ '--stagger-index': idx }"
          @listen="listenTo(word.text)" @record="selectItem(word)" @select="selectItem(word)" />
      </transition-group>
    </div>
  </div>

  <PracticePopup v-model:show="showPractice" :item="activeItem" :score="score" :word-results="wordResults"
    :accuracy-score="accuracyScore" :confidence-score="confidenceScore" :intonation-score="intonationScore"
    :fluency-score="fluencyScore" :is-recording="isRecording" :is-processing="isProcessing" :is-supported="isSupported"
    :recorded-blob="recordedBlob" :media-stream="mediaStream" :analyser-node="analyserNode" :transcript="transcript"
    :is-playing="isPlaying" :is-speaking="isSpeaking" :is-model-loading="isModelLoading"
    :model-load-progress="modelLoadProgress" @close="closePractice" @listen="activeItem && listenTo(activeItem.text)"
    @record="handleRecord" @play-recording="playRecording" @stop-playback="stopPlayback" />
</div>
</template>

<style scoped>
.words-page__content {
  padding: 0 var(--space-md);
}

.words-page__warning {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
}

.words-page__list {
  margin-top: var(--space-md);
}

.words-page__cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* Card list transitions */
.card-list-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.card-list-leave-active {
  transition: all 0.3s ease;
}

.card-list-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.96);
}

.card-list-leave-to {
  opacity: 0;
  transform: translateX(-100%) scale(0.9);
}

.card-list-move {
  transition: transform 0.35s ease;
}
</style>
