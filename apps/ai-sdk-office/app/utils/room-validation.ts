import type { IRoom, IDoor, IFurniture } from '~/types/office'

export interface RoomBounds {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Vérifie si un meuble est à l'intérieur d'un rectangle (en pixels)
 */
export function isFurnitureInside(item: IFurniture, bounds: RoomBounds): boolean {
  const itemX = item.gx * 32
  const itemY = item.gy * 32
  const itemW = item.w * 32
  const itemH = item.h * 32

  return (
    itemX >= bounds.x &&
    itemY >= bounds.y &&
    itemX + itemW <= bounds.x + bounds.w &&
    itemY + itemH <= bounds.y + bounds.h
  )
}

/**
 * Vérifie si une porte est sur l'un des bords d'un rectangle (en pixels)
 */
export function isDoorOnEdge(door: IDoor, bounds: RoomBounds): boolean {
  const dx = door.gx * 32
  const dy = door.gy * 32

  const isOnVerticalEdge = (dx === bounds.x || dx === bounds.x + bounds.w) && 
                           (dy >= bounds.y && dy < bounds.y + bounds.h)
  
  const isOnHorizontalEdge = (dy === bounds.y || dy === bounds.y + bounds.h) && 
                             (dx >= bounds.x && dx < bounds.x + bounds.w)

  return door.orientation === 'v' ? isOnVerticalEdge : isOnHorizontalEdge
}

/**
 * Vérifie si un point (gx, gy) est à l'intérieur d'au moins une pièce
 */
export function isPointInsideAnyRoom(gx: number, gy: number, rooms: IRoom[]): boolean {
  const px = gx * 32
  const py = gy * 32
  return rooms.some(room => {
    return px >= room.x && py >= room.y && px < room.x + room.w && py < room.y + room.h
  })
}

/**
 * Valide si une configuration de pièce est légale
 */
export function validateRoom(
  roomId: string | null,
  newBounds: RoomBounds,
  allRooms: IRoom[],
  itemsInRoom: IFurniture[],
  doorsInRoom: IDoor[]
): { valid: boolean; reason?: string } {
  // 1. Check overlap with other rooms
  const hasOverlap = allRooms.some(r => {
    if (r.id === roomId) return false
    return (
      newBounds.x < r.x + r.w &&
      newBounds.x + newBounds.w > r.x &&
      newBounds.y < r.y + r.h &&
      newBounds.y + newBounds.h > r.y
    )
  })

  if (hasOverlap) return { valid: false, reason: 'Chevauchement avec une autre pièce' }

  // 2. Check if all "contained" furniture is still inside
  const allFurnitureInside = itemsInRoom.every(item => isFurnitureInside(item, newBounds))
  if (!allFurnitureInside) return { valid: false, reason: 'Le mobilier sortirait de la pièce' }

  // 3. Check if all "attached" doors are still on edges
  const allDoorsOnEdge = doorsInRoom.every(door => isDoorOnEdge(door, newBounds))
  if (!allDoorsOnEdge) return { valid: false, reason: 'Une porte ne serait plus sur un mur' }

  return { valid: true }
}
