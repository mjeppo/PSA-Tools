<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  caoVersie,
  getSchaalOptions,
  getTredeOptions,
  getBedragForLabel,
  findNextHigherSchaalTrede,
  getTredeNStepsHigher,
} from '@/utils/schalen'
import {
  FormateerGetallen,
  selectValue,
  resetSelectValue,
  isValidFTE,
  kopieerBedrag as kopieerBedragNaarKlembord,
  kopieerTekstNaarKlembord,
} from '@/utils/utilities'
import { useSettings } from '@/composables/useLocalstorage'
import { useToast } from 'vue-toastification'
import PageTitleComponent from '@/components/PageTitle-Component.vue'
import WerktijdfactorInput from '@/components/WerktijdfactorInput.vue'

const { settings } = useSettings()
const toast = useToast()

const isOptionsOpen = ref(false)
const toastIsActive = ref(false)
const fteStatus = ref('VALID')

function toggleOptions() {
  isOptionsOpen.value = !isOptionsOpen.value
}

// Schaal opties (LB, LC, LD, 01-18)
const schaalOpties = getSchaalOptions()

// Computed voor trede opties
const laagTredeOpties = computed(() => {
  return getTredeOptions(settings.tb_laagSchaal)
})

const hoogTredeOpties = computed(() => {
  return getTredeOptions(settings.tb_hoogSchaal)
})

// Computed voor bedragen
const laagBedrag = computed(() => {
  return getBedragForLabel(
    settings.tb_laagSchaal,
    settings.tb_laagTrede,
    settings.tb_geselecteerdeCao,
  )
})

const hoogBedrag = computed(() => {
  return getBedragForLabel(
    settings.tb_hoogSchaal,
    settings.tb_hoogTrede,
    settings.tb_geselecteerdeCao,
  )
})

// FTE conversie naar getal
const fteAsNumber = computed(() => {
  if (!settings.tb_fteWaarde) return 0
  const fteString = String(settings.tb_fteWaarde)
  const normalized = fteString.replace(',', '.')
  const number = Number(normalized)
  return isNaN(number) ? 0 : number
})

// Bereken toelage
const toelage = computed(() => {
  if (laagBedrag.value === null || hoogBedrag.value === null) return 0
  return (hoogBedrag.value - laagBedrag.value) * fteAsNumber.value
})

// Berekenings tekst
const berekeningsTekst = computed(() => {
  if (laagBedrag.value === null || hoogBedrag.value === null) return ''

  const laagLabel = `${settings.tb_laagSchaal}.${settings.tb_laagTrede}`
  const hoogLabel = `${settings.tb_hoogSchaal}.${settings.tb_hoogTrede}`

  // Voeg toe welke methode wordt gebruikt
  let methodeText = ''
  if (settings.tb_berekeningsmethode === '1-periodiek') {
    methodeText = ' (+1 periodiek)'
  } else if (settings.tb_berekeningsmethode === '2-periodieken') {
    methodeText = ' (+2 periodieken)'
  } else if (settings.tb_berekeningsmethode === 'naast-hoger-1-periodiek') {
    methodeText = ' (naast hoger + 1 periodiek)'
  }

  return `Verschil ${laagLabel} - ${hoogLabel} => ${FormateerGetallen.valuta(hoogBedrag.value)} - ${FormateerGetallen.valuta(laagBedrag.value)} * ${FormateerGetallen.decimalen4(fteAsNumber.value)} = ${FormateerGetallen.valuta(toelage.value)}`
})

// FTE validatie
const validateFTE = async () => {
  fteStatus.value = isValidFTE(settings.tb_fteWaarde)

  if (fteStatus.value === 'INVALID' && !toastIsActive.value) {
    toast.error('Ongeldige FTE-waarde.', {
      position: 'top-center',
    })
    toastIsActive.value = true
  } else if (fteStatus.value === 'WARNING') {
    toast.warning('Let op: De FTE is hoger dan 1,5. Is dit correct?', {
      position: 'top-center',
    })
    toastIsActive.value = false
  } else if (fteStatus.value === 'VALID') {
    toastIsActive.value = false
  }
}

function formatFteValue(rawValue) {
  const inputVal = String(rawValue ?? '')
  const normalized = inputVal.replace(',', '.')
  const number = Number(normalized)

  if (isNaN(number)) return null

  return number.toFixed(4).replace('.', ',')
}

function onFteBlur(event) {
  validateFTE()
  if (event) {
    resetSelectValue(event)
  }

  const formattedValue = formatFteValue(event?.target?.value ?? settings.tb_fteWaarde)
  if (formattedValue !== null) {
    settings.tb_fteWaarde = formattedValue
  }
}

function adjustFte(delta) {
  const current = fteAsNumber.value || 0
  const newVal = Math.round((current + delta) * 10) / 10
  settings.tb_fteWaarde = Math.min(1.0, Math.max(0.0, newVal))
  onFteBlur()
}

// Kopieer functies
async function kopieerBedrag() {
  const result = await kopieerBedragNaarKlembord(toelage.value)

  result.success
    ? toast.success(`Bedrag ${result.formatted} gekopieerd`)
    : toast.error(`Kopiëren naar klembord mislukt ${result.error}`)
}

async function kopieerBerekening() {
  const result = await kopieerTekstNaarKlembord(berekeningsTekst.value)

  result.success
    ? toast.success('Berekening gekopieerd')
    : toast.error(`Kopiëren naar klembord mislukt ${result.error}`)
}

function onKopieerToets(event, callback) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    callback()
  }
}

// Helper functie: bepaal trede op basis van berekeningsmethode
// Geeft null terug als de schaal geen geldige trede heeft (alle bedragen < laagBedrag)
const berekenTredeVoorSchaal = (schaal) => {
  const laagBedragVal = laagBedrag.value
  if (laagBedragVal === null) return null

  // Vind de eerste trede in deze schaal met bedrag >= laagBedrag (basis = horizontaal over)
  const tredeOpties = getTredeOptions(schaal)
  let baseTrede = null

  for (const trede of tredeOpties) {
    const bedrag = getBedragForLabel(schaal, trede, settings.tb_geselecteerdeCao)
    if (bedrag !== null && bedrag >= laagBedragVal) {
      baseTrede = trede
      break
    }
  }

  if (!baseTrede) {
    return null
  }

  let steps = 0

  if (settings.tb_berekeningsmethode === '1-periodiek') {
    steps = 1
  } else if (settings.tb_berekeningsmethode === '2-periodieken') {
    steps = 2
  } else if (settings.tb_berekeningsmethode === 'naast-hoger-1-periodiek') {
    const baseBedrag = getBedragForLabel(schaal, baseTrede, settings.tb_geselecteerdeCao)
    if (baseBedrag === laagBedragVal) {
      steps = 1
    } else {
      steps = 0
    }
  }

  if (steps > 0) {
    const hogere = getTredeNStepsHigher(schaal, baseTrede, steps, settings.tb_geselecteerdeCao)
    return hogere ? hogere.trede : baseTrede
  }

  return baseTrede
}

// Watch voor wanneer lagere schaal/trede/cao verandert
watch(
  [() => settings.tb_laagSchaal, () => settings.tb_laagTrede, () => settings.tb_geselecteerdeCao],
  () => {
    if (!settings.tb_automatischeInschaling) return

    // Probeer trede te berekenen voor de huidige hogere schaal
    const trede = berekenTredeVoorSchaal(settings.tb_hoogSchaal)

    if (trede !== null) {
      // Hogere schaal heeft een geldige trede: schaal vasthouden, trede aanpassen
      settings.tb_hoogTrede = trede
    } else {
      // Geen geldige trede voor huidige hogere schaal: automatisch opzoeken
      const nextHigher = findNextHigherSchaalTrede(
        laagBedrag.value,
        settings.tb_laagSchaal,
        settings.tb_geselecteerdeCao,
      )

      if (nextHigher) {
        settings.tb_hoogSchaal = nextHigher.schaal
        const nieuwesTrede = berekenTredeVoorSchaal(nextHigher.schaal)
        if (nieuwesTrede) {
          settings.tb_hoogTrede = nieuwesTrede
        }
      }
    }
  },
)

// Watch voor wanneer gebruiker hogere schaal handmatig wijzigt
watch(
  () => settings.tb_hoogSchaal,
  () => {
    if (!settings.tb_automatischeInschaling) return

    const trede = berekenTredeVoorSchaal(settings.tb_hoogSchaal)
    if (trede !== null) {
      settings.tb_hoogTrede = trede
    }
  },
)

// Watch voor berekeningsmethode wijziging - update de trede
watch(
  () => settings.tb_berekeningsmethode,
  () => {
    if (!settings.tb_automatischeInschaling) return

    const trede = berekenTredeVoorSchaal(settings.tb_hoogSchaal)
    if (trede !== null) {
      settings.tb_hoogTrede = trede
    }
  },
)

onMounted(() => {
  isOptionsOpen.value = false
  validateFTE()

  const laagTredes = getTredeOptions(settings.tb_laagSchaal)
  if (laagTredes.length > 0 && !laagTredes.includes(settings.tb_laagTrede)) {
    settings.tb_laagTrede = laagTredes[0]
  }

  const hoogTredes = getTredeOptions(settings.tb_hoogSchaal)
  if (hoogTredes.length > 0 && !hoogTredes.includes(settings.tb_hoogTrede)) {
    settings.tb_hoogTrede = hoogTredes[0]
  }
})
</script>

<template>
  <div id="main" class="flex h-full pt-4 justify-center bg_1">
    <div id="titel-container" class="flex flex-col gap-2 relative z-10 w-max-[900px]">
      <!-- Titel -->
      <PageTitleComponent tekst1="Bedrag" tekst2="toelage" tekst3="berekenen" />
      <!-- Schaal selecties naast elkaar -->
      <div class="grid grid-cols-2 gap-2 ml-2">
        <!-- Lagere schaal (links) -->
        <div
          id="laag-container"
          class="relative z-20 p-4 bg-(--achtergrond-berekening) opacity-97 shadow rounded"
        >
          <div><p class="ubuntu-medium">Huidige schaal</p></div>
          <div class="grid grid-cols-[80px_1fr] gap-y-2 gap-x-2 items-center">
            <span>Schaal:</span>
            <select
              v-model="settings.tb_laagSchaal"
              class="rounded border border-(--randkleur-inputs)! px-2 py-1"
            >
              <option v-for="schaal in schaalOpties" :key="schaal" :value="schaal">
                {{ schaal }}
              </option>
            </select>

            <span>Trede:</span>
            <select
              v-model="settings.tb_laagTrede"
              class="rounded border border-(--randkleur-inputs)! px-2 py-1"
            >
              <option v-for="trede in laagTredeOpties" :key="trede" :value="trede">
                {{ trede }}
              </option>
            </select>

            <span>Bedrag:</span>
            <div class="font-semibold">
              {{ laagBedrag !== null ? FormateerGetallen.valuta(laagBedrag) : '—' }}
            </div>
          </div>
        </div>

        <!-- Hogere schaal (rechts) -->
        <div
          id="hoog-container"
          class="relative z-20 p-4 bg-(--achtergrond-berekening) opacity-97 shadow rounded"
        >
          <div><p class="ubuntu-medium">Hogere schaal</p></div>
          <div class="grid grid-cols-[80px_1fr] gap-y-2 gap-x-2 items-center">
            <span>Schaal:</span>
            <select
              v-model="settings.tb_hoogSchaal"
              class="rounded border border-(--randkleur-inputs)! px-2 py-1"
            >
              <option v-for="schaal in schaalOpties" :key="schaal" :value="schaal">
                {{ schaal }}
              </option>
            </select>

            <span>Trede:</span>
            <select
              v-model="settings.tb_hoogTrede"
              class="rounded border border-(--randkleur-inputs)! px-2 py-1"
            >
              <option v-for="trede in hoogTredeOpties" :key="trede" :value="trede">
                {{ trede }}
              </option>
            </select>

            <span>Bedrag:</span>
            <div class="font-semibold">
              {{ hoogBedrag !== null ? FormateerGetallen.valuta(hoogBedrag) : '—' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Berekeningstype -->
      <div
        id="methode-container"
        class="relative p-4 ml-2 bg-(--achtergrond-berekening) opacity-97 shadow rounded"
      >
        <div>
          <p class="ubuntu-medium mb-2">Berekeningstype</p>
        </div>
        <div class="grid grid-cols-4 gap-2 border border-(--randkleur-inputs)! p-1 rounded">
          <button
            type="button"
            :class="[
              'toggle-knop transition-all duration-300 py-2 shadow text-sm',
              settings.tb_berekeningsmethode === 'horizontaal'
                ? 'bg-(--dcterra-red)! text-white! font-semibold!'
                : 'bg-(--dcterra-red-light) text-gray-500 hover:bg-gray-200',
            ]"
            @click="settings.tb_berekeningsmethode = 'horizontaal'"
          >
            Horizontaal over
          </button>
          <button
            type="button"
            :class="[
              'toggle-knop transition-all duration-300 py-2 shadow text-sm',
              settings.tb_berekeningsmethode === 'naast-hoger-1-periodiek'
                ? 'bg-(--dcterra-red)! text-white! font-semibold!'
                : 'bg-(--dcterra-red-light) text-gray-500 hover:bg-gray-200',
            ]"
            @click="settings.tb_berekeningsmethode = 'naast-hoger-1-periodiek'"
          >
            Naast hoger + 1 periodiek
          </button>
          <button
            type="button"
            :class="[
              'toggle-knop transition-all duration-300 py-2 shadow text-sm',
              settings.tb_berekeningsmethode === '1-periodiek'
                ? 'bg-(--dcterra-red)! text-white! font-semibold!'
                : 'bg-(--dcterra-red-light) text-gray-500 hover:bg-gray-200',
            ]"
            @click="settings.tb_berekeningsmethode = '1-periodiek'"
          >
            1 periodiek
          </button>
          <button
            type="button"
            :class="[
              'toggle-knop transition-all duration-300 py-2 shadow text-sm',
              settings.tb_berekeningsmethode === '2-periodieken'
                ? 'bg-(--dcterra-red)! text-white! font-semibold!'
                : 'bg-(--dcterra-red-light) text-gray-500 hover:bg-gray-200',
            ]"
            @click="settings.tb_berekeningsmethode = '2-periodieken'"
          >
            2 periodieken
          </button>
        </div>
      </div>

      <!-- Toelage berekening -->
      <div
        id="toelage-container"
        class="relative p-4 ml-2 bg-(--achtergrond-berekening) opacity-97 shadow rounded"
      >
        <div><p class="ubuntu-medium">Toelage berekening</p></div>
        <div class="grid grid-cols-[180px_1fr] gap-y-2 gap-x-2 items-center">
          <!-- FTE input -->
          <span class="pr-2 self-center">Werktijdfactor:</span>
          <div class="grid grid-cols-[130px_1fr_20px_20px] gap-0">
            <input
              type="text"
              class="transition duration-300 border border-(--randkleur-inputs)! rounded-sm p-1 w-32 shadow-sm hover:shadow-lg!"
              v-model="settings.tb_fteWaarde"
              @blur="onFteBlur"
              @click="selectValue"
              ref="fteWaarde"
            />
            <div class="flex flex-col leading-none">
              <div class="mt-1"><i class="fa-solid fa-sort-up" @click="adjustFte(0.1)"></i></div>
              <div class="-mt-2">
                <i class="fa-solid fa-sort-down -mt-1" @click="adjustFte(-0.1)"></i>
              </div>
            </div>
            <i
              v-if="fteStatus === 'INVALID'"
              class="fa-solid fa-circle-exclamation self-center"
              style="color: #e01b24"
            ></i>
            <i
              v-if="fteStatus === 'WARNING'"
              class="fa-solid fa-triangle-exclamation self-center"
              style="color: #ff7800"
            ></i>
          </div>

          <!-- Toelage bedrag -->
          <span class="pr-2 self-center">Toelage bedrag:</span>
          <div
            class="kopieer-knop flex items-center gap-2"
            title="Klik om te kopiëren"
            role="button"
            tabindex="0"
            @click="kopieerBedrag"
            @keydown="onKopieerToets($event, kopieerBedrag)"
          >
            <span
              :class="[
                'font-bold text-xl cursor-pointer',
                toelage < 0 ? 'text-(--dcterra-red)' : 'text-black',
              ]"
            >
              {{ FormateerGetallen.valuta(toelage) }}
            </span>
            <span class="kopieer-knop-icoon pointer-events-none">
              <i class="fa-solid fa-copy"></i>
            </span>
          </div>

          <!-- Berekening tekst -->
          <span class="pr-2 self-start pt-1">Berekening:</span>
          <div
            class="kopieer-knop"
            title="Klik om te kopiëren"
            role="button"
            tabindex="0"
            @click="kopieerBerekening"
            @keydown="onKopieerToets($event, kopieerBerekening)"
          >
            <span class="text-sm cursor-pointer overflow-x-auto block">
              {{ berekeningsTekst }}
            </span>
            <span class="kopieer-knop-icoon pointer-events-none">
              <i class="fa-solid fa-copy"></i>
            </span>
          </div>
        </div>
      </div>

      <!-- Opties -->
      <div
        id="options-container"
        class="relative py-2 px-4 ml-2 bg-(--achtergrond-berekening) opacity-97 shadow rounded transition-all duration-300 ease-in-out overflow-hidden"
      >
        <div @click="toggleOptions" class="cursor-pointer flex justify-between items-center mb-0">
          <p class="transition duration-300 ubuntu-medium text-sm hover:text-(--dcterra-red) mt-2">
            Opties
          </p>
          <i
            class="fa-solid fa-chevron-down transition-transform duration-300 -mt-2.5"
            :class="{ 'rotate-180': isOptionsOpen }"
          ></i>
        </div>

        <div v-show="isOptionsOpen" class="grid grid-cols-[180px_200px] gap-y-2 text-sm mt-2">
          <div class="self-center">CAO versie:</div>
          <select
            v-model="settings.tb_geselecteerdeCao"
            class="rounded border border-(--randkleur-inputs)! px-2 py-1"
          >
            <option v-for="item in caoVersie" :key="item" :value="item">{{ item }}</option>
          </select>

          <div class="self-center">Automatische inschaling:</div>
          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto-inschaling"
              v-model="settings.tb_automatischeInschaling"
              class="w-4 h-4 cursor-pointer"
            />
            <label for="auto-inschaling" class="cursor-pointer">
              {{ settings.tb_automatischeInschaling ? 'Aan' : 'Uit' }}
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Zorg ervoor dat selects een consistente styling hebben */
select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  padding-right: 2rem;
}

/* Kopieer knop styling */
.kopieer-knop {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
  width: fit-content;
}

.kopieer-knop:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.kopieer-knop-icoon {
  opacity: 0;
  display: inline-flex;
  align-items: center;
  transition: opacity 0.2s;
  font-size: 0.875rem;
}

.kopieer-knop:hover .kopieer-knop-icoon {
  opacity: 1;
}

.toggle-knop {
  border-radius: 0.25rem;
  font-weight: 500;
  transition: all 0.3s;
}

#hoog-container select,
#laag-container select {
  width: 80px;
  box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.1);
}
</style>
