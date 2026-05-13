import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Berekeningen from '@/views/Berekeningen/Berekeningen.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
    },
    {
      path: '/berekeningen',
      name: 'berekeningen',
      component: Berekeningen,
      meta: { requiresAuth: false }, // 👈 Voeg deze regel toe
      children: [
        {
          path: 'werkgeversverklaring', // URL: /berekeningen/werkgeversverklaring
          name: 'Bedragen Werkgeversverklaring',
          component: () => import('@/views/Berekeningen/Werkgeversverklaring.vue'),
        },
        {
          path: 'gratificatie', // URL: /berekeningen/gratificatie
          name: 'Bedragen Gratificatie',
          component: () => import('@/views/Berekeningen/Gratificatie.vue'),
        },
        {
          path: 'toelagen-berekenen', // URL: /berekeningen/toelagen-berekenen
          name: 'Toelagen Berekenen',
          component: () => import('@/views/Berekeningen/ToelagenBerekenen.vue'),
        },
        {
          path: 'transitievergoeding-berekenen', // URL: /berekeningen/transitievergoeding-berekenen
          name: 'Transitievergoeding Berekenen',
          component: () => import('@/views/Berekeningen/Transitievergoeding.vue'),
        },
        {
          path: 'woon-werk-berekenen', // URL: /berekeningen/woon-werk-berekenen
          name: 'Woon-Werk Vergoeding Berekenen',
          component: () => import('@/views/Berekeningen/WoonWerk.vue'),
        },
        {
          path: 'delen-door-drie', // URL: /berekeningen/woon-werk-berekenen
          name: 'Delen door 3/6/12',
          component: () => import('@/views/Berekeningen/DelenDoorDrie.vue'),
        },
        // ... nog meer berekeningspagina's
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  // 1. Controleer of de route authenticatie vereist
  if (requiresAuth && !authStore.isLoggedIn) {
    // Als auth vereist is EN de gebruiker NIET is ingelogd, stuur naar login
    next({ name: 'login' })
  } else if ((to.name === 'login' || to.name === 'register') && authStore.isLoggedIn) {
    // Als de gebruiker al is ingelogd, stuur dan weg van de login/register pagina's
    next({ name: 'home' }) // Vervang 'home' door je daadwerkelijke home route naam
  } else {
    // Toegang verlenen
    next()
  }
})

export default router

console.info(
  '%c %cMjepware™',
  'padding-left: 36px; line-height: 36px; background-image: url("data:image/gif;base64,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"); background-size: 32px; background-repeat: no-repeat; background-position: 2px 2px; ',
  'background:#D40629; padding:0.2em 0.5em 0.25em 0.5em; border-radius:0.5em; color: white; ',
)
