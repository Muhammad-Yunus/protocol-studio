<script setup lang="ts">
import { computed } from 'vue'
import { settings, baudRates } from '~/composables/useSerialSettings'

const dataBitsOptions = computed(() => [
  { label: '7', value: 7 },
  { label: '8', value: 8 }
])
const stopBitsOptions = computed(() => [
  { label: '1', value: 1 },
  { label: '2', value: 2 }
])
const parityOptions = computed(() => [
  { label: 'None', value: 'none' },
  { label: 'Even', value: 'even' },
  { label: 'Odd', value: 'odd' }
])
const flowControlOptions = computed(() => [
  { label: 'None', value: 'none' },
  { label: 'Hardware', value: 'hardware' }
])
const encodingOptions = computed(() => [
  { label: 'Text', value: 'text' },
  { label: 'Hex', value: 'hex' }
])
const delimiterOptions = computed(() => [
  { label: 'None', value: 'none' },
  { label: 'Newline (LF)', value: 'newline' },
  { label: 'Carriage Return (CR)', value: 'carriage-return' },
  { label: 'Both (CR+LF)', value: 'both' }
])
</script>

<template>
  <div class="p-4 space-y-4">
    <div>
      <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Serial Settings
      </h3>
      <div class="space-y-3">
        <UFormField
          label="Baud Rate"
          size="sm"
        >
          <USelect
            v-model="settings.baudRate"
            :items="baudRates.map((b) => ({ label: String(b), value: b }))"
            class="w-full"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-2">
          <UFormField
            label="Data Bits"
            size="sm"
          >
            <USelect
              v-model="settings.dataBits"
              :items="dataBitsOptions"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Stop Bits"
            size="sm"
          >
            <USelect
              v-model="settings.stopBits"
              :items="stopBitsOptions"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <UFormField
            label="Parity"
            size="sm"
          >
            <USelect
              v-model="settings.parity"
              :items="parityOptions"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Flow Control"
            size="sm"
          >
            <USelect
              v-model="settings.flowControl"
              :items="flowControlOptions"
              class="w-full"
            />
          </UFormField>
        </div>
      </div>
    </div>

    <USeparator />

    <div>
      <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Display
      </h3>
      <div class="space-y-3">
        <UFormField
          label="Receive Encoding"
          size="sm"
        >
          <USelect
            v-model="settings.receiveEncoding"
            :items="encodingOptions"
            class="w-full"
          />
        </UFormField>

        <UCheckbox
          v-model="settings.timestampEnabled"
          label="Timestamps"
          size="sm"
        />

        <UCheckbox
          v-if="settings.receiveEncoding === 'hex'"
          v-model="settings.hexUpper"
          label="Uppercase Hex"
          size="sm"
        />
      </div>
    </div>

    <USeparator />

    <div>
      <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Send
      </h3>
      <div class="space-y-3">
        <UFormField
          label="Send Encoding"
          size="sm"
        >
          <USelect
            v-model="settings.sendEncoding"
            :items="encodingOptions"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Delimiter"
          size="sm"
        >
          <USelect
            v-model="settings.sendDelimiter"
            :items="delimiterOptions"
            class="w-full"
          />
        </UFormField>
      </div>
    </div>
  </div>
</template>
