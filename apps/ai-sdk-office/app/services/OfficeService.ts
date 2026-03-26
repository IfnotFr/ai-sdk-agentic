import type { OfficeLayout, IRoom, IFurniture, IDoor, IEquipment, IZone } from '~/types/office'
import { calculateRoomMovement, isZoneInRoom, calculateItemMovement } from '~/utils/office-geometry'
import { OfficeValidationService } from '~/utils/office-validation-service'

/**
 * Service orchestrant les opérations complexes sur le bureau.
 * C'est ici que réside l'intelligence métier.
 */
export class OfficeService {
  constructor(private layout: OfficeLayout) {}

  /**
   * Prépare la suppression d'une pièce et de tout ce qu'elle contient.
   */
  prepareRoomRemoval(id: string) {
    const room = this.layout.rooms.find(r => r.id === id)
    if (!room) return null

    // Identifier tout ce qui doit être supprimé en cascade
    const furnitureIds = this.layout.items
      .filter(item => this.isItemInRoom(item, room))
      .map(i => i.id)
    
    const doorIds = this.layout.doors
      .filter(door => this.isDoorOnRoomEdge(door, room))
      .map(d => d.id)

    const zoneIds = this.layout.zones
      .filter(z => isZoneInRoom(z, room))
      .map(z => z.id)

    return {
      roomId: id,
      furnitureIds,
      doorIds,
      zoneIds
    }
  }

  /**
   * Exécute le déplacement d'une pièce avec validation.
   */
  executeRoomMove(id: string, dx: number, dy: number) {
    const room = this.layout.rooms.find(r => r.id === id)
    if (!room) return null

    // Logique : on déplace la pièce et tout ce qui est "lié"
    const furnitureIds = this.layout.items
      .filter(i => this.isItemInRoom(i, room))
      .map(i => i.id)
    
    const doorIds = this.layout.doors
      .filter(d => this.isDoorOnRoomEdge(d, room))
      .map(d => d.id)

    const result = calculateRoomMovement(
      room, dx, dy,
      this.layout.items,
      this.layout.doors,
      this.layout.equipments,
      this.layout.zones,
      furnitureIds,
      doorIds
    )

    return result
  }

  /**
   * Ajoute un meuble avec validation préalable.
   */
  prepareItemAddition(item: IFurniture) {
    const validation = new OfficeValidationService(this.layout)
    
    if (!validation.isPointInsideAnyRoom({ gx: item.gx, gy: item.gy })) {
      throw new Error('Le mobilier doit être placé à l\'intérieur d\'une pièce !')
    }

    if (validation.isCellFullBlocked({ gx: item.gx, gy: item.gy })) {
      throw new Error('Cet emplacement est déjà occupé !')
    }

    return item
  }

  private isItemInRoom(item: IFurniture, room: IRoom): boolean {
    const x = item.gx * 32
    const y = item.gy * 32
    return x >= room.x && y >= room.y && x < room.x + room.w && y < room.y + room.h
  }

  private isDoorOnRoomEdge(door: IDoor, room: IRoom): boolean {
    const dx = door.gx * 32
    const dy = door.gy * 32
    // Une porte est sur le bord si elle touche le périmètre de la pièce
    return (dx >= room.x && dx <= room.x + room.w && dy >= room.y && dy <= room.y + room.h)
  }
}
