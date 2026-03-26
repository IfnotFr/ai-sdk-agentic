<script setup lang="ts">
import { useEditorStore } from "~/stores/useEditor";
import { FURNITURE_REGISTRY, type FurnitureId } from "~/utils/furniture";

const editorStore = useEditorStore();

const currentToolLabel = computed(() => {
  const tool = editorStore.currentTool;
  if (!tool) return "";
  return FURNITURE_REGISTRY[tool as FurnitureId]?.label || tool;
});
</script>

<template>
  <footer
    class="h-8 border-t border-neutral-200 bg-transparent flex items-center px-4 shrink-0 text-[10px] uppercase tracking-wider text-neutral-500 font-medium"
  >
    <div class="flex items-center gap-2">
      <div class="size-2 rounded-full bg-green-500 animate-pulse" />
      <span>Application Opérationnelle</span>
    </div>

    <div class="ml-10 flex items-center gap-2">
      <UIcon name="i-lucide-grid-3x3" class="size-3 text-neutral-400" />
      <span>Grille 32px</span>
    </div>

    <div class="ml-auto">
      <div
        v-if="editorStore.currentTool"
        class="text-neutral-400 flex items-center gap-1.5"
      >
        <span>Placement de</span>
        <span
          class="text-primary-600 font-bold uppercase text-[9px] tracking-tight"
          >{{ currentToolLabel }}</span
        >
        <span>,</span>
        <div class="flex items-center bg-neutral-100 px-1 py-0.5 rounded text-neutral-500 ml-0.5">
          <span class="text-[7px] font-black">ESC</span>
        </div>
        <span class="text-neutral-400 text-[9px] lowercase italic">ou clic droit</span>
        <span>pour annuler</span>
      </div>
      <span v-else class="text-neutral-400">Aucun outil sélectionné</span>
    </div>
  </footer>
</template>
