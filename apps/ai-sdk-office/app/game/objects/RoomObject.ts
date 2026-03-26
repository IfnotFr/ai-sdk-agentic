import Phaser from 'phaser'
import type { IRoom, IDoor, IFurniture } from '~/types/office'
import { validateRoom, isFurnitureInside, isDoorOnEdge } from '~/utils/room-validation'
import { GRID_SIZE } from '~/utils/grid'
import { ROOM_COLOR, WALL_COLOR } from '~/utils/furniture'
import type { MainScene } from '~/game/scenes/MainScene'

type ResizeType = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se' | null

export class RoomObject extends Phaser.GameObjects.Container {
  public room: IRoom // Publique pour l'EntityManager
  private rect!: Phaser.GameObjects.Rectangle
  private nameLabel!: Phaser.GameObjects.Container
  private nameText!: Phaser.GameObjects.Text
  private nameBg!: Phaser.GameObjects.Rectangle
  private handlesContainer!: Phaser.GameObjects.Container
  
  private isDragging = false
  private activeResize: ResizeType = null
  private dragOffset = { x: 0, y: 0 }
  private initialRoomState!: IRoom
  
  private capturedFurniture: IFurniture[] = []
  private capturedDoors: IDoor[] = []

  constructor(public override scene: MainScene, room: IRoom) {
    super(scene, room.x, room.y)
    this.room = room
    
    this.createVisuals()
    this.setInteractive(new Phaser.Geom.Rectangle(0, 0, room.w, room.h), Phaser.Geom.Rectangle.Contains)
    
    this.on('pointerdown', this.onPointerDown, this)

    scene.add.existing(this)
    this.setDepth(0)
  }

  override destroy(fromScene?: boolean) {
    this.scene.input.off('pointermove', this.onPointerMove, this)
    this.scene.input.off('pointerup', this.onPointerUp, this)
    super.destroy(fromScene)
  }

  private createVisuals() {
    // Room background
    this.rect = this.scene.add.rectangle(this.room.w / 2, this.room.h / 2, this.room.w, this.room.h, ROOM_COLOR, 0.05)
    this.add(this.rect)

    // Name Label
    this.nameLabel = this.scene.add.container(0, 0)
    this.nameBg = this.scene.add.rectangle(0, 0, 0, 0, WALL_COLOR, 1)
    this.nameText = this.scene.add.text(0, 0, '', {
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold',
      padding: { x: 6, y: 3 }
    }).setOrigin(0.5)
    
    this.nameLabel.add([this.nameBg, this.nameText])
    this.add(this.nameLabel)

    // Handles
    this.handlesContainer = this.scene.add.container(0, 0)
    this.handlesContainer.setDepth(1)
    this.add(this.handlesContainer)
    
    this.updateVisuals()
  }

  private createHandle(x: number, y: number, type: ResizeType) {
    const size = 12
    const handle = this.scene.add.rectangle(x, y, size, size, 0xffffff)
    handle.setStrokeStyle(1.5, 0x3b82f6)
    handle.setInteractive({ useHandCursor: true })
    handle.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation()
      this.startResize(type, pointer)
    })
    this.handlesContainer.add(handle)
  }

  updateVisuals() {
    if (!this.scene || !this.scene.getLayout) return
    const layout = this.scene.getLayout()
    const interaction = this.scene.getInteractionState()

    const storeRoom = layout.rooms.find(r => r.id === this.room.id)
    if (storeRoom && !this.isDragging && !this.activeResize) {
      this.room = { ...storeRoom }
      this.setPosition(this.room.x, this.room.y)
    } else if (storeRoom) {
      // Sync only data properties, keep local position during drag/resize
      this.room.name = storeRoom.name
      this.room.color = storeRoom.color
    }

    const isSelected = interaction.selectedId === this.room.id
    
    this.rect.setSize(this.room.w, this.room.h)
    this.rect.setPosition(this.room.w / 2, this.room.h / 2)
    
    // Stroke uses WALL_COLOR (Slate-400), Fill uses ROOM_COLOR (Slate-200)
    this.rect.setStrokeStyle(3, WALL_COLOR, 0.8)
    this.rect.setFillStyle(ROOM_COLOR, isSelected ? 0.2 : 0.1)
    
    this.input?.hitArea.setSize(this.room.w, this.room.h)

    // Update Name Label
    const hasName = !!this.room.name
    this.nameLabel.setVisible(hasName)
    if (hasName && this.room.name) {
      this.nameText.setText(this.room.name.toUpperCase())
      const tw = this.nameText.width
      const th = this.nameText.height
      this.nameBg.setSize(tw, th)
      this.nameBg.setFillStyle(WALL_COLOR, 1)
      
      // Snap to top-left inside room
      this.nameLabel.setPosition(tw / 2 + 4, th / 2 + 4)
    }
    
    this.handlesContainer.removeAll(true)
    if (isSelected && !this.isDragging && !this.activeResize) {
      const w = this.room.w
      const h = this.room.h
      this.createHandle(0, 0, 'nw')
      this.createHandle(w, 0, 'ne')
      this.createHandle(0, h, 'sw')
      this.createHandle(w, h, 'se')
      this.createHandle(w / 2, 0, 'n')
      this.createHandle(w / 2, h, 's')
      this.createHandle(0, h / 2, 'w')
      this.createHandle(w, h / 2, 'e')
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    const interaction = this.scene.getInteractionState()
    if (interaction.category !== 'structure' || interaction.toolId) return
    pointer.event.stopPropagation()
    
    // Select immediately on down
    this.scene.events.emit('ENTITY_SELECT', this.room.id, 'room')
    
    this.isDragging = true
    this.dragOffset.x = pointer.x - this.x
    this.dragOffset.y = pointer.y - this.y
    this.captureContent()
    this.updateVisuals()
    this.scene.input.on('pointermove', this.onPointerMove, this)
    this.scene.input.on('pointerup', this.onPointerUp, this)
  }

  private startResize(type: ResizeType, pointer: Phaser.Input.Pointer) {
    this.activeResize = type
    this.isDragging = false
    this.initialRoomState = { ...this.room }
    this.dragOffset.x = pointer.x
    this.dragOffset.y = pointer.y
    this.captureContent()
    this.updateVisuals()
    this.scene.input.on('pointermove', this.onPointerMove, this)
    this.scene.input.on('pointerup', this.onPointerUp, this)
  }

  private captureContent() {
    const layout = this.scene.getLayout()
    this.capturedFurniture = layout.items.filter(item => isFurnitureInside(item, this.room))
    this.capturedDoors = layout.doors.filter(door => isDoorOnEdge(door, this.room))
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    const layout = this.scene.getLayout()
    if (this.isDragging) {
      const newX = Math.round((pointer.x - this.dragOffset.x) / GRID_SIZE) * GRID_SIZE
      const newY = Math.round((pointer.y - this.dragOffset.y) / GRID_SIZE) * GRID_SIZE
      
      const dx = (newX - this.room.x)
      const dy = (newY - this.room.y)
      
      if (dx === 0 && dy === 0) return
      
      const result = validateRoom(this.room.id, { ...this.room, x: newX, y: newY }, layout.rooms, [], [])
      if (result.valid) {
        // Le store s'occupe maintenant de calculer les enfants à déplacer via OfficeService
        this.scene.events.emit('ROOM_MOVE', this.room.id, dx, dy)
        
        // On met à jour la position locale immédiatement pour la fluidité
        this.room.x = newX
        this.room.y = newY
        this.setPosition(newX, newY)
        this.updateVisuals()
      }
    } else if (this.activeResize) {
      const dx = Math.round((pointer.x - this.dragOffset.x) / GRID_SIZE) * GRID_SIZE
      const dy = Math.round((pointer.y - this.dragOffset.y) / GRID_SIZE) * GRID_SIZE
      if (dx === 0 && dy === 0) return
      
      let newX = this.initialRoomState.x
      let newY = this.initialRoomState.y
      let newW = this.initialRoomState.w
      let newH = this.initialRoomState.h
      if (this.activeResize?.includes('e')) newW += dx
      if (this.activeResize?.includes('s')) newH += dy
      if (this.activeResize?.includes('w')) { newX += dx; newW -= dx }
      if (this.activeResize?.includes('n')) { newY += dy; newH -= dy }
      if (newW < GRID_SIZE || newH < GRID_SIZE) return
      
      const result = validateRoom(this.room.id, { x: newX, y: newY, w: newW, h: newH }, layout.rooms, this.capturedFurniture, this.capturedDoors)
      if (result.valid) {
        this.scene.events.emit('ROOM_UPDATE', this.room.id, { x: newX, y: newY, w: newW, h: newH })
        
        // Mise à jour locale pour le feedback fluide
        this.room.x = newX
        this.room.y = newY
        this.room.w = newW
        this.room.h = newH
        this.setPosition(newX, newY)
        this.updateVisuals()
      }
    }
  }

  private onPointerUp() {
    this.isDragging = false
    this.activeResize = null
    this.capturedFurniture = []
    this.capturedDoors = []
    this.scene.input.off('pointermove', this.onPointerMove, this)
    this.scene.input.off('pointerup', this.onPointerUp, this)
    this.updateVisuals()
  }
}
