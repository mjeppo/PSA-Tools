<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import SchaalSelectComponent from '@/components/SchaalSelect-component.vue'
import DatePickerComponent from '@/components/DatePicker-Component.vue'
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
  kopieerBedrag as kopieerBedragNaarKlembord,
  kopieerWaarde as kopieerWaardeNaarKlembord,
  isValidFTE,
  FormateerGetallen,
} from '@/utils/utilities'
import { useSettings } from '@/composables/useLocalstorage'
import PageTitleComponent from '@/components/PageTitle-Component.vue'

const { settings } = useSettings()
const transIngang = ref('')
const transEinddatum = ref('')
const anderMeetellendLoon = ref(0)

const isOptionsOpen = ref(false)

function toggleOptions() {
  isOptionsOpen.value = !isOptionsOpen.value
}

const toast = useToast()
const toastIsActive = ref(false)
const dateToastIsActive = ref(false)
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
      schaal.label === settings.trans_schaal,
  )

  // Geef de ECHTE (original) waarde terug
  return selectedObject ? selectedObject.value : null
})

const fteStatus = ref('VALID') // Kan zijn: 'VALID', 'INVALID', 'WARNING'

const validateFTE = async () => {
  fteStatus.value = isValidFTE(settings.trans_fteWaarde)

  isValid.value = fteStatus.value !== 'INVALID'

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
    settings.trans_fteWaarde = number.toFixed(5).replace('.', ',')
  }
}

const fteAsNumber = computed(() => {
  if (!settings.trans_fteWaarde) return 0

  const fteString = String(settings.trans_fteWaarde)
  // vervang komma door punt
  const normalized = fteString.replace(',', '.')
  const number = Number(normalized)

  return isNaN(number) ? 0 : number
})

function parseDatumString(datumString) {
  if (!datumString || typeof datumString !== 'string') {
    return null
  }

  // Ondersteun zowel nieuw formaat dd-mm-yyyy als bestaand yyyy-mm-dd uit storage.
  if (/^\d{2}-\d{2}-\d{4}$/.test(datumString)) {
    const [dd, mm, yyyy] = datumString.split('-').map(Number)
    return new Date(yyyy, mm - 1, dd)
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(datumString)) {
    const [yyyy, mm, dd] = datumString.split('-').map(Number)
    return new Date(yyyy, mm - 1, dd)
  }

  return null
}

function naarDdMmYyyy(datumString) {
  if (!datumString) {
    return ''
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(datumString)) {
    return datumString
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(datumString)) {
    const [yyyy, mm, dd] = datumString.split('-')
    return `${dd}-${mm}-${yyyy}`
  }

  return datumString
}

function addDays(datum, dagen) {
  const nieuweDatum = new Date(datum)
  nieuweDatum.setDate(nieuweDatum.getDate() + dagen)
  return nieuweDatum
}

function dateDiff(startDatum, eindDatum) {
  // Beide data zijn INCLUSIEF (tot en met)
  if (!startDatum || !eindDatum || eindDatum < startDatum) {
    return { jaren: 0, maanden: 0, dagen: 0 }
  }

  const sy = startDatum.getFullYear(), sm = startDatum.getMonth(), sd = startDatum.getDate()
  const ey = eindDatum.getFullYear(),  em = eindDatum.getMonth(),  ed = eindDatum.getDate()

  // Zelfde kalendermaand: simpele dagtelling
  if (sy === ey && sm === em) {
    return { jaren: 0, maanden: 0, dagen: ed - sd + 1 }
  }

  const daysInSM = new Date(sy, sm + 1, 0).getDate()
  const daysInEM = new Date(ey, em + 1, 0).getDate()

  // Resterende dagen in beginmaand (startdatum t/m einde beginmaand)
  const startRest = sd === 1 ? 0 : (daysInSM - sd + 1)

  // Eindmaand volledig of gedeeltelijk?
  const eindVolMaand = ed === daysInEM
  const eindRest = eindVolMaand ? 0 : ed

  // Eerste volledige kalendermaand
  let fcy = sy, fcm = sd === 1 ? sm : sm + 1
  if (fcm > 11) { fcy++; fcm = 0 }

  // Laatste volledige kalendermaand
  let lcy = ey, lcm = eindVolMaand ? em : em - 1
  if (lcm < 0) { lcy--; lcm = 11 }

  // Tel volledige kalendermaanden
  let totalMaanden = 0
  if (lcy > fcy || (lcy === fcy && lcm >= fcm)) {
    totalMaanden = (lcy - fcy) * 12 + (lcm - fcm) + 1
  }

  const jaren   = Math.floor(totalMaanden / 12)
  const maanden = totalMaanden % 12
  const dagen   = startRest + eindRest

  return { jaren, maanden, dagen }
}

function validateDatumbereik() {
  const beginDatum = parseDatumString(transIngang.value)
  const eindDatum = parseDatumString(transEinddatum.value)

  if (!beginDatum || !eindDatum) {
    dateToastIsActive.value = false
    return
  }

  if (eindDatum < beginDatum && !dateToastIsActive.value) {
    toast.error('Einddatum mag niet vóór de begindatum liggen.', {
      position: 'top-center',
    })
    dateToastIsActive.value = true
    return
  }

  if (eindDatum >= beginDatum) {
    dateToastIsActive.value = false
  }
}

const bedragen = computed(() => {
  if (!schaalBedrag.value) {
    return {
      vakantietoeslag: 0,
      eindejaars: 0,
      totaal: 0,
    }
  }

  const brutoMaand = fteAsNumber.value * schaalBedrag.value
  const vakantietoeslag = brutoMaand * 0.08
  const eindejaars = brutoMaand * 0.0833
  const totaal = brutoMaand + vakantietoeslag + eindejaars + anderMeetellendLoon.value
  const ingangDatum = parseDatumString(transIngang.value)
  const eindDatum = parseDatumString(transEinddatum.value)
  const resultaat = ingangDatum && eindDatum ? dateDiff(ingangDatum, eindDatum) : null
  const jaren = resultaat?.jaren ?? 0
  const maanden = (resultaat?.maanden ?? 0) / 12
  const dagen = (resultaat?.dagen ?? 0) / 365
  const dienstjarenExact = jaren + maanden + dagen
  const transitievergoeding = (totaal / 3) * dienstjarenExact

  const brutoMaandBerekening = `(${FormateerGetallen.valuta(schaalBedrag.value)} * ${FormateerGetallen.decimalen4(fteAsNumber.value)})`
  const vakantietoeslagBerekening = `(${FormateerGetallen.valuta(brutoMaand)} * 8%)`
  const eindejaarsUitkeringBerekening = `(${FormateerGetallen.valuta(brutoMaand)} * 8,33%)`
  const totaalBedragBerekening = `(${FormateerGetallen.valuta(brutoMaand)} + ${FormateerGetallen.valuta(vakantietoeslag)} + ${FormateerGetallen.valuta(eindejaars)})`
  const periodeloonBerekening = `(${FormateerGetallen.valuta(brutoMaand)} + ${FormateerGetallen.valuta(vakantietoeslag)} + ${FormateerGetallen.valuta(eindejaars)} + ${FormateerGetallen.valuta(anderMeetellendLoon.value)})`
  const dienstjarenBerekening = `${ingangDatum ? naarDdMmYyyy(transIngang.value) : '?'} t/m ${eindDatum ? naarDdMmYyyy(transEinddatum.value) : '?'} = ${jaren} jaar + ${resultaat?.maanden ?? 0} maanden + ${resultaat?.dagen ?? 0} dagen = ${dienstjarenExact.toFixed(5)} jaar`
  const transitievergoedingBerekening = `(${FormateerGetallen.valuta(totaal)} * ${dienstjarenExact.toFixed(5)} / 3 ) `

  return {
    brutoMaand,
    vakantietoeslag,
    eindejaars,
    totaal,
    brutoMaandBerekening,
    vakantietoeslagBerekening,
    eindejaarsUitkeringBerekening,
    totaalBedragBerekening,
    periodeloonBerekening,
    dienstjarenExact,
    dienstjarenBerekening,
    transitievergoeding,
    transitievergoedingBerekening,
  }
})

const formatValuta = (value) => {
  return FormateerGetallen.valuta(value)
}

const maandBedrag = computed(() => bedragen.value.brutoMaand)
const brutoMaandSalaris = computed(() => formatValuta(bedragen.value.brutoMaand))
const vakantietoeslag = computed(() => formatValuta(bedragen.value.vakantietoeslag))
const eindejaarsUitkering = computed(() => formatValuta(bedragen.value.eindejaars))
const jaarTotaal = computed(() => formatValuta(bedragen.value.totaal))
const brutoMaandSalarisBerekening = computed(() => bedragen.value.brutoMaandBerekening)

const vakantietoeslagBerekening = computed(() => bedragen.value.vakantietoeslagBerekening)
const eindejaarsUitkeringBerekening = computed(() => bedragen.value.eindejaarsUitkeringBerekening)
const totaalBedragBerekening = computed(() => bedragen.value.totaalBedragBerekening)
const totaalPeriodeloonBerekening = computed(() => bedragen.value.periodeloonBerekening)
const dienstjaren = computed(() => bedragen.value.dienstjarenExact.toFixed(6))
const dienstjarenBerekeningTekst = computed(() => bedragen.value.dienstjarenBerekening)
const transitievergoedingBedrag = computed(() => formatValuta(bedragen.value.transitievergoeding))
const transitievergoedingBerekeningTekst = computed(
  () => bedragen.value.transitievergoedingBerekening,
)

async function kopieerBedrag(key) {
  const value = bedragen.value[key]
  const result = await kopieerBedragNaarKlembord(value)

  result.success
    ? toast.success(`Bedrag ${result.formatted} gekopieerd`)
    : toast.error(`Kopiëren naar klembord mislukt ${result.error}`)
}

async function kopieerWaarde(value, omschrijving) {
  const result = await kopieerWaardeNaarKlembord(value)

  result.success
    ? toast.success(`${omschrijving} ${result.formatted} gekopieerd`)
    : toast.error(`Kopiëren naar klembord mislukt ${result.error}`)
}

function onKopieerToets(event, callback) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    callback()
  }
}

const standaardDatums = () => {
  const today = new Date()
  const jaar = today.getFullYear()
  const begin = `01-01-${jaar}`
  const eind = `31-07-${jaar}`
  return { begin, eind }
}

onMounted(() => {
  isOptionsOpen.value = false

  const { begin, eind } = standaardDatums()
  transIngang.value = begin
  transEinddatum.value = eind

  validateFTE()
  validateDatumbereik()
})

watch([transIngang, transEinddatum], () => {
  validateDatumbereik()
})
</script>

<template>
  <div id="main" class="flex h-full pt-4 justify-center bg_1">
    <div id="titel-container" class="flex flex-col gap-2 relative z-10 w-max-[500px]">
      <PageTitleComponent tekst1="bedrag" tekst2="transitievergoeding" tekst3="berekenen" />
      <div
        id="input-container"
        class="relative z-20 p-4 ml-2 w-max-[500px] bg-(--achtergrond-berekening) opacity-97 shadow rounded"
      >
        <div><p class="ubuntu-medium">Invoer</p></div>
        <div class="grid grid-cols-[200px_150px_400px] gap-y-2">
          <div class="grid grid-cols-[230px_auto] col-span-2">
            <span class="self-center">Schaal :</span>
            <SchaalSelectComponent :options="actueleSchalenLijst" v-model="settings.trans_schaal" />
          </div>
          <div class="self-center pl-4 text-sm" id="schaalBedrag">
            Schaalbedrag : {{ schaalBedrag !== null ? FormateerGetallen.valuta(schaalBedrag) : '' }}
            <span v-if="schaalBedrag" class="text-xs text-gray-500 ml-1"
              >(cao versie {{ shortCaoVersion }})</span
            >
          </div>
          <div class="grid grid-cols-[230px_auto] col-span-2">
            <span class="pr-2 self-center">Werktijdfactor :</span>
            <div class="grid grid-cols-[1fr_20px_20px] gap-0">
              <input
                type="text"
                class="transition duration-300 border border-(--randkleur-inputs)! rounded-sm p-1 w-24 shadow-sm hover:shadow-lg!"
                v-model="settings.trans_fteWaarde"
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
          <div class="grid grid-cols-[230px_auto] gap-y-2">
            <label for="ingangsdatum" class="self-center">Ingangsdatum dienstverband :</label>
            <DatePickerComponent
              input-id="ingangsdatum"
              v-model="transIngang"
              class="transition duration-300 border rounded-sm p-1 w-32 shadow-sm hover:shadow-lg!"
              :class="
                dateToastIsActive
                  ? 'border-red-500 ring-2 ring-red-200'
                  : 'border-(--randkleur-inputs)!'
              "
            />
            <label for="einddatum" class="self-center">Einddatum dienstverband :</label>
            <DatePickerComponent
              input-id="einddatum"
              v-model="transEinddatum"
              class="transition duration-300 border rounded-sm p-1 w-32 shadow-sm hover:shadow-lg!"
              :class="
                dateToastIsActive
                  ? 'border-red-500 ring-2 ring-red-200'
                  : 'border-(--randkleur-inputs)!'
              "
            />
            <label for="ander-meetellend-loon" class="self-center">Ander meetellend loon :</label>
            <input
              type="number"
              id="ander-meetellend-loon"
              v-model.number="anderMeetellendLoon"
              class="transition duration-300 border border-(--randkleur-inputs)! rounded-sm p-1 w-32 shadow-sm hover:shadow-lg!"
            />
          </div>
        </div>
      </div>

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
            @click="kopieerBedrag('brutoMaand')"
            @keydown="onKopieerToets($event, () => kopieerBedrag('brutoMaand'))"
          >
            <span id="wg-bruto-maand" class="text-right">{{ brutoMaandSalaris }} </span>
            <span class="kopieer-knop-icoon pointer-events-none">
              <i class="fa-solid fa-copy"></i
            ></span>
          </div>
          <span class="text-sm flex items-center">{{ brutoMaandSalarisBerekening }}</span>
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
        <div class="grid grid-cols-[160px_150px_400px] mt-2 pt-2 gap-0">
          <span class="p-1">Totaal periodeloon :</span>
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
          <span class="text-sm flex items-center">{{ totaalPeriodeloonBerekening }}</span>
        </div>
        <div class="grid grid-cols-[160px_150px_400px] mt-2 pt-2 gap-0">
          <span class="p-1">Aantal dienstjaren :</span>
          <div
            class="kopieer-knop"
            title="Klik om te kopiëren"
            role="button"
            tabindex="0"
            @click="kopieerWaarde(dienstjaren, 'Dienstjaren')"
            @keydown="onKopieerToets($event, () => kopieerWaarde(dienstjaren, 'Dienstjaren'))"
          >
            <span id="dienstjaren" class="text-right">{{ dienstjaren }} </span>
            <span class="kopieer-knop-icoon pointer-events-none">
              <i class="fa-solid fa-copy"></i
            ></span>
          </div>
          <span class="text-sm flex items-center">{{ dienstjarenBerekeningTekst }}</span>
        </div>
        <div class="grid grid-cols-[160px_150px_400px] mt-2 pt-2 gap-0">
          <span class="p-1 font-bold">Transitievergoeding :</span>
          <div
            class="kopieer-knop"
            title="Klik om te kopiëren"
            role="button"
            tabindex="0"
            @click="kopieerBedrag('transitievergoeding')"
            @keydown="onKopieerToets($event, () => kopieerBedrag('transitievergoeding'))"
          >
            <span id="transitievergoeding" class="text-right font-bold"
              >{{ transitievergoedingBedrag }}
            </span>
            <span class="kopieer-knop-icoon pointer-events-none">
              <i class="fa-solid fa-copy"></i
            ></span>
          </div>
          <span class="text-sm flex items-center">{{ transitievergoedingBerekeningTekst }}</span>
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
