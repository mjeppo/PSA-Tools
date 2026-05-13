<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { Datepicker } from 'vanillajs-datepicker'
import 'vanillajs-datepicker/locales/nl'
import 'vanillajs-datepicker/css/datepicker-bs5.css'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  inputId: {
    type: String,
    default: '',
  },
  language: {
    type: String,
    default: 'nl',
  },
  format: {
    type: String,
    default: 'dd-mm-yyyy',
  },
  autohide: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const inputRef = ref(null)
let picker = null

function onDateChange() {
  if (!inputRef.value) {
    return
  }

  emit('update:modelValue', inputRef.value.value)
}

onMounted(() => {
  if (!inputRef.value) {
    return
  }

  picker = new Datepicker(inputRef.value, {
    language: props.language,
    format: props.format,
    autohide: props.autohide,
  })

  inputRef.value.addEventListener('changeDate', onDateChange)

  if (props.modelValue) {
    inputRef.value.value = props.modelValue
  }
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (!inputRef.value) {
      return
    }

    inputRef.value.value = newValue || ''
  },
)

onBeforeUnmount(() => {
  if (!inputRef.value) {
    picker?.destroy()
    return
  }

  inputRef.value.removeEventListener('changeDate', onDateChange)
  picker?.destroy()
})
</script>

<template>
  <input
    ref="inputRef"
    type="text"
    :id="inputId"
    :value="modelValue"
    @input="emit('update:modelValue', $event.target.value)"
  />
</template>

<style></style>
