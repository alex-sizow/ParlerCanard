import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { useTelegram } from './composables/useTelegram'
import { initCloudSync } from './composables/useCloudPersistence'

async function bootstrap () {
  const { init: initTelegram, isTelegramEnv, validateInitData } = useTelegram()

  // 1. Initialize Telegram WebApp (sync — reads initData)
  initTelegram()

  // 2. Validate initData server-side if in Telegram
  if (isTelegramEnv.value) {
    await validateInitData()
  }

  // 3. Load data from CloudStorage (merges with localStorage)
  await initCloudSync()

  // 4. Mount the app
  const app = createApp(App)
  app.use(router)
  app.mount('#app')
}

bootstrap()
