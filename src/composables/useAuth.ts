import { computed } from 'vue'
import { usePersistence } from './usePersistence'

export type UserRole = 'student' | 'teacher'

export interface User {
  id: string
  name: string
  role: UserRole
  avatar: string
  joinedAt: string
}

interface AuthState {
  currentUser: User | null
  users: User[]
}

/** Pre-seeded teacher account */
const TEACHER_SVETLANA: User = {
  id: 'teacher-svetlana',
  name: 'Светлана',
  role: 'teacher',
  avatar: '👩‍🏫',
  joinedAt: '2025-09-01',
}

const state = usePersistence<AuthState>('parler-auth', {
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

    const user: User = { id: `student-${Date.now()}`, name, role: 'student', avatar: '🧑‍🎓', joinedAt: new Date().toISOString().split('T')[0] }
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
    loginAs,
    loginAsTeacher,
    logout,
  }
}
