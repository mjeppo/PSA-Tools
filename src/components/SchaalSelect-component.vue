<script setup>
import { defineEmits, computed, ref, nextTick } from 'vue'
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

const vSelectRef = ref(null)

const selectedOption = computed({
  // Zoek het volledige optie-object op basis van de label-string uit modelValue.
  get() {
    if (props.modelValue == null) {
      return null
    }

    if (typeof props.modelValue === 'object') {
      return props.modelValue
    }

    return props.options.find((option) => option.label === props.modelValue) ?? null
  },
  // Emit alleen de label-string terug zodat bestaande parent-code blijft werken.
  set(newValue) {
    emit('update:modelValue', newValue?.label ?? null)
  },
})

// Gebruik vue-select interne pointer, zodat de dropdown opent rond de huidige selectie.
const handleOpen = async () => {
  await nextTick()
  const instance = vSelectRef.value

  if (!instance) {
    return
  }

  if (typeof instance.typeAheadToLastSelected === 'function') {
    instance.typeAheadToLastSelected()
  }

  await nextTick()

  const dropdownMenu = instance.$refs?.dropdownMenu
  const pointer = instance.typeAheadPointer

  if (
    dropdownMenu &&
    Number.isInteger(pointer) &&
    pointer >= 0 &&
    pointer < dropdownMenu.children.length
  ) {
    const selectedOptionElement = dropdownMenu.children[pointer]
    const centerScrollTop =
      selectedOptionElement.offsetTop -
      dropdownMenu.clientHeight / 2 +
      selectedOptionElement.clientHeight / 2

    dropdownMenu.scrollTop = Math.max(0, centerScrollTop)
    return
  }

  if (typeof instance.maybeAdjustScroll === 'function') {
    instance.maybeAdjustScroll()
  }
}
</script>

<template>
  <div>
    <v-select
      ref="vSelectRef"
      id="schaal-selector"
      class="rounded border-0! shadow-sm"
      v-model="selectedOption"
      :options="props.options"
      label="label"
      placeholder="Selecteer een schaal"
      :searchable="true"
      @open="handleOpen"
    />
  </div>
</template>

<style></style>
