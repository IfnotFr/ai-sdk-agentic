import { GRID_SIZE, pixelToGrid, gridToPixel, gridToPixelCenter, snapToGrid } from '~/utils/grid'

export class GridSystem {
  get size(): number {
    return GRID_SIZE
  }

  pixelToGrid(pixel: number): number {
    return pixelToGrid(pixel)
  }

  gridToPixel(grid: number): number {
    return gridToPixel(grid)
  }

  gridToPixelCenter(grid: number): number {
    return gridToPixelCenter(grid)
  }

  snapToGrid(pixel: number): number {
    return snapToGrid(pixel)
  }

  snapPoint(x: number, y: number): { x: number, y: number } {
    return {
      x: snapToGrid(x),
      y: snapToGrid(y)
    }
  }
}
