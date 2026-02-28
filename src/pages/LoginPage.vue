<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { showToast } from 'vant'

const router = useRouter()
const { allUsers, register, loginAs } = useAuth()

const studentName = ref('')
const showExisting = ref(false)

function handleRegister() {
  const name = studentName.value.trim()
  if (!name) {
    showToast({ message: 'Please enter your name', type: 'fail' })
    return
  }
  register(name)
  showToast({ message: `Welcome, ${name}! 🦆`, type: 'success' })
  router.replace('/words')
}

function handleLoginAs(userId: string) {
  if (loginAs(userId)) {
    const user = allUsers.value.find(u => u.id === userId)
    showToast({ message: `Welcome back, ${user?.name}!`, type: 'success' })
    router.replace('/words')
  }
}
</script>

<template>
<div class="login-page">
  <div class="login-page__hero">
    <div class="login-page__logo duck-float">🦆</div>
    <h1 class="login-page__title">ParlerCanard</h1>
    <p class="login-page__subtitle">
      Master French pronunciation
    </p>
  </div>

  <div class="login-page__form surface-card-elevated">
    <h3 class="login-page__form-title">Get Started</h3>
    <p class="text-caption" style="margin: 0 0 12px;">Enter your name to begin</p>

    <van-field v-model="studentName" placeholder="Your name" size="large" clearable :border="false"
      class="login-page__input" @keyup.enter="handleRegister" />

    <van-button type="primary" block round size="large" :disabled="!studentName.trim()" @click="handleRegister">
      Start Practicing
    </van-button>
  </div>

  <!-- Teacher Login -->
  <div class="login-page__teacher surface-card">
    <div class="login-page__teacher-header" @click="showExisting = !showExisting">
      <span>👩‍🏫</span>
      <div>
        <p class="login-page__teacher-name">Светлана</p>
        <p class="text-caption" style="margin: 0;">Teacher access</p>
      </div>
      <van-icon :name="showExisting ? 'arrow-up' : 'arrow-down'" size="14" />
    </div>

    <van-button type="default" block round size="small" style="margin-top: 10px;"
      @click="handleLoginAs('teacher-svetlana')">
      Sign in as Teacher
    </van-button>
  </div>

  <!-- Existing Users -->
  <div v-if="showExisting && allUsers.length > 1" class="login-page__existing surface-card">
    <p class="section-label">Existing accounts</p>
    <div v-for="user in allUsers" :key="user.id" class="login-page__user-row" @click="handleLoginAs(user.id)">
      <span class="login-page__user-avatar">{{ user.avatar }}</span>
      <div class="login-page__user-info">
        <span class="login-page__user-name">{{ user.name }}</span>
        <van-tag :type="user.role === 'teacher' ? 'warning' : 'primary'" round size="medium">
          {{ user.role }}
        </van-tag>
      </div>
      <van-icon name="arrow" size="14" color="var(--color-lavender)" />
    </div>
  </div>
</div>
</template>

<style scoped>
.login-page {
  min-height: 100dvh;
  padding: var(--space-lg) var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  background: linear-gradient(180deg, oklch(0.72 0.16 85 / 0.1) 0%, oklch(0.68 0.19 55 / 0.04) 15%, var(--color-cream) 40%);
}

.login-page__hero {
  text-align: center;
  padding-top: var(--space-lg);
}

.login-page__logo {
  font-size: 56px;
  margin-bottom: var(--space-sm);
  filter: drop-shadow(0 3px 6px oklch(0.72 0.16 85 / 0.25));
}

.login-page__title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: -0.02em;
}

.login-page__subtitle {
  margin: 4px 0 0;
  font-size: 15px;
  color: var(--color-text-secondary);
}

.login-page__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
}

.login-page__form-title {
  margin: 0 0 2px;
  font-size: 17px;
  font-weight: 600;
}

.login-page__input {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.login-page__teacher {
  padding: var(--space-sm) var(--space-md);
}

.login-page__teacher-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
}

.login-page__teacher-header>span:first-child {
  font-size: 24px;
}

.login-page__teacher-header>div {
  flex: 1;
}

.login-page__teacher-name {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.login-page__existing {
  padding: var(--space-sm) var(--space-md);
}

.login-page__user-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 6px 0;
  cursor: pointer;
  border-bottom: 1px solid var(--color-lavender-light);
}

.login-page__user-row:last-child {
  border-bottom: none;
}

.login-page__user-avatar {
  font-size: 22px;
}

.login-page__user-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.login-page__user-name {
  font-size: 14px;
  font-weight: 500;
}
</style>
