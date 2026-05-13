import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss()],
  optimizeDeps: {
    // Forceer Vite om deze modules als ES modules te behandelen
    include: ['bootstrap-vue-next'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true, // Dit zorgt ervoor dat Vite luistert op 0.0.0.0
    port: 5173, // Optioneel: zorg ervoor dat de poort correct is ingesteld
  },
})
