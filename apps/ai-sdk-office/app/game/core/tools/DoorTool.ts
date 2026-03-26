import type Phaser from 'phaser'
import { BaseTool } from '../BaseTool'
import { GridSystem } from '../GridSystem'
import { GRID_SIZE } from '~/utils/grid'
import type { MainScene } from '~/game/scenes/MainScene'

interface SnapResult {
  gx: number
  gy: number
  orientation: 'h' | 'v'
  dist: number
}

export class DoorTool extends BaseTool {
  private gridSystem = new GridSystem()
  private ghostGraphics: Phaser.GameObjects.Graphics
  private currentSnap: { gx: number, gy: number, orientation: 'h' | 'v' } | null = null
  private mouseGrid: { gx: number, gy: number } = { gx: 0, gy: 0 }
  private isOnEdge = false
  private existingDoorId: string | null = null

  constructor(protected override scene: MainScene) {
    super(scene)
    this.ghostGraphics = scene.add.graphics()
    this.ghostGraphics.setDepth(10)
  }

  onPointerDown(pointer: Phaser.Input.Pointer) {
    this.updateSnap(pointer)
    
    if (this.existingDoorId) {
      this.scene.events.emit('DOOR_REMOVE', this.existingDoorId)
      return
    }

    if (this.isOnEdge && this.currentSnap) {
      this.scene.events.emit('DOOR_ADD', {
        id: crypto.randomUUID(),
        gx: this.currentSnap.gx,
        gy: this.currentSnap.gy,
        orientation: this.currentSnap.orientation
      })
    } else {
      this.scene.events.emit('ERROR', 'Les portes doivent être placées sur le bord d\'une pièce !')
    }
  }

  onPointerMove(pointer: Phaser.Input.Pointer) {
    this.mouseGrid = {
      gx: Math.floor(pointer.worldX / GRID_SIZE),
      gy: Math.floor(pointer.worldY / GRID_SIZE)
    }
    this.updateSnap(pointer)
    this.drawGhost()
  }

  onPointerUp() {}

  override activate() {
    this.ghostGraphics.setVisible(true)
  }

  override deactivate() {
    this.ghostGraphics.clear()
    this.ghostGraphics.setVisible(false)
    this.currentSnap = null
    this.isOnEdge = false
    this.existingDoorId = null
  }

  private updateSnap(pointer: Phaser.Input.Pointer) {
    const px = pointer.worldX
    const py = pointer.worldY
    const layout = this.scene.getLayout()

    let bestSnap: SnapResult | null = null

    for (const room of layout.rooms) {
      const rgx = Math.floor(room.x / GRID_SIZE)
      const rgy = Math.floor(room.y / GRID_SIZE)
      const rgw = Math.floor(room.w / GRID_SIZE)
      const rgh = Math.floor(room.h / GRID_SIZE)

      const edges = [
        { gx: rgx, gy: py / GRID_SIZE, orientation: 'v' as const, x: room.x, y: py, minGy: rgy, maxGy: rgy + rgh },
        { gx: rgx + rgw, gy: py / GRID_SIZE, orientation: 'v' as const, x: room.x + room.w, y: py, minGy: rgy, maxGy: rgy + rgh },
        { gx: px / GRID_SIZE, gy: rgy, orientation: 'h' as const, x: px, y: room.y, minGx: rgx, maxGx: rgx + rgw },
        { gx: px / GRID_SIZE, gy: rgy + rgh, orientation: 'h' as const, x: px, y: room.y + room.h, minGx: rgx, maxGx: rgx + rgw }
      ]

      for (const edge of edges) {
        if (edge.orientation === 'v') {
          if (edge.gy >= edge.minGy && edge.gy <= edge.maxGy) {
            const dist = Math.abs(px - edge.x)
            if (!bestSnap || dist < bestSnap.dist) {
              bestSnap = { gx: edge.gx, gy: Math.floor(edge.gy), orientation: 'v', dist }
            }
          }
        } else {
          if (edge.gx >= edge.minGx && edge.gx <= edge.maxGx) {
            const dist = Math.abs(py - edge.y)
            if (!bestSnap || dist < bestSnap.dist) {
              bestSnap = { gx: Math.floor(edge.gx), gy: edge.gy, orientation: 'h', dist }
            }
          }
        }
      }
    }

    if (bestSnap && bestSnap.dist < GRID_SIZE) {
      this.currentSnap = { gx: bestSnap.gx, gy: bestSnap.gy, orientation: bestSnap.orientation }
      this.isOnEdge = true
      
      const door = layout.doors.find(d => 
        d.gx === this.currentSnap?.gx && 
        d.gy === this.currentSnap?.gy && 
        d.orientation === this.currentSnap?.orientation
      )
      this.existingDoorId = door ? door.id : null
    } else {
      this.currentSnap = null
      this.isOnEdge = false
      this.existingDoorId = null
    }
  }

  private drawGhost() {
    this.ghostGraphics.clear()
    
    if (this.existingDoorId && this.currentSnap) {
      const x = this.currentSnap.gx * GRID_SIZE
      const y = this.currentSnap.gy * GRID_SIZE
      this.ghostGraphics.lineStyle(4, 0xf97316, 0.8) // Orange
      
      if (this.currentSnap.orientation === 'v') {
        this.ghostGraphics.lineBetween(x, y, x, y + GRID_SIZE)
      } else {
        this.ghostGraphics.lineBetween(x, y, x + GRID_SIZE, y)
      }
      return
    }

    if (this.isOnEdge && this.currentSnap) {
      const x = this.currentSnap.gx * GRID_SIZE
      const y = this.currentSnap.gy * GRID_SIZE
      this.ghostGraphics.lineStyle(4, 0x3b82f6, 0.6) // Blue
      
      if (this.currentSnap.orientation === 'v') {
        this.ghostGraphics.lineBetween(x, y, x, y + GRID_SIZE)
      } else {
        this.graphics.lineBetween(x, y, x + GRID_SIZE, y)
      }
    } else {
      const x = this.mouseGrid.gx * GRID_SIZE
      const y = this.mouseGrid.gy * GRID_SIZE
      this.ghostGraphics.lineStyle(4, 0xef4444, 0.4) // Red
      this.ghostGraphics.lineBetween(x, y, x, y + GRID_SIZE)
    }
  }

  private get graphics() {
    return this.ghostGraphics
  }
}
