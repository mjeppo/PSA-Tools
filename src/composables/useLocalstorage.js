// src/composables/useLocalStorage.js

import { reactive, watch, onMounted } from 'vue'

const STORAGE_KEY = 'psaportal_user_settings' // Een unieke sleutel

// Definieer de standaardwaarden voor alle instellingen in de app
const defaultSettings = {
  wg_geselecteerdeSchaalInView: 'LB.11',
  wg_fteWaarde: '0,9000',
  wg_geselecteerdeCao: '2025-1 (01-01-2025)',
  // Gratificatie specifieke settings
  gr_geselecteerdeSchaalInView: 'LB.11',
  gr_fteWaarde: '0,9000',
  gr_geselecteerdeCao: '2025-1 (01-01-2025)',
  gr_selectedJubileumJaar: '25',
  // ToelagenBerekenen specifieke settings
  tb_geselecteerdeCao: '2025-1 (01-01-2025)',
  tb_laagSchaal: 'LB',
  tb_laagTrede: '11',
  tb_hoogSchaal: 'LB',
  tb_hoogTrede: '01',
  tb_fteWaarde: '0,8000',
  tb_berekeningsmethode: 'horizontaal', // 'horizontaal', '1-periodiek', '2-periodieken'
  tb_automatischeInschaling: true,
  trans_schaal: 'LB.01',
  trans_fteWaarde: '1,0000',
  // Hier komen later instellingen van andere pagina's bij:
  // thema: 'donker',
  // toonHulp: true,
}

// Maak een reactief object met de standaardwaarden
const settings = reactive({ ...defaultSettings })

export function useSettings() {
  // 1. Laden bij Mount (eenmalig)
  onMounted(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        // Data parsen en de 'settings' vullen
        const loadedSettings = JSON.parse(stored)

        // Zorg ervoor dat alleen bestaande/bekende sleutels worden overgenomen
        Object.assign(settings, defaultSettings, loadedSettings)
      }
    } catch (e) {
      console.error('Fout bij het laden van settings uit LocalStorage:', e)
    }
  })

  // 2. Opslaan bij Wijziging
  // Watch kijkt naar het hele 'settings' object en voert opslag uit bij elke verandering
  watch(
    settings,
    (newSettings) => {
      //console.log('Settings changed, saving to localStorage:', JSON.stringify(newSettings))
      try {
        // JSON.stringify() is nodig om het object als tekst op te slaan
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
      } catch (e) {
        console.error('Fout bij het opslaan van settings in LocalStorage:', e)
      }
    },
    { deep: true },
  ) // Cruciaal: deep: true kijkt naar alle geneste properties

  // Geef het reactieve object terug
  return {
    settings,
    // Je kunt hier eventueel een reset-functie toevoegen
    resetSettings: () => Object.assign(settings, defaultSettings),
  }
}
