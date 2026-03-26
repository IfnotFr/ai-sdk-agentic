import type { IRoom, IDoor, IFurniture, IEquipment, IZone } from '~/types/office'
import { GRID_SIZE } from './grid'

/**
 * Calcule les nouveaux états des entités après le déplacement d'une pièce.
 */
export function calculateRoomMovement(
  room: IRoom,
  dx: number,
  dy: number,
  furniture: IFurniture[],
  doors: IDoor[],
  equipments: IEquipment[],
  zones: IZone[],
  furnitureIds: string[],
  doorIds: string[]
) {
  const gdx = Math.round(dx / GRID_SIZE)
  const gdy = Math.round(dy / GRID_SIZE)

  // On clone pour éviter les mutations directes si besoin (optionnel selon le pattern)
  const updatedFurniture = furniture.map(item => {
    if (furnitureIds.includes(item.id)) {
      return { ...item, gx: item.gx + gdx, gy: item.gy + gdy }
    }
    return item
  })

  const updatedDoors = doors.map(door => {
    if (doorIds.includes(door.id)) {
      return { ...door, gx: door.gx + gdx, gy: door.gy + gdy }
    }
    return door
  })

  const updatedEquipments = equipments.map(eq => {
    if (furnitureIds.includes(eq.parentId)) {
      return { ...eq, gx: eq.gx + gdx, gy: eq.gy + gdy }
    }
    return eq
  })

  const updatedZones = zones.map(zone => {
    const zx = zone.gx * GRID_SIZE
    const zy = zone.gy * GRID_SIZE
    // Une zone est considérée dans la pièce si son origine est dans les anciennes limites
    if (zx >= room.x && zy >= room.y && zx < room.x + room.w && zy < room.y + room.h) {
      return { ...zone, gx: zone.gx + gdx, gy: zone.gy + gdy }
    }
    return zone
  })

  return {
    room: { ...room, x: room.x + dx, y: room.y + dy },
    furniture: updatedFurniture,
    doors: updatedDoors,
    equipments: updatedEquipments,
    zones: updatedZones
  }
}

/**
 * Vérifie si une zone est à l'intérieur d'une pièce donnée.
 */
export function isZoneInRoom(zone: IZone, room: IRoom): boolean {
  const zx = zone.gx * GRID_SIZE
  const zy = zone.gy * GRID_SIZE
  return zx >= room.x && zy >= room.y && zx < room.x + room.w && zy < room.y + room.h
}

/**
 * Calcule le mouvement d'un meuble et de ses équipements rattachés.
 */
export function calculateItemMovement(
  item: IFurniture,
  newGx: number,
  newGy: number,
  equipments: IEquipment[]
) {
  const gdx = newGx - item.gx
  const gdy = newGy - item.gy

  const updatedEquipments = equipments.map(eq => {
    if (eq.parentId === item.id) {
      return { ...eq, gx: eq.gx + gdx, gy: eq.gy + gdy }
    }
    return eq
  })

  return {
    item: { ...item, gx: newGx, gy: newGy },
    equipments: updatedEquipments
  }
}
