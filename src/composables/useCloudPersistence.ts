import { reactive, watch, ref } from 'vue'
import { useCloudStorage } from './useCloudStorage'
import { useTelegram } from './useTelegram'

export type SyncStatus = 'idle' | 'loading' | 'syncing' | 'synced' | 'error'

const syncStatus = ref<SyncStatus>('idle')
const lastSyncTime = ref<number | null>(null)

/** Global list of registered cloud-persistent stores for bulk init */
const pendingLoads: Array<() => Promise<void>> = []
let cloudInitDone = false

/**
 * Cloud-aware persistence: localStorage as fast cache,
 * Telegram CloudStorage as source of truth (synced across devices).
 *
 * In non-TG environments, falls back to localStorage only.
 */
export function useCloudPersistence<T extends object> (
  key: string,
  defaults: T,
  migrate?: (loaded: T) => T,
): T {
  /* ---- localStorage (synchronous, fast) ---- */
  function loadLocal (): T {
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        let parsed = JSON.parse(raw) as T
        if (migrate) parsed = migrate(parsed)
        return parsed
      }
    } catch { /* ignore */ }
    return { ...defaults }
  }

  const state = reactive<T>(loadLocal()) as T

  /* ---- debounced localStorage write ---- */
  let localSaveTimeout: ReturnType<typeof setTimeout> | null = null
  let cloudSaveTimeout: ReturnType<typeof setTimeout> | null = null

  watch(
    () => ({ ...state }),
    () => {
      // Always write to localStorage immediately (debounced 100ms)
      if (localSaveTimeout) clearTimeout(localSaveTimeout)
      localSaveTimeout = setTimeout(() => {
        localStorage.setItem(key, JSON.stringify(state))
      }, 100)

      // Debounced CloudStorage write (2s to batch changes)
      if (cloudInitDone) {
        scheduleCloudSync(state, key)
      }
    },
    { deep: true },
  )

  /* ---- Register for cloud init ---- */
  pendingLoads.push(async () => {
    await loadFromCloud(state, key, migrate)
  })

  return state

  function scheduleCloudSync (s: T, k: string) {
    if (cloudSaveTimeout) clearTimeout(cloudSaveTimeout)
    cloudSaveTimeout = setTimeout(() => {
      void saveToCloud(s, k)
    }, 2000)
  }
}

/* ---- Cloud read/write helpers ---- */

async function loadFromCloud<T extends object> (
  state: T,
  key: string,
  migrate?: (loaded: T) => T,
): Promise<void> {
  const { cloudGet } = useCloudStorage()

  try {
    const cloudData = await cloudGet<T & { __lastModified?: number }>(key)
    if (!cloudData) return // No cloud data — keep localStorage values

    // Compare timestamps to resolve conflicts
    const localRaw = localStorage.getItem(key)
    let localModified = 0
    if (localRaw) {
      try {
        const localParsed = JSON.parse(localRaw) as { __lastModified?: number }
        localModified = localParsed.__lastModified ?? 0
      } catch { /* ignore */ }
    }
    const cloudModified = cloudData.__lastModified ?? 0

    // Cloud is newer or equal — use cloud data
    if (cloudModified >= localModified) {
      let merged = { ...cloudData }
      delete (merged as Record<string, unknown>).__lastModified
      if (migrate) merged = migrate(merged as T)
      Object.assign(state, merged)
      localStorage.setItem(key, JSON.stringify(state))
    }
    // Otherwise keep local data (it's newer, will sync to cloud on next write)
  } catch {
    // Cloud unavailable — keep localStorage data
  }
}

async function saveToCloud<T extends object> (state: T, key: string): Promise<void> {
  const { isTelegramEnv } = useTelegram()
  if (!isTelegramEnv.value) return

  const { cloudSet } = useCloudStorage()

  syncStatus.value = 'syncing'
  try {
    const withTimestamp = { ...state, __lastModified: Date.now() }
    // Also persist the timestamp locally
    localStorage.setItem(key, JSON.stringify(withTimestamp))
    const ok = await cloudSet(key, withTimestamp)
    if (ok) {
      syncStatus.value = 'synced'
      lastSyncTime.value = Date.now()
    } else {
      syncStatus.value = 'error'
    }
  } catch {
    syncStatus.value = 'error'
  }
}

/**
 * Initialize all registered cloud-persistent stores by loading from CloudStorage.
 * Should be called once during app bootstrap after Telegram init.
 */
export async function initCloudSync (): Promise<void> {
  const { isTelegramEnv } = useTelegram()
  if (!isTelegramEnv.value) {
    cloudInitDone = true
    return
  }

  syncStatus.value = 'loading'
  try {
    await Promise.all(pendingLoads.map(fn => fn()))
    syncStatus.value = 'synced'
    lastSyncTime.value = Date.now()
  } catch {
    syncStatus.value = 'error'
  }
  cloudInitDone = true
}

/**
 * Expose sync status for UI indicators.
 */
export function useCloudSyncStatus () {
  return {
    syncStatus,
    lastSyncTime,
  }
}
