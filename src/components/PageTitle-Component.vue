<script setup>
defineProps({
  tekst1: String,
  tekst2: String,
  tekst3: String,
  image1: {
    type: String,
    default: 'fa-solid fa-sack-dollar',
  },
})
</script>

<template>
  <div
    class="grid grid-cols-[50px_1fr] p-2 ml-2 w-full overflow-hidden bg-(--achtergrond-berekening) opacity-97 shadow rounded "
  >
    <div class="self-center"><i :class="[image1, 'text-3xl']"></i></div>
    <div class="flex w-full items-center justify-center">
      <div class="flex items-center gap-3">
        <h5 class="self-center">{{ tekst1 }}</h5>
        <h1 class="text-(--dcterra-red)!">{{ tekst2 }}</h1>
        <h5 class="self-center">{{ tekst3 }}</h5>
      </div>
    </div>
  </div>
</template>

<style></style>
