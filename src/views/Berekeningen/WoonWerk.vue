<script setup>
import PageTitleComponent from '@/components/PageTitle-Component.vue'
import { ref, computed } from 'vue'
import {
  selectValue,
  FormateerGetallen,
  kopieerBedrag as kopieerBedragNaarKlembord,
} from '@/utils/utilities'
import { useToast } from 'vue-toastification'

const toast = useToast()

const afstand = ref(5)
const afstandCorrect = () => {
  return afstand.value < 5 ? 0 : afstand.value > 40 ? 40 : afstand.value
}
const dienstreizen = ref(0)

const formatValuta = (value) => {
  return FormateerGetallen.valuta(value)
}

async function kopieerBedrag(waarde) {
  const result = await kopieerBedragNaarKlembord(waarde)

  result.success
    ? toast.success(`Bedrag ${result.formatted} gekopieerd`)
    : toast.error(`Kopiëren naar klembord mislukt ${result.error}`)
}

const woonWerk = () => {
  const distance = afstandCorrect()
  const vergMaand = Math.round(((distance * 2 * 0.19 * 214) / 12) * 100) / 100

  return {
    '5dagen': vergMaand,
    '4dagen': (vergMaand / 5) * 4,
    '3dagen': (vergMaand / 5) * 3,
    '2dagen': (vergMaand / 5) * 2,
    '1dag': vergMaand / 5,
    '1dag-uzk': distance * 2 * 0.19,
  }
}

const fiscaleRuimte = () => {
  const distance = afstand.value > 75 ? 75 : afstand.value === 0 ? 0 : afstand.value
  const dienstreizenJaar = dienstreizen.value ? dienstreizen.value : 0
  const wwk = woonWerk()['5dagen'] * 12
  const fisc = distance * 2 * 0.23 * 214 + dienstreizenJaar * 0.23

  return fisc - wwk
}

const woonWerkBedragen = computed(() => woonWerk())
const fiscaleRuimteJaar = computed(() => fiscaleRuimte())

function onKopieerToets(event, waarde) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    kopieerBedrag(waarde)
  }
}
</script>

<template>
  <div id="main" class="flex h-full pt-20 justify-center bg_1">
    <div class="flex flex-col gap-2 relative z-10 w-max-[500px]">
      <PageTitleComponent
        tekst1="vergoeding"
        tekst2="woon-werk"
        tekst3="berekenen"
        image1="fa-solid fa-car-side"
      />
      <div
        id="input-container"
        class="relative z-20 p-4 ml-2 w-max-[500px] bg-(--achtergrond-berekening) opacity-97 shadow rounded"
      >
        <div id="input">
          <div class="">
            <label for="input-afstand" class="mr-2">Aantal kilometers enkele reis</label>
            <input
              id="input-afstand"
              type="number"
              v-model="afstand"
              @click="selectValue"
              min="5"
              max="40"
              class="input-veld"
            />
            <span class="text-sm ml-2">(minimaal 5, maximaal 40)</span>
          </div>
          <div class="mt-2">
            <label for="input-dienstreizen" class="mr-2"
              >Kilometers dienstreizen op jaarbasis</label
            >
            <input
              id="input-dienstreizen"
              type="number"
              v-model="dienstreizen"
              @click="selectValue"
              class="input-veld"
            />
            <span class="text-sm ml-2">(schatting)</span>
          </div>
        </div>
      </div>
      <div
        id="output-container"
        class="relative p-4 ml-2 w-max-[500px] bg-(--achtergrond-berekening) opacity-97 shadow rounded"
      >
        <div class="grid grid-cols-[80px_100px_250px_100px] gap-2">
          <!-- RIJ header -->
          <span class="font-bold">Reisdagen</span>
          <span class="wrap-break-word font-bold">Vergoeding per maand</span>
          <span class="font-bold">Berekening</span>
          <span class="wrap-break-word font-bold">Fiscale ruimte per jaar</span>

          <!-- RIJ 1 -->
          <span>1</span>
          <div
            class="kopieer-knop"
            title="Klik om te kopiëren"
            role="button"
            tabindex="0"
            @click="kopieerBedrag(woonWerkBedragen['1dag'])"
            @keydown="onKopieerToets($event, woonWerkBedragen['1dag'])"
          >
            <span id="vergoeding-1dag">{{ formatValuta(woonWerkBedragen['1dag']) }}</span>
            <span class="kopieer-knop-icoon pointer-events-none">
              <i class="fa-solid fa-copy"></i>
            </span>
          </div>
          <span id="berekening-1dag">{{ `${afstandCorrect()} * 2 * 0,19 * 214 / 12 * 1/5` }}</span>
          <span id="fiscale-ruimte-1dag">{{ formatValuta(fiscaleRuimteJaar / 5) }}</span>

          <!-- RIJ 2 -->
          <span>2</span>
          <div
            class="kopieer-knop"
            title="Klik om te kopiëren"
            role="button"
            tabindex="0"
            @click="kopieerBedrag(woonWerkBedragen['2dagen'])"
            @keydown="onKopieerToets($event, woonWerkBedragen['2dagen'])"
          >
            <span id="vergoeding-2dag">{{ formatValuta(woonWerkBedragen['2dagen']) }}</span
            ><span class="kopieer-knop-icoon pointer-events-none">
              <i class="fa-solid fa-copy"></i
            ></span>
          </div>
          <span id="berekening-2dag">{{ `${afstandCorrect()} * 2 * 0,19 * 214 / 12 * 2/5` }}</span>
          <span id="fiscale-ruimte-2dag">{{ formatValuta((fiscaleRuimteJaar / 5) * 2) }}</span>

          <!-- RIJ 3 -->
          <span>3</span>
          <div
            class="kopieer-knop"
            title="Klik om te kopiëren"
            role="button"
            tabindex="0"
            @click="kopieerBedrag(woonWerkBedragen['3dagen'])"
            @keydown="onKopieerToets($event, woonWerkBedragen['3dagen'])"
          >
            <span id="vergoeding-3dag">{{ formatValuta(woonWerkBedragen['3dagen']) }}</span
            ><span class="kopieer-knop-icoon pointer-events-none">
              <i class="fa-solid fa-copy"></i
            ></span>
          </div>
          <span id="berekening-3dag">{{ `${afstandCorrect()} * 2 * 0,19 * 214 / 12 * 3/5` }}</span>
          <span id="fiscale-ruimte-3dag">{{ formatValuta((fiscaleRuimteJaar / 5) * 3) }}</span>

          <!-- RIJ 4 -->
          <span>4</span>
          <div
            class="kopieer-knop"
            title="Klik om te kopiëren"
            role="button"
            tabindex="0"
            @click="kopieerBedrag(woonWerkBedragen['4dagen'])"
            @keydown="onKopieerToets($event, woonWerkBedragen['4dagen'])"
          >
            <span id="vergoeding-4dag">{{ formatValuta(woonWerkBedragen['4dagen']) }}</span>
            <span class="kopieer-knop-icoon pointer-events-none">
              <i class="fa-solid fa-copy"></i
            ></span>
          </div>
          <span id="berekening-4dag">{{ `${afstandCorrect()} * 2 * 0,19 * 214 / 12 * 4/5` }}</span>
          <span id="fiscale-ruimte-4dag">{{ formatValuta((fiscaleRuimteJaar / 5) * 4) }}</span>

          <!-- RIJ 5 -->
          <span>5</span>
          <div
            class="kopieer-knop"
            title="Klik om te kopiëren"
            role="button"
            tabindex="0"
            @click="kopieerBedrag(woonWerkBedragen['5dagen'])"
            @keydown="onKopieerToets($event, woonWerkBedragen['5dagen'])"
          >
            <span id="vergoeding-5dag">{{ formatValuta(woonWerkBedragen['5dagen']) }}</span>
            <span class="kopieer-knop-icoon pointer-events-none">
              <i class="fa-solid fa-copy"></i
            ></span>
          </div>
          <span id="berekening-5dag">{{ `${afstandCorrect()} * 2 * 0,19 * 214 / 12 * 5/5` }}</span>
          <span id="fiscale-ruimte-5dag">{{ formatValuta(fiscaleRuimteJaar) }}</span>

          <!-- RIJ 6 -->
          <span class="mt-2">1 (uitzend)</span>
          <span class="mt-2" id="vergoeding-1dag-uzk">{{
            formatValuta(woonWerkBedragen['1dag-uzk'])
          }}</span>
          <span class="mt-2" id="berekening-1dag-uzk">{{ `${afstandCorrect()} * 2 * 0,19` }}</span>
          <span class="mt-2" id="fiscale-ruimte-1dag-uzk"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style></style>
