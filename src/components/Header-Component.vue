<template>
  <div class="bg-(--dcterra-black) w-full h-(--height-menu-topbar) text-white">
    <div class="flex justify-between items-center h-full">
      <nav class="flex justify-between items-center h-full">
        <div class="w-(--width-menu-sidebar) h-full flex items-center justify-center">
          <img src="/src/img/logo_dcterra.png" class="w-46" />
        </div>
        <div @mouseenter="open1 = true" @mouseleave="open1 = false">
          <b-dropdown text="Berekeningen" variant="light" class="me-2" v-model="open1" to="/berekeningen">
            <b-dropdown-item v-for="link in berekeningenLinks" :key="link.title" :to="link.to">
              {{ link.title }}
            </b-dropdown-item>

            <!-- <b-dropdown-divider /> -->
            <!-- <b-dropdown-item active>Active action</b-dropdown-item>
            <b-dropdown-item disabled>Disabled action</b-dropdown-item> -->
          </b-dropdown>
        </div>
        <div @mouseenter="open2 = true" @mouseleave="open2 = false">
          <b-dropdown text="Procedures" variant="light" class="me-2" v-model="open2">
            <b-dropdown-item to="/berekeningen">Bedragen Werkgeversverklaring</b-dropdown-item>
            <b-dropdown-item>Bedragen gratificatie</b-dropdown-item>
            <b-dropdown-item>Third Action</b-dropdown-item>
            <b-dropdown-divider />
            <b-dropdown-item active>Active action</b-dropdown-item>
            <b-dropdown-item disabled>Disabled action</b-dropdown-item>
          </b-dropdown>
        </div>
        <div @mouseenter="open3 = true" @mouseleave="open3 = false">
          <b-dropdown text="Informatie" variant="light" class="me-2" v-model="open3">
            <b-dropdown-item v-for="link in infoLinks" :key="link.title" :to="link.to">
              {{ link.title }}
            </b-dropdown-item>
          </b-dropdown>
        </div>
        <div @mouseenter="open4 = true" @mouseleave="open4 = false">
          <b-dropdown text="Overig" variant="light" class="me-2" v-model="open4">
            <b-dropdown-item to="/berekeningen">Bedragen Werkgeversverklaring</b-dropdown-item>
            <b-dropdown-item>Bedragen gratificatie</b-dropdown-item>
            <b-dropdown-item>Third Action</b-dropdown-item>
            <b-dropdown-divider />
            <b-dropdown-item active>Active action</b-dropdown-item>
            <b-dropdown-item disabled>Disabled action</b-dropdown-item>
          </b-dropdown>
        </div>
        <div @mouseenter="open5 = true" @mouseleave="open5 = false">
          <b-dropdown
            v-model="open5"
            text="Overig"
            variant="light"
            auto-close="outside"
            class="me-2"
          >
            <b-dropdown-item to="/berekeningen">Bedragen Werkgeversverklaring</b-dropdown-item>
            <b-dropdown-item>Bedragen gratificatie</b-dropdown-item>
            <b-dropdown-divider />
            <b-dropdown-item active>Active action</b-dropdown-item>
            <b-dropdown-item disabled>Disabled action</b-dropdown-item>
          </b-dropdown>
        </div>
      </nav>
      <div class="auth-controls">
        <template v-if="!authStore.isLoggedIn">
          <router-link to="/login">
            <button class="login-btn btn btn-light m-1">Inloggen</button>
          </router-link>
          <router-link to="/register">
            <button class="register-btn btn btn-light m-1">Registreren</button>
          </router-link>
        </template>
        <template v-else>
          <div class="mr-2">
            <span class="text-sm mr-2">Welkom, {{ authStore.user.email }}</span>
            <button @click="handleLogout" class="logout-btn btn btn-danger mr-2">Uitloggen</button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { BDropdown, BDropdownItem, BDropdownDivider } from 'bootstrap-vue-next'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = async () => {
  await authStore.logout()
  // Stuur de gebruiker na het uitloggen naar de homepage
  router.push('/')
}

import { ref } from 'vue'

const open1 = ref(false)
const open2 = ref(false)
const open3 = ref(false)
const open4 = ref(false)
const open5 = ref(false)

const onEnter = () => {
  open.value = true
}
const onLeave = () => {
  open.value = false
}

const berekeningenLinks = [
  {
    title: 'Bedragen Werkgeversverklaring',
    to: '/berekeningen/werkgeversverklaring',
  },
  {
    title: 'Bedragen Gratificatie',
    to: '/berekeningen/gratificatie',
  },
  {
    title: 'Toelage berekenen',
    to: '/berekeningen/toelagen-berekenen',
  },
  {
    title: 'Transitievergoeding berekenen',
    to: '/berekeningen/transitievergoeding-berekenen',
  },
  {
    title: 'Vergoeding woon-werk berekenen',
    to: '/berekeningen/woon-werk-berekenen',
  },

  {
    title: 'Delen door 3/6/12',
    to: '/berekeningen/delen-door-drie',
  },
  // Voeg hier de rest van de 13 links toe
]

const infoLinks = [
  {
    title: '🔒 Salarisschalen',
    to: '/info/salarisschalen',
    
  },
]
</script>

<style>
.b-dropdown:hover .dropdown-menu {
  display: block;
  visibility: visible;
  opacity: 1;
}
</style>
