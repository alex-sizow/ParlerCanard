import { ref, readonly } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const canInstall = ref(false)
const isInstalled = ref(false)

// Check if already installed (display-mode: standalone)
if (typeof window !== 'undefined') {
  isInstalled.value = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as unknown as { standalone?: boolean }).standalone === true

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    deferredPrompt.value = e as BeforeInstallPromptEvent
    canInstall.value = true
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt.value = null
    canInstall.value = false
    isInstalled.value = true
  })
}

async function install (): Promise<boolean> {
  if (!deferredPrompt.value) return false

  await deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice

  deferredPrompt.value = null
  canInstall.value = false

  return outcome === 'accepted'
}

export function usePwa () {
  return {
    canInstall: readonly(canInstall),
    isInstalled: readonly(isInstalled),
    install,
  }
}
