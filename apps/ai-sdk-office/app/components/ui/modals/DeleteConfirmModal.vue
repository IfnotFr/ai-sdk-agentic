<script setup lang="ts">
import { useEditorStore } from '~/stores/useEditor'
import { useOfficeStore } from '~/stores/useOffice'

const editorStore = useEditorStore()
const officeStore = useOfficeStore()

const room = computed(() => {
  if (editorStore.selectedEntityType !== 'room') return null
  return officeStore.rooms.find(r => r.id === editorStore.selectedEntityId)
})

function confirm() {
  if (room.value) {
    officeStore.removeRoom(room.value.id)
    editorStore.selectEntity(null, null)
  }
  editorStore.setDeleteConfirmModalOpen(false)
}

function cancel() {
  editorStore.setDeleteConfirmModalOpen(false)
}
</script>

<template>
  <UModal
    v-model:open="editorStore.isDeleteConfirmModalOpen"
    title="Confirmer la suppression"
    description="Cette pièce contient des objets qui seront également supprimés."
  >
    <template #body>
      <div class="p-4 space-y-4 text-center">
        <div class="flex justify-center">
          <div class="p-3 bg-error/10 rounded-full">
            <UIcon name="i-lucide-triangle-alert" class="size-8 text-error" />
          </div>
        </div>
        <div class="text-sm text-neutral-500">
          Êtes-vous sûr de vouloir supprimer la pièce <span class="font-bold text-highlighted" v-if="room?.name">"{{ room.name }}"</span> ? Cette action est irréversible et supprimera tout le mobilier et l'équipement qu'elle contient.
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-center gap-3 w-full">
        <UButton
          label="Annuler"
          color="neutral"
          variant="ghost"
          @click="cancel"
        />
        <UButton
          label="Supprimer définitivement"
          color="error"
          @click="confirm"
        />
      </div>
    </template>
  </UModal>
</template>
