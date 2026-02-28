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
  selectItem, closePractice, listenTo, handleRecord,
  isRecording, isProcessing, transcript, isSupported,
  recordedBlob, mediaStream, isPlaying, isSpeaking,
  playRecording, stopPlayback,
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
      <PracticeCard v-for="word in filteredWords" :key="word.id" :item="word" :is-learned="isWordLearned(word.id)"
        @listen="listenTo(word.text)" @record="selectItem(word)" @select="selectItem(word)" />
    </div>
  </div>

  <PracticePopup v-model:show="showPractice" :item="activeItem" :score="score" :word-results="wordResults"
    :is-recording="isRecording" :is-processing="isProcessing" :is-supported="isSupported" :recorded-blob="recordedBlob"
    :media-stream="mediaStream" :transcript="transcript" :is-playing="isPlaying" :is-speaking="isSpeaking"
    @close="closePractice" @listen="activeItem && listenTo(activeItem.text)" @record="handleRecord"
    @play-recording="playRecording" @stop-playback="stopPlayback" />
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
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-top: var(--space-md);
}
</style>
