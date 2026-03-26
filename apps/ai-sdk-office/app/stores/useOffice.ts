import { defineStore } from 'pinia'
import type { OfficeLayout, IRoom, IDoor, IFurniture, IEquipment, IZone } from '~/types/office'
import { OfficeService } from '~/services/OfficeService'
import { calculateItemMovement } from '~/utils/office-geometry'

export const useOfficeStore = defineStore('office', {
  state: (): OfficeLayout => ({
    rooms: [],
    doors: [],
    items: [],
    equipments: [],
    zones: []
  }),
  actions: {
    addRoom(room: IRoom) {
      this.rooms.push(room)
    },
    
    updateRoom(id: string, bounds: { x: number, y: number, w: number, h: number }) {
      const room = this.rooms.find(r => r.id === id)
      if (room) {
        room.x = bounds.x
        room.y = bounds.y
        room.w = bounds.w
        room.h = bounds.h
      }
    },
    
    updateRoomProperties(id: string, updates: { name?: string }) {
      const room = this.rooms.find(r => r.id === id)
      if (room) {
        if (updates.name !== undefined) room.name = updates.name
      }
    },
    
    removeRoom(id: string) {
      const service = new OfficeService(this.$state)
      const prep = service.prepareRoomRemoval(id)
      if (!prep) return

      this.rooms = this.rooms.filter(r => r.id !== prep.roomId)
      this.items = this.items.filter(i => !prep.furnitureIds.includes(i.id))
      this.doors = this.doors.filter(d => !prep.doorIds.includes(d.id))
      this.zones = this.zones.filter(z => !prep.zoneIds.includes(z.id))
      this.equipments = this.equipments.filter(e => !prep.furnitureIds.includes(e.parentId))
    },

    moveRoom(id: string, dx: number, dy: number) {
      const service = new OfficeService(this.$state)
      const result = service.executeRoomMove(id, dx, dy)
      if (!result) return

      const roomIndex = this.rooms.findIndex(r => r.id === id)
      if (roomIndex !== -1) {
        this.rooms[roomIndex] = result.room
      }
      this.items = result.furniture
      this.doors = result.doors
      this.equipments = result.equipments
      this.zones = result.zones
    },

    addDoor(door: IDoor) {
      this.doors.push(door)
    },

    removeDoor(id: string) {
      this.doors = this.doors.filter(d => d.id !== id)
    },

    addItem(item: IFurniture) {
      this.items.push(item)
    },

    moveItem(id: string, gx: number, gy: number) {
      const item = this.items.find(i => i.id === id)
      if (!item) return

      const result = calculateItemMovement(item, gx, gy, this.equipments)
      
      const index = this.items.findIndex(i => i.id === id)
      if (index !== -1) {
        this.items[index] = result.item
      }
      this.equipments = result.equipments
    },

    removeItem(id: string) {
      this.items = this.items.filter(i => i.id !== id)
      this.equipments = this.equipments.filter(e => e.parentId !== id)
    },

    addEquipment(eq: IEquipment) {
      this.equipments.push(eq)
    },

    moveEquipment(id: string, gx: number, gy: number, parentId?: string) {
      const eq = this.equipments.find(e => e.id === id)
      if (eq) {
        eq.gx = gx
        eq.gy = gy
        if (parentId) eq.parentId = parentId
      }
    },

    removeEquipment(id: string) {
      this.equipments = this.equipments.filter(e => e.id !== id)
    },

    addZone(zone: IZone) {
      this.zones.push(zone)
    },

    moveZone(id: string, gx: number, gy: number) {
      const zone = this.zones.find(z => z.id === id)
      if (zone) {
        zone.gx = gx
        zone.gy = gy
      }
    },

    updateZoneProperties(id: string, props: Partial<IZone['properties']>) {
      const zone = this.zones.find(z => z.id === id)
      if (zone) {
        zone.properties = { ...zone.properties, ...props }
      }
    },

    removeZone(id: string) {
      this.zones = this.zones.filter(z => z.id !== id)
    },

    clearLayout() {
      this.rooms = []
      this.doors = []
      this.items = []
      this.equipments = []
      this.zones = []
    }
  },
  persist: true
})
