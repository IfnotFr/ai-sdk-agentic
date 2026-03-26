import type Phaser from 'phaser'
import { BaseTool } from '../BaseTool'
import { GridSystem } from '../GridSystem'
import { FURNITURE_REGISTRY, type FurnitureId } from '~/utils/furniture'
import { GRID_SIZE } from '~/utils/grid'
import type { MainScene } from '~/game/scenes/MainScene'

export class FurnitureTool extends BaseTool {
  private gridSystem = new GridSystem()
  private ghostGraphics: Phaser.GameObjects.Graphics
  private currentDirection = 0 // 0: N, 1: E, 2: S, 3: W

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

    const isHorizontal = this.currentDirection === 1 || this.currentDirection === 3
    const w = isHorizontal ? def.h : def.w
    const h = isHorizontal ? def.w : def.h

    if (!this.isInsideRoom(gx, gy, w, h)) {
      this.scene.events.emit('ERROR', 'Le mobilier doit être placé à l\'intérieur d\'une pièce !')
      return
    }

    if (!this.isPositionFree(gx, gy, w, h)) {
      this.scene.events.emit('ERROR', 'Cet emplacement est déjà occupé par un autre meuble !')
      return
    }

    const newId = crypto.randomUUID()
    this.scene.events.emit('FURNITURE_ADD', {
      id: newId,
      registryId: toolId,
      type: def.type,
      gx, gy, w, h,
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

  override onWheel(_pointer: Phaser.Input.Pointer, deltaY: number) {
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

  private isInsideRoom(gx: number, gy: number, w: number, h: number): boolean {
    const layout = this.scene.getLayout()
    const x = gx * GRID_SIZE
    const y = gy * GRID_SIZE
    const pw = w * GRID_SIZE
    const ph = h * GRID_SIZE
    return layout.rooms.some(room => {
      return x >= room.x && y >= room.y && x + pw <= room.x + room.w && y + ph <= room.y + room.h
    })
  }

  private isPositionFree(gx: number, gy: number, w: number, h: number): boolean {
    const layout = this.scene.getLayout()
    return !layout.items.some(item => {
      return gx < item.gx + item.w && gx + w > item.gx && gy < item.gy + item.h && gy + h > item.gy
    })
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

    const isHorizontal = this.currentDirection === 1 || this.currentDirection === 3
    const w = isHorizontal ? def.h : def.w
    const h = isHorizontal ? def.w : def.h
    
    const pw = w * GRID_SIZE
    const ph = h * GRID_SIZE

    const isValid = this.isInsideRoom(gx, gy, w, h) && this.isPositionFree(gx, gy, w, h)

    this.ghostGraphics.setPosition(x, y)

    if (def.drawBody) {
      def.drawBody(this.ghostGraphics, pw, ph, false, isValid, true)
    }
    if (def.drawDetail) {
      def.drawDetail(this.ghostGraphics, pw, ph, this.currentDirection)
    }
  }
}
