<script setup lang="ts">
import { useEditorStore, type Category } from '~/stores/useEditor'
import { FURNITURE_REGISTRY, type FurnitureId } from '~/utils/furniture'

const editorStore = useEditorStore()
const hoveredCategory = ref<Category>(null)

// Main Categories (Layers)
const categories = [
  { id: 'execution', label: 'Exécution', icon: 'i-lucide-play', items: [], color: 'emerald' },
  { id: 'structure', label: 'Espaces', icon: 'i-lucide-layout-grid', items: ['room', 'door'], color: 'primary' },
  { id: 'interior', label: 'Mobilier', icon: 'i-lucide-armchair', items: ['chair', 'table'], color: 'primary' },
  { id: 'equipment', label: 'Équipements', icon: 'i-lucide-monitor', items: ['computer'], color: 'primary' },
  { id: 'zones', label: 'Zones', icon: 'i-lucide-layers-3', items: ['zone', 'entry_exit'], color: 'primary' }
]

/**
 * Logic: Sub-menu ONLY shows items of the ACTIVE category.
 * Hovering categories only provides visual feedback on the category buttons themselves.
 */
const categoryToDisplay = computed(() => {
  return editorStore.activeCategory
})

const categoryItems = computed(() => {
  const cat = categories.find(c => c.id === categoryToDisplay.value)
  if (!cat) return []
  return cat.items.map(id => FURNITURE_REGISTRY[id as FurnitureId]).filter(Boolean) as any[]
})

function selectTool(itemId: string) {
  editorStore.setTool(itemId as any)
}

function handleMouseEnter(catId: Category) {
  hoveredCategory.value = catId
}

function getCategoryColor(cat: any) {
  const isActive = editorStore.activeCategory === cat.id
  const isHovered = hoveredCategory.value === cat.id
  
  if (isActive) {
    return cat.id === 'execution' ? 'text-emerald-500' : 'text-primary'
  }
  
  if (isHovered) {
    return 'text-highlighted' // Visual feedback on hover
  }
  
  return 'text-dimmed'
}

function getGlowColor(catId: string) {
  return catId === 'execution' ? 'bg-emerald-500/10' : 'bg-primary-500/5'
}
</script>

<template>
  <div 
    class="fixed bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0 z-50 pointer-events-auto"
    @mouseleave="hoveredCategory = null"
  >
    
    <!-- Sub-menu (Items) -->
    <div class="flex items-end min-h-[64px]">
      <Transition
        mode="out-in"
        enter-active-class="transition duration-500 ease-out"
        enter-from-class="translate-y-2 opacity-0 scale-90"
        enter-to-class="translate-y-0 opacity-100 scale-100"
        leave-active-class="transition duration-300 ease-in"
        leave-from-class="translate-y-0 opacity-100 scale-100"
        leave-to-class="translate-y-2 opacity-0 scale-90"
      >
        <div 
          v-if="categoryItems.length > 0"
          :key="categoryToDisplay || 'none'"
          class="flex items-center gap-1"
        >
          <button
            v-for="item in categoryItems"
            :key="item.id"
            class="group relative flex flex-col items-center justify-center size-20 transition-all duration-300 active:scale-90"
            :class="[
              editorStore.currentTool === item.id 
                ? 'text-primary scale-110 font-bold' 
                : 'text-dimmed hover:text-highlighted'
            ]"
            @click="selectTool(item.id)"
          >
            <UIcon :name="item.icon" class="size-9" />
            <span class="text-[8px] font-black uppercase tracking-widest mt-1">{{ item.label }}</span>
            
            <div class="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-inverted text-inverted text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold uppercase tracking-wider">
              {{ item.description }}
            </div>
          </button>
        </div>
      </Transition>
    </div>

    <!-- Main Categories -->
    <div class="flex items-center gap-1 relative">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="relative flex flex-col items-center justify-center size-20 transition-all duration-500 active:scale-90"
        :class="[
          editorStore.activeCategory === cat.id ? 'scale-110' : '',
          getCategoryColor(cat)
        ]"
        @mouseenter="handleMouseEnter(cat.id as Category)"
        @click="editorStore.setCategory(cat.id as Category)"
      >
        <UIcon :name="cat.icon" class="size-9" />
        <span class="text-[8px] font-black uppercase tracking-widest mt-1">{{ cat.label }}</span>
        
        <div 
          v-if="editorStore.activeCategory === cat.id"
          class="absolute inset-0 blur-2xl rounded-full -z-10"
          :class="getGlowColor(cat.id)"
        />
      </button>
    </div>
  </div>
</template>
