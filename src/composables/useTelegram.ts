import { ref, computed } from 'vue'

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
  is_premium?: boolean
}

interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    query_id?: string
    user?: TelegramUser
    auth_date?: number
    hash?: string
  }
  version: string
  platform: string
  colorScheme: 'light' | 'dark'
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  ready: () => void
  expand: () => void
  close: () => void
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    show: () => void
    hide: () => void
    onClick: (cb: () => void) => void
  }
  BackButton: {
    isVisible: boolean
    show: () => void
    hide: () => void
    onClick: (cb: () => void) => void
  }
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

const isTelegramEnv = ref(false)
const telegramUser = ref<TelegramUser | null>(null)

function init () {
  const tg = window.Telegram?.WebApp
  if (!tg || !tg.initData) return

  isTelegramEnv.value = true
  telegramUser.value = tg.initDataUnsafe.user ?? null

  tg.ready()
  tg.expand()
}

export function useTelegram () {
  const webapp = computed(() => window.Telegram?.WebApp ?? null)

  const displayName = computed(() => {
    if (!telegramUser.value) return ''
    const { first_name, last_name } = telegramUser.value
    return last_name ? `${first_name} ${last_name}` : first_name
  })

  const username = computed(() => telegramUser.value?.username ?? '')
  const photoUrl = computed(() => telegramUser.value?.photo_url ?? '')
  const isPremium = computed(() => telegramUser.value?.is_premium ?? false)

  function haptic (type: 'light' | 'medium' | 'heavy' = 'light') {
    webapp.value?.HapticFeedback.impactOccurred(type)
  }

  return {
    isTelegramEnv,
    telegramUser,
    webapp,
    displayName,
    username,
    photoUrl,
    isPremium,
    haptic,
    init,
  }
}
