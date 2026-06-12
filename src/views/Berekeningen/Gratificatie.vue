<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import SchaalSelectComponent from '@/components/SchaalSelect-component.vue'
import {
  schalenArray2025_1,
  schalenArray2024_1,
  schalenArray2024_2,
  schalenArray2023_1,
  schalenArray2023_2,
  caoVersie,
} from '@/utils/schalen'
import { useToast } from 'vue-toastification'
import {
  selectValue,
  resetSelectValue,
  formatToDecimals,
  kopieerBedrag as kopieerBedragNaarKlembord,
  isValidFTE,
  FormateerGetallen,
  formatInputFTE,
} from '@/utils/utilities'
import { useSettings } from '@/composables/useLocalstorage'
import PageTitleComponent from '@/components/PageTitle-Component.vue'

const { settings } = useSettings()

const isOptionsOpen = ref(false)

function toggleOptions() {
  isOptionsOpen.value = !isOptionsOpen.value
}

// const geselecteerdeSchaalInView = ref('LB.12') // Je kunt een initiële waarde geven
const formatter = FormateerGetallen

const toast = useToast()
const toastIsActive = ref(false)

const geselecteerdeCao = ref(settings.gr_geselecteerdeCao)

// const fteValue = ref('1,0000')
const isValid = ref(true)

// Mapping van CAO namen naar de geïmporteerde arrays
const caoMapping = {
  '2023-1 (01-01-2023)': schalenArray2023_1,
  '2023-2 (01-07-2023)': schalenArray2023_2,
  '2024-1 (01-01-2024)': schalenArray2024_1,
  '2024-2 (01-07-2024)': schalenArray2024_2,
  '2025-1 (01-01-2025)': schalenArray2025_1,
}

const actueleSchalenLijst = computed(() => {
  return caoMapping[settings.gr_geselecteerdeCao] || schalenArray2025_1
})

const shortCaoVersion = computed(() => {
  if (!settings.gr_geselecteerdeCao) return ''
  // "2025-1 (01-01-2025)" -> "2025_1"
  return settings.gr_geselecteerdeCao.split(' ')[0].replace('-', '_')
})

const schaalBedrag = computed(() => {
  // Zoek het object in de ACTUELE array
  const selectedObject = actueleSchalenLijst.value.find(
    (schaal) =>
      // We zoeken op de unieke label die in v-model zit
      schaal.label === settings.gr_geselecteerdeSchaalInView,
  )

  // Geef de ECHTE (original) waarde terug
  return selectedObject ? selectedObject.value : null
})

const fteInputRef = ref(null)
const fteStatus = ref('VALID') // Kan zijn: 'VALID', 'INVALID', 'WARNING'

const validateFTE = async () => {
  fteStatus.value = isValidFTE(settings.gr_fteWaarde)

  isValid.value = fteStatus !== 'INVALID'

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

function onFteBlur(event) {
  validateFTE()
  resetSelectValue(event)

  // Format the value and update state directly
  const inputVal = event.target.value
  const normalized = inputVal.replace(',', '.')
  const number = Number(normalized)

  if (!isNaN(number)) {
    settings.gr_fteWaarde = number.toFixed(5).replace('.', ',')
  }
}

const fteAsNumber = computed(() => {
  if (!settings.gr_fteWaarde) return 0

  const fteString = String(settings.gr_fteWaarde)
  // vervang komma door punt
  const normalized = fteString.replace(',', '.')
  const number = Number(normalized)

  return isNaN(number) ? 0 : number
})

const bedragen = computed(() => {
  if (!schaalBedrag.value) {
    return {
      maandSalaris: 0,
      vakantietoeslag: 0,
      totaal: 0,
    }
  }

  let baseMaandSalaris = fteAsNumber.value * schaalBedrag.value

  // Jubilee logic: 25 years = 50%, 40 years = 100%
  if (settings.gr_selectedJubileumJaar === '25') {
    baseMaandSalaris = baseMaandSalaris / 2
  }

  const maandSalaris = baseMaandSalaris
  const vakantietoeslag = maandSalaris * 0.08
  const totaal = maandSalaris + vakantietoeslag

  let maandSalarisBerekening = `(${FormateerGetallen.valuta(schaalBedrag.value)} * ${FormateerGetallen.decimalen4(fteAsNumber.value)} ${settings.gr_selectedJubileumJaar === '25' ? '/ 2' : ''})`

  const vakantietoeslagBerekening = `(${FormateerGetallen.valuta(maandSalaris)} * 8%)`
  const totaalBedragBerekening = `(${FormateerGetallen.valuta(maandSalaris)} + ${FormateerGetallen.valuta(vakantietoeslag)})`

  return {
    maandSalaris,
    vakantietoeslag,
    totaal,
    maandSalarisBerekening,
    vakantietoeslagBerekening,
    totaalBedragBerekening,
  }
})

const formatValuta = (value) => {
  return FormateerGetallen.valuta(value)
}
const formatGetal = (value) => {
  return FormateerGetallen.decimalen2(value)
}

const maandBedrag = computed(() => bedragen.value.maandSalaris)
const maandSalaris = computed(() => formatValuta(bedragen.value.maandSalaris))
const vakantietoeslag = computed(() => formatValuta(bedragen.value.vakantietoeslag))
const totaal = computed(() => formatValuta(bedragen.value.totaal))
const maandSalarisBerekening = computed(() => bedragen.value.maandSalarisBerekening)
const vakantietoeslagBerekening = computed(() => bedragen.value.vakantietoeslagBerekening)
const totaalBedragBerekening = computed(() => bedragen.value.totaalBedragBerekening)

async function kopieerBedrag(key) {
  const value = bedragen.value[key]
  const result = await kopieerBedragNaarKlembord(value)

  result.success
    ? toast.success(`Bedrag ${result.formatted} gekopieerd`)
    : toast.error(`Kopiëren naar klembord mislukt ${result.error}`)
}

function onKopieerToets(event, callback) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    callback()
  }
}

onMounted(() => {
  isOptionsOpen.value = false
  validateFTE()
})
</script>

<template>
  <div id="main" class="flex h-full pt-4 justify-center bg_1">
    <div id="titel-container" class="flex flex-col gap-2 relative z-10 w-max-[500px]">
      <!-- < <div
        class="grid grid-cols-[50px_100px_400px_200px] p-4 ml-2 w-max-[500px] overflow-hidden bg-(--achtergrond-berekening) opacity-97 shadow rounded"
      >
        <i class="fa-solid fa-sack-dollar self-center text-3xl"></i>
        <h5 class="self-baseline-last">Bedrag</h5>
        <h1 class="text-(--dcterra-red)!">jubileumgratificatie</h1>
        <h5 class="self-baseline-last">berekenen</h5>
      </div>> -->
      <PageTitleComponent tekst1="Bedrag" tekst2="jubileumgratificatie" tekst3="berekenen" />

      <div
        id="input-container"
        class="relative z-20 p-4 ml-2 w-max-[500px] bg-(--achtergrond-berekening) opacity-97 shadow rounded"
      >
        <div><p class="ubuntu-medium">Invoer</p></div>
        <div class="grid grid-cols-[200px_150px_400px] gap-y-2">
          <div class="grid grid-cols-[150px_auto] col-span-2">
            <span class="self-center">Schaal :</span>
            <SchaalSelectComponent
              :options="actueleSchalenLijst"
              v-model="settings.gr_geselecteerdeSchaalInView"
            />
          </div>
          <div class="self-center pl-4 text-sm" id="schaalBedrag">
            Schaalbedrag : {{ schaalBedrag !== null ? FormateerGetallen.valuta(schaalBedrag) : '' }}
            <span v-if="schaalBedrag" class="text-xs text-gray-500 ml-1"
              >(cao versie {{ shortCaoVersion }})</span
            >
          </div>
          <div class="grid grid-cols-[150px_auto] col-span-2">
            <span class="pr-2 self-center">Werktijdfactor :</span>
            <div class="grid grid-cols-[1fr_20px_20px] gap-0">
              <input
                type="text"
                class="transition duration-300 border border-(--randkleur-inputs)! rounded-sm p-1 w-24 shadow-sm hover:shadow-lg!"
                v-model="settings.gr_fteWaarde"
                @blur="onFteBlur"
                @click="selectValue"
                @input="isValid = true"
                ref="fteWaarde"
              />
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
          </div>
          <div class="self-center pl-4 text-sm">
            Maandbedrag : {{ maandBedrag !== null ? FormateerGetallen.valuta(maandBedrag) : '' }}
          </div>
          <div class="grid grid-cols-[150px_auto]">
            <span class="mt-1">Soort gratificatie :</span>
            <div
              class="grid grid-cols-[100px_100px] gap-1 border border-(--randkleur-inputs)! rounded-sm p-1 shadow-sm"
            >
              <button
                type="button"
                title="25 jaar onderwijstijd"
                :class="[
                  'toggle-knop transition-all duration-300',
                  settings.gr_selectedJubileumJaar === '25'
                    ? 'bg-(--dcterra-red)! text-white!'
                    : 'bg-(--dcterra-red-light) text-gray-500 hover:bg-gray-200',
                ]"
                @click="settings.gr_selectedJubileumJaar = '25'"
              >
                25 jaar
              </button>
              <button
                type="button"
                title="40 jaar onderwijstijd"
                :class="[
                  'toggle-knop transition-all duration-300',
                  settings.gr_selectedJubileumJaar === '40'
                    ? 'bg-(--dcterra-red)! text-white!'
                    : 'bg-(--dcterra-red-light) text-gray-500 hover:bg-gray-200',
                ]"
                @click="settings.gr_selectedJubileumJaar = '40'"
              >
                40 jaar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!--Resultaat-->
      <div
        id="output-container"
        class="relative p-4 ml-2 w-max-[500px] bg-(--achtergrond-berekening) opacity-97 shadow rounded"
      >
        <div><p class="ubuntu-medium">Resultaat</p></div>
        <div class="grid grid-cols-[160px_150px_400px]">
          <span class="p-1">Bruto maandsalaris :</span>
          <div
            class="kopieer-knop"
            title="Klik om te kopiëren"
            role="button"
            tabindex="0"
            @click="kopieerBedrag('brutoJaar')"
            @keydown="onKopieerToets($event, () => kopieerBedrag('brutoJaar'))"
          >
            <span id="wg-bruto-jaar" class="text-right">{{ maandSalaris }} </span>
            <span class="kopieer-knop-icoon pointer-events-none">
              <i class="fa-solid fa-copy"></i
            ></span>
          </div>
          <span class="text-sm flex items-center">{{ maandSalarisBerekening }}</span>
        </div>
        <!--Vakantietoeslag-->
        <div class="grid grid-cols-[160px_150px_400px] mt-2">
          <span class="p-1">Vakantietoeslag :</span>
          <div
            class="kopieer-knop"
            title="Klik om te kopiëren"
            role="button"
            tabindex="0"
            @click="kopieerBedrag('vakantietoeslag')"
            @keydown="onKopieerToets($event, () => kopieerBedrag('vakantietoeslag'))"
          >
            <span id="wg-vakantietoeslag-jaar" class="text-right">{{ vakantietoeslag }}</span>
            <span class="kopieer-knop-icoon pointer-events-none">
              <i class="fa-solid fa-copy"></i
            ></span>
          </div>
          <span class="text-sm flex items-center">{{ vakantietoeslagBerekening }}</span>
        </div>

        <!--Totaal jaar-->
        <div class="grid grid-cols-[160px_150px_400px] mt-2 border-t pt-2 gap-0">
          <span class="p-1">Totaal :</span>
          <div
            class="kopieer-knop"
            title="Klik om te kopiëren"
            role="button"
            tabindex="0"
            @click="kopieerBedrag('totaal')"
            @keydown="onKopieerToets($event, () => kopieerBedrag('totaal'))"
          >
            <span id="wg-totaal-jaar" class="text-right">{{ totaal }} </span>
            <span class="kopieer-knop-icoon pointer-events-none">
              <i class="fa-solid fa-copy"></i
            ></span>
          </div>
          <span class="text-sm flex items-center">{{ totaalBedragBerekening }}</span>
        </div>
        <!-- <div class="mt-4"><button @click="validateFTE" class="bereken-knop mr-1!">Bereken</button></div> -->
      </div>

      <!--Opties-->
      <div
        id="options-container"
        class="relative py-2 px-4 ml-2 bg-(--achtergrond-berekening) opacity-97 shadow rounded transition-all duration-300 ease-in-out overflow-hidden"
      >
        <div @click="toggleOptions" class="cursor-pointer flex justify-between items-center mb-0">
          <p class="transition duration-300 ubuntu-medium text-sm hover:text-(--dcterra-red) mt-2">
            Opties
          </p>
          <i
            class="fa-solid fa-chevron-down transition-transform duration-300 mt-2.5"
            :class="{ 'rotate-180': isOptionsOpen }"
          ></i>
        </div>

        <div v-show="isOptionsOpen" class="grid grid-cols-[100px_200px] w-80 text-sm">
          <div class="self-center">CAO versie :</div>
          <select
            v-model="settings.gr_geselecteerdeCao"
            class="rounded border border-(--randkleur-inputs)! px-2 py-1"
          >
            <option v-for="item in caoVersie" :key="item" :value="item">{{ item }}</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<style></style>
