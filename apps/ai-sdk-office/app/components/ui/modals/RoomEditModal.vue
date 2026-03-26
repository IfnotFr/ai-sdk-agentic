<script setup lang="ts">
import { useEditorStore } from "~/stores/useEditor";
import { useOfficeStore } from "~/stores/useOffice";

const editorStore = useEditorStore();
const officeStore = useOfficeStore();

const room = computed(() => {
  if (editorStore.selectedEntityType !== "room") return null;
  return officeStore.rooms.find((r) => r.id === editorStore.selectedEntityId);
});

const localName = ref("");

watch(
  () => room.value?.name,
  (newVal) => {
    localName.value = newVal || "";
  },
  { immediate: true },
);

function save() {
  if (room.value) {
    officeStore.updateRoomProperties(room.value.id, { name: localName.value });
  }
  editorStore.setRoomModalOpen(false);
}
</script>

<template>
  <UModal
    v-model:open="editorStore.isRoomModalOpen"
    title="Édition de la Pièce"
    description="Personnalisez le nom de cet espace."
  >
    <template #body>
      <div v-if="room">
        <UFormField label="Nom de la pièce" size="lg">
          <UInput
            v-model="localName"
            class="w-full"
            placeholder="Ex: Bureau Open Space, Cafétéria..."
            size="lg"
            autofocus
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-3 w-full">
        <UButton
          label="Annuler"
          color="neutral"
          variant="ghost"
          size="lg"
          @click="editorStore.setRoomModalOpen(false)"
        />
        <UButton label="Enregistrer" color="primary" size="lg" @click="save" />
      </div>
    </template>
  </UModal>
</template>
