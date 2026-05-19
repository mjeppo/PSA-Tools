<template>
  <div class="flex items-center justify-center min-h-fit bg_1">
    <div class="bg-(--achtergrond-berekening) p-4 rounded">
      <!-- Context-melding als je doorgestuurd bent -->
      <p v-if="redirectPath" class="mb-3 text-sm text-amber-600 font-medium">
        <i class="fa-solid fa-lock mr-1"></i> Je moet ingelogd zijn om deze pagina te bekijken.
      </p>

      <form @submit.prevent="handleLogin">
        <div class="mb-2 grid grid-cols-2 gap-1">
          <label for="login-email">Emailadres :</label>
          <input
            v-model="email"
            type="email"
            placeholder="Voer E-mail-adres in"
            id="login-email"
            class="input-veld"
          />

          <label for="login-password">Wachtwoord :</label>
          <input
            v-model="password"
            type="password"
            placeholder="Wachtwoord"
            id="login-password"
            class="input-veld"
          />
        </div>

        <button type="submit" :disabled="authStore.isLoading" class="btn btn-primary">
          {{ authStore.isLoading ? 'Bezig...' : 'Inloggen' }}
        </button>
        <p v-if="authStore.error" class="error">{{ authStore.error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'

const toast = useToast()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')

// Haal de redirect-url op als die meegegeven is
const redirectPath = computed(() => route.query.redirect || null)

async function handleLogin() {
  const success = await authStore.login(email.value, password.value)

  if (success) {
    toast.success('Je bent succesvol ingelogd!')
    // Stuur terug naar de oorspronkelijke pagina, of naar home
    router.push(redirectPath.value || '/')
  }
}
</script>
