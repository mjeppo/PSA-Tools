import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import * as BSN from 'bootstrap-vue-next'
import { createBootstrap } from 'bootstrap-vue-next'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

import App from './App.vue'
import router from './router'

import { useAuthStore } from './stores/auth'

import 'vue-select/dist/vue-select.css';

const app = createApp(App)
const pinia = createPinia()
const options = {
  // Optionele configuratie, bijvoorbeeld:
  position: 'bottom-left',
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: false, // Zorg dat de timer ALTIJD doorloopt
  pauseOnHover: true,
}

app.use(Toast, options)
app.use(pinia)
app.use(router)
app.use(createBootstrap())

const authStore = useAuthStore()
authStore.initializeUser()

app.mount('#app')
