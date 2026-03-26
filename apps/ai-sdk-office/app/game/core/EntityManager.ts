import type { MainScene } from '~/game/scenes/MainScene'
import { RoomObject } from '~/game/objects/RoomObject'
import { FurnitureObject } from '~/game/objects/FurnitureObject'
import { EquipmentObject } from '~/game/objects/EquipmentObject'
import { ZoneObject } from '~/game/objects/ZoneObject'
import { DoorObject } from '~/game/objects/DoorObject'
import { GRID_SIZE } from '~/utils/grid'
import { useEditorStore } from '~/stores/useEditor'
import type { OfficeLayout, IRoom, IFurniture, IEquipment, IZone, IDoor } from '~/types/office'

export class EntityManager {
  private roomObjects: Map<string, RoomObject> = new Map()
  private furnitureObjects: Map<string, FurnitureObject> = new Map()
  private equipmentObjects: Map<string, EquipmentObject> = new Map()
  private zoneObjects: Map<string, ZoneObject> = new Map()
  private doorObjects: Map<string, DoorObject> = new Map()
  private editorStore: ReturnType<typeof useEditorStore>

  constructor(private scene: MainScene) {
    this.editorStore = useEditorStore()
  }

  syncAll(layout: OfficeLayout) {
    this.syncRooms(layout.rooms)
    this.syncFurniture(layout.items)
    this.syncEquipments(layout.equipments)
    this.syncZones(layout.zones)
    this.syncDoors(layout.doors)
  }

  updateAllVisuals(layout: OfficeLayout, selectedEntityId: string | null) {
    this.roomObjects.forEach(obj => obj.updateVisuals())
    this.furnitureObjects.forEach((obj, id) => {
      const data = layout.items.find(i => i.id === id)
      if (data) obj.updateVisuals(data)
    })
    this.equipmentObjects.forEach((obj, id) => {
      const data = layout.equipments.find(e => e.id === id)
      if (data) obj.updateVisuals(data)
    })
    this.zoneObjects.forEach((obj, id) => {
      const data = layout.zones.find(z => z.id === id)
      if (data) obj.updateVisuals(data)
    })
    this.doorObjects.forEach(obj => obj.updateVisuals())

    // Gestion du menu flottant (HTML Bridge)
    if (!selectedEntityId) {
      this.editorStore.updateMenuPosition(0, 0, false)
      return
    }

    let target: Phaser.GameObjects.Container | null = null
    let bounds = { w: 0, h: 0 }

    const room = this.roomObjects.get(selectedEntityId)
    if (room) {
      target = room
      bounds = { w: (room as any).room.w, h: (room as any).room.h }
    } else {
      const furniture = this.furnitureObjects.get(selectedEntityId)
      if (furniture) {
        target = furniture
        const data = layout.items.find(i => i.id === selectedEntityId)
        bounds = { w: (data?.w || 1) * GRID_SIZE, h: (data?.h || 1) * GRID_SIZE }
      } else {
        const door = this.doorObjects.get(selectedEntityId)
        if (door) {
          target = door
          bounds = { w: GRID_SIZE, h: GRID_SIZE }
        } else {
          const eq = this.equipmentObjects.get(selectedEntityId)
          if (eq) {
            target = eq
            bounds = { w: GRID_SIZE, h: GRID_SIZE }
          } else {
            const zone = this.zoneObjects.get(selectedEntityId)
            if (zone) {
              target = zone
              bounds = { w: GRID_SIZE, h: GRID_SIZE }
            }
          }
        }
      }
    }

    if (target) {
      // Calculer la position écran (Monde - Caméra)
      const cam = this.scene.cameras.main
      const screenX = target.x - cam.scrollX
      const screenY = target.y - cam.scrollY
      
      // Placer en haut à gauche avec 4px de marge gauche et 4px au dessus de l'objet (32px menu + 4px)
      this.editorStore.updateMenuPosition(screenX + 4, screenY - 36, true)
    } else {
      this.editorStore.updateMenuPosition(0, 0, false)
    }
  }

  private syncRooms(rooms: OfficeLayout['rooms']) {
    const currentIds = new Set(rooms.map(r => r.id))
    for (const [id, obj] of this.roomObjects) {
      if (!currentIds.has(id)) {
        obj.destroy()
        this.roomObjects.delete(id)
      }
    }
    rooms.forEach((room) => {
      if (!this.roomObjects.has(room.id)) {
        this.roomObjects.set(room.id, new RoomObject(this.scene, room))
      } else {
        this.roomObjects.get(room.id)?.updateVisuals()
      }
    })
  }

  private syncFurniture(items: OfficeLayout['items']) {
    const currentIds = new Set(items.map(i => i.id))
    for (const [id, obj] of this.furnitureObjects) {
      if (!currentIds.has(id)) {
        obj.destroy()
        this.furnitureObjects.delete(id)
      }
    }
    items.forEach((item) => {
      const obj = this.furnitureObjects.get(item.id)
      if (!obj) {
        this.furnitureObjects.set(item.id, new FurnitureObject(this.scene, item))
      } else {
        obj.updateVisuals(item)
      }
    })
  }

  private syncEquipments(equipments: OfficeLayout['equipments']) {
    const currentIds = new Set(equipments.map(e => e.id))
    for (const [id, obj] of this.equipmentObjects) {
      if (!currentIds.has(id)) {
        obj.destroy()
        this.equipmentObjects.delete(id)
      }
    }
    equipments.forEach((eq) => {
      const obj = this.equipmentObjects.get(eq.id)
      if (!obj) {
        this.equipmentObjects.set(eq.id, new EquipmentObject(this.scene, eq))
      } else {
        obj.updateVisuals(eq)
      }
    })
  }

  private syncZones(zones: OfficeLayout['zones']) {
    const currentIds = new Set(zones.map(z => z.id))
    for (const [id, obj] of this.zoneObjects) {
      if (!currentIds.has(id)) {
        obj.destroy()
        this.zoneObjects.delete(id)
      }
    }
    zones.forEach((zone) => {
      const obj = this.zoneObjects.get(zone.id)
      if (!obj) {
        this.zoneObjects.set(zone.id, new ZoneObject(this.scene, zone))
      } else {
        obj.updateVisuals(zone)
      }
    })
  }

  syncDoors(doors: OfficeLayout['doors']) {
    const currentIds = new Set(doors.map(d => d.id))
    for (const [id, obj] of this.doorObjects) {
      if (!currentIds.has(id)) {
        obj.destroy()
        this.doorObjects.delete(id)
      }
    }
    doors.forEach((door) => {
      this.upsertDoor(door)
    })
  }

  upsertRoom(room: IRoom) {
    let obj = this.roomObjects.get(room.id)
    if (!obj) {
      obj = new RoomObject(this.scene, room)
      this.roomObjects.set(room.id, obj)
    } else {
      obj.updateVisuals()
    }
  }

  removeRoom(id: string) {
    const obj = this.roomObjects.get(id)
    if (obj) {
      obj.destroy()
      this.roomObjects.delete(id)
    }
  }

  upsertFurniture(item: IFurniture) {
    let obj = this.furnitureObjects.get(item.id)
    if (!obj) {
      obj = new FurnitureObject(this.scene, item)
      this.furnitureObjects.set(item.id, obj)
    } else {
      obj.updateVisuals(item)
    }
  }

  removeFurniture(id: string) {
    const obj = this.furnitureObjects.get(id)
    if (obj) {
      obj.destroy()
      this.furnitureObjects.delete(id)
    }
  }

  upsertEquipment(eq: IEquipment) {
    let obj = this.equipmentObjects.get(eq.id)
    if (!obj) {
      obj = new EquipmentObject(this.scene, eq)
      this.equipmentObjects.set(eq.id, obj)
    } else {
      obj.updateVisuals(eq)
    }
  }

  removeEquipment(id: string) {
    const obj = this.equipmentObjects.get(id)
    if (obj) {
      obj.destroy()
      this.equipmentObjects.delete(id)
    }
  }

  upsertZone(zone: IZone) {
    let obj = this.zoneObjects.get(zone.id)
    if (!obj) {
      obj = new ZoneObject(this.scene, zone)
      this.zoneObjects.set(zone.id, obj)
    } else {
      obj.updateVisuals(zone)
    }
  }

  removeZone(id: string) {
    const obj = this.zoneObjects.get(id)
    if (obj) {
      obj.destroy()
      this.zoneObjects.delete(id)
    }
  }

  upsertDoor(door: IDoor) {
    let obj = this.doorObjects.get(door.id)
    if (!obj) {
      obj = new DoorObject(this.scene, door)
      this.doorObjects.set(door.id, obj)
    } else {
      obj.setPosition(door.gx * GRID_SIZE, door.gy * GRID_SIZE)
      obj.updateVisuals()
    }
  }

  removeDoor(id: string) {
    const obj = this.doorObjects.get(id)
    if (obj) {
      obj.destroy()
      this.doorObjects.delete(id)
    }
  }

  destroy() {

    this.roomObjects.forEach(obj => obj.destroy())
    this.furnitureObjects.forEach(obj => obj.destroy())
    this.equipmentObjects.forEach(obj => obj.destroy())
    this.zoneObjects.forEach(obj => obj.destroy())
    this.doorObjects.forEach(obj => obj.destroy())
    this.roomObjects.clear()
    this.furnitureObjects.clear()
    this.equipmentObjects.clear()
    this.zoneObjects.clear()
    this.doorObjects.clear()
  }
}
