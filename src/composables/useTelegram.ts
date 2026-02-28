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

type CloudStorageCb<T> = (error: string | null, result?: T) => void

export interface TelegramCloudStorage {
  setItem: (key: string, value: string, cb?: CloudStorageCb<boolean>) => void
  getItem: (key: string, cb: CloudStorageCb<string>) => void
  getItems: (keys: string[], cb: CloudStorageCb<Record<string, string>>) => void
  removeItem: (key: string, cb?: CloudStorageCb<boolean>) => void
  removeItems: (keys: string[], cb?: CloudStorageCb<boolean>) => void
  getKeys: (cb: CloudStorageCb<string[]>) => void
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
  CloudStorage: TelegramCloudStorage
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

const VALIDATE_URL = import.meta.env.VITE_VALIDATE_URL as string | undefined

const isTelegramEnv = ref(false)
const isValidated = ref(false)
const isValidating = ref(false)
const telegramUser = ref<TelegramUser | null>(null)

function init () {
  const tg = window.Telegram?.WebApp
  if (!tg || !tg.initData) return

  isTelegramEnv.value = true
  telegramUser.value = tg.initDataUnsafe.user ?? null

  tg.ready()
  tg.expand()
}

/**
 * Validate initData via the backend HMAC-SHA256 check.
 * Falls back to client-side trust if no VALIDATE_URL is configured.
 */
async function validateInitData (): Promise<boolean> {
  const tg = window.Telegram?.WebApp
  if (!tg?.initData) return false

  // If no validation endpoint is configured, trust client-side data
  if (!VALIDATE_URL) {
    isValidated.value = true
    return true
  }

  isValidating.value = true
  try {
    const resp = await fetch(VALIDATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: tg.initData }),
    })
    const data = await resp.json()
    isValidated.value = data.valid === true
    return isValidated.value
  } catch {
    // Network error — trust client-side data as fallback
    isValidated.value = true
    return true
  } finally {
    isValidating.value = false
  }
}

export function useTelegram () {
  const webapp = computed(() => window.Telegram?.WebApp ?? null)

  const cloudStorage = computed(() => {
    const tg = window.Telegram?.WebApp
    return tg?.CloudStorage ?? null
  })

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
    isValidated,
    isValidating,
    telegramUser,
    webapp,
    cloudStorage,
    displayName,
    username,
    photoUrl,
    isPremium,
    haptic,
    init,
    validateInitData,
  }
}
