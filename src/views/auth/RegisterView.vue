<template>
  <div class="flex items-center justify-center h-screen bg-gray-300">
    <div class="bg-amber-50 p-4 rounded">
      <form @submit.prevent="handleRegister">
        <div class="form-group mb-2">
          <label for="register-email">Emailadres :</label>
          <input
            id="register-email"
            v-model="email"
            type="email"
            placeholder="Voer e-mail-adres in"
            class="form-control"
            required
          />
        </div>
        <div class="form-group mb-2">
          <label for="register-password">Wachtwoord :</label>
          <input
            id="register-password"
            v-model="password"
            type="password"
            placeholder="Wachtwoord"
            class="form-control"
            required
          />
        </div>
        <div class="form-group mb-4">
          <label for="register-password-repeat">Herhaal wachtwoord :</label>
          <input
            id="register-password-repeat"
            v-model="passwordRepeat"
            type="password"
            placeholder="Herhaal wachtwoord"
            class="form-control"
            required
          />
        </div>

        <button type="submit" :disabled="authStore.isLoading" class="btn btn-primary">
          {{ authStore.isLoading ? 'Bezig...' : 'Registreren' }}
        </button>
        <p v-if="authStore.error" class="error mt-2">{{ authStore.error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

const toast = useToast()
const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const passwordRepeat = ref('')
const allowedDomain = '@dcterra.nl'

function validatePassword(pwd) {
  if (pwd.length < 8) {
    return 'Wachtwoord moet minimaal 8 karakters zijn.'
  }
  if (!/[A-Z]/.test(pwd)) {
    return 'Wachtwoord moet minstens één hoofdletter bevatten.'
  }
  if (!/[0-9]/.test(pwd)) {
    return 'Wachtwoord moet minstens één cijfer bevatten.'
  }
  return null
}

async function handleRegister() {
  const normalizedEmail = email.value.trim().toLowerCase()

  const passwordError = validatePassword(password.value)
  if (passwordError) {
    toast.error(passwordError)
    return
  }

  if (!normalizedEmail.endsWith(allowedDomain)) {
    toast.error(`Alleen e-mailadressen op ${allowedDomain} zijn toegestaan.`)
    return
  }

  if (password.value !== passwordRepeat.value) {
    toast.error('Wachtwoorden komen niet overeen.')
    return
  }

  const success = await authStore.register(normalizedEmail, password.value)

  if (success) {
    toast.success('Registratie gelukt. Controleer je e-mail voor bevestiging.')
    router.push('/login')
  }
}
</script>
