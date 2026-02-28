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
const { activeItem, selectItem, listenTo } = usePracticeSession<Sentence>({
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

      <transition-group name="card-list" tag="div" class="sentences-page__cards">
        <div v-for="(sentence, idx) in filteredSentences" :key="sentence.id"
          class="sentence-card surface-card-elevated animate-stagger"
          :class="{ 'sentence-card--completed': isSentenceCompleted(sentence.id) }" :style="{ '--stagger-index': idx }"
          @click="selectItem(sentence)">
          <div class="sentence-card__header">
            <van-tag :type="difficultyColors[sentence.difficulty]" round size="medium">
              {{ sentence.difficulty }}
            </van-tag>
            <transition name="check-pop">
              <van-icon v-if="isSentenceCompleted(sentence.id)" name="checked" color="var(--color-success)" size="20" />
            </transition>
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
      </transition-group>
    </div>
  </div>

  <PracticePopup listen-label="Listen Full Sentence">
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
  margin-top: var(--space-sm);
}

.sentences-page__cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.sentence-card {
  cursor: pointer;
  padding: var(--space-md);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.3s ease;
  will-change: transform;
}

.sentence-card:active {
  transform: scale(0.975);
  box-shadow: var(--shadow-sm);
}

.sentence-card--completed {
  border-left: 3px solid var(--color-success);
}

.sentence-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xs);
}

.sentence-card__text {
  margin: 0 0 2px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
}

.sentence-card__ipa {
  margin: 0 0 2px;
  color: var(--color-primary);
  font-size: 13px;
}

.sentence-card__translation {
  margin: 0 0 var(--space-sm);
  font-size: 13px;
  color: var(--color-text-secondary);
}

.sentence-card__actions {
  display: flex;
  gap: var(--space-xs);
}

.phrases-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.phrase-item {
  padding: var(--space-xs) var(--space-sm);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 1px;
  transition: background-color 0.2s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  -webkit-tap-highlight-color: transparent;
}

.phrase-item:active {
  background: var(--color-lavender-light);
  transform: scale(0.97);
}

.phrase-item__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
