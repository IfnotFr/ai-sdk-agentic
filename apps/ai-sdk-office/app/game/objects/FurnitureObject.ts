import Phaser from 'phaser'
import type { IFurniture, IEquipment } from '~/types/office'
import { GRID_SIZE } from '~/utils/grid'
import { FURNITURE_REGISTRY, type FurnitureId } from '~/utils/furniture'
import type { MainScene } from '~/game/scenes/MainScene'

export class FurnitureObject extends Phaser.GameObjects.Container {
  public furniture: IFurniture
  private bodyGraphics!: Phaser.GameObjects.Graphics
  private detailGraphics!: Phaser.GameObjects.Graphics
  private isDragging = false
  private dragOffset = { x: 0, y: 0 }

  constructor(public override scene: MainScene, furniture: IFurniture) {
    super(scene, furniture.gx * GRID_SIZE, furniture.gy * GRID_SIZE)
    this.furniture = furniture
    
    this.createVisuals()
    this.updateVisuals(furniture)
    
    this.setInteractive(new Phaser.Geom.Rectangle(0, 0, furniture.w * GRID_SIZE, furniture.h * GRID_SIZE), Phaser.Geom.Rectangle.Contains)
    this.on('pointerdown', this.onPointerDown, this)
    
    scene.add.existing(this)
    this.setDepth(1)
  }

  override destroy(fromScene?: boolean) {
    this.scene.input.off('pointermove', this.onPointerMove, this)
    this.scene.input.off('pointerup', this.onPointerUp, this)
    super.destroy(fromScene)
  }

  updateVisuals(furniture?: IFurniture) {
    if (!this.scene || !this.scene.getLayout) return
    const layout = this.scene.getLayout()
    const interaction = this.scene.getInteractionState()

    const storeItem = layout.items.find(i => i.id === (furniture?.id || this.furniture.id))
    if (storeItem) {
      this.furniture = { ...storeItem }
    }

    const isSelected = interaction.selectedId === this.furniture.id
    const def = FURNITURE_REGISTRY[this.furniture.registryId as FurnitureId]
    
    if (!def) return

    this.bodyGraphics.clear()
    this.detailGraphics.clear()

    const pw = this.furniture.w * GRID_SIZE
    const ph = this.furniture.h * GRID_SIZE

    if (def.drawBody) {
      def.drawBody(this.bodyGraphics, pw, ph, isSelected, true)
    }
    if (def.drawDetail) {
      def.drawDetail(this.detailGraphics, pw, ph, this.furniture.direction)
    }

    if (!this.isDragging) {
      this.setPosition(this.furniture.gx * GRID_SIZE, this.furniture.gy * GRID_SIZE)
    }
    
    this.input?.hitArea.setSize(pw, ph)
  }

  private createVisuals() {
    this.bodyGraphics = this.scene.add.graphics()
    this.detailGraphics = this.scene.add.graphics()
    this.add([this.bodyGraphics, this.detailGraphics])
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    const interaction = this.scene.getInteractionState()
    if (interaction.category !== 'interior' || interaction.toolId) return
    
    // On ne stoppe la propagation que si on traite vraiment le clic
    pointer.event.stopPropagation()

    this.scene.events.emit('ENTITY_SELECT', this.furniture.id, 'furniture')
    
    this.isDragging = true
    this.dragOffset.x = pointer.x - this.x
    this.dragOffset.y = pointer.y - this.y
    
    this.scene.input.on('pointermove', this.onPointerMove, this)
    this.scene.input.on('pointerup', this.onPointerUp, this)
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.isDragging) return

    const newGx = Math.floor((pointer.x - this.dragOffset.x) / GRID_SIZE)
    const newGy = Math.floor((pointer.y - this.dragOffset.y) / GRID_SIZE)

    if (newGx !== this.furniture.gx || newGy !== this.furniture.gy) {
      // Validation simple : doit rester dans une pièce
      const layout = this.scene.getLayout()
      const x = newGx * GRID_SIZE
      const y = newGy * GRID_SIZE
      const pw = this.furniture.w * GRID_SIZE
      const ph = this.furniture.h * GRID_SIZE
      
      const inRoom = layout.rooms.some(r => x >= r.x && y >= r.y && x + pw <= r.x + r.w && y + ph <= r.y + r.h)
      const isFree = !layout.items.some(i => i.id !== this.furniture.id && newGx < i.gx + i.w && newGx + this.furniture.w > i.gx && newGy < i.gy + i.h && newGy + this.furniture.h > i.gy)

      if (inRoom && isFree) {
        this.scene.events.emit('FURNITURE_MOVE', this.furniture.id, newGx, newGy)
        this.furniture.gx = newGx
        this.furniture.gy = newGy
        this.setPosition(newGx * GRID_SIZE, newGy * GRID_SIZE)
        this.updateVisuals()
      }
    }
  }

  private onPointerUp() {
    this.isDragging = false
    this.scene.input.off('pointermove', this.onPointerMove, this)
    this.scene.input.off('pointerup', this.onPointerUp, this)
    this.updateVisuals()
  }
}
