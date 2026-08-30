import { ref, watch } from 'vue'

export interface SerialSettings {
  baudRate: number
  dataBits: 7 | 8
  stopBits: 1 | 2
  parity: 'none' | 'even' | 'odd'
  flowControl: 'none' | 'hardware'
  receiveEncoding: 'text' | 'hex'
  sendEncoding: 'text' | 'hex'
  sendDelimiter: 'none' | 'newline' | 'carriage-return' | 'both'
  timestampEnabled: boolean
  hexUpper: boolean
  retroTheme: boolean
}

const STORAGE_KEY = 'serial-settings'

const DEFAULT_SETTINGS: SerialSettings = {
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  flowControl: 'none',
  receiveEncoding: 'text',
  sendEncoding: 'text',
  sendDelimiter: 'none',
  timestampEnabled: true,
  hexUpper: true,
  retroTheme: true
}

const settings = ref<SerialSettings>({ ...DEFAULT_SETTINGS })

async function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        settings.value = { ...DEFAULT_SETTINGS, ...parsed }
      }
    }
  } catch {
    // ignore
  }
}

async function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
}

watch(settings, persist, { deep: true })

load()

export const baudRates = [300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600]

export { settings, DEFAULT_SETTINGS }
