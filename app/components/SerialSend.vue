<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { settings } from '~/composables/useSerialSettings'
import { send } from '~/composables/useSerial'

const emit = defineEmits<{
  sent: [data: string]
}>()

const inputValue = ref('')

// Find and focus the send input by querying DOM
function focusSendInput() {
  nextTick(() => {
    const input = document.querySelector('input[placeholder*="Enter text"]') as HTMLInputElement | null
      || document.querySelector('input[placeholder*="48 65"]') as HTMLInputElement | null
      || document.querySelector('.font-mono input') as HTMLInputElement | null
    if (input) {
      input.focus()
    }
  })
}

onMounted(() => {
  window.addEventListener('focus-send-input', focusSendInput)
})

onUnmounted(() => {
  window.removeEventListener('focus-send-input', focusSendInput)
})

function handleSend() {
  const val = inputValue.value.trim()
  if (!val) return

  send(val, settings.value.sendEncoding === 'hex', settings.value.sendDelimiter)
  emit('sent', val)
  inputValue.value = ''
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

defineExpose({ inputValue })
</script>

<template>
  <div class="p-4 space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Send Data
      </h3>
      <div class="flex rounded-lg overflow-hidden border border-border">
        <button
          :class="[
            'px-2.5 py-1 text-xs font-medium transition-colors',
            settings.sendEncoding === 'hex'
              ? 'bg-primary/10 text-primary'
              : 'bg-transparent text-muted-foreground hover:text-foreground'
          ]"
          @click="settings.sendEncoding = 'hex'"
        >
          HEX
        </button>
        <button
          :class="[
            'px-2.5 py-1 text-xs font-medium transition-colors border-l border-border',
            settings.sendEncoding === 'text'
              ? 'bg-primary/10 text-primary'
              : 'bg-transparent text-muted-foreground hover:text-foreground'
          ]"
          @click="settings.sendEncoding = 'text'"
        >
          TEXT
        </button>
      </div>
    </div>

    <div class="flex gap-2">
      <UInput
        v-model="inputValue"
        :placeholder="settings.sendEncoding === 'hex' ? 'e.g. 48 65 6C 6C 6F' : 'Enter text...'"
        class="flex-1 font-mono text-sm"
        size="md"
        @keydown="handleKeyDown"
      />
      <UButton
        color="primary"
        icon="i-lucide-send"
        label="Send"
        @click="handleSend"
      />
    </div>

    <div class="flex items-center gap-4 text-xs text-muted-foreground">
      <span>
        Delimiter:
        <USelect
          v-model="settings.sendDelimiter"
          :items="[{ label: 'None', value: 'none' }, { label: 'Newline (LF)', value: 'newline' }, { label: 'Carriage Return (CR)', value: 'carriage-return' }, { label: 'Both (CR+LF)', value: 'both' }]"
          size="xs"
          class="w-32"
        />
      </span>
    </div>
  </div>
</template>
