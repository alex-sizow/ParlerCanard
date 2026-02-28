import { reactive, watch } from 'vue'

export function usePersistence<T extends object> (
  key: string,
  defaults: T,
  migrate?: (loaded: T) => T,
): T {
  function loadState (): T {
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        let parsed = JSON.parse(raw) as T
        if (migrate) parsed = migrate(parsed)
        return parsed
      }
    } catch {
      // ignore corrupt data
    }
    return { ...defaults }
  }

  const state = reactive<T>(loadState()) as T

  let saveTimeout: ReturnType<typeof setTimeout> | null = null

  watch(
    () => ({ ...state }),
    () => {
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem(key, JSON.stringify(state))
      }, 100)
    },
    { deep: true },
  )

  return state
}
