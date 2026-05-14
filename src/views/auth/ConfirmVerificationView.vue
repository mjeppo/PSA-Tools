<template>
  <div class="flex items-center justify-center h-screen bg-gray-300">
    <div class="bg-amber-50 p-4 rounded text-center">
      <div v-if="loading">
        <p>Verificatie wordt verwerkt...</p>
      </div>
      <div v-else-if="success">
        <h2 class="text-green-600 font-bold">Verificatie succesvol!</h2>
        <p class="mt-2">Je account is nu geverifieerd. Je kunt nu inloggen.</p>
        <router-link to="/login" class="btn btn-primary mt-4 inline-block"
          >Ga naar inloggen</router-link
        >
      </div>
      <div v-else>
        <h2 class="text-red-600 font-bold">Verificatie mislukt</h2>
        <p class="mt-2">{{ errorMessage }}</p>
        <router-link to="/register" class="btn btn-secondary mt-4 inline-block"
          >Probeer opnieuw</router-link
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { pb } from '@/pocketbase.js'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const success = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  const token = route.params.token

  if (!token) {
    errorMessage.value = 'Geen verificatietoken gevonden.'
    loading.value = false
    return
  }

  try {
    await pb.collection('users').confirmVerification(token)
    success.value = true
  } catch (error) {
    errorMessage.value = error?.message || 'Verificatie is mislukt. Token kan verlopen zijn.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}
</style>
