<script setup>
import { computed, ref } from 'vue'
import vSelect from 'vue-select'
import { useToast } from 'vue-toastification'
import PageTitleComponent from '@/components/PageTitle-Component.vue'
import {
  schalenArray2025_1,
  schalenArray2024_1,
  schalenArray2024_2,
  schalenArray2023_1,
  schalenArray2023_2,
} from '@/utils/schalen'
import { FormateerGetallen, kopieerBedrag as kopieerBedragNaarKlembord } from '@/utils/utilities'

const toast = useToast()

const datasetOpties = [
  { id: '2025_1', label: '2025-1 (01-01-2025)' },
  { id: '2024_2', label: '2024-2 (01-07-2024)' },
  { id: '2024_1', label: '2024-1 (01-01-2024)' },
  { id: '2023_2', label: '2023-2 (01-07-2023)' },
  { id: '2023_1', label: '2023-1 (01-01-2023)' },
]

const datasets = {
  '2025_1': schalenArray2025_1,
  '2024_2': schalenArray2024_2,
  '2024_1': schalenArray2024_1,
  '2023_2': schalenArray2023_2,
  '2023_1': schalenArray2023_1,
}

const selectedDatasetId = ref('2025_1')
const selectedSchaalFilterValues = ref([])
const selectedSoortFilterValue = ref('ALL')

const fte = ref(1)
const verrekenFte = ref(false)

function fteWaarde(waarde) {
  if (!verrekenFte.value) return waarde
  const factor = parseFloat(fte.value)
  return isNaN(factor) || factor <= 0 ? waarde : waarde * factor
}

const selectedDatasetOptie = computed({
  get() {
    return datasetOpties.find((optie) => optie.id === selectedDatasetId.value) ?? datasetOpties[0]
  },
  set(newValue) {
    selectedDatasetId.value = newValue?.id ?? '2025_1'
  },
})

const isOpPrefix = (prefix) => ['LB', 'LC', 'LD'].includes(prefix)

const actieveDataset = computed(() => {
  return datasets[selectedDatasetId.value] ?? schalenArray2025_1
})

const schaalVolgorde = computed(() => {
  const volgorde = []
  const gezien = new Set()

  for (const item of actieveDataset.value) {
    const prefix = item.label.split('.')[0]
    if (!gezien.has(prefix)) {
      gezien.add(prefix)
      volgorde.push(prefix)
    }
  }

  return volgorde
})

const schaalFilterOpties = computed(() => {
  return schaalVolgorde.value.map((prefix) => ({ value: prefix, label: `Schaal ${prefix}` }))
})

const selectedSchaalFilter = computed({
  get() {
    return schaalFilterOpties.value.filter((optie) =>
      selectedSchaalFilterValues.value.includes(optie.value),
    )
  },
  set(newValues) {
    selectedSchaalFilterValues.value = Array.isArray(newValues)
      ? newValues.map((item) => item.value)
      : []
  },
})

const soortFilterOpties = [
  { value: 'ALL', label: 'Alle soorten' },
  { value: 'OBP', label: 'OBP (01 t/m 18)' },
  { value: 'OP', label: 'OP (LB, LC, LD)' },
]

const selectedSoortFilter = computed({
  get() {
    return (
      soortFilterOpties.find((optie) => optie.value === selectedSoortFilterValue.value) ??
      soortFilterOpties[0]
    )
  },
  set(newValue) {
    selectedSoortFilterValue.value = newValue?.value ?? 'ALL'
  },
})

function clearCaoFilter() {
  selectedDatasetId.value = '2025_1'
}

function clearSchaalFilter() {
  selectedSchaalFilterValues.value = []
}

function clearSoortFilter() {
  selectedSoortFilterValue.value = 'ALL'
}

function clearAlleFilters() {
  clearCaoFilter()
  clearSchaalFilter()
  clearSoortFilter()
}

const verrijkteSchalen = computed(() => {
  return actieveDataset.value.map((item) => {
    const prefix = item.label.split('.')[0]
    return {
      ...item,
      prefix,
      soort: isOpPrefix(prefix) ? 'OP' : 'OBP',
    }
  })
})

const gefilterdeSchalen = computed(() => {
  return verrijkteSchalen.value.filter((item) => {
    const matchSchaal =
      selectedSchaalFilterValues.value.length === 0 ||
      selectedSchaalFilterValues.value.includes(item.prefix)
    const matchSoort =
      selectedSoortFilterValue.value === 'ALL' || item.soort === selectedSoortFilterValue.value

    return matchSchaal && matchSoort
  })
})

const tabellenPerSchaal = computed(() => {
  const groepen = new Map()

  for (const item of gefilterdeSchalen.value) {
    if (!groepen.has(item.prefix)) {
      groepen.set(item.prefix, [])
    }
    groepen.get(item.prefix).push(item)
  }

  return schaalVolgorde.value
    .filter((prefix) => groepen.has(prefix))
    .map((prefix) => ({
      prefix,
      soort: isOpPrefix(prefix) ? 'OP' : 'OBP',
      rijen: groepen.get(prefix),
    }))
})

const gekozenDatasetLabel = computed(() => {
  return datasetOpties.find((optie) => optie.id === selectedDatasetId.value)?.label ?? ''
})

async function kopieerSchaalBedrag(item) {
  const result = await kopieerBedragNaarKlembord(fteWaarde(item.value))

  if (result.success) {
    toast.success(`Schaal ${item.label}: ${result.formatted} gekopieerd`)
    return
  }

  toast.error(`Kopieren mislukt: ${result.error}`)
}

function onKopieerToets(event, item) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    kopieerSchaalBedrag(item)
  }
}
</script>

<template>
  <div id="main" class="flex h-screen pt-20 justify-center bg_1 overflow-y-auto">
    <div id="titel-container" class="flex flex-col gap-3 relative z-10 w-full max-w-7xl px-2 pb-10">
      <div class="page-title-wrap w-full">
        <PageTitleComponent tekst1="" tekst2="salarisschalen" tekst3="" image1="" class="w-full" />
      </div>

      <div class="filters-panel p-3 bg-(--achtergrond-berekening) opacity-98 shadow rounded">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="vselect-layer">
            <label class="text-sm mb-1 block">CAO-versie</label>
            <div class="flex gap-2 items-center">
              <v-select
                v-model="selectedDatasetOptie"
                :options="datasetOpties"
                label="label"
                :clearable="false"
                :searchable="false"
                class="flex-1"
              />
              <button
                type="button"
                class="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-100"
                @click="clearCaoFilter"
              >
                Wissen
              </button>
            </div>
          </div>

          <div class="vselect-layer">
            <label class="text-sm mb-1 block">Filter op schaal</label>
            <div class="flex gap-2 items-center">
              <v-select
                v-model="selectedSchaalFilter"
                :options="schaalFilterOpties"
                label="label"
                :multiple="true"
                :closeOnSelect="false"
                :clearable="false"
                :searchable="true"
                placeholder="Alle schalen"
                class="flex-1"
              />
              <button
                type="button"
                class="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-100"
                @click="clearSchaalFilter"
              >
                Wissen
              </button>
            </div>
          </div>

          <div class="vselect-layer">
            <label class="text-sm mb-1 block">Filter op soort schaal</label>
            <div class="flex gap-2 items-center">
              <v-select
                v-model="selectedSoortFilter"
                :options="soortFilterOpties"
                label="label"
                :clearable="false"
                :searchable="false"
                class="flex-1"
              />
              <button
                type="button"
                class="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-100"
                @click="clearSoortFilter"
              >
                Wissen
              </button>
            </div>
          </div>
        </div>

        <div class="mt-3 flex flex-wrap items-center gap-3 border-t pt-3">
          <div class="flex items-center gap-2">
            <label class="text-sm whitespace-nowrap">FTE</label>
            <input
              v-model.number="fte"
              type="number"
              min="0.01"
              max="1"
              step="0.01"
              class="w-20 border rounded px-2 py-1 text-sm"
              :disabled="!verrekenFte"
            />
          </div>
          <label class="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input v-model="verrekenFte" type="checkbox" class="w-4 h-4 cursor-pointer" />
            Verrekenen met FTE
          </label>
        </div>

        <div class="mt-3 flex items-center justify-between gap-2">
          <p class="text-xs text-gray-700 mb-0">
            Actieve dataset: <strong>{{ gekozenDatasetLabel }}</strong
            >. Klik op een bedrag om te kopieren.
            <span v-if="verrekenFte" class="ml-1 text-blue-700 font-medium"
              >(FTE {{ fte }})</span
            >
          </p>
          <button
            type="button"
            class="px-3 py-1 text-xs rounded border bg-(--dcterra-black) text-white hover:opacity-90"
            @click="clearAlleFilters"
          >
            Alle filters wissen
          </button>
        </div>
      </div>

      <div v-if="tabellenPerSchaal.length === 0" class="p-4 bg-white/85 rounded shadow text-sm">
        Geen resultaten voor de gekozen filters.
      </div>

      <div v-else class="compact-sections flex flex-wrap gap-2">
        <section
          v-for="groep in tabellenPerSchaal"
          :key="groep.prefix"
          class="bg-white/95 rounded shadow overflow-hidden w-42.5"
        >
          <header class="px-2 py-1 border-b bg-gray-100 flex items-center justify-between">
            <h3 class="m-0 text-sm ubuntu-medium">{{ groep.prefix }}</h3>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-200">{{ groep.soort }}</span>
          </header>

          <div class="text-xs">
            <div class="flex border-b bg-white/70">
              <span class="w-1/2 px-2 py-1 font-medium text-left">Schaal</span>
              <span class="w-1/2 px-2 py-1 font-medium text-right">Bedrag</span>
            </div>

            <div
              v-for="item in groep.rijen"
              :key="item.label"
              class="flex border-b last:border-b-0 hover:bg-gray-100"
            >
              <span class="w-1/2 px-2 py-1 text-left">{{ item.label }}</span>
              <span
                class="w-1/2 px-2 py-1 text-right font-medium cursor-pointer"
                role="button"
                tabindex="0"
                title="Klik om bedrag te kopieren"
                @click="kopieerSchaalBedrag(item)"
                @keydown="onKopieerToets($event, item)"
              >
                {{ FormateerGetallen.valuta(fteWaarde(item.value)) }}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-title-wrap {
  position: relative;
  z-index: 70;
}

.page-title-wrap :deep(div.grid) {
  height: auto !important;
  min-height: 0 !important;
  margin-left: 0 !important;
}

.filters-panel {
  position: relative;
  z-index: 30;
}

.vselect-layer {
  position: relative;
  z-index: 35;
}

.vselect-layer :deep(.vs__dropdown-menu) {
  z-index: 45;
}

.compact-sections {
  position: relative;
  z-index: 10;
}
</style>
