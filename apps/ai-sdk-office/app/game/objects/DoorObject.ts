import Phaser from 'phaser'
import type { IDoor } from '~/types/office'
import { GRID_SIZE } from '~/utils/grid'
import type { MainScene } from '~/game/scenes/MainScene'

export class DoorObject extends Phaser.GameObjects.Container {
  public door: IDoor
  private graphics!: Phaser.GameObjects.Graphics

  constructor(public override scene: MainScene, door: IDoor) {
    super(scene, door.gx * GRID_SIZE, door.gy * GRID_SIZE)
    this.door = door
    
    this.createVisuals()
    this.updateVisuals()
    
    this.setInteractive(new Phaser.Geom.Rectangle(0, 0, GRID_SIZE, GRID_SIZE), Phaser.Geom.Rectangle.Contains)
    this.on('pointerdown', this.onPointerDown, this)
    
    scene.add.existing(this)
    this.setDepth(3) // Devant tout
  }

  updateVisuals() {
    if (!this.scene || !this.scene.getLayout) return
    const layout = this.scene.getLayout()
    const interaction = this.scene.getInteractionState()

    const storeDoor = layout.doors.find(d => d.id === this.door.id)
    if (storeDoor) {
      this.door = { ...storeDoor }
      this.setPosition(this.door.gx * GRID_SIZE, this.door.gy * GRID_SIZE)
    }

    const isSelected = interaction.selectedId === this.door.id

    this.graphics.clear()
    this.graphics.lineStyle(4, isSelected ? 0x2563eb : 0x3b82f6, 1)
    
    if (this.door.orientation === 'v') {
      this.graphics.lineBetween(0, 0, 0, GRID_SIZE)
    } else {
      this.graphics.lineBetween(0, 0, GRID_SIZE, 0)
    }
  }

  private createVisuals() {
    this.graphics = this.scene.add.graphics()
    this.add(this.graphics)
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    const interaction = this.scene.getInteractionState()
    if (interaction.category !== 'structure' || interaction.toolId) return
    pointer.event.stopPropagation()

    this.scene.events.emit('ENTITY_SELECT', this.door.id, 'door')
    this.updateVisuals()
  }
}
