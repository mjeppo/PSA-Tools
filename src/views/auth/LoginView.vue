<template>
  <div class="flex items-center justify-center h-screen bg-gray-300">
    <div class="bg-amber-50 p-4 rounded">
      <form @submit.prevent="handleLogin">
        <div class="form-group mb-2">
          <label for="login-email">Emailadres :</label>
          <input v-model="email" type="email" placeholder="Voer E-mail-adres in" id="login-email" class="form-control">
          </div>
          <div class="form-group mb-4">
            <label for="login-password">Wachtwoord :</label>
            <input v-model="password" type="password" placeholder="Wachtwoord" id="login-password" class="form-control">
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
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router'; // Om door te sturen na inloggen
import { useToast } from 'vue-toastification';

const toast = useToast();
const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');

async function handleLogin() {
  const success = await authStore.login(email.value,  password.value );
  
  if (success) {
    // Stuur de gebruiker door naar een beveiligde pagina
    toast.success("Je bent succesvol ingelogd!")
    router.push('/'); 
    
  }
}
</script>