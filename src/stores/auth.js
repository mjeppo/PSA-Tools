import { defineStore } from 'pinia'
import { useToast } from 'vue-toastification'
import { pb } from '@/pocketbase.js'

const toast = useToast()
const allowedDomain = '@dcterra.nl'

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
    isAdmin(state) {
      return state.user?.admin === true
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
    async register(email, password, name) {
      this.isLoading = true
      this.error = null

      const normalizedEmail = email.trim().toLowerCase()
      if (!normalizedEmail.endsWith(allowedDomain)) {
        this.error = `Alleen e-mailadressen op ${allowedDomain} zijn toegestaan.`
        this.isLoading = false
        return false
      }

      try {
        await pb.collection('users').create({
          email: normalizedEmail,
          password,
          passwordConfirm: password,
          name: name.trim(),
        })

        await pb.collection('users').requestVerification(normalizedEmail)

        return true
      } catch (error) {
        const data = error?.data?.data ?? error?.data ?? {}
        const fieldError =
          data?.name?.message ||
          data?.email?.message ||
          data?.password?.message ||
          data?.passwordConfirm?.message

        if (fieldError) {
          this.error = fieldError
        } else {
          this.error = error?.message || 'Registratie mislukt.'
        }

        console.error('PocketBase registratiefout:', JSON.stringify(error?.data ?? error, null, 2))
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
