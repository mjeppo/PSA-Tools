export class FormateerGetallen {
  static valuta(getal) {
    if (getal === null || getal === undefined) return '€ 0,00'
    let output = new Intl.NumberFormat('nl', { style: 'currency', currency: 'EUR' }).format(getal)
    return output
  }

  static percentageGeenDecimalen(getal) {
    let b = new Intl.NumberFormat('nl', { style: 'percent', maximumFractionDigits: 0 }).format(
      getal,
    )
    return b
  }

  static decimalen4(getal) {
    let b = new Intl.NumberFormat('nl', { minimumFractionDigits: 4 }).format(getal)
    return b
  }

  static decimalen2(getal) {
    if (getal === null || getal === undefined) return '0,00'
    let b = new Intl.NumberFormat('nl', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(getal)
    return b
  }

  static percentage(getal) {
    let b = new Intl.NumberFormat('nl', { style: 'percent', maximumFractionDigits: 2 }).format(
      getal,
    )
    return b
  }

  static decimalen8(getal) {
    let b = new Intl.NumberFormat('nl', {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8,
    }).format(getal)
    return b
  }

  static decimalen6(getal) {
    let b = new Intl.NumberFormat('nl', {
      minimumFractionDigits: 6,
      maximumFractionDigits: 6,
    }).format(getal)
    return b
  }

  static decimalenKeuze(getal, decimalen) {
    let b = new Intl.NumberFormat('nl', {
      minimumFractionDigits: decimalen,
      maximumFractionDigits: decimalen,
    }).format(getal)
    return b
  }
}

export function isValidFTE(input) {
  if (input === null || typeof input === 'undefined') {
    return 'INVALID'
  }

  const value = String(input)

  if (value.trim().length === 0) {
    return 'INVALID'
  }

  const standardizedValue = value.replace(',', '.')

  const regex = /^\d*(\.\d+)?$/

  if (!regex.test(standardizedValue)) {
    return 'INVALID'
  }

  const fteNumber = parseFloat(standardizedValue)

  if (isNaN(fteNumber)) {
    return 'INVALID'
  }

  if (fteNumber > 1.5) {
    return 'WARNING'
  }

  return 'VALID'
}

export function selectValue(event) {
  const el = event.target
  if (!el.dataset.selectedOnce) {
    el.select()
    el.dataset.selectedOnce = 'true'
  }
}

export function resetSelectValue(event) {
  delete event.target.dataset.selectedOnce
}

export function formatInputFTE(event) {
  const input = parseFloat(event.value)
  console.log(input)
}

export function formatToDecimals(event, decimals) {
  const el = event.target
  if (!el || el.value === '') return

  // Vervang komma door punt voor parsing
  const normalized = el.value.replace(',', '.')
  const number = Number(normalized)

  if (isNaN(number)) return

  // Format naar 4 decimalen met komma
  el.value = number.toFixed(decimals).replace('.', ',')
}

export async function kopieerTekstNaarKlembord(text) {
  if (typeof text !== 'string' || !text.length) {
    return { success: false, error: 'Geen geldige tekst om te kopiëren' }
  }

  // Controleer of de moderne API beschikbaar is
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return { success: true }
    } catch (err) {
      console.error('Clipboard API faal:', err)
      // Als de API faalt, gaan we hieronder door naar de fallback
    }
  }

  // Fallback methode voor niet-secure contexts of oudere browsers
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text

    // Zorg dat het element niet zichtbaar is
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    textArea.style.top = '0'
    document.body.appendChild(textArea)

    textArea.focus()
    textArea.select()

    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)

    if (successful) {
      return { success: true }
    } else {
      throw new Error('Kopieer-opdracht mislukt')
    }
  } catch (err) {
    return {
      success: false,
      error: 'Klembord niet beschikbaar en fallback mislukt',
    }
  }
}

async function kopieerGeformatteerdeTekst(waarde, formatter = (input) => String(input)) {
  if (waarde === null || waarde === undefined) {
    return { success: false, error: 'Geen geldige tekst om te kopiëren' }
  }

  const formatted = String(formatter(waarde)).replace(/\u00A0/g, ' ')
  const result = await kopieerTekstNaarKlembord(formatted)

  return {
    ...result,
    formatted,
  }
}

export async function kopieerBedrag(waarde) {
  return kopieerGeformatteerdeTekst(waarde, (input) => FormateerGetallen.decimalen2(input))
}

export async function kopieerWaarde(waarde) {
  return kopieerGeformatteerdeTekst(waarde)
}
