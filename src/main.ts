import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { useTelegram } from './composables/useTelegram'

// Initialize Telegram WebApp integration (no-op when outside Telegram)
const { init: initTelegram } = useTelegram()
initTelegram()

const app = createApp(App)
app.use(router)
app.mount('#app')
