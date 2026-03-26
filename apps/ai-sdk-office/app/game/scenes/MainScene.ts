import Phaser from 'phaser'
import { GridSystem } from '~/game/core/GridSystem'
import { AgentObject } from '~/game/objects/AgentObject'
import { useEditorStore } from '~/stores/useEditor'
import { useOfficeStore } from '~/stores/useOffice'
import { GRID_SIZE } from '~/utils/grid'
import { Pathfinder } from '~/game/core/Pathfinder'
import { EntityManager } from '~/game/core/EntityManager'
import { InputManager } from '~/game/core/InputManager'
import { AgentManager } from '~/game/core/AgentManager'
import { OfficeService } from '~/services/OfficeService'
import type { PiniaMutationEvent, OfficeLayout, IRoom, IFurniture, IDoor, IEquipment, IZone } from '~/types/office'

export class MainScene extends Phaser.Scene {
  private gridGraphics!: Phaser.GameObjects.Graphics
  private gridSystem!: GridSystem
  private pathGraphics!: Phaser.GameObjects.Graphics
  
  private entityManager!: EntityManager
  private inputManager!: InputManager
  private agentManager!: AgentManager
  
  private agent: AgentObject | null = null
  private editorStore = useEditorStore()
  private officeStore = useOfficeStore()

  constructor() {
    super('MainScene')
  }

  init() {
    this.gridSystem = new GridSystem()
    this.entityManager = new EntityManager(this)
    this.inputManager = new InputManager(this)
    this.agentManager = new AgentManager(this)
  }

  create() {
    this.gridGraphics = this.add.graphics()
    this.pathGraphics = this.add.graphics()
    this.pathGraphics.setDepth(10)

    this.inputManager.setup()
    this.setupEvents()
    
    this.drawGrid()
    this.entityManager.syncAll(this.officeStore.$state)

    this.scale.on('resize', () => {
      this.drawGrid()
    })

    this.events.on('CAMERA_MOVE', () => {
      this.drawGrid()
      this.entityManager.updateAllVisuals(this.officeStore.$state, this.editorStore.selectedEntityId)
    })

    // Bridge Store -> Game
    this.officeStore.$subscribe((mutation) => {
      // Force syncAll pour n'importe quel changement dans le store office pour l'instant
      // pour garantir que l'UI est toujours à jour, on optimisera plus tard si besoin.
      this.entityManager.syncAll(this.officeStore.$state)
      this.entityManager.updateAllVisuals(this.officeStore.$state, this.editorStore.selectedEntityId)
    })

    this.editorStore.$subscribe(() => {
      this.entityManager.updateAllVisuals(this.officeStore.$state, this.editorStore.selectedEntityId)
      this.inputManager.updateActiveTool(this.editorStore.activeCategory, this.editorStore.currentTool)
    })

    this.inputManager.updateActiveTool(this.editorStore.activeCategory, this.editorStore.currentTool)

    // Bridge HTML -> Game
    window.addEventListener('entity-delete-request', ((e: CustomEvent) => {
      this.events.emit('ENTITY_DELETE_REQUEST', e.detail.id, e.detail.type)
    }) as EventListener)

    window.addEventListener('agent-bus', ((e: CustomEvent) => {
      const { event, payload } = e.detail
      const mission = payload.mission
      if (!mission) return

      const officeMetadata = mission.agent.metadata?.office as any
      const agentId = officeMetadata?.id || mission.agent.id
      
      if (event === 'agent.start') this.events.emit('AGENT_START', mission)
      else if (event === 'agent.step.start') this.events.emit('AGENT_STEP_START', agentId, payload.stepNumber)
      else if (event === 'agent.tool.start') this.events.emit('AGENT_TOOL_START', agentId, payload.toolCall.toolName)
      else if (event === 'agent.tool.finish') this.events.emit('AGENT_TOOL_FINISH', agentId, mission)
      else if (event === 'agent.text') this.events.emit('AGENT_TEXT', agentId, payload.text)
      else if (event === 'agent.finish') this.events.emit('AGENT_FINISH', agentId, mission)
    }) as EventListener)
  }

  private setupEvents() {
    // Bridge Game -> Store (UI and State)
    this.events.on('ENTITY_SELECT', (id: string | null, type: string | null) => {
      this.editorStore.selectEntity(id, type as any)
    })

    this.events.on('ERROR', (msg: string) => {
      this.editorStore.setError(msg)
    })

    this.events.on('TOOL_DESELECT', () => {
      this.editorStore.setTool(null)
    })

    this.events.on('CATEGORY_SET', (cat: string) => {
      this.editorStore.setCategory(cat as any)
    })

    this.events.on('ROOM_MODAL_OPEN', (open: boolean) => {
      this.editorStore.setRoomModalOpen(open)
    })

    this.events.on('WORKZONE_MODAL_OPEN', (open: boolean) => {
      this.editorStore.setWorkZoneModalOpen(open)
    })

    this.events.on('INPUT_RIGHT_CLICK', () => {
      if (this.editorStore.currentTool) this.editorStore.setTool(null)
      else this.editorStore.selectEntity(null, null)
    })

    this.events.on('INPUT_ESCAPE', () => {
      if (this.editorStore.currentTool) {
        this.editorStore.setTool(null)
      } else if (this.editorStore.selectedEntityId) {
        this.editorStore.selectEntity(null, null)
      } else if (this.editorStore.activeCategory !== 'execution') {
        this.editorStore.setCategory('execution')
      }
    })

    // Data Mutations
    this.events.on('ROOM_ADD', (room: IRoom) => this.officeStore.addRoom(room))
    this.events.on('ROOM_UPDATE', (id: string, bounds: any) => this.officeStore.updateRoom(id, bounds))
    this.events.on('ROOM_MOVE', (id: string, dx: number, dy: number) => 
      this.officeStore.moveRoom(id, dx, dy))
    
    this.events.on('FURNITURE_ADD', (item: IFurniture) => this.officeStore.addItem(item))
    this.events.on('FURNITURE_MOVE', (id: string, gx: number, gy: number) => this.officeStore.moveItem(id, gx, gy))
    
    this.events.on('EQUIPMENT_ADD', (eq: IEquipment) => this.officeStore.addEquipment(eq))
    this.events.on('EQUIPMENT_MOVE', (id: string, gx: number, gy: number, parentId?: string) => this.officeStore.moveEquipment(id, gx, gy, parentId))
    
    this.events.on('ZONE_ADD', (zone: IZone) => this.officeStore.addZone(zone))
    this.events.on('ZONE_MOVE', (id: string, gx: number, gy: number) => this.officeStore.moveZone(id, gx, gy))
    
    this.events.on('DOOR_ADD', (door: IDoor) => this.officeStore.addDoor(door))
    this.events.on('DOOR_REMOVE', (id: string) => this.officeStore.removeDoor(id))

    // Agent Events (from Socket Bridge)
    this.events.on('AGENT_START', (mission: any) => this.agentManager.handleStart(mission))
    this.events.on('AGENT_STEP_START', (agentId: string, stepNumber: number) => this.agentManager.handleStepStart(agentId, stepNumber))
    this.events.on('AGENT_TOOL_START', (agentId: string, toolName: string) => this.agentManager.handleToolStart(agentId, toolName))
    this.events.on('AGENT_TOOL_FINISH', (agentId: string, mission: any) => this.agentManager.handleToolFinish(agentId, mission))
    this.events.on('AGENT_TEXT', (agentId: string, text: string) => this.agentManager.handleText(agentId, text))
    this.events.on('AGENT_FINISH', (agentId: string, mission: any) => this.agentManager.handleFinish(agentId, mission))

    this.events.on('ENTITY_DELETE_REQUEST', (id: string, type: string) => {
      if (type === 'room') {
        const service = new OfficeService(this.officeStore.$state)
        const prep = service.prepareRoomRemoval(id)
        if (prep && (prep.furnitureIds.length > 0 || prep.doorIds.length > 0 || prep.zoneIds.length > 0)) {
          this.editorStore.setDeleteConfirmModalOpen(true)
        } else {
          this.officeStore.removeRoom(id)
          this.editorStore.selectEntity(null, null)
        }
      } else if (type === 'furniture') {
        this.officeStore.removeItem(id)
        this.editorStore.selectEntity(null, null)
      } else if (type === 'door') {
        this.officeStore.removeDoor(id)
        this.editorStore.selectEntity(null, null)
      }
    })
  }

  // Data Getters for internal classes
  getLayout(): OfficeLayout {
    return this.officeStore.$state
  }

  getInteractionState() {
    return {
      category: this.editorStore.activeCategory,
      toolId: this.editorStore.currentTool,
      selectedId: this.editorStore.selectedEntityId,
      selectedType: this.editorStore.selectedEntityType
    }
  }

  async handleAgentNavigation(gx: number, gy: number) {
    if (!this.agent) {
      this.agent = new AgentObject(this, gx, gy, 'test-agent')
      this.agent.setDepth(5)
    } else {
      this.agent.stopMovement()
      const pathfinder = new Pathfinder(this.officeStore.$state)
      const path = pathfinder.findPath(this.agent.gridPos, { gx, gy })
      this.drawPath(path)
      if (path) {
        await this.agent.moveAlongPath(path)
        this.pathGraphics.clear()
      }
    }
  }

  private drawPath(path: { gx: number, gy: number }[] | null) {
    this.pathGraphics.clear()
    if (!path) return
    this.pathGraphics.lineStyle(2, 0x3b82f6, 0.3)
    this.pathGraphics.beginPath()
    path.forEach((p, i) => {
      const x = p.gx * GRID_SIZE + GRID_SIZE / 2
      const y = p.gy * GRID_SIZE + GRID_SIZE / 2
      if (i === 0) this.pathGraphics.moveTo(x, y)
      else this.pathGraphics.lineTo(x, y)
    })
    this.pathGraphics.strokePath()
  }

  private drawGrid() {
    const { width, height } = this.scale
    const cam = this.cameras.main
    const gridSize = GRID_SIZE
    
    this.gridGraphics.clear()
    this.gridGraphics.lineStyle(1, 0xe5e7eb, 1)

    // Calculer le point de départ en fonction du scroll de la caméra
    const startX = Math.floor(cam.scrollX / gridSize) * gridSize
    const endX = startX + width + gridSize
    const startY = Math.floor(cam.scrollY / gridSize) * gridSize
    const endY = startY + height + gridSize

    for (let x = startX; x <= endX; x += gridSize) {
      this.gridGraphics.moveTo(x, startY)
      this.gridGraphics.lineTo(x, endY)
    }
    for (let y = startY; y <= endY; y += gridSize) {
      this.gridGraphics.moveTo(startX, y)
      this.gridGraphics.lineTo(endX, y)
    }
    this.gridGraphics.strokePath()
  }
}
