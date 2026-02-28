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
  <van-nav-bar title="Phoneme Library" :border="false" />

  <div class="phonemes-page__content">
    <!-- Category Filter -->
    <div class="phonemes-page__filter">
      <van-tag v-for="cat in categories" :key="cat.key" :type="activeCategory === cat.key ? 'primary' : 'default'"
        :plain="activeCategory !== cat.key" round size="medium" class="phonemes-page__tag"
        @click="activeCategory = cat.key">
        {{ cat.label }}
      </van-tag>
    </div>

    <!-- Phoneme Grid -->
    <div class="phonemes-page__grid">
      <div v-for="(phoneme, idx) in filteredPhonemes" :key="phoneme.symbol"
        class="phoneme-tile surface-card animate-stagger" :style="{ '--stagger-index': idx }"
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
  <van-popup v-model:show="showDetail" position="bottom" round :style="{ maxHeight: '60vh' }" closeable>
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

      <p class="phoneme-detail__desc">
        {{ selectedPhoneme.description }}
      </p>

      <div class="phoneme-detail__example surface-card">
        <div class="phoneme-detail__example-row">
          <span class="phoneme-detail__example-word">{{ selectedPhoneme.example }}</span>
          <span class="text-phonetic" style="font-size: 14px;">{{ selectedPhoneme.exampleIpa }}</span>
        </div>
        <van-button type="primary" size="mini" round icon="volume-o" :loading="isSpeaking"
          @click="listenExample(selectedPhoneme!)">
          Listen
        </van-button>
      </div>

      <div class="phoneme-detail__tip surface-card">
        <h4 class="section-label" style="margin: 0 0 2px;">Articulation Tip</h4>
        <p class="phoneme-detail__tip-text">
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
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.phonemes-page__tag {
  cursor: pointer;
}

.phonemes-page__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-top: var(--space-sm);
}

.phoneme-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--space-sm) var(--space-xs);
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
  text-align: center;
  -webkit-tap-highlight-color: transparent;
}

.phoneme-tile:active {
  transform: scale(0.9);
  box-shadow: var(--shadow-sm);
}

.phoneme-tile__symbol {
  font-family: var(--font-phonetic);
  font-size: 20px;
  font-weight: 500;
  line-height: 1;
}

.phoneme-tile__example {
  font-size: 11px;
}

.phoneme-detail {
  padding: var(--space-lg) var(--space-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
}

.phoneme-detail__symbol {
  font-family: var(--font-phonetic);
  font-size: 40px;
  font-weight: 500;
  line-height: 1;
}

.phoneme-detail__desc {
  text-align: center;
  margin: 0;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.phoneme-detail__example {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm);
}

.phoneme-detail__example-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-sm);
}

.phoneme-detail__example-word {
  font-size: 17px;
  font-weight: 600;
}

.phoneme-detail__tip {
  width: 100%;
  padding: var(--space-sm);
}

.phoneme-detail__tip-text {
  margin: 0;
  font-size: 14px;
}
</style>
