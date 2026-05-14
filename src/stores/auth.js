import { defineStore } from 'pinia'
import { useToast } from 'vue-toastification'
import { pb } from '@/pocketbase.js'

const toast = useToast()

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    isLoggedIn(state) {
      // Controleert of er een user object is
      return !!state.user
    },
  },

  actions: {
    // 1. Inloggen met PocketBase (Email/Wachtwoord)
    async login(email, password) {
      this.isLoading = true
      this.error = null

      try {
        const authData = await pb.collection('users').authWithPassword(email, password)

        this.user = authData.record
        toast.success('Je bent succesvol ingelogd.')
        return true
      } catch (error) {
        this.error = error?.message || 'Inloggen mislukt.'
        this.user = null
        return false
      } finally {
        this.isLoading = false
      }
    },

    // 2. Registreren van een nieuwe gebruiker
    async register(email, password) {
      this.isLoading = true
      this.error = null

      try {
        await pb.collection('users').create({
          email,
          password,
          passwordConfirm: password,
        })

        return true
      } catch (error) {
        this.error = error?.message || 'Registratie mislukt.'
        return false
      } finally {
        this.isLoading = false
      }
    },

    // 3. Uitloggen
    async logout() {
      pb.authStore.clear()
      this.user = null
    },

    // 4. Gebruiker ophalen bij app start (Controleert sessie)
    async initializeUser() {
      this.user = pb.authStore.model || null
    },
  },
})
