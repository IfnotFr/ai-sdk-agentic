<script setup lang="ts">
import { useEditorStore } from '~/stores/useEditor'
import { useAgents } from '~/composables/useAgents'
import UiConfigModal from './components/ui/modals/ConfigModal.vue'
import UiRoomEditModal from './components/ui/modals/RoomEditModal.vue'
import UiWorkZoneEditModal from './components/ui/modals/WorkZoneEditModal.vue'
import UiDeleteConfirmModal from './components/ui/modals/DeleteConfirmModal.vue'
import UiEntityActionMenu from './components/ui/modals/EntityActionMenu.vue'

const editorStore = useEditorStore()
const toast = useToast()
const { messages, isConnected, connect } = useAgents()

onMounted(() => {
  connect()
})

watch(() => editorStore.error, (newError) => {
  if (newError) {
    toast.add({
      title: 'Action impossible',
      description: newError,
      color: 'error',
      icon: 'i-lucide-triangle-alert',
      duration: 3000
    })
    // Reset error in store
    editorStore.setError(null)
  }
})

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'fr',
    class: 'overflow-hidden h-full w-full'
  },
  bodyAttrs: {
    class: 'overflow-hidden h-full w-full'
  }
})

useSeoMeta({
  title: 'AI SDK Office',
  description: 'Concepteur de bureaux agentique.'
})
</script>

<template>
  <UApp>
    <div class="flex flex-col h-screen w-screen overflow-hidden bg-default">
      <main class="flex-1 relative overflow-hidden flex">
        <!-- Configuration flottante en haut à droite -->
        <div class="fixed top-2 right-2 z-50">
          <UiConfigModal />
        </div>

        <UiRoomEditModal />
        <UiWorkZoneEditModal />
        <UiDeleteConfirmModal />
        <UiEntityActionMenu />

        <!-- Zone de jeu -->
        <div class="flex-1 relative overflow-hidden">
          <NuxtPage />
        </div>

        <!-- Barre d'outils flottante -->
        <UiEditorToolbar />
      </main>
    </div>
  </UApp>
</template>

<style>
/* Global styles for the app-like feel */
#__nuxt {
  height: 100%;
}
</style>
