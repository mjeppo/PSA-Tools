<template>
<div class="bg-(--dcterra-red) w-full  h-10 text-white text-sm flex grow-0 p-2">
PSA-Tools versie 1.0.0 - Gemaakt door MjepWare - Laatste update: {{ laatsteUpdate }}
</div>
</template>

<script>
export default {
  data() {
    return {
      laatsteUpdate: new Date().toLocaleDateString('nl-NL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    }
  }
}

</script>

<style scoped>

</style>