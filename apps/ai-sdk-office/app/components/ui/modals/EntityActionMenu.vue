<script setup lang="ts">
import { useEditorStore } from '~/stores/useEditor'
import { useOfficeStore } from '~/stores/useOffice'

const editorStore = useEditorStore()
const officeStore = useOfficeStore()

const menuStyle = computed(() => ({
  top: `${editorStore.selectedEntityMenu.y}px`,
  left: `${editorStore.selectedEntityMenu.x}px`
}))

const hasEdit = computed(() => {
  if (editorStore.selectedEntityType === 'room') return true
  
  const id = editorStore.selectedEntityId
  if (!id) return false

  // Meuble de type zone ou n'importe quelle zone avec propriétés
  const zone = officeStore.zones.find(z => z.id === id)
  if (zone?.registryId === 'zone') return true

  return false
})

function onEdit() {
  if (editorStore.selectedEntityType === 'room') {
    editorStore.setRoomModalOpen(true)
  } else if (editorStore.selectedEntityType === 'furniture') {
    editorStore.setWorkZoneModalOpen(true)
  }
}

function onDelete() {
  if (editorStore.selectedEntityId && editorStore.selectedEntityType) {
    window.dispatchEvent(new CustomEvent('entity-delete-request', { 
      detail: { id: editorStore.selectedEntityId, type: editorStore.selectedEntityType } 
    }))
  }
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="transform scale-75 opacity-0 translate-y-2"
    enter-to-class="transform scale-100 opacity-100 translate-y-0"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="transform scale-100 opacity-100 translate-y-0"
    leave-to-class="transform scale-75 opacity-0 translate-y-2"
  >
    <div
      v-if="editorStore.selectedEntityMenu.visible"
      class="fixed z-50 flex items-center gap-1.5 pointer-events-auto"
      :style="menuStyle"
    >
      <button
        v-if="hasEdit"
        class="flex items-center justify-center size-8 rounded-full transition-all duration-300 text-dimmed hover:text-primary active:scale-90"
        title="Modifier"
        @click="onEdit"
      >
        <UIcon name="i-lucide-pencil" class="size-4" />
      </button>
      
      <button
        class="flex items-center justify-center size-8 rounded-full transition-all duration-300 text-dimmed hover:text-error active:scale-90"
        title="Supprimer"
        @click="onDelete"
      >
        <UIcon name="i-lucide-trash-2" class="size-4" />
      </button>
    </div>
  </Transition>
</template>
