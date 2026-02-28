import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useTelegram } from '@/composables/useTelegram'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/words',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { public: true },
    },
    {
      path: '/words',
      name: 'words',
      component: () => import('@/pages/WordsPage.vue'),
    },
    {
      path: '/sentences',
      name: 'sentences',
      component: () => import('@/pages/SentencesPage.vue'),
    },
    {
      path: '/phonemes',
      name: 'phonemes',
      component: () => import('@/pages/PhonemesPage.vue'),
    },
    {
      path: '/achievements',
      name: 'achievements',
      component: () => import('@/pages/AchievementsPage.vue'),
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('@/pages/AccountPage.vue'),
    },
    {
      path: '/teacher/words',
      name: 'teacher-words',
      component: () => import('@/pages/TeacherWordsPage.vue'),
      meta: { teacherOnly: true },
    },
    {
      path: '/teacher/recordings',
      name: 'teacher-recordings',
      component: () => import('@/pages/TeacherRecordingsPage.vue'),
      meta: { teacherOnly: true },
    },
  ],
})

router.beforeEach((to) => {
  const { isAuthenticated, isTeacher, registerFromTelegram } = useAuth()
  const { isTelegramEnv, isValidated, telegramUser } = useTelegram()

  // Auto-login from Telegram if not yet authenticated (only if validated)
  if (!isAuthenticated.value && isTelegramEnv.value && telegramUser.value && isValidated.value) {
    registerFromTelegram(telegramUser.value)
  }

  if (!to.meta.public && !isAuthenticated.value) {
    return { name: 'login' }
  }

  if (to.name === 'login' && isAuthenticated.value) {
    return { name: 'words' }
  }

  if (to.meta.teacherOnly && !isTeacher.value) {
    return { name: 'words' }
  }
})

export default router
