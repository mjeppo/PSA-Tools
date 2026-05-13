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

const geselecteerdeCao = ref(settings.wg_geselecteerdeCao)

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
  return caoMapping[settings.wg_geselecteerdeCao] || schalenArray2025_1
})

const shortCaoVersion = computed(() => {
  if (!settings.wg_geselecteerdeCao) return ''
  // "2025-1 (01-01-2025)" -> "2025_1"
  return settings.wg_geselecteerdeCao.split(' ')[0].replace('-', '_')
})

const schaalBedrag = computed(() => {
  // Zoek het object in de ACTUELE array
  const selectedObject = actueleSchalenLijst.value.find(
    (schaal) =>
      // We zoeken op de unieke label die in v-model zit
      schaal.label === settings.wg_geselecteerdeSchaalInView,
  )

  // Geef de ECHTE (original) waarde terug
  return selectedObject ? selectedObject.value : null
})

const fteInputRef = ref(null)
const fteStatus = ref('VALID') // Kan zijn: 'VALID', 'INVALID', 'WARNING'

const validateFTE = async () => {
  fteStatus.value = isValidFTE(settings.wg_fteWaarde)

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
    settings.wg_fteWaarde = number.toFixed(5).replace('.', ',')
  }
}

const fteAsNumber = computed(() => {
  if (!settings.wg_fteWaarde) return 0

  const fteString = String(settings.wg_fteWaarde)
  // vervang komma door punt
  const normalized = fteString.replace(',', '.')
  const number = Number(normalized)

  return isNaN(number) ? 0 : number
})

const bedragen = computed(() => {
  if (!schaalBedrag.value) {
    return {
      brutoJaar: 0,
      vakantietoeslag: 0,
      eindejaars: 0,
      totaal: 0,
    }
  }

  const brutoMaand = fteAsNumber.value * schaalBedrag.value
  const brutoJaar = fteAsNumber.value * schaalBedrag.value * 12
  const vakantietoeslag = brutoJaar * 0.08
  const eindejaars = brutoJaar * 0.0833
  const totaal = brutoJaar + vakantietoeslag + eindejaars

  const brutoJaarBerekening = `(${FormateerGetallen.valuta(schaalBedrag.value)} * ${FormateerGetallen.decimalen4(fteAsNumber.value)} * 12)`
  const vakantietoeslagBerekening = `(${FormateerGetallen.valuta(brutoJaar)} * 8%)`
  const eindejaarsUitkeringBerekening = `(${FormateerGetallen.valuta(brutoJaar)} * 8,33%)`
  const totaalBedragBerekening = `(${FormateerGetallen.valuta(brutoJaar)} + ${FormateerGetallen.valuta(vakantietoeslag)} + ${FormateerGetallen.valuta(eindejaars)})`

  return {
    brutoMaand,
    brutoJaar,
    vakantietoeslag,
    eindejaars,
    totaal,
    brutoJaarBerekening,
    vakantietoeslagBerekening,
    eindejaarsUitkeringBerekening,
    totaalBedragBerekening,
  }
})

const formatValuta = (value) => {
  return FormateerGetallen.valuta(value)
}
const formatGetal = (value) => {
  return FormateerGetallen.decimalen2(value)
}

const maandBedrag = computed(() => bedragen.value.brutoMaand)
const brutoJaarsalaris = computed(() => formatValuta(bedragen.value.brutoJaar))
const vakantietoeslag = computed(() => formatValuta(bedragen.value.vakantietoeslag))
const eindejaarsUitkering = computed(() => formatValuta(bedragen.value.eindejaars))
const jaarTotaal = computed(() => formatValuta(bedragen.value.totaal))
const brutoJaarSalarisBerekening = computed(() => bedragen.value.brutoJaarBerekening)
const vakantietoeslagBerekening = computed(() => bedragen.value.vakantietoeslagBerekening)
const eindejaarsUitkeringBerekening = computed(() => bedragen.value.eindejaarsUitkeringBerekening)
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
  <div id="main" class="flex h-screen pt-20 justify-center bg_1">
    <div id="titel-container" class="flex flex-col gap-2 relative z-10 w-max-[500px]">
      <PageTitleComponent tekst1="Bedragen" tekst2="werkgeversverklaring" tekst3="berekenen" />
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
              v-model="settings.wg_geselecteerdeSchaalInView"
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
                v-model="settings.wg_fteWaarde"
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
        </div>
      </div>

      <div
        id="output-container"
        class="relative p-4 ml-2 w-max-[500px] bg-(--achtergrond-berekening) opacity-97 shadow rounded"
      >
        <div><p class="ubuntu-medium">Resultaat</p></div>
        <div class="grid grid-cols-[160px_150px_400px]">
          <span class="p-1">Bruto jaarsalaris :</span>
          <div
            class="kopieer-knop"
            title="Klik om te kopiëren"
            role="button"
            tabindex="0"
            @click="kopieerBedrag('brutoJaar')"
            @keydown="onKopieerToets($event, () => kopieerBedrag('brutoJaar'))"
          >
            <span id="wg-bruto-jaar" class="text-right">{{ brutoJaarsalaris }} </span>
            <span class="kopieer-knop-icoon pointer-events-none">
              <i class="fa-solid fa-copy"></i
            ></span>
          </div>
          <span class="text-sm flex items-center">{{ brutoJaarSalarisBerekening }}</span>
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
        <!--Eindejaarsuitkering-->
        <div class="grid grid-cols-[160px_150px_400px] mt-2">
          <span class="p-1">Eindejaarsuitkering :</span>
          <div
            class="kopieer-knop"
            title="Klik om te kopiëren"
            role="button"
            tabindex="0"
            @click="kopieerBedrag('eindejaars')"
            @keydown="onKopieerToets($event, () => kopieerBedrag('eindejaars'))"
          >
            <span id="wg-eindejaarsuitkering-jaar" class="text-right"
              >{{ eindejaarsUitkering }}
            </span>
            <span class="kopieer-knop-icoon pointer-events-none">
              <i class="fa-solid fa-copy"></i
            ></span>
          </div>
          <span class="text-sm flex items-center">{{ eindejaarsUitkeringBerekening }}</span>
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
            <span id="wg-totaal-jaar" class="text-right">{{ jaarTotaal }} </span>
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
            v-model="settings.wg_geselecteerdeCao"
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
