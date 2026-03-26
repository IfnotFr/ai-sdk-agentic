import type Phaser from 'phaser'
import { BaseTool } from '../BaseTool'
import { GridSystem } from '../GridSystem'
import { FURNITURE_REGISTRY, type FurnitureId } from '~/utils/furniture'
import { GRID_SIZE } from '~/utils/grid'
import type { MainScene } from '~/game/scenes/MainScene'

export class EquipmentTool extends BaseTool {
  private gridSystem = new GridSystem()
  private ghostGraphics: Phaser.GameObjects.Graphics
  private currentDirection = 0

  constructor(protected override scene: MainScene) {
    super(scene)
    this.ghostGraphics = scene.add.graphics()
    this.ghostGraphics.setDepth(10)
  }

  onPointerDown(pointer: Phaser.Input.Pointer) {
    const { toolId } = this.scene.getInteractionState()
    const def = FURNITURE_REGISTRY[toolId as FurnitureId]
    if (!def) return

    const gx = Math.floor(pointer.worldX / GRID_SIZE)
    const gy = Math.floor(pointer.worldY / GRID_SIZE)

    const parent = this.getSupportAt(gx, gy)
    if (!parent) {
      this.scene.events.emit('ERROR', 'Cet objet doit être posé sur un support (table, etc.) !')
      return
    }

    if (!this.isPositionFree(gx, gy)) {
      this.scene.events.emit('ERROR', 'Cet emplacement est déjà occupé !')
      return
    }

    const newId = crypto.randomUUID()
    this.scene.events.emit('EQUIPMENT_ADD', {
      id: newId,
      registryId: toolId,
      parentId: parent.id,
      gx,
      gy,
      direction: this.currentDirection
    })

    if (!pointer.event?.shiftKey) {
      this.scene.events.emit('TOOL_DESELECT')
      this.scene.events.emit('ENTITY_SELECT', newId, 'furniture')
    }
  }

  onPointerMove(pointer: Phaser.Input.Pointer) {
    this.drawGhost(pointer)
  }

  onPointerUp() {}

  override onRotate() {
    this.currentDirection = (this.currentDirection + 1) % 4
    this.drawGhost(this.scene.input.activePointer)
  }

  override onWheel(_p: Phaser.Input.Pointer, deltaY: number) {
    if (deltaY > 0) this.currentDirection = (this.currentDirection + 1) % 4
    else this.currentDirection = (this.currentDirection + 3) % 4
    this.drawGhost(this.scene.input.activePointer)
  }

  override activate() {
    this.ghostGraphics.setVisible(true)
  }

  override deactivate() {
    this.ghostGraphics.clear()
    this.ghostGraphics.setVisible(false)
  }

  private getSupportAt(gx: number, gy: number) {
    const layout = this.scene.getLayout()
    return layout.items.find(item => {
      const def = FURNITURE_REGISTRY[item.registryId as FurnitureId]
      if (!def?.canSupport) return false
      return (
        gx >= item.gx && gx < item.gx + item.w &&
        gy >= item.gy && gy < item.gy + item.h
      )
    })
  }

  private isPositionFree(gx: number, gy: number): boolean {
    const layout = this.scene.getLayout()
    return !layout.equipments.some(e => e.gx === gx && e.gy === gy)
  }

  private drawGhost(pointer: Phaser.Input.Pointer) {
    this.ghostGraphics.clear()
    const { toolId } = this.scene.getInteractionState()
    const def = FURNITURE_REGISTRY[toolId as FurnitureId]
    if (!def) return

    const gx = Math.floor(pointer.worldX / GRID_SIZE)
    const gy = Math.floor(pointer.worldY / GRID_SIZE)
    const x = gx * GRID_SIZE
    const y = gy * GRID_SIZE

    const isValid = !!this.getSupportAt(gx, gy) && this.isPositionFree(gx, gy)

    this.ghostGraphics.setPosition(x, y)
    if (def.drawBody) {
      def.drawBody(this.ghostGraphics, GRID_SIZE, GRID_SIZE, false, isValid, true)
    }
    if (def.drawDetail) {
      def.drawDetail(this.ghostGraphics, GRID_SIZE, GRID_SIZE, this.currentDirection)
    }
  }
}
