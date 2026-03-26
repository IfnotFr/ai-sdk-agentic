import Phaser from 'phaser'
import type { IEquipment } from '~/types/office'
import { GRID_SIZE } from '~/utils/grid'
import { FURNITURE_REGISTRY, type FurnitureId } from '~/utils/furniture'
import type { MainScene } from '~/game/scenes/MainScene'

export class EquipmentObject extends Phaser.GameObjects.Container {
  public equipment: IEquipment
  private bodyGraphics!: Phaser.GameObjects.Graphics
  private detailGraphics!: Phaser.GameObjects.Graphics
  private isDragging = false
  private dragOffset = { x: 0, y: 0 }

  constructor(public override scene: MainScene, equipment: IEquipment) {
    super(scene, equipment.gx * GRID_SIZE, equipment.gy * GRID_SIZE)
    this.equipment = equipment
    
    this.createVisuals()
    this.updateVisuals(equipment)
    
    this.setInteractive(new Phaser.Geom.Rectangle(0, 0, GRID_SIZE, GRID_SIZE), Phaser.Geom.Rectangle.Contains)
    this.on('pointerdown', this.onPointerDown, this)
    
    scene.add.existing(this)
    this.setDepth(2)
  }

  override destroy(fromScene?: boolean) {
    this.scene.input.off('pointermove', this.onPointerMove, this)
    this.scene.input.off('pointerup', this.onPointerUp, this)
    super.destroy(fromScene)
  }

  updateVisuals(equipment?: IEquipment) {
    if (!this.scene || !this.scene.getLayout) return
    const layout = this.scene.getLayout()
    const interaction = this.scene.getInteractionState()

    const storeItem = layout.equipments.find(e => e.id === (equipment?.id || this.equipment.id))
    if (storeItem) {
      this.equipment = { ...storeItem }
    }

    const isSelected = interaction.selectedId === this.equipment.id
    const def = FURNITURE_REGISTRY[this.equipment.registryId as FurnitureId]
    
    if (!def) return

    this.bodyGraphics.clear()
    this.detailGraphics.clear()

    if (def.drawBody) {
      def.drawBody(this.bodyGraphics, GRID_SIZE, GRID_SIZE, isSelected, true)
    }
    if (def.drawDetail) {
      def.drawDetail(this.detailGraphics, GRID_SIZE, GRID_SIZE, this.equipment.direction)
    }

    if (!this.isDragging) {
      this.setPosition(this.equipment.gx * GRID_SIZE, this.equipment.gy * GRID_SIZE)
    }
  }

  private createVisuals() {
    this.bodyGraphics = this.scene.add.graphics()
    this.detailGraphics = this.scene.add.graphics()
    this.add([this.bodyGraphics, this.detailGraphics])
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    const interaction = this.scene.getInteractionState()
    if (interaction.category !== 'equipment' || interaction.toolId) return
    
    // On ne stoppe la propagation que si on traite vraiment le clic
    pointer.event.stopPropagation()

    this.scene.events.emit('ENTITY_SELECT', this.equipment.id, 'furniture')
    
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

    if (newGx !== this.equipment.gx || newGy !== this.equipment.gy) {
      const layout = this.scene.getLayout()
      
      // Doit être sur un support
      const parent = layout.items.find(item => {
        const def = FURNITURE_REGISTRY[item.registryId as FurnitureId]
        if (!def?.canSupport) return false
        return (
          newGx >= item.gx && newGx < item.gx + item.w &&
          newGy >= item.gy && newGy < item.gy + item.h
        )
      })

      const isFree = !layout.equipments.some(e => e.id !== this.equipment.id && e.gx === newGx && e.gy === newGy)

      if (parent && isFree) {
        this.scene.events.emit('EQUIPMENT_MOVE', this.equipment.id, newGx, newGy, parent.id)
        this.equipment.gx = newGx
        this.equipment.gy = newGy
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
