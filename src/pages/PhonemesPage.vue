<script setup lang="ts">
import { ref, computed } from 'vue'
import { phonemes } from '@/data/phonemes'
import type { Phoneme } from '@/data/phonemes'
import { useAudio } from '@/composables/useAudio'
import { showToast } from 'vant'

const { speak, isSpeaking } = useAudio()

const activeCategory = ref<string>('all')

const categories = [
  { key: 'all', label: 'All' },
  { key: 'vowel', label: 'Vowels' },
  { key: 'nasal', label: 'Nasals' },
  { key: 'consonant', label: 'Consonants' },
  { key: 'semi-vowel', label: 'Semi-vowels' },
]

const filteredPhonemes = computed(() => {
  if (activeCategory.value === 'all') return phonemes
  return phonemes.filter(p => p.category === activeCategory.value)
})

const selectedPhoneme = ref<Phoneme | null>(null)
const showDetail = ref(false)

function selectPhoneme(phoneme: Phoneme) {
  selectedPhoneme.value = phoneme
  showDetail.value = true
}

async function listenExample(phoneme: Phoneme) {
  try {
    await speak(phoneme.example, 0.7)
  } catch {
    showToast({ message: 'Audio playback failed', type: 'fail' })
  }
}

const categoryColors: Record<string, string> = {
  vowel: 'var(--color-primary)',
  nasal: 'var(--color-accent)',
  consonant: 'var(--color-success)',
  'semi-vowel': 'var(--color-warning)',
}
</script>

<template>
<div class="phonemes-page">
  <van-nav-bar title="🦆 Phoneme Library" :border="false" />

  <div class="phonemes-page__content">
    <!-- Category Filter -->
    <div class="phonemes-page__filter surface-card">
      <van-tag v-for="cat in categories" :key="cat.key" :type="activeCategory === cat.key ? 'primary' : 'default'"
        :plain="activeCategory !== cat.key" round size="medium" class="phonemes-page__tag"
        @click="activeCategory = cat.key">
        {{ cat.label }}
      </van-tag>
    </div>

    <!-- Phoneme Grid -->
    <div class="phonemes-page__grid">
      <div v-for="phoneme in filteredPhonemes" :key="phoneme.symbol" class="phoneme-tile surface-card animate-fade-in"
        @click="selectPhoneme(phoneme)">
        <span class="phoneme-tile__symbol" :style="{ color: categoryColors[phoneme.category] ?? 'var(--color-text)' }">
          {{ phoneme.symbol }}
        </span>
        <span class="phoneme-tile__example text-caption">
          {{ phoneme.example }}
        </span>
      </div>
    </div>
  </div>

  <!-- Detail Popup -->
  <van-popup v-model:show="showDetail" position="bottom" round :style="{ maxHeight: '70vh' }" closeable>
    <div v-if="selectedPhoneme" class="phoneme-detail">
      <div class="phoneme-detail__symbol"
        :style="{ color: categoryColors[selectedPhoneme.category] ?? 'var(--color-text)' }">
        {{ selectedPhoneme.symbol }}
      </div>

      <van-tag :type="selectedPhoneme.category === 'vowel' ? 'primary'
        : selectedPhoneme.category === 'nasal' ? 'danger'
          : selectedPhoneme.category === 'consonant' ? 'success'
            : 'warning'" round size="medium">
        {{ selectedPhoneme.category }}
      </van-tag>

      <p class="text-body phoneme-detail__desc">
        {{ selectedPhoneme.description }}
      </p>

      <div class="phoneme-detail__example surface-card">
        <div class="phoneme-detail__example-row">
          <span class="text-h3">{{ selectedPhoneme.example }}</span>
          <span class="text-phonetic">{{ selectedPhoneme.exampleIpa }}</span>
        </div>
        <van-button type="primary" size="small" round icon="volume-o" :loading="isSpeaking"
          @click="listenExample(selectedPhoneme!)">
          Listen
        </van-button>
      </div>

      <div class="phoneme-detail__tip surface-card">
        <h4 class="text-caption" style="margin: 0 0 4px; font-weight: 600; color: var(--color-text);">
          💡 Articulation Tip
        </h4>
        <p class="text-body" style="margin: 0;">
          {{ selectedPhoneme.articulationTip }}
        </p>
      </div>
    </div>
  </van-popup>
</div>
</template>

<style scoped>
.phonemes-page__content {
  padding: 0 var(--space-md);
}

.phonemes-page__filter {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
  padding: var(--space-md);
}

.phonemes-page__tag {
  cursor: pointer;
}

.phonemes-page__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-sm);
  margin-top: var(--space-md);
}

.phoneme-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md) var(--space-sm);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-align: center;
}

.phoneme-tile:active {
  transform: scale(0.95);
}

.phoneme-tile__symbol {
  font-family: var(--font-phonetic);
  font-size: 24px;
  font-weight: 500;
  line-height: 1;
}

.phoneme-tile__example {
  font-size: 12px;
}

.phoneme-detail {
  padding: var(--space-xl) var(--space-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.phoneme-detail__symbol {
  font-family: var(--font-phonetic);
  font-size: 56px;
  font-weight: 500;
  line-height: 1;
}

.phoneme-detail__desc {
  text-align: center;
  margin: 0;
  color: var(--color-text-secondary);
}

.phoneme-detail__example {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
}

.phoneme-detail__example-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-md);
}

.phoneme-detail__tip {
  width: 100%;
  padding: var(--space-md);
}
</style>
