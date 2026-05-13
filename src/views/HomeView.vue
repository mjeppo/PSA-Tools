<script setup></script>

<template>
  <main>
    <div class="flex h-full w-full">
      <!-- Sidebar -->
      <!-- <div class="w-(--width-menu-sidebar) bg-(--dcterra-black) h-[calc(100vh)] text-white p-4">
        <h2 class="text-xl font-bold mb-4">Menu</h2>
        <ul>
          <li class="mb-2"><a href="#" class="hover:text-gray-300">Home</a></li>
          <li class="mb-2"><a href="#" class="hover:text-gray-300">Profiel</a></li>
          <li class="mb-2"><a href="#" class="hover:text-gray-300">Instellingen</a></li>
        </ul>
      </div> -->
      <div class="flex justify-center pt-20 w-full">
        <div>
          <h3 class="text-center">Welkom op de PSA Portal</h3>
          <p class="text-center">Kies in het menu een optie <i class="fa-solid fa-up-long"></i></p>
        </div>
      </div>
      <section class="calculation-content">
        <router-view />
      </section>
    </div>
  </main>
</template>
