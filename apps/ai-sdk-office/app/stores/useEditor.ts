import { defineStore } from 'pinia'
import { FURNITURE_REGISTRY, type FurnitureId } from '~/utils/furniture'

export type Tool = 'room' | 'door' | 'chair' | 'table' | 'computer' | null
export type EntityType = 'room' | 'furniture' | 'door' | 'agent' | null
export type Category = 'execution' | 'structure' | 'interior' | 'equipment' | 'zones' | null

export const useEditorStore = defineStore('editor', {
  state: () => ({
    activeCategory: 'execution' as Category, // Default mode
    currentTool: null as Tool,
    selectedEntityId: null as string | null,
    selectedEntityType: null as EntityType,
    error: null as string | null,
    isRoomModalOpen: false,
    isWorkZoneModalOpen: false,
    isDeleteConfirmModalOpen: false,
    selectedEntityMenu: {
      x: 0,
      y: 0,
      visible: false
    }
  }),
  getters: {
    activeCategoryLabel: (state) => {
      const cats: Record<string, string> = {
        execution: 'Simulation',
        structure: 'Structure',
        interior: 'Mobilier',
        equipment: 'Équipements',
        zones: 'Zones'
      }
      return state.activeCategory ? cats[state.activeCategory] : ''
    },
    activeToolDef: (state) => {
      if (!state.currentTool) return null
      return FURNITURE_REGISTRY[state.currentTool as FurnitureId] || null
    }
  },
  actions: {
    setRoomModalOpen(open: boolean) {
      this.isRoomModalOpen = open
    },
    setWorkZoneModalOpen(open: boolean) {
      this.isWorkZoneModalOpen = open
    },
    setDeleteConfirmModalOpen(open: boolean) {
      this.isDeleteConfirmModalOpen = open
    },
    setCategory(category: Category) {
      // No more toggle to null. To leave a mode, you must click another one (like 'execution')
      if (this.activeCategory !== category) {
        this.activeCategory = category
        this.currentTool = null
        this.selectEntity(null, null)
      }
    },
    setTool(tool: Tool) {
      this.currentTool = tool
      if (tool) {
        this.selectEntity(null, null)
      }
    },
    selectEntity(id: string | null, type: EntityType) {
      this.selectedEntityId = id
      this.selectedEntityType = type
      if (id) {
        this.currentTool = null
      } else {
        this.selectedEntityMenu.visible = false
      }
    },
    updateMenuPosition(x: number, y: number, visible: boolean) {
      this.selectedEntityMenu.x = x
      this.selectedEntityMenu.y = y
      this.selectedEntityMenu.visible = visible
    },
    setError(msg: string | null) {
      this.error = msg
    }
  },
  persist: true
})
