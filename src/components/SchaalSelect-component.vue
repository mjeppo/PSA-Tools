<script setup>
import { watch, defineEmits, computed } from 'vue'
import vSelect from 'vue-select'

const props = defineProps({
  // De lijst met opties die het component moet weergeven
  options: {
    type: Array,
    required: true,
  },
  // Een optionele prop voor de initiële geselecteerde waarde
  modelValue: {
    type: [String, Number, Object],
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const computedSelectedSchaal = computed({
  // De getter stuurt de waarde van de prop naar v-select (voor het laden)
  get() {
    return props.modelValue
  },
  // De setter wordt geactiveerd wanneer v-select de v-model probeert te wijzigen
  set(newValue) {
    console.log('V-Select new value:', newValue)
    // We versturen de wijziging direct terug naar de ouder
    // (Hierdoor wordt de 'settings.geselecteerdeSchaalInView' direct bijgewerkt)
    emit('update:modelValue', newValue)
  },
})
</script>

<template>
  <div>
    <v-select
      id="schaal-selector"
      class="rounded border-0! shadow-sm"
      v-model="computedSelectedSchaal"
      :options="props.options"
      track-by="label"
      :reduce="(option) => option.label"
      placeholder="Selecteer een schaal"
      :searchable="true"
    />
  </div>
</template>

<style></style>
