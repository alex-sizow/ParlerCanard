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
    <h1 class="text-h1 login-page__title">ParlerCanard</h1>
    <p class="text-body login-page__subtitle">
      Quack your way to perfect French pronunciation!
    </p>
  </div>

  <div class="login-page__form surface-card-elevated">
    <h3 class="text-h3" style="margin: 0 0 4px;">Get Started</h3>
    <p class="text-caption" style="margin: 0 0 16px;">Enter your name to start quacking in French!</p>

    <van-field v-model="studentName" placeholder="Your name" size="large" clearable :border="false"
      class="login-page__input" @keyup.enter="handleRegister" />

    <van-button type="primary" block round size="large" :disabled="!studentName.trim()" @click="handleRegister">
      Start Quacking 🦆
    </van-button>
  </div>

  <!-- Teacher Login -->
  <div class="login-page__teacher surface-card">
    <div class="login-page__teacher-header" @click="showExisting = !showExisting">
      <span>👩‍🏫</span>
      <div>
        <p class="text-body" style="margin: 0; font-weight: 600;">Teacher: Светлана</p>
        <p class="text-caption" style="margin: 0;">Admin access</p>
      </div>
      <van-icon :name="showExisting ? 'arrow-up' : 'arrow-down'" size="16" />
    </div>

    <van-button type="default" block round size="normal" style="margin-top: 12px;"
      @click="handleLoginAs('teacher-svetlana')">
      Sign in as Светлана
    </van-button>
  </div>

  <!-- Existing Users -->
  <div v-if="showExisting && allUsers.length > 1" class="login-page__existing surface-card">
    <p class="text-caption" style="margin: 0 0 8px; font-weight: 600; color: var(--color-text);">
      Existing accounts
    </p>
    <div v-for="user in allUsers" :key="user.id" class="login-page__user-row" @click="handleLoginAs(user.id)">
      <span class="login-page__user-avatar">{{ user.avatar }}</span>
      <div class="login-page__user-info">
        <span class="text-body" style="font-weight: 500;">{{ user.name }}</span>
        <van-tag :type="user.role === 'teacher' ? 'warning' : 'primary'" round size="mini">
          {{ user.role }}
        </van-tag>
      </div>
      <van-icon name="arrow" size="16" color="var(--color-lavender)" />
    </div>
  </div>
</div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  min-height: 100dvh;
  padding: var(--space-xl) var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  background: linear-gradient(180deg,
      oklch(0.72 0.16 85 / 0.15) 0%,
      oklch(0.68 0.19 55 / 0.06) 20%,
      var(--color-cream) 50%);
}

.login-page__hero {
  text-align: center;
  padding-top: var(--space-xl);
}

.login-page__logo {
  font-size: 80px;
  margin-bottom: var(--space-md);
  filter: drop-shadow(0 4px 8px oklch(0.72 0.16 85 / 0.3));
}

.login-page__title {
  margin: 0;
  color: var(--color-primary);
}

.login-page__subtitle {
  margin: var(--space-sm) 0 0;
  color: var(--color-text-secondary);
}

.login-page__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.login-page__input {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.login-page__teacher {
  padding: var(--space-md) var(--space-lg);
}

.login-page__teacher-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  cursor: pointer;
}

.login-page__teacher-header>span:first-child {
  font-size: 32px;
}

.login-page__teacher-header>div {
  flex: 1;
}

.login-page__existing {
  padding: var(--space-md) var(--space-lg);
}

.login-page__user-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) 0;
  cursor: pointer;
  border-bottom: 1px solid var(--color-lavender-light);
}

.login-page__user-row:last-child {
  border-bottom: none;
}

.login-page__user-avatar {
  font-size: 28px;
}

.login-page__user-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
</style>
