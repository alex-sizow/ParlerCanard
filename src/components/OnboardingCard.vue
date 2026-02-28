<script setup lang="ts">
import { ref } from 'vue'
import { usePersistence } from '@/composables/usePersistence'

const state = usePersistence('parlercanard-onboarding', { dismissed: false })
const isDismissed = ref(state.dismissed)
const steps = [
  { action: '👂 Listen', desc: 'to the native pronunciation' },
  { action: '🎤 Record', desc: 'your own duck... er, French accent' },
  { action: '🎯 Review', desc: 'your accuracy score' },
  { action: '🦆 Improve', desc: 'quack by quack!' },
]

function dismiss() {
  isDismissed.value = true
  state.dismissed = true
}
</script>

<template>
<div v-if="!isDismissed" class="onboarding surface-card-elevated animate-fade-in">
  <div class="onboarding__header">
    <h3 class="onboarding__title">Welcome to ParlerCanard!</h3>
    <van-icon name="cross" size="18" color="var(--color-text-secondary)" class="onboarding__close" @click="dismiss" />
  </div>

  <p class="onboarding__subtitle">Master French pronunciation in 4 steps:</p>

  <div class="onboarding__steps">
    <div v-for="(step, i) in steps" :key="i" class="onboarding__step">
      <div class="onboarding__step-num">{{ i + 1 }}</div>
      <div><strong>{{ step.action }}</strong> {{ step.desc }}</div>
    </div>
  </div>

  <p class="onboarding__tip">Tip: Allow microphone access for speech recognition.</p>

  <van-button type="primary" round block size="small" @click="dismiss">Get Started</van-button>
</div>
</template>

<style scoped>
.onboarding {
  margin-bottom: var(--space-sm);
}

.onboarding__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.onboarding__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.onboarding__close {
  cursor: pointer;
  padding: 2px;
}

.onboarding__subtitle {
  margin: 4px 0 var(--space-sm);
  font-size: 14px;
  color: var(--color-text-secondary);
}

.onboarding__steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.onboarding__step {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 13px;
}

.onboarding__step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-primary);
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 11px;
  flex-shrink: 0;
}

.onboarding__tip {
  margin-bottom: var(--space-sm);
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>
