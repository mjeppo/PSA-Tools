<script setup>
import PageTitleComponent from '@/components/PageTitle-Component.vue'
import { ref, computed } from 'vue'
import { FormateerGetallen, kopieerBedrag as kopieerBedragNaarKlembord } from '@/utils/utilities'
import { useToast } from 'vue-toastification'

const toast = useToast()

const factor = ref(3)
const bedrag = ref(null)
const resultaten = ref(null)

const setFactor = (waarde) => {
  factor.value = waarde
}

const handleFactorChange = (waarde) => {
  setFactor(waarde)
  berekenDelen()
}

async function kopieerBedrag(waarde) {
  const result = await kopieerBedragNaarKlembord(waarde)

  result.success
    ? toast.success(`Bedrag ${result.formatted} gekopieerd`)
    : toast.error(`Kopiëren naar klembord mislukt ${result.error}`)
}

function onKopieerToets(event, waarde) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    kopieerBedrag(waarde)
  }
}

const berekenDelen = () => {
  if (!bedrag.value || bedrag.value <= 0) {
    resultaten.value = null
    return
  }

  const getal = parseFloat(bedrag.value)
  const rest = getal % factor.value
  const afgerond = Math.round((getal / factor.value) * 100) / 100

  if (rest === 0) {
    resultaten.value = {
      enkelvoudig: true,
      bedrag: afgerond,
      tekst: `${factor.value} x ${FormateerGetallen.valuta(afgerond)}`,
    }
  } else {
    const restBedrag = Math.round((getal - afgerond * (factor.value - 1)) * 100) / 100
    if (restBedrag === afgerond) {
      resultaten.value = {
        enkelvoudig: true,
        bedrag: afgerond,
        tekst: `${factor.value} x ${FormateerGetallen.valuta(afgerond)}`,
      }
    } else {
      resultaten.value = {
        enkelvoudig: false,
        aantalAfgerond: factor.value - 1,
        bedrag: afgerond,
        restBedrag: restBedrag,
        tekst: `${factor.value - 1} x ${FormateerGetallen.valuta(afgerond)}, 1 x ${FormateerGetallen.valuta(restBedrag)}`,
      }
    }
  }
}
</script>

<template>
  <div id="main" class="flex h-screen pt-20 justify-center bg_1">
    <div class="flex flex-col gap-2 relative z-10 w-max-[500px]">
      <PageTitleComponent
        tekst1="delen door"
        tekst2="3 / 6 / 12"
        tekst3=""
        image1="fa-solid fa-divide"
      />
      <div
        id="input-container"
        class="relative z-20 p-4 ml-2 w-max-[500px] bg-(--achtergrond-berekening) opacity-97 shadow rounded"
      >
        <div class="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2">
          <input
            v-model.number="bedrag"
            type="number"
            placeholder="bedrag"
            @input="berekenDelen"
            class="input-veld"
          />
          <button
            :class="[
              'toggle-knop transition-all duration-300',
              factor === 3
                ? 'bg-(--dcterra-red) text-white'
                : 'bg-(--dcterra-red-light) text-gray-700',
            ]"
            @click="handleFactorChange(3)"
          >
            3
          </button>
          <button
            :class="[
              'toggle-knop transition-all duration-300',
              factor === 6
                ? 'bg-(--dcterra-red) text-white'
                : 'bg-(--dcterra-red-light) text-gray-700',
            ]"
            @click="handleFactorChange(6)"
          >
            6
          </button>
          <button
            :class="[
              'toggle-knop transition-all duration-300',
              factor === 12
                ? 'bg-(--dcterra-red) text-white'
                : 'bg-(--dcterra-red-light) text-gray-700',
            ]"
            @click="handleFactorChange(12)"
          >
            12
          </button>
        </div>
      </div>

      <div
        v-if="resultaten"
        class="p-4 ml-2 w-max-[500px] bg-(--achtergrond-berekening) opacity-97 shadow rounded"
      >
        <div v-if="resultaten.enkelvoudig">
          <div
            class="kopieer-knop"
            title="Klik om te kopiëren"
            role="button"
            tabindex="0"
            @click="kopieerBedrag(resultaten.bedrag)"
            @keydown="onKopieerToets($event, resultaten.bedrag)"
          >
            <span class="text-lg font-semibold text-(--dcterra-red)">{{ resultaten.tekst }}</span>
            <span class="kopieer-knop-icoon pointer-events-none">
              <i class="fa-solid fa-copy"></i>
            </span>
          </div>
        </div>
        <div v-else>
          <div
            class="kopieer-knop"
            title="Klik om te kopiëren"
            role="button"
            tabindex="0"
            @click="kopieerBedrag(resultaten.bedrag)"
            @keydown="onKopieerToets($event, resultaten.bedrag)"
          >
            <span class="text-lg font-semibold text-(--dcterra-red)"
              >{{ resultaten.aantalAfgerond }} x
              {{ FormateerGetallen.valuta(resultaten.bedrag) }}</span
            >
            <span class="kopieer-knop-icoon pointer-events-none">
              <i class="fa-solid fa-copy"></i>
            </span>
          </div>
          <div
            class="kopieer-knop mt-2"
            title="Klik om te kopiëren"
            role="button"
            tabindex="0"
            @click="kopieerBedrag(resultaten.restBedrag)"
            @keydown="onKopieerToets($event, resultaten.restBedrag)"
          >
            <span class="text-lg font-semibold text-(--dcterra-red)"
              >1 x {{ FormateerGetallen.valuta(resultaten.restBedrag) }}</span
            >
            <span class="kopieer-knop-icoon pointer-events-none">
              <i class="fa-solid fa-copy"></i>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
