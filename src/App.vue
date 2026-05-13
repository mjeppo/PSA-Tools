<script setup>
import { RouterLink, RouterView } from 'vue-router'
import HeaderComponent from './components/Header-Component.vue';
import FooterComponent from './components/Footer-Component.vue';

</script>

<template>
  <div id="app-layout" class="flex flex-col min-h-screen">
  <HeaderComponent />
  <main class="main-content grow ">
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </main>
    <FooterComponent />
  </div>
</template>

<style scoped>
#app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0 !important;
}


</style>
