<script setup>
import { ref, computed, onMounted } from 'vue'
import PageTitleComponent from '@/components/PageTitle-Component.vue'
import { pb } from '@/pocketbase'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

const toast = useToast()
const authStore = useAuthStore()
const adressen = ref([])
const selectedVestiging = ref('')
const sortBy = ref('vestiging')

// Modal state
const showModal = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)
const emptyRecord = () => ({
  id: null,
  vestiging: '',
  adres: '',
  telefoonnummer: '',
  url_telefoonnummer: '',
  email: '',
  url_email: '',
  url_website: '',
  url_maps: '',
})
const modalRecord = ref(emptyRecord())

// Gegevens uit PocketBase ophalen
const fetchAdressen = async () => {
  try {
    const records = await pb.collection('adressen_dcterra').getFullList()
    adressen.value = records
  } catch (error) {
    console.error('Fout bij ophalen adressen:', error)
  }
}

// Unieke vestigingen voor dropdown
const vestigingen = computed(() => {
  return [...new Set(adressen.value.map((r) => r.vestiging))].sort()
})

// Gefilterde en gesorteerde adressen
const gefilterdAdressen = computed(() => {
  let result = [...adressen.value]

  if (selectedVestiging.value) {
    result = result.filter((a) => a.vestiging === selectedVestiging.value)
  }

  result.sort((a, b) => {
    const aVal = a[sortBy.value]
    const bVal = b[sortBy.value]
    if (typeof aVal === 'string') return aVal.localeCompare(bVal)
    return aVal - bVal
  })

  return result
})

// Modal openen voor bewerken
const openEdit = (adres) => {
  modalRecord.value = { ...adres }
  isEditing.value = true
  showModal.value = true
}

// Modal openen voor nieuw record
const openNew = () => {
  modalRecord.value = emptyRecord()
  isEditing.value = false
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

// Opslaan (aanmaken of bijwerken)
const saveRecord = async () => {
  isSaving.value = true
  try {
    const { id, ...data } = modalRecord.value
    if (isEditing.value) {
      const updated = await pb.collection('adressen_dcterra').update(id, data)
      const idx = adressen.value.findIndex((a) => a.id === id)
      if (idx !== -1) adressen.value[idx] = updated
      toast.success('Vestiging bijgewerkt!')
    } else {
      const created = await pb.collection('adressen_dcterra').create(data)
      adressen.value.push(created)
      toast.success('Vestiging toegevoegd!')
    }
    closeModal()
  } catch (error) {
    toast.error('Opslaan mislukt: ' + (error?.message || 'Onbekende fout'))
  } finally {
    isSaving.value = false
  }
}

// Verwijderen met bevestiging
const deleteRecord = async (adres) => {
  if (!confirm(`Vestiging "${adres.vestiging}" verwijderen? Dit kan niet ongedaan worden gemaakt.`))
    return
  try {
    await pb.collection('adressen_dcterra').delete(adres.id)
    adressen.value = adressen.value.filter((a) => a.id !== adres.id)
    toast.success('Vestiging verwijderd.')
  } catch (error) {
    toast.error('Verwijderen mislukt: ' + (error?.message || 'Onbekende fout'))
  }
}

// Tekst naar klembord
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    toast.success('Gekopieerd naar klembord!')
  })
}

// URL formatting (van text naar clickable URL)
const formatUrl = (url) => {
  if (!url) return ''
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url
  }
  return url
}

onMounted(() => {
  fetchAdressen()
})
</script>

<template>
  <div id="main" class="flex h-full pt-20 justify-center bg_1">
    <div id="titel-container" class="flex flex-col gap-3 relative z-10 w-full max-w-7xl px-2 pb-10">
      <div class="page-title-wrap w-full">
        <PageTitleComponent tekst1="" tekst2="Adressen" tekst3="" image1="" class="w-full" />
      </div>

      <!-- Toevoegen knop (alleen voor admins) -->
      <div v-if="authStore.isAdmin" class="flex justify-end">
        <button @click="openNew" class="btn btn-primary flex items-center gap-2">
          <i class="fa-solid fa-plus"></i> Vestiging toevoegen
        </button>
      </div>

      <!-- Filter en Sorteer Controls -->
      <div class="p-3 bg-(--achtergrond-berekening) opacity-98 shadow rounded flex gap-4 flex-wrap">
        <div class="flex flex-col">
          <label for="vestiging-filter" class="text-sm font-semibold mb-1"
            >Filter op Vestiging:</label
          >
          <select
            v-model="selectedVestiging"
            id="vestiging-filter"
            class="px-2 py-1 border rounded"
          >
            <option value="">-- Alle vestigingen --</option>
            <option v-for="v in vestigingen" :key="v" :value="v">{{ v }}</option>
          </select>
        </div>
        <div class="flex flex-col">
          <label for="sort-by" class="text-sm font-semibold mb-1">Sorteren op:</label>
          <select v-model="sortBy" id="sort-by" class="px-2 py-1 border rounded">
            <option value="vestiging">Vestiging</option>
            <option value="adres">Adres</option>
          </select>
        </div>
      </div>

      <!-- Tabel -->
      <div class="p-3 bg-(--achtergrond-berekening) opacity-98 shadow rounded">
        <div id="table-header" class="adressen-grid font-semibold pb-2 border-b">
          <span>Vestiging</span>
          <span>Adres</span>
          <span>Telefoonnummer</span>
          <span> <i class="fa-solid fa-phone" style="color: rgb(0, 0, 0)"></i></span>
          <span>Email</span>
          <span> <i class="fa-solid fa-envelope" style="color: rgb(0, 0, 0)"></i></span>
          <span> <i class="fa-solid fa-globe" style="color: rgb(0, 0, 0)"></i></span>
          <span> <i class="fa-solid fa-location-dot" style="color: rgb(0, 0, 0)"></i></span>
          <span v-if="authStore.isAdmin">
            <i class="fa-solid fa-pen-to-square" style="color: rgb(0, 0, 0)"></i
          ></span>
          <span v-if="authStore.isAdmin"
            ><i class="fa-solid fa-trash" style="color: rgb(0, 0, 0)"></i
          ></span>
        </div>

        <!-- Rijen -->
        <div
          v-for="(adres, index) in gefilterdAdressen"
          :key="index"
          class="adressen-grid py-2 border-b items-center"
        >
          <span class="cursor-default">{{ adres.vestiging }}</span>

          <!-- Adres - klikbaar voor klembord -->
          <span
            @click="copyToClipboard(adres.adres)"
            class="cursor-pointer hover:bg-gray-200 p-1 rounded"
            title="Klik om adres te kopiëren"
          >
            {{ adres.adres }}
          </span>

          <!-- Telefoonnummer - klikbaar voor klembord -->
          <span
            @click="copyToClipboard(adres.telefoonnummer)"
            class="cursor-pointer hover:bg-gray-200 p-1 rounded"
            title="Klik om telefoonnummer te kopiëren"
          >
            {{ adres.telefoonnummer }}
          </span>

          <!-- Telefoon link -->
          <a
            v-if="adres.url_telefoonnummer"
            :href="'tel:' + adres.url_telefoonnummer"
            title="Bellen"
          >
            <i class="fa-solid fa-phone" style="color: rgb(255, 72, 59)"></i>
          </a>
          <span v-else></span>

          <!-- Email - klikbaar voor klembord -->
          <span
            @click="copyToClipboard(adres.email)"
            class="cursor-pointer hover:bg-gray-200 p-1 rounded"
            title="Klik om email-adres te kopiëren"
          >
            {{ adres.email }}
          </span>

          <!-- Email link -->
          <a v-if="adres.url_email" :href="'mailto:' + adres.url_email" title="E-mail">
            <i class="fa-solid fa-envelope" style="color: rgb(255, 212, 59)"></i>
          </a>
          <span v-else></span>

          <!-- Website link -->
          <a
            v-if="adres.url_website"
            :href="formatUrl(adres.url_website)"
            target="_blank"
            rel="noopener noreferrer"
            title="Website"
          >
            <i class="fa-solid fa-globe" style="color: rgb(116, 192, 252)"></i>
          </a>
          <span v-else></span>

          <!-- Maps link -->
          <a
            v-if="adres.url_maps"
            :href="formatUrl(adres.url_maps)"
            target="_blank"
            rel="noopener noreferrer"
            title="Locatie op kaart"
          >
            <i class="fa-solid fa-location-dot" style="color: rgb(99, 230, 190)"></i>
          </a>
          <span v-else></span>
          <!-- Bewerken / Verwijderen (alleen voor admins) -->
          <span v-if="authStore.isAdmin" class="flex items-center gap-4">
            <button @click="openEdit(adres)" title="Bewerken">
              <i class="fa-solid fa-pen-to-square" style="color: rgb(177, 151, 252)"></i>
            </button>
            <button @click="deleteRecord(adres)" title="Verwijderen">
              <i class="fa-solid fa-trash" style="color: rgb(255, 72, 59)"></i>
            </button>
          </span>
          <span v-else></span>
        </div>

        <!-- Geen resultaten -->
        <div v-if="gefilterdAdressen.length === 0" class="py-4 text-center text-gray-500">
          Geen adressen gevonden
        </div>
      </div>
    </div>
  </div>

  <!-- Modal: Toevoegen / Bewerken -->
  <Teleport to="body">
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="closeModal"
    >
      <div class="bg-(--achtergrond-berekening) rounded shadow-xl w-full max-w-lg p-6">
        <h2 class="text-lg font-semibold mb-4">
          {{ isEditing ? 'Vestiging bewerken' : 'Nieuwe vestiging toevoegen' }}
        </h2>

        <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-center">
          <label>Vestiging</label>
          <input
            v-model="modalRecord.vestiging"
            type="text"
            class="input-veld"
            placeholder="Naam vestiging"
          />

          <label>Adres</label>
          <input
            v-model="modalRecord.adres"
            type="text"
            class="input-veld"
            placeholder="Straat + huisnummer, postcode, stad"
          />

          <label>Telefoonnummer</label>
          <input
            v-model="modalRecord.telefoonnummer"
            type="text"
            class="input-veld"
            placeholder="010 - 123 4567"
          />

          <label>URL telefoon</label>
          <input
            v-model="modalRecord.url_telefoonnummer"
            type="text"
            class="input-veld"
            placeholder="+31101234567"
          />

          <label>E-mailadres</label>
          <input
            v-model="modalRecord.email"
            type="text"
            class="input-veld"
            placeholder="info@bedrijf.nl"
          />

          <label>URL e-mail</label>
          <input
            v-model="modalRecord.url_email"
            type="text"
            class="input-veld"
            placeholder="info@bedrijf.nl"
          />

          <label>Website</label>
          <input
            v-model="modalRecord.url_website"
            type="text"
            class="input-veld"
            placeholder="www.bedrijf.nl"
          />

          <label>Google Maps</label>
          <input
            v-model="modalRecord.url_maps"
            type="text"
            class="input-veld"
            placeholder="maps.app.goo.gl/..."
          />
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <button @click="closeModal" class="btn">Annuleren</button>
          <button @click="saveRecord" :disabled="isSaving" class="btn btn-primary">
            {{ isSaving ? 'Bezig...' : isEditing ? 'Opslaan' : 'Toevoegen' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
