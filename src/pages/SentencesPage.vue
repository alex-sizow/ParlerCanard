<script setup lang="ts">
import { useDifficulty } from '@/composables/useDifficulty'
import { useProgress } from '@/composables/useProgress'
import { usePracticeSession } from '@/composables/usePracticeSession'
import type { Sentence } from '@/data/sentences'
import { difficultyColors } from '@/data/constants'
import DifficultyFilter from '@/components/DifficultyFilter.vue'
import EmptyState from '@/components/EmptyState.vue'
import PracticePopup from '@/components/PracticePopup.vue'

const { sentenceDifficulty, filteredSentences, sentenceCounts } = useDifficulty()
const { markSentenceCompleted, isSentenceCompleted } = useProgress()

const {
  activeItem, showPractice, score, wordResults,
  selectItem, closePractice, listenTo, handleRecord,
  isRecording, isProcessing, transcript, isSupported,
  recordedBlob, mediaStream, isPlaying, isSpeaking,
  playRecording, stopPlayback,
} = usePracticeSession<Sentence>({
  itemType: 'sentence',
  markCompleted: markSentenceCompleted,
  speakRate: 0.75,
})
</script>

<template>
<div class="sentences-page">
  <van-nav-bar title="Practice Sentences" :border="false" />

  <div class="sentences-page__content">
    <DifficultyFilter v-model="sentenceDifficulty" :counts="sentenceCounts" />

    <div class="sentences-page__list">
      <EmptyState v-if="filteredSentences.length === 0" description="No sentences match this difficulty level" />

      <div v-for="sentence in filteredSentences" :key="sentence.id"
        class="sentence-card surface-card-elevated animate-fade-in"
        :class="{ 'sentence-card--completed': isSentenceCompleted(sentence.id) }" @click="selectItem(sentence)">
        <div class="sentence-card__header">
          <van-tag :type="difficultyColors[sentence.difficulty]" round size="medium">
            {{ sentence.difficulty }}
          </van-tag>
          <van-icon v-if="isSentenceCompleted(sentence.id)" name="checked" color="var(--color-success)" size="20" />
        </div>

        <p class="sentence-card__text text-h3">
          {{ sentence.text }}
        </p>
        <p class="sentence-card__ipa text-phonetic">
          {{ sentence.ipa }}
        </p>
        <p class="sentence-card__translation text-caption">
          {{ sentence.translation }}
        </p>

        <div class="sentence-card__actions">
          <van-button type="primary" size="small" round icon="volume-o" @click.stop="listenTo(sentence.text)">
            Listen
          </van-button>
          <van-button type="default" size="small" round icon="audio" @click.stop="selectItem(sentence)">
            Practice
          </van-button>
        </div>
      </div>
    </div>
  </div>

  <PracticePopup v-model:show="showPractice" :item="activeItem" :score="score" :word-results="wordResults"
    :is-recording="isRecording" :is-processing="isProcessing" :is-supported="isSupported" :recorded-blob="recordedBlob"
    :media-stream="mediaStream" :transcript="transcript" :is-playing="isPlaying" :is-speaking="isSpeaking"
    listen-label="Listen Full Sentence" max-height="90vh" @close="closePractice"
    @listen="activeItem && listenTo(activeItem.text)" @record="handleRecord" @play-recording="playRecording"
    @stop-playback="stopPlayback">
    <template v-if="activeItem" #extra>
      <div class="phrases-section">
        <h4 class="text-caption" style="margin: 0;">Phrase Breakdown:</h4>
        <div v-for="(phrase, i) in activeItem.phrases" :key="i" class="phrase-item surface-card"
          @click="listenTo(phrase.text, 0.7)">
          <div class="phrase-item__top">
            <span class="text-body">{{ phrase.text }}</span>
            <van-icon name="volume-o" size="16" color="var(--color-primary)" />
          </div>
          <span class="text-phonetic" style="font-size: 14px;">{{ phrase.ipa }}</span>
          <span class="text-caption">{{ phrase.translation }}</span>
        </div>
      </div>
    </template>
  </PracticePopup>
</div>
</template>

<style scoped>
.sentences-page__content {
  padding: 0 var(--space-md);
}

.sentences-page__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-top: var(--space-md);
}

.sentence-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.sentence-card:active {
  transform: scale(0.98);
}

.sentence-card--completed {
  border-left: 3px solid var(--color-success);
}

.sentence-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.sentence-card__text {
  margin: 0 0 var(--space-xs);
}

.sentence-card__ipa {
  margin: 0 0 var(--space-xs);
  color: var(--color-primary);
  font-size: 14px;
}

.sentence-card__translation {
  margin: 0 0 var(--space-md);
}

.sentence-card__actions {
  display: flex;
  gap: var(--space-sm);
}

.phrases-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.phrase-item {
  padding: var(--space-sm) var(--space-md);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: background-color 0.2s;
}

.phrase-item:active {
  background: var(--color-lavender-light);
}

.phrase-item__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
