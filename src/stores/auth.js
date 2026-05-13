import { defineStore } from 'pinia';
import { supabase } from '@/supabase'; // Importeer de Supabase client
import { useToast } from 'vue-toastification';

const toast = useToast();

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null, 
    isLoading: false, 
    error: null,
  }),

  getters: {
    isLoggedIn(state) {
      // Controleert of er een user object is
      return !!state.user;
    },
  },

  actions: {
    // 1. Inloggen met Supabase (Email/Wachtwoord)
    async login(email, password) {
      this.isLoading = true;
      this.error = null;

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      this.isLoading = false;

      if (error) {
        this.error = error.message;
        this.user = null;
        return false;
      }
      
      // Supabase slaat de sessie op in Local Storage.
          this.user = data.user; 
          toast.success('Je bent succesvol ingelogd.')
      return true;
    },
    
    // 2. Registreren van een nieuwe gebruiker
    async register(email, password) {
      this.isLoading = true;
      this.error = null;
      
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });
      
      this.isLoading = false;
      
      if (error) {
        this.error = error.message;
        return false;
      }

      // Bij registratie logt Supabase de gebruiker direct in
      this.user = data.user; 
      // Afhankelijk van je instellingen, moet de gebruiker mogelijk eerst e-mail bevestigen
        alert('Registratie succesvol. Controleer je e-mail voor bevestiging!');
        toast.success('Registratie succesvol. Controleer je e-mail voor bevestiging!')
      return true;
    },

    // 3. Uitloggen
    async logout() {
      await supabase.auth.signOut();
      this.user = null;
    },

    // 4. Gebruiker ophalen bij app start (Controleert sessie)
    async initializeUser() {
        const { data: { user } } = await supabase.auth.getUser();
        this.user = user;
    }
  },
});