import type { OfficeLayout, Point, IRoom } from '~/types/office'
import { GRID_SIZE } from './grid'
import { FURNITURE_REGISTRY, type FurnitureId } from './furniture'

/**
 * Service centralisant les règles métier et de validation de l'espace de bureau.
 */
export class OfficeValidationService {
  constructor(private layout: OfficeLayout) {}

  /**
   * Vérifie si un point (en coordonnées de grille) est à l'intérieur d'au moins une pièce.
   */
  isPointInsideAnyRoom(p: Point): boolean {
    return this.layout.rooms.some(room => this.isPointInRoom(p, room))
  }

  /**
   * Récupère la liste des pièces contenant un point donné.
   */
  getRoomsAt(p: Point): IRoom[] {
    return this.layout.rooms.filter(room => this.isPointInRoom(p, room))
  }

  /**
   * Vérifie si un point est bloqué par un meuble (collision complète).
   */
  isCellFullBlocked(p: Point): boolean {
    return this.layout.items.some((item) => {
      const def = FURNITURE_REGISTRY[item.registryId as FurnitureId]
      if (!def || !def.fullBlock) return false

      return p.gx >= item.gx && p.gx < item.gx + item.w
        && p.gy >= item.gy && p.gy < item.gy + item.h
    })
  }

  /**
   * Vérifie si une transition entre deux cases est bloquée par un bord de meuble (ex: dossier de chaise).
   */
  isTransitionBlockedByFurniture(p: Point, direction: number): boolean {
    return this.layout.items.some((item) => {
      const def = FURNITURE_REGISTRY[item.registryId as FurnitureId]
      if (!def || !def.blockingEdges) return false

      if (p.gx >= item.gx && p.gx < item.gx + item.w
        && p.gy >= item.gy && p.gy < item.gy + item.h) {
        return def.blockingEdges.some((edge) => {
          const absoluteEdge = (edge + item.direction) % 4
          return absoluteEdge === direction
        })
      }
      return false
    })
  }

  /**
   * Vérifie si une transition entre deux points est possible (mouvement agent).
   */
  canMove(from: Point, to: Point, direction: number): boolean {
    const fromRooms = this.getRoomsAt(from)
    const toRooms = this.getRoomsAt(to)

    if (fromRooms.length === 0 || toRooms.length === 0) return false

    // Changement de pièce
    const shareRoom = fromRooms.some(r => toRooms.includes(r))
    if (!shareRoom) {
      const hasDoor = this.layout.doors.some((door) => {
        if (door.orientation === 'v') {
          const isVerticalTransition = (direction === 1 && to.gx === door.gx) || (direction === 3 && from.gx === door.gx)
          return isVerticalTransition && from.gy === door.gy
        } else {
          const isHorizontalTransition = (direction === 2 && to.gy === door.gy) || (direction === 0 && from.gy === door.gy)
          return isHorizontalTransition && from.gx === door.gx
        }
      })
      if (!hasDoor) return false
    }

    if (this.isCellFullBlocked(to)) return false
    if (this.isTransitionBlockedByFurniture(from, direction)) return false

    const oppositeDir = (direction + 2) % 4
    if (this.isTransitionBlockedByFurniture(to, oppositeDir)) return false

    return true
  }

  private isPointInRoom(p: Point, room: IRoom): boolean {
    const rgx = room.x / GRID_SIZE
    const rgy = room.y / GRID_SIZE
    const rgw = room.w / GRID_SIZE
    const rgh = room.h / GRID_SIZE
    return p.gx >= rgx && p.gx < rgx + rgw && p.gy >= rgy && p.gy < rgy + rgh
  }
}
