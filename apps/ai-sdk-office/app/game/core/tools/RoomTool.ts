import type Phaser from 'phaser'
import { BaseTool } from '../BaseTool'
import { GridSystem } from '../GridSystem'
import { validateRoom } from '~/utils/room-validation'
import { GRID_SIZE } from '~/utils/grid'
import { ROOM_COLOR, WALL_COLOR } from '~/utils/furniture'
import type { MainScene } from '~/game/scenes/MainScene'

export class RoomTool extends BaseTool {
  private gridSystem = new GridSystem()
  private dragGraphics: Phaser.GameObjects.Graphics
  private dragStartGrid: { x: number, y: number } | null = null

  constructor(protected override scene: MainScene) {
    super(scene)
    this.dragGraphics = scene.add.graphics()
    this.dragGraphics.setDepth(10)
  }

  onPointerDown(pointer: Phaser.Input.Pointer) {
    const gx = Math.floor(pointer.worldX / GRID_SIZE)
    const gy = Math.floor(pointer.worldY / GRID_SIZE)
    this.dragStartGrid = { x: gx, y: gy }
  }

  onPointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.dragStartGrid) return

    const gx = Math.floor(pointer.worldX / GRID_SIZE)
    const gy = Math.floor(pointer.worldY / GRID_SIZE)

    const x = Math.min(this.dragStartGrid.x, gx) * GRID_SIZE
    const y = Math.min(this.dragStartGrid.y, gy) * GRID_SIZE
    const w = (Math.abs(gx - this.dragStartGrid.x) + 1) * GRID_SIZE
    const h = (Math.abs(gy - this.dragStartGrid.y) + 1) * GRID_SIZE

    const layout = this.scene.getLayout()
    const { valid } = validateRoom(null, { x, y, w, h }, layout.rooms, [], [])
    
    const strokeColor = valid ? WALL_COLOR : 0xef4444
    const fillColor = valid ? ROOM_COLOR : 0xef4444

    this.dragGraphics.clear()
    this.dragGraphics.fillStyle(fillColor, 0.05)
    this.dragGraphics.lineStyle(3, strokeColor, 0.4)
    this.dragGraphics.fillRect(x, y, w, h)
    this.dragGraphics.strokeRect(x, y, w, h)
  }

  onPointerUp(pointer: Phaser.Input.Pointer) {
    if (!this.dragStartGrid) return

    const gx = Math.floor(pointer.worldX / GRID_SIZE)
    const gy = Math.floor(pointer.worldY / GRID_SIZE)

    const x = Math.min(this.dragStartGrid.x, gx) * GRID_SIZE
    const y = Math.min(this.dragStartGrid.y, gy) * GRID_SIZE
    const w = (Math.abs(gx - this.dragStartGrid.x) + 1) * GRID_SIZE
    const h = (Math.abs(gy - this.dragStartGrid.y) + 1) * GRID_SIZE

    if (w > 0 && h > 0) {
      const layout = this.scene.getLayout()
      if (w <= GRID_SIZE && h <= GRID_SIZE) {
        const roomAtPos = layout.rooms.find(r => 
          x >= r.x && x < r.x + r.w && 
          y >= r.y && y < r.y + r.h
        )
        if (roomAtPos) {
          this.scene.events.emit('ENTITY_SELECT', roomAtPos.id, 'room')
        }
      } else {
        const result = validateRoom(null, { x, y, w, h }, layout.rooms, [], [])
        if (!result.valid) {
          this.scene.events.emit('ERROR', result.reason || 'Placement invalide')
        } else {
          const newId = crypto.randomUUID()
          this.scene.events.emit('ROOM_ADD', {
            id: newId,
            x, y, w, h,
            color: '#e2e8f0'
          })

          if (!pointer.event.shiftKey) {
            this.scene.events.emit('TOOL_DESELECT')
            this.scene.events.emit('ENTITY_SELECT', newId, 'room')
          }
        }
      }
    }

    this.dragStartGrid = null
    this.dragGraphics.clear()
  }

  override deactivate() {
    this.dragStartGrid = null
    this.dragGraphics.clear()
  }
}
