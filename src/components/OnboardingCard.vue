<script setup lang="ts">
import { ref } from 'vue'

const STORAGE_KEY = 'parlercanard-onboarding-dismissed'
const isDismissed = ref(localStorage.getItem(STORAGE_KEY) === 'true')
const steps = [
  { action: '👂 Listen', desc: 'to the native pronunciation' },
  { action: '🎤 Record', desc: 'your own duck... er, French accent' },
  { action: '🎯 Review', desc: 'your accuracy score' },
  { action: '🦆 Improve', desc: 'quack by quack!' },
]

function dismiss() {
  isDismissed.value = true
  localStorage.setItem(STORAGE_KEY, 'true')
}
</script>

<template>
<div v-if="!isDismissed" class="onboarding surface-card-elevated animate-fade-in">
  <div class="onboarding__header">
    <h3 class="text-h3">Welcome to ParlerCanard! 🦆</h3>
    <van-icon name="cross" size="20" color="var(--color-text-secondary)" class="onboarding__close" @click="dismiss" />
  </div>

  <p class="text-body onboarding__subtitle">Master French pronunciation in 4 simple steps:</p>

  <div class="onboarding__steps">
    <div v-for="(step, i) in steps" :key="i" class="onboarding__step">
      <div class="onboarding__step-num">{{ i + 1 }}</div>
      <div><strong>{{ step.action }}</strong> {{ step.desc }}</div>
    </div>
  </div>

  <p class="text-caption onboarding__tip">🦆 Tip: Allow microphone access so we can hear you quack!</p>

  <van-button type="primary" round block @click="dismiss">Let's Quack!</van-button>
</div>
</template>

<style scoped>
.onboarding {
  margin-bottom: var(--space-md);
}

.onboarding__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.onboarding__header h3 {
  margin: 0;
}

.onboarding__close {
  cursor: pointer;
  padding: 4px;
}

.onboarding__subtitle {
  margin: var(--space-sm) 0 var(--space-md);
  color: var(--color-text-secondary);
}

.onboarding__steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.onboarding__step {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: 15px;
}

.onboarding__step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary);
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.onboarding__tip {
  margin-bottom: var(--space-md);
}
</style>
