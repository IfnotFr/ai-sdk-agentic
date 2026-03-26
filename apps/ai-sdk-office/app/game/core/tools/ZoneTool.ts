import type Phaser from 'phaser'
import { BaseTool } from '../BaseTool'
import { GridSystem } from '../GridSystem'
import { FURNITURE_REGISTRY, type FurnitureId } from '~/utils/furniture'
import { GRID_SIZE } from '~/utils/grid'
import { isPointInsideAnyRoom } from '~/utils/room-validation'
import type { MainScene } from '~/game/scenes/MainScene'

export class ZoneTool extends BaseTool {
  private gridSystem = new GridSystem()
  private ghostGraphics: Phaser.GameObjects.Graphics
  private currentDirection = 0

  constructor(scene: MainScene) {
    super(scene)
    this.ghostGraphics = scene.add.graphics()
    this.ghostGraphics.setDepth(10)
  }

  onPointerDown(pointer: Phaser.Input.Pointer) {
    const interaction = this.scene.getInteractionState()
    const layout = this.scene.getLayout()
    const toolId = interaction.toolId as FurnitureId
    const def = FURNITURE_REGISTRY[toolId]
    if (!def) return

    const gx = Math.floor(pointer.worldX / GRID_SIZE)
    const gy = Math.floor(pointer.worldY / GRID_SIZE)

    if (!isPointInsideAnyRoom(gx, gy, layout.rooms)) {
      this.scene.events.emit('ERROR', 'Les zones doivent être placées à l\'intérieur d\'une pièce !')
      return
    }

    const newId = crypto.randomUUID()
    this.scene.events.emit('ZONE_ADD', {
      id: newId,
      registryId: toolId as any,
      gx,
      gy,
      direction: this.currentDirection,
      properties: {}
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

  private drawGhost(pointer: Phaser.Input.Pointer) {
    const interaction = this.scene.getInteractionState()
    const layout = this.scene.getLayout()
    this.ghostGraphics.clear()
    const toolId = interaction.toolId as FurnitureId
    const def = FURNITURE_REGISTRY[toolId]
    if (!def) return

    const gx = Math.floor(pointer.worldX / GRID_SIZE)
    const gy = Math.floor(pointer.worldY / GRID_SIZE)
    const x = gx * GRID_SIZE
    const y = gy * GRID_SIZE

    const isValid = isPointInsideAnyRoom(gx, gy, layout.rooms)

    this.ghostGraphics.setPosition(x, y)
    if (def.drawBody) {
      def.drawBody(this.graphics, GRID_SIZE, GRID_SIZE, false, isValid, true)
    }
  }

  // Helper pour accéder aux graphismes si besoin
  private get graphics() {
    return this.ghostGraphics
  }
}
