import type { MainScene } from '~/game/scenes/MainScene'
import { RoomTool } from '~/game/core/tools/RoomTool'
import { FurnitureTool } from '~/game/core/tools/FurnitureTool'
import { EquipmentTool } from '~/game/core/tools/EquipmentTool'
import { ZoneTool } from '~/game/core/tools/ZoneTool'
import { DoorTool } from '~/game/core/tools/DoorTool'
import type { BaseTool } from '~/game/core/BaseTool'
import { FURNITURE_REGISTRY, type FurnitureId } from '~/utils/furniture'
import { GRID_SIZE } from '~/utils/grid'
import { OfficeValidationService } from '~/utils/office-validation-service'

export class InputManager {
  private tools: Record<string, BaseTool> = {}
  private activeTool: BaseTool | null = null

  private isPanning = false
  private panStart = { x: 0, y: 0 }

  constructor(private scene: MainScene) {
    this.tools = {
      room: new RoomTool(scene),
      furniture: new FurnitureTool(scene),
      equipment: new EquipmentTool(scene),
      zone: new ZoneTool(scene),
      door: new DoorTool(scene)
    }
  }

  setup() {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
      if (pointer.button === 1) { // Middle button
        this.isPanning = true
        this.panStart.x = pointer.x
        this.panStart.y = pointer.y
        return
      }
      
      if (pointer.rightButtonDown()) {
        this.handleRightClick()
        return
      }
      
      // On log les objets détectés pour le debug si besoin
      // console.log('[InputManager] pointerdown', currentlyOver.length, 'objects')
      
      this.handlePointerDown(pointer, currentlyOver)
    })

    this.scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.isPanning) {
        const dx = p.x - this.panStart.x
        const dy = p.y - this.panStart.y
        
        this.scene.cameras.main.scrollX -= dx
        this.scene.cameras.main.scrollY -= dy
        
        this.panStart.x = p.x
        this.panStart.y = p.y
        this.scene.events.emit('CAMERA_MOVE')
        return
      }
      this.activeTool?.onPointerMove(p)
    })

    this.scene.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (p.button === 1) {
        this.isPanning = false
        return
      }
      this.activeTool?.onPointerUp(p)
    })
    
    this.scene.input.on('wheel', (p: Phaser.Input.Pointer, _go: any, _dx: number, dy: number) => {
      this.activeTool?.onWheel(p, dy)
    })

    this.scene.input.keyboard?.on('keydown-R', () => {
      this.handleRotate()
    })


    this.scene.input.keyboard?.on('keydown-ESC', () => {
      this.handleEscape()
    })

    this.scene.input.keyboard?.on('keydown-DELETE', () => {
      this.handleDelete()
    })

    this.scene.input.setTopOnly(false)
    this.scene.input.mouse?.disableContextMenu()
  }

  private handleRotate() {
    this.activeTool?.onRotate?.()
  }

  private handleDelete() {
    const { selectedId, selectedType } = this.scene.getInteractionState()
    if (selectedId) {
      this.scene.events.emit('ENTITY_DELETE_REQUEST', selectedId, selectedType)
    }
  }

  private handleRightClick() {
    this.scene.events.emit('INPUT_RIGHT_CLICK')
  }

  private handleEscape() {
    this.scene.events.emit('INPUT_ESCAPE')
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) {
    const mode = this.scene.getInteractionState()

    // 1. Si on a un outil actif, il a la priorité absolue
    if (this.activeTool) {
      this.activeTool.onPointerDown(pointer)
      return
    }

    // 2. Gestion intelligente de la sélection si pas d'outil
    if (currentlyOver.length > 0) {
      const mode = this.scene.getInteractionState()
      
      // Trouver l'objet qui correspond le mieux à la catégorie active
      let target: any = null
      
      if (mode.category === 'zones') {
        target = currentlyOver.find(o => o.constructor.name === 'ZoneObject')
      } else if (mode.category === 'equipment') {
        target = currentlyOver.find(o => o.constructor.name === 'EquipmentObject')
      } else if (mode.category === 'interior') {
        target = currentlyOver.find(o => o.constructor.name === 'FurnitureObject')
      } else if (mode.category === 'structure') {
        target = currentlyOver.find(o => o.constructor.name === 'RoomObject' || o.constructor.name === 'DoorObject')
      }

      // Si on a un match, on ne fait rien de plus ici, 
      // l'objet lui-même gérera son pointerdown s'il est interactif.
      // Mais si on n'a pas de match et qu'on a des objets, on pourrait vouloir 
      // quand même sélectionner l'objet le plus haut (comportement par défaut).
      if (target) {
        console.log('[InputManager] Found matching target for category', mode.category)
        // Note: On laisse l'événement se propager aux objets
        return
      }
    }

    // 3. Si on clique dans le vide ou sur une pièce en mode exécution
    if (mode.category === 'execution') {
      const gx = Math.floor(pointer.worldX / GRID_SIZE)
      const gy = Math.floor(pointer.worldY / GRID_SIZE)
      
      const validation = new OfficeValidationService(this.scene.getLayout())
      if (validation.isPointInsideAnyRoom({ gx, gy })) {
        this.scene.handleAgentNavigation(gx, gy)
      } else {
        this.scene.events.emit('ERROR', 'L\'agent ne peut se déplacer qu\'à l\'intérieur des pièces !')
      }
      return
    }

    // 4. Si on clique dans le vide (pas d'objet interactif sous la souris)
    if (currentlyOver.length === 0) {
      // Désélection systématique
      this.scene.events.emit('ENTITY_SELECT', null, null)
    }
  }

  updateActiveTool(category: string | null, toolId: string | null) {
    this.activeTool?.deactivate()
    this.activeTool = null
    
    if (!category || !toolId) return
    
    if (toolId === 'room') this.activeTool = this.tools.room || null
    else if (toolId === 'door') this.activeTool = this.tools.door || null
    else {
      const def = FURNITURE_REGISTRY[toolId as FurnitureId]
      if (def?.type === 'equipment') this.activeTool = this.tools.equipment || null
      else if (def?.type === 'zone') this.activeTool = this.tools.zone || null
      else if (def) this.activeTool = this.tools.furniture || null
    }
    
    this.activeTool?.activate()
  }
}
