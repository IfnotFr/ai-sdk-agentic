<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import type Phaser from 'phaser'
import { useOfficeStore } from '~/stores/useOffice'

const officeStore = useOfficeStore()
const gameContainer = ref<HTMLElement | null>(null)
const gameInstance = ref<Phaser.Game | null>(null)

onMounted(async () => {
  if (import.meta.client) {
    const { createGame } = await import('~/game/manager')
    // We use a specific ID to ensure Phaser finds it
    gameInstance.value = createGame('phaser-app-root', officeStore.$state)
  }
})

onUnmounted(() => {
  if (gameInstance.value) {
    gameInstance.value.destroy(true)
  }
})
</script>

<template>
  <div
    id="phaser-app-root"
    ref="gameContainer"
    class="w-full h-full block"
  />
</template>

<style scoped>
#phaser-app-root {
  width: 100%;
  height: 100%;
}
</style>
