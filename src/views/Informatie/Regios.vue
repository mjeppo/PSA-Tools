<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import PageTitleComponent from '@/components/PageTitle-Component.vue'
import { pb } from '@/pocketbase'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { useSettings } from '@/composables/useLocalstorage'

const authStore = useAuthStore()
const toast = useToast()
const { settings } = useSettings()

// Kolom-zichtbaarheid
const kolommenMenuOpen = ref(false)
const toggleKolom = (key) => {
  const verborgen = settings.regios_verborgenKolommen
  const idx = verborgen.indexOf(key)
  if (idx === -1) {
    verborgen.push(key)
  } else {
    verborgen.splice(idx, 1)
  }
}
const isKolomZichtbaar = (key) => !settings.regios_verborgenKolommen.includes(key)
const zichtbareKolommen = computed(() => kolommen.filter((k) => isKolomZichtbaar(k.key)))

const toggleKolommenMenu = (event) => {
  event.stopPropagation()
  kolommenMenuOpen.value = !kolommenMenuOpen.value
  if (kolommenMenuOpen.value) filterOpen.value = null
}

const regiosDiensten = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const showModal = ref(false)
const isSaving = ref(false)
const modalRecord = ref(null)

const kolommen = [
  { label: 'Regio', key: 'regio' },
  { label: 'Team', key: 'team' },
  { label: 'Teamcode', key: 'teamcode' },
  { label: 'Opleidingsmanager', key: 'opleidingsmanager' },
  { label: 'Adviseur', key: 'adviseur' },
  { label: 'Personeelsadministratie', key: 'personeelsadministratie' },
  { label: 'Salarisadministratie', key: 'salarisadministratie' },
  { label: 'Manager', key: 'manager' },
  { label: 'Locatie', key: 'locatie' },
]

// Globale zoekterm
const zoekterm = ref('')

// Filter state: dropdown open per kolom + invoerwaarde per kolom
const filterOpen = ref(null)
const filters = ref(Object.fromEntries(kolommen.map((k) => [k.key, ''])))

// Sorteerstatus
const sortKey = ref(null)
const sortDir = ref('asc') // 'asc' | 'desc'

// Unieke waarden per kolom voor suggesties
const uniqueValues = computed(() => {
  const result = {}
  for (const { key } of kolommen) {
    result[key] = [...new Set(regiosDiensten.value.map((r) => r[key]).filter(Boolean))].sort()
  }
  return result
})

// Gefilterde + gesorteerde rijen
const gefilterd = computed(() => {
  let rows = [...regiosDiensten.value]

  // Globale zoekterm — doorzoekt alle kolommen
  const globaal = zoekterm.value.toLowerCase().trim()
  if (globaal) {
    rows = rows.filter((r) =>
      kolommen.some((k) =>
        String(r[k.key] ?? '')
          .toLowerCase()
          .includes(globaal),
      ),
    )
  }

  for (const { key } of kolommen) {
    const term = filters.value[key].toLowerCase().trim()
    if (term) {
      rows = rows.filter((r) =>
        String(r[key] ?? '')
          .toLowerCase()
          .includes(term),
      )
    }
  }

  if (sortKey.value) {
    rows.sort((a, b) => {
      const av = String(a[sortKey.value] ?? '').toLowerCase()
      const bv = String(b[sortKey.value] ?? '').toLowerCase()
      const cmp = av.localeCompare(bv, 'nl')
      return sortDir.value === 'asc' ? cmp : -cmp
    })
  }

  return rows
})

const toggleSort = (key) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

const toggleFilter = (key, event) => {
  event.stopPropagation()
  filterOpen.value = filterOpen.value === key ? null : key
}

const closeAllFilters = () => {
  filterOpen.value = null
  kolommenMenuOpen.value = false
}

const clearFilter = (key) => {
  filters.value[key] = ''
}

const selectFilterValue = (key, val) => {
  filters.value[key] = val
  filterOpen.value = null
}

const hasActiveFilter = (key) => filters.value[key].trim() !== ''

const sortIcon = (key) => {
  if (sortKey.value !== key) return '↕'
  return sortDir.value === 'asc' ? '↑' : '↓'
}

const openEdit = (record) => {
  modalRecord.value = {
    id: record.id,
    ...Object.fromEntries(kolommen.map((k) => [k.key, record[k.key] ?? ''])),
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  modalRecord.value = null
}

const saveRecord = async () => {
  if (!modalRecord.value?.id) return

  isSaving.value = true
  try {
    const { id, ...payload } = modalRecord.value
    const updated = await pb.collection('overzicht_regios_diensten').update(id, payload)
    const idx = regiosDiensten.value.findIndex((r) => r.id === id)
    if (idx !== -1) regiosDiensten.value[idx] = updated
    toast.success('Rij bijgewerkt.')
    closeModal()
  } catch (error) {
    toast.error('Opslaan mislukt: ' + (error?.message || 'Onbekende fout'))
  } finally {
    isSaving.value = false
  }
}

const deleteRecord = async (record) => {
  if (
    !confirm(`Rij voor team "${record.team}" verwijderen? Dit kan niet ongedaan worden gemaakt.`)
  ) {
    return
  }

  try {
    await pb.collection('overzicht_regios_diensten').delete(record.id)
    regiosDiensten.value = regiosDiensten.value.filter((r) => r.id !== record.id)
    toast.success('Rij verwijderd.')
  } catch (error) {
    toast.error('Verwijderen mislukt: ' + (error?.message || 'Onbekende fout'))
  }
}

const fetchRegiosDiensten = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const records = await pb.collection('overzicht_regios_diensten').getFullList()
    regiosDiensten.value = records
  } catch (error) {
    errorMessage.value = 'Fout bij ophalen van regio- en dienstgegevens.'
    console.error('Fout bij ophalen overzicht_regios_diensten:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchRegiosDiensten()
  document.addEventListener('click', closeAllFilters)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeAllFilters)
})
</script>

<template>
  <div id="main" class="flex h-full min-h-0 box-border pt-3 justify-center bg_1">
    <div id="titel-container" class="flex flex-col gap-3 relative z-10 w-full px-2 pb-10">
      <div class="page-title-wrap w-full">
        <PageTitleComponent
          tekst1=""
          tekst2="Regios en Diensten"
          tekst3=""
          image1=""
          class="w-full"
        />
      </div>

      <div
        id="content-container"
        class="relative z-20 p-4 w-full bg-(--achtergrond-berekening) opacity-97 shadow rounded"
      >
        <div v-if="isLoading" class="text-gray-600">Gegevens laden...</div>

        <div v-else-if="errorMessage" class="text-red-600">
          {{ errorMessage }}
        </div>

        <div v-else-if="!regiosDiensten.length" class="text-gray-600">Geen gegevens gevonden.</div>

        <div v-else>
          <!-- Globale zoekbalk -->
          <div class="mb-3 flex items-center gap-2">
            <div class="relative flex-1 max-w-sm">
              <input
                v-model="zoekterm"
                type="text"
                placeholder="Zoek in alle velden..."
                class="w-full text-sm border border-(--randkleur-inputs) rounded px-3 py-1.5 pl-8 focus:outline-none focus:border-(--dcterra-red) bg-white"
                autofocus
              />
            </div>
            <button
              v-if="zoekterm"
              class="text-xs text-gray-400 hover:text-(--dcterra-red) transition-colors"
              @click="zoekterm = ''"
            >
              ✕ wissen
            </button>
            <!-- Kolommen-kiezer -->
            <div class="relative ml-auto">
              <button
                class="flex items-center gap-1.5 text-xs border border-(--randkleur-inputs) rounded px-2.5 py-1.5 bg-white hover:border-(--dcterra-red) transition-colors"
                :class="
                  settings.regios_verborgenKolommen.length
                    ? 'border-(--dcterra-red) text-(--dcterra-red)'
                    : 'text-gray-500'
                "
                title="Kolommen tonen/verbergen"
                @click="toggleKolommenMenu($event)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M3 3h4v18H3zM10 3h4v18h-4zM17 3h4v18h-4z" />
                </svg>
                Kolommen
                <span
                  v-if="settings.regios_verborgenKolommen.length"
                  class="bg-(--dcterra-red) text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                >
                  {{ settings.regios_verborgenKolommen.length }}
                </span>
              </button>
              <div
                v-if="kolommenMenuOpen"
                class="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded shadow-lg p-2 min-w-100"
                @click.stop
              >
                <p class="text-xs text-gray-400 mb-1.5 px-1">Kolomzichtbaarheid</p>
                <label
                  v-for="kolom in kolommen"
                  :key="`vis-${kolom.key}`"
                  class="flex items-center gap-2 px-1 py-1 rounded hover:bg-gray-50 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    :checked="isKolomZichtbaar(kolom.key)"
                    class="accent-(--dcterra-red)"
                    @change="toggleKolom(kolom.key)"
                  />
                  {{ kolom.label }}
                </label>
                <button
                  v-if="settings.regios_verborgenKolommen.length"
                  class="mt-1.5 w-full text-xs text-gray-400 hover:text-(--dcterra-red) text-left px-1"
                  @click="settings.regios_verborgenKolommen.splice(0)"
                >
                  Alles tonen
                </button>
              </div>
              
            </div>
            
          </div>

          <div
            class="overflow-auto max-h-[calc(100dvh-24rem)] md:max-h-[calc(100dvh-21rem)] rounded"
          >
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-gray-300 bg-(--achtergrond-berekening)">
                  <th
                    v-for="kolom in zichtbareKolommen"
                    :key="`header-${kolom.key}`"
                    class="text-left py-2 pr-4 font-semibold whitespace-nowrap select-none"
                  >
                    <div class="flex items-center gap-1">
                      <!-- Kolomlabel + sorteericon (dubbelklik) -->
                      <span
                        class="cursor-pointer hover:text-(--dcterra-red) transition-colors"
                        :class="{ 'text-(--dcterra-red)': sortKey === kolom.key }"
                        :title="`Dubbelklik om te sorteren op ${kolom.label}`"
                        @dblclick="toggleSort(kolom.key)"
                      >
                        {{ kolom.label }}
                      </span>
                      <span
                        class="text-2xl leading-none transition-colors flex items-center"
                        :class="sortKey === kolom.key ? 'text-(--dcterra-red)' : 'text-gray-400'"
                      >
                        {{ sortIcon(kolom.key) }}
                      </span>
                      <!-- Filterknop -->
                      <div class="relative">
                        <button
                          :title="`Filter op ${kolom.label}`"
                          class="ml-1 w-5 h-5 flex items-center justify-center rounded transition-colors"
                          :class="
                            hasActiveFilter(kolom.key)
                              ? 'bg-(--dcterra-red) text-white'
                              : 'text-gray-400 hover:text-(--dcterra-red)'
                          "
                          @click="toggleFilter(kolom.key, $event)"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path
                              d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 .77 1.64L14 12.3V20a1 1 0 0 1-1.45.89l-4-2A1 1 0 0 1 8 18v-5.7L3.23 5.64A1 1 0 0 1 3 4z"
                            />
                          </svg>
                        </button>

                        <!-- Filter dropdown -->
                        <div
                          v-if="filterOpen === kolom.key"
                          class="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded shadow-lg p-2 min-w-48 min-h-100"
                          @click.stop
                        >
                          <div class="flex items-center gap-1 mb-1">
                            <input
                              :id="`filter-${kolom.key}`"
                              v-model="filters[kolom.key]"
                              type="text"
                              :placeholder="`Zoek ${kolom.label}...`"
                              class="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-(--dcterra-red)"
                              autofocus
                            />
                            <button
                              v-if="hasActiveFilter(kolom.key)"
                              class="text-gray-400 hover:text-(--dcterra-red) text-xs shrink-0"
                              title="Filter wissen"
                              @click="clearFilter(kolom.key)"
                            >
                              ✕
                            </button>
                          </div>
                          <!-- Suggesties -->
                          <ul class="max-h-90 overflow-y-auto">
                            <li
                              v-for="val in uniqueValues[kolom.key].filter((v) =>
                                v.toLowerCase().includes(filters[kolom.key].toLowerCase()),
                              )"
                              :key="val"
                              class="text-xs px-2 py-1 rounded cursor-pointer hover:bg-gray-100"
                              :class="{ 'bg-red-50 font-medium': filters[kolom.key] === val }"
                              @click="selectFilterValue(kolom.key, val)"
                            >
                              {{ val }}
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </th>
                  <th
                    v-if="authStore.isAdmin"
                    class="text-left py-2 font-semibold whitespace-nowrap"
                  >
                    <span class="inline-flex items-center gap-4">
                      <i class="fa-solid fa-pen-to-square" style="color: rgb(0, 0, 0)"></i>
                      <i class="fa-solid fa-trash" style="color: rgb(0, 0, 0)"></i>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!gefilterd.length">
                  <td
                    :colspan="zichtbareKolommen.length + (authStore.isAdmin ? 1 : 0)"
                    class="py-4 text-center text-gray-500 text-sm"
                  >
                    Geen resultaten gevonden.
                  </td>
                </tr>
                <tr
                  v-for="(record, index) in gefilterd"
                  :key="record.id"
                  class="border-b border-gray-100 align-top transition-colors"
                  :class="index % 2 === 0 ? 'bg-(--dcterra-red-lighter) hover:brightness-95' : 'hover:bg-gray-50'"
                >
                  <td
                    v-for="kolom in zichtbareKolommen"
                    :key="`${record.id}-${kolom.key}`"
                    class="py-2 pr-4"
                  >
                    {{ record[kolom.key] }}
                  </td>
                  <td v-if="authStore.isAdmin" class="py-2 pr-2">
                    <div class="flex items-center gap-4">
                      <button
                        @click="openEdit(record)"
                        title="Bewerken"
                        class="hover:opacity-80 transition-opacity"
                      >
                        <i class="fa-solid fa-pen-to-square" style="color: rgb(177, 151, 252)"></i>
                      </button>
                      <button
                        @click="deleteRecord(record)"
                        title="Verwijderen"
                        class="hover:opacity-80 transition-opacity"
                      >
                        <i class="fa-solid fa-trash" style="color: rgb(255, 72, 59)"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <!-- Resultaatindicator -->
            <p class="mt-2 text-xs text-gray-400">
              {{ gefilterd.length }} van {{ regiosDiensten.length }} rijen
            </p>
          </div>
        </div>
      </div>

      <div
        v-if="showModal && authStore.isAdmin && modalRecord"
        class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        @click.self="closeModal"
      >
        <div class="bg-white w-full max-w-3xl rounded shadow-lg p-4 max-h-[85vh] overflow-y-auto">
          <h3 class="text-lg font-semibold mb-3">Rij bewerken</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div v-for="kolom in kolommen" :key="`edit-${kolom.key}`" class="flex flex-col gap-1">
              <label :for="`edit-${kolom.key}`" class="text-sm font-medium">{{
                kolom.label
              }}</label>
              <input
                :id="`edit-${kolom.key}`"
                v-model="modalRecord[kolom.key]"
                type="text"
                class="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-(--dcterra-red)"
              />
            </div>
          </div>

          <div class="mt-4 flex justify-end gap-2">
            <button
              class="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100"
              :disabled="isSaving"
              @click="closeModal"
            >
              Annuleren
            </button>
            <button
              class="px-3 py-1.5 rounded text-white bg-(--dcterra-red) hover:bg-(--dcterra-red-hover) disabled:opacity-60"
              :disabled="isSaving"
              @click="saveRecord"
            >
              {{ isSaving ? 'Opslaan...' : 'Opslaan' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
