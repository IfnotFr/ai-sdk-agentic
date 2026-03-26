<script setup lang="ts">
import { useEditorStore } from '~/stores/useEditor'
import { useOfficeStore } from '~/stores/useOffice'
import { useAgents } from '~/composables/useAgents'

const editorStore = useEditorStore()
const officeStore = useOfficeStore()
const { registry } = useAgents()

const zone = computed(() => {
  const id = editorStore.selectedEntityId
  if (!id) return null
  return officeStore.zones.find(z => z.id === id)
})

const selectedTargets = ref<string[]>([])

// Synchronize local state with store
watch(() => zone.value?.properties?.targets, (newVal) => {
  selectedTargets.value = Array.isArray(newVal) ? [...newVal] : []
}, { immediate: true })

// Tabs definition
const tabs = computed(() => {
  const items = []
  
  // 1. Positions Tab
  items.push({
    label: 'Positions',
    icon: 'i-lucide-map-pin',
    targets: registry.value.positions
  })

  // 2. Agent Tabs
  registry.value.agents.forEach(agent => {
    items.push({
      label: agent.name,
      icon: 'i-lucide-bot',
      targets: agent.tools
    })
  })

  return items
})

function isEnabled(target: string) {
  return selectedTargets.value.includes(target)
}

function toggleTarget(target: string) {
  const index = selectedTargets.value.indexOf(target)
  if (index === -1) {
    selectedTargets.value.push(target)
  } else {
    selectedTargets.value.splice(index, 1)
  }
}

/**
 * Get how many zones in the entire office use this target
 */
function getUsageCount(target: string) {
  return officeStore.zones.filter(z => z.properties?.targets?.includes(target)).length
}

function save() {
  if (zone.value) {
    officeStore.updateZoneProperties(zone.value.id, { 
      targets: selectedTargets.value 
    })
  }
  editorStore.setWorkZoneModalOpen(false)
}
</script>

<template>
  <UModal
    v-model:open="editorStore.isWorkZoneModalOpen"
    title="Gestionnaire de Zone"
    description="Activez les outils et positions qui doivent matcher avec cet espace."
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <div v-if="zone" class="space-y-6">
        
        <UTabs :items="tabs" class="w-full">
          <template #content="{ item }">
            <div class="py-4 space-y-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              
              <div v-if="!item.targets || item.targets.length === 0" class="text-center py-10 text-dimmed italic">
                Aucun élément trouvé pour cette catégorie.
              </div>

              <div 
                v-for="targetName in (item.targets as string[])" 
                :key="targetName"
                class="flex items-center justify-between p-3 rounded-xl border border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors group"
              >
                <div class="flex items-center gap-3">
                  <span class="font-bold text-sm">{{ targetName }}</span>
                  <div class="flex items-center gap-1.5">
                    <span 
                      class="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                      :class="getUsageCount(targetName) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
                    >
                      {{ getUsageCount(targetName) }} zone(s)
                    </span>
                    <UIcon 
                      v-if="getUsageCount(targetName) === 0" 
                      name="i-lucide-triangle-alert" 
                      class="size-3.5 text-amber-500 animate-pulse" 
                    />
                  </div>
                </div>

                <USwitch 
                  :model-value="isEnabled(targetName)" 
                  @update:model-value="toggleTarget(targetName)" 
                />
              </div>
            </div>
          </template>
        </UTabs>

      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-3 w-full">
        <UButton
          label="Annuler"
          color="neutral"
          variant="ghost"
          size="lg"
          @click="editorStore.setWorkZoneModalOpen(false)"
        />
        <UButton
          label="Enregistrer les modifications"
          color="primary"
          size="lg"
          @click="save"
        />
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 10px;
}
</style>
