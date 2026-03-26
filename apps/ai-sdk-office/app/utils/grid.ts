export const GRID_SIZE = 32

/**
 * Pure functions for grid calculations
 */
export const pixelToGrid = (pixel: number): number => {
  return Math.floor(pixel / GRID_SIZE)
}

export const gridToPixel = (grid: number): number => {
  return grid * GRID_SIZE
}

export const gridToPixelCenter = (grid: number): number => {
  return (grid * GRID_SIZE) + (GRID_SIZE / 2)
}

export const snapToGrid = (pixel: number): number => {
  return gridToPixel(pixelToGrid(pixel))
}
