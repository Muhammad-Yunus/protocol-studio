<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useColorMode } from '#imports'
import { settings } from '~/composables/useSerialSettings'

const colorMode = useColorMode()
const terminalRef = ref<HTMLDivElement | null>(null)
const lines = ref<{ ts: string, content: string }[]>([])

const isDark = computed(() => colorMode.value === 'dark')

const terminalClass = computed(() => ({
  'bg-black': isDark.value,
  'bg-white': !isDark.value
}))

const headerClass = computed(() => ({
  'border-green-900/40 bg-black': isDark.value,
  'border-green-200 bg-white': !isDark.value
}))

const clearBtnClass = computed(() => ({
  'text-green-700 hover:text-green-500 hover:bg-green-900/20': isDark.value,
  'text-green-700 hover:text-green-900 hover:bg-green-100': !isDark.value
}))

// Remove the blur logic - not needed

function handleNewData(data: string) {
  const now = new Date()
  const ts = now.toLocaleTimeString('en-US', { hour12: false })
  lines.value.push({ ts, content: data })
  nextTick(() => scrollToBottom())
}

function scrollToBottom() {
  if (terminalRef.value) {
    terminalRef.value.scrollTop = terminalRef.value.scrollHeight
  }
}

function clear() {
  lines.value = []
}

const stats = computed(() => ({
  rx: lines.value.length
}))

defineExpose({ handleNewData, clear, stats })
</script>

<template>
  <div class="flex flex-col h-full">
    <div
      class="flex items-center justify-between px-4 py-2 border-b"
      :class="headerClass"
    >
      <span class="text-xs font-mono text-green-700">
        RX: {{ stats.rx }}
      </span>
      <UButton
        size="xs"
        variant="ghost"
        color="neutral"
        icon="i-lucide-trash-2"
        label="Clear"
        :class="clearBtnClass"
        @click="clear"
      />
    </div>

    <div
      ref="terminalRef"
      class="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed"
      :class="terminalClass"
      :style="isDark
        ? { color: '#00ff41', textShadow: '0 0 4px rgba(0, 255, 65, 0.4)' }
        : { color: '#00aa00', textShadow: 'none' }"
    >
      <div
        v-if="lines.length === 0"
        class="italic"
        :class="isDark ? 'text-green-800' : 'text-green-300'"
      >
        No data received yet...
      </div>
      <div
        v-for="(line, i) in lines"
        :key="i"
        class="whitespace-pre-wrap break-all"
      >
        <span
          v-if="settings.timestampEnabled"
          class="mr-2 select-none"
          :class="isDark ? 'text-white' : 'text-black'"
        >
          [{{ line.ts }}]
        </span>
        <span>{{ line.content }}</span>
      </div>
    </div>
  </div>
</template>
