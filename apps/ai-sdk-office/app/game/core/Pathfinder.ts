import type { OfficeLayout, Point } from '~/types/office'
import { OfficeValidationService } from '~/utils/office-validation-service'

export class Pathfinder {
  private validation: OfficeValidationService

  constructor(layout: OfficeLayout) {
    this.validation = new OfficeValidationService(layout)
  }

  findPath(start: Point, end: Point): Point[] | null {
    if (start.gx === end.gx && start.gy === end.gy) return [start]

    const queue: Point[] = [start]
    const cameFrom: Record<string, Point | null> = {
      [`${start.gx},${start.gy}`]: null
    }

    while (queue.length > 0) {
      const current = queue.shift()!

      if (current.gx === end.gx && current.gy === end.gy) {
        return this.reconstructPath(cameFrom, end)
      }

      for (const neighbor of this.getNeighbors(current)) {
        const key = `${neighbor.gx},${neighbor.gy}`
        if (!(key in cameFrom)) {
          cameFrom[key] = current
          queue.push(neighbor)
        }
      }
    }

    return null
  }

  private getNeighbors(p: Point): Point[] {
    const neighbors: Point[] = []
    const directions = [
      { gx: 0, gy: -1, dir: 0 }, // N
      { gx: 1, gy: 0, dir: 1 }, // E
      { gx: 0, gy: 1, dir: 2 }, // S
      { gx: -1, gy: 0, dir: 3 } // W
    ]

    for (const d of directions) {
      const next = { gx: p.gx + d.gx, gy: p.gy + d.gy }
      if (this.validation.canMove(p, next, d.dir)) {
        neighbors.push(next)
      }
    }

    return neighbors
  }

  private reconstructPath(cameFrom: Record<string, Point | null>, end: Point): Point[] {
    const path: Point[] = []
    let current: Point | null = end
    while (current) {
      path.unshift(current)
      const next: Point | null | undefined = cameFrom[`${current.gx},${current.gy}`]
      current = next !== undefined ? next : null
    }
    return path
  }
}
