<template>
  <div class="flex h-full">
    <!-- Sidebar -->
    <div class="box-border! shrink-0  w-fit bg-(--dcterra-black) text-white p-4">
      <h2 class="text-xl font-bold mb-1">Menu</h2>
      <h5 class="mb-4">Informatie</h5>

      <ul class="p-0">
        <li
          v-for="link in infoMenuLinks"
          :key="link.title"
          @click="navigeerNaar(link.to)"
          class="text-white mb-2 hover:text-gray-500! active:translate-y-px cursor-pointer"
        >
          {{ link.title }}
        </li>
      </ul>
    </div>

    <section class="calculation-content flex-1 h-full overflow-auto">
      <router-view />
    </section>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { infoMenuLinks } from '@/router/links'

const router = useRouter()

const navigeerNaar = (pad) => {
  router.push(pad)
}
</script>

<style scoped></style>
