<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { isSupported, isConnected, getPortInfo, openPort, closePort, setOnReceive } from '~/composables/useSerial'
import type { PortInfo } from '~/composables/useSerial'
import type { settings } from '~/composables/useSerialSettings'

const props = defineProps<{
  serialSettings: typeof settings.value
}>()

const emit = defineEmits<{
  received: [data: string]
  error: [msg: string]
}>()

const isConnecting = ref(false)
const portError = ref('')
const webSerialSupported = ref(false)

onMounted(() => {
  webSerialSupported.value = isSupported()
})

async function handleConnect() {
  isConnecting.value = true
  portError.value = ''

  try {
    setOnReceive((data: Uint8Array) => {
      const encoded = props.serialSettings.receiveEncoding === 'hex'
      const output = encoded
        ? Array.from(data).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
        : new TextDecoder('utf-8', { fatal: false }).decode(data)
      emit('received', output)
    })

    await openPort({
      baudRate: props.serialSettings.baudRate,
      dataBits: props.serialSettings.dataBits,
      stopBits: props.serialSettings.stopBits,
      parity: props.serialSettings.parity,
      flowControl: props.serialSettings.flowControl,
      bufferSize: 1024 * 1024
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Connection failed'
    portError.value = msg
    emit('error', msg)
  } finally {
    isConnecting.value = false
    // Focus send input after connect
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('focus-send-input'))
    }, 50)
  }
}

async function handleDisconnect() {
  try {
    await closePort()
    setOnReceive(null)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Disconnect failed'
    portError.value = msg
  }
}

function formatPortInfo(info: PortInfo | undefined): string {
  if (!info) return ''
  const parts: string[] = []
  if (info.usbVendorId) {
    const vid = info.usbVendorId.toString(16).toUpperCase().padStart(4, '0')
    const pid = info.usbProductId?.toString(16).toUpperCase().padStart(4, '0') ?? '----'
    parts.push(`VID:${vid} PID:${pid}`)
  }
  if (info.serialNumber) parts.push(`SN:${info.serialNumber}`)
  return parts.join(' | ')
}

defineExpose({ handleConnect, handleDisconnect })
</script>

<template>
  <div class="p-4 space-y-4">
    <div
      class="flex items-center gap-2"
    >
      <div
        class="flex items-center gap-2"
      >
        <div
          class="w-2 h-2 rounded-full shrink-0"
          :class="isConnected() ? 'bg-emerald-500' : 'bg-neutral-400'"
        />
        <span class="text-sm font-medium">
          {{ isConnected() ? 'Connected' : 'Disconnected' }}
        </span>
      </div>
      <span
        v-if="getPortInfo()"
        class="text-xs text-muted-foreground ml-auto font-mono"
      >
        {{ formatPortInfo(getPortInfo()) }}
      </span>
    </div>

    <div
      v-if="!webSerialSupported"
      class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-500"
    >
      Web Serial API not supported. Use Chrome or Edge.
    </div>

    <div
      v-if="portError"
      class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-500"
    >
      {{ portError }}
    </div>

    <div class="flex gap-2">
      <UButton
        v-if="!isConnected()"
        :loading="isConnecting"
        :disabled="isConnecting || !webSerialSupported"
        class="flex-1"
        color="primary"
        @click="handleConnect"
      >
        <Icon
          name="i-lucide-plug"
          class="mr-1.5"
          size="14"
        />
        Connect
      </UButton>
      <UButton
        v-else
        variant="outline"
        color="neutral"
        class="flex-1"
        @click="handleDisconnect"
      >
        <Icon
          name="i-lucide-circle-x"
          class="mr-1.5"
          size="14"
        />
        Disconnect
      </UButton>
    </div>
  </div>
</template>
