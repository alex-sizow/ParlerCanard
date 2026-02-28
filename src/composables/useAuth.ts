import { computed } from 'vue'
import { useCloudPersistence } from './useCloudPersistence'
import type { TelegramUser } from './useTelegram'

export type UserRole = 'student' | 'teacher'

export interface User {
  id: string
  name: string
  role: UserRole
  avatar: string
  joinedAt: string
  telegramId?: number
  telegramUsername?: string
  telegramPhotoUrl?: string
}

interface AuthState {
  currentUser: User | null
  users: User[]
}

/** Telegram usernames that automatically get teacher role */
const TEACHER_USERNAMES = new Set([
  'svetalitvinova',
  'sizifalex',
])

function isTeacherUsername (username?: string): boolean {
  return !!username && TEACHER_USERNAMES.has(username.toLowerCase())
}

/** Pre-seeded teacher account */
const TEACHER_SVETLANA: User = {
  id: 'teacher-svetlana',
  name: 'Светлана',
  role: 'teacher',
  avatar: '👩‍🏫',
  joinedAt: '2025-09-01',
}

const state = useCloudPersistence<AuthState>('parler-auth', {
  currentUser: null,
  users: [TEACHER_SVETLANA],
}, (loaded) => {
  if (!loaded.users.find(u => u.id === TEACHER_SVETLANA.id)) {
    loaded.users.push(TEACHER_SVETLANA)
  }
  return loaded
})

export function useAuth () {
  const isAuthenticated = computed(() => state.currentUser !== null)
  const currentUser = computed(() => state.currentUser)
  const isTeacher = computed(() => state.currentUser?.role === 'teacher')
  const allUsers = computed(() => state.users)

  function register (name: string): User {
    const existing = state.users.find(u => u.name.toLowerCase() === name.toLowerCase())
    if (existing) { state.currentUser = existing; return existing }

    const user: User = { id: `student-${Date.now()}`, name, role: 'student', avatar: '🧑‍🎓', joinedAt: new Date().toISOString().split('T')[0]! }
    state.users.push(user)
    state.currentUser = user
    return user
  }

  /**
   * Register or login a user from Telegram Mini App data.
   * Uses telegramId as the stable identity key.
   */
  function registerFromTelegram (tgUser: TelegramUser): User {
    const tgId = tgUser.id
    const displayName = tgUser.last_name
      ? `${tgUser.first_name} ${tgUser.last_name}`
      : tgUser.first_name

    const shouldBeTeacher = isTeacherUsername(tgUser.username)

    // Find by telegramId first (stable)
    const existing = state.users.find(u => u.telegramId === tgId)
    if (existing) {
      // Update name / photo on every login (user may have changed TG profile)
      existing.name = displayName
      existing.telegramUsername = tgUser.username
      existing.telegramPhotoUrl = tgUser.photo_url
      // Promote to teacher if username is in the whitelist
      if (shouldBeTeacher && existing.role !== 'teacher') {
        existing.role = 'teacher'
        existing.avatar = '👩‍🏫'
      }
      state.currentUser = existing
      return existing
    }

    const user: User = {
      id: `tg-${tgId}`,
      name: displayName,
      role: shouldBeTeacher ? 'teacher' : 'student',
      avatar: shouldBeTeacher ? '👩‍🏫' : '🧑‍🎓',
      joinedAt: new Date().toISOString().split('T')[0]!,
      telegramId: tgId,
      telegramUsername: tgUser.username,
      telegramPhotoUrl: tgUser.photo_url,
    }
    state.users.push(user)
    state.currentUser = user
    return user
  }

  function loginAs (userId: string) {
    const user = state.users.find(u => u.id === userId)
    if (user) { state.currentUser = user; return true }
    return false
  }

  const loginAsTeacher = () => loginAs(TEACHER_SVETLANA.id)
  const logout = () => { state.currentUser = null }

  return {
    isAuthenticated,
    currentUser,
    isTeacher,
    allUsers,
    register,
    registerFromTelegram,
    loginAs,
    loginAsTeacher,
    logout,
  }
}
