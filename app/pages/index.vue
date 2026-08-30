<script setup lang="ts">
import { ref, computed } from 'vue'
import SerialTerminal from '~/components/SerialTerminal.vue'
import SerialSend from '~/components/SerialSend.vue'
import SerialSettings from '~/components/SerialSettings.vue'
import SerialPortManager from '~/components/SerialPortManager.vue'
import { settings } from '~/composables/useSerialSettings'
import { useColorMode } from '#imports'

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const terminalRef = ref<InstanceType<typeof SerialTerminal> | null>(null)
const sendRef = ref<InstanceType<typeof SerialSend> | null>(null)

function handleReceived(data: string) {
  terminalRef.value?.handleNewData(data)
}

function handleSent(_data: string) {
}

function handleConnectionError(_msg: string) {
}
</script>

<template>
  <div class="flex flex-col h-screen bg-background overflow-hidden">
    <header class="flex items-center gap-3 px-6 py-3 border-b border-border bg-muted/30 shrink-0">
      <Icon
        name="i-lucide-terminal"
        class="text-primary"
        size="20"
      />
      <div>
        <h1 class="text-sm font-semibold leading-none">
          Protocol Studio
        </h1>
        <p class="text-xs text-muted-foreground mt-0.5">
          Serial UART Terminal
        </p>
      </div>
      <div class="ml-auto flex items-center gap-2">
        <UColorModeButton />
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <aside class="w-64 border-r border-border bg-muted/20 overflow-auto shrink-0">
        <SerialPortManager
          :serial-settings="settings"
          @received="handleReceived"
          @error="handleConnectionError"
        />
        <SerialSettings :settings="settings" />
      </aside>

      <main class="flex-1 flex flex-col overflow-hidden">
        <div class="flex-1 min-h-0 flex flex-col">
          <SerialTerminal ref="terminalRef" />
        </div>

        <div class="border-t border-border bg-muted/20 shrink-0">
          <SerialSend
            ref="sendRef"
            @sent="handleSent"
          />
        </div>
      </main>
    </div>

    <footer
      :class="isDark ? 'bg-black text-white' : 'bg-white text-black'"
      class="flex items-center gap-4 px-4 py-1.5 border-t text-xs shrink-0"
    >
      <span class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Web Serial API
      </span>
      <span>·</span>
      <span>Phase 1 — UART Terminal</span>
    </footer>
  </div>
</template>
