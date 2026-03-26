import Phaser from 'phaser'
import type { IZone } from '~/types/office'
import { GRID_SIZE } from '~/utils/grid'
import { FURNITURE_REGISTRY, type FurnitureId } from '~/utils/furniture'
import type { MainScene } from '~/game/scenes/MainScene'

export class ZoneObject extends Phaser.GameObjects.Container {
  public zone: IZone
  private graphics!: Phaser.GameObjects.Graphics
  private isDragging = false
  private dragOffset = { x: 0, y: 0 }

  constructor(public override scene: MainScene, zone: IZone) {
    super(scene, zone.gx * GRID_SIZE, zone.gy * GRID_SIZE)
    this.zone = zone
    
    this.createVisuals()
    this.updateVisuals(zone)
    
    this.setInteractive(new Phaser.Geom.Rectangle(0, 0, GRID_SIZE, GRID_SIZE), Phaser.Geom.Rectangle.Contains)
    this.on('pointerdown', this.onPointerDown, this)
    
    scene.add.existing(this)
    this.setDepth(0.5) // Juste au dessus du sol des pièces (0), sous les meubles (1)
  }

  override destroy(fromScene?: boolean) {
    this.scene.input.off('pointermove', this.onPointerMove, this)
    this.scene.input.off('pointerup', this.onPointerUp, this)
    super.destroy(fromScene)
  }

  updateVisuals(zone?: IZone) {
    if (!this.scene || !this.scene.getLayout) return
    const layout = this.scene.getLayout()
    const interaction = this.scene.getInteractionState()

    const storeItem = layout.zones.find(z => z.id === (zone?.id || this.zone.id))
    if (storeItem) {
      this.zone = { ...storeItem }
    }

    const isSelected = interaction.selectedId === this.zone.id
    const def = FURNITURE_REGISTRY[this.zone.registryId as FurnitureId]
    
    if (!def) return

    this.graphics.clear()
    if (def.drawBody) {
      def.drawBody(this.graphics, GRID_SIZE, GRID_SIZE, isSelected, true)
    }

    if (!this.isDragging) {
      this.setPosition(this.zone.gx * GRID_SIZE, this.zone.gy * GRID_SIZE)
    }
  }

  private createVisuals() {
    this.graphics = this.scene.add.graphics()
    this.add(this.graphics)
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    const interaction = this.scene.getInteractionState()
    if (interaction.category !== 'zones' || interaction.toolId) return
    
    // On ne stoppe la propagation que si on traite vraiment le clic
    pointer.event.stopPropagation()

    this.scene.events.emit('ENTITY_SELECT', this.zone.id, 'furniture')
    
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

    if (newGx !== this.zone.gx || newGy !== this.zone.gy) {
      this.scene.events.emit('ZONE_MOVE', this.zone.id, newGx, newGy)
      this.zone.gx = newGx
      this.zone.gy = newGy
      this.setPosition(newGx * GRID_SIZE, newGy * GRID_SIZE)
      this.updateVisuals()
    }
  }

  private onPointerUp() {
    this.isDragging = false
    this.scene.input.off('pointermove', this.onPointerMove, this)
    this.scene.input.off('pointerup', this.onPointerUp, this)
    this.updateVisuals()
  }
}
