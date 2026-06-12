<script setup>
import { RouterView } from 'vue-router'
import HeaderComponent from './components/Header-Component.vue'
import FooterComponent from './components/Footer-Component.vue'
</script>

<template>
  <div id="app-layout" class="flex flex-col">
    <HeaderComponent class="shrink-0" />
    <main class="main-content grow min-h-0">
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </main>
    <FooterComponent />
  </div>
</template>

<style scoped>
#app-layout {
  height: 100dvh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 0 !important;
}

.main-content {
  display: flex;
  flex-direction: column;
}

.main-content > * {
  flex: 1;
  min-height: 0;
}
</style>
