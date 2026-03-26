import type Phaser from 'phaser'

export type FurnitureType = 'chair' | 'table' | 'decoration' | 'equipment' | 'zone'

export interface FurnitureDefinition {
  id: string
  type: FurnitureType
  category: 'Espaces' | 'Mobilier' | 'Équipements' | 'Zones'
  w: number
  h: number
  label: string
  description: string
  icon: string
  color?: number
  canSupport?: boolean
  drawBody?: (graphics: Phaser.GameObjects.Graphics, w: number, h: number, isSelected?: boolean, isValid?: boolean, isGhost?: boolean) => void
  drawDetail?: (graphics: Phaser.GameObjects.Graphics, w: number, h: number, direction: number) => void
  blockingEdges?: number[]
  fullBlock?: boolean
}

const DEFAULT_FURNITURE_COLOR = 0x64748b // Slate-500
const ROOM_COLOR = 0xe2e8f0 // Slate-200 (Neutral fill)
const WALL_COLOR = 0x94a3b8 // Slate-400 (Visible borders)

const drawStandardBody = (g: Phaser.GameObjects.Graphics, w: number, h: number, isSelected = false, isValid = true, isGhost = false) => {
  const strokeColor = !isValid ? 0xef4444 : (isSelected ? 0x3b82f6 : 0x475569)
  let alpha = 0.8
  if (isGhost) alpha = 0.05
  else if (isSelected) alpha = 0.4
  const strokeAlpha = isGhost ? 0.4 : 1
  
  g.fillStyle(DEFAULT_FURNITURE_COLOR, alpha)
  g.lineStyle(isSelected || !isValid ? 3 : 1.5, strokeColor, strokeAlpha)
  g.fillRect(2, 2, w - 4, h - 4)
  g.strokeRect(2, 2, w - 4, h - 4)
}

const drawEquipmentBody = (g: Phaser.GameObjects.Graphics, w: number, h: number, isSelected = false, isValid = true, isGhost = false) => {
  const strokeColor = !isValid ? 0xef4444 : (isSelected ? 0x3b82f6 : 0x475569)
  g.lineStyle(isSelected || !isValid ? 2 : 1, strokeColor, isGhost ? 0.5 : 1)
  g.strokeRect(6, 6, w - 12, h - 12)
}

const drawZoneBody = (g: Phaser.GameObjects.Graphics, w: number, h: number, isSelected = false, isValid = true, isGhost = false, color = 0x3b82f6) => {
  const strokeColor = !isValid ? 0xef4444 : color // Always use the zone's color
  const offset = 2
  
  // More opaque background when selected (0.3 instead of 0.1)
  g.fillStyle(color, isGhost ? 0.05 : (isSelected ? 0.3 : 0.1))
  
  // Full opacity stroke when selected
  g.lineStyle(4, strokeColor, isGhost ? 0.2 : (isSelected ? 1.0 : 0.6))
  
  g.fillRoundedRect(-offset, -offset, w + offset * 2, h + offset * 2, 6)
  g.strokeRoundedRect(-offset, -offset, w + offset * 2, h + offset * 2, 6)
}

export const FURNITURE_REGISTRY: Record<string, FurnitureDefinition> = {
  room: {
    id: 'room',
    type: 'decoration',
    category: 'Espaces',
    w: 0,
    h: 0,
    label: 'Pièce',
    description: 'Définir une nouvelle zone',
    icon: 'i-lucide-square'
  },
  door: {
    id: 'door',
    type: 'decoration',
    category: 'Espaces',
    w: 1,
    h: 1,
    label: 'Porte',
    description: 'Relier deux pièces',
    icon: 'i-lucide-door-open'
  },
  chair: {
    id: 'chair',
    type: 'chair',
    category: 'Mobilier',
    w: 1,
    h: 1,
    label: 'Chaise',
    description: 'Placer une chaise',
    icon: 'i-lucide-armchair',
    drawBody: drawStandardBody,
    blockingEdges: [0],
    drawDetail: (g, w, h, dir) => {
      g.lineStyle(2, 0x1e293b, 1)
      switch (dir) {
        case 0: g.lineBetween(4, 6, w - 4, 6); break
        case 1: g.lineBetween(w - 6, 4, w - 6, h - 4); break
        case 2: g.lineBetween(4, h - 6, w - 4, h - 6); break
        case 3: g.lineBetween(6, 4, 6, h - 4); break
      }
    }
  },
  table: {
    id: 'table',
    type: 'table',
    category: 'Mobilier',
    w: 1,
    h: 3,
    label: 'Table 1x3',
    description: 'Table rectangulaire standard',
    icon: 'i-lucide-rectangle-vertical',
    canSupport: true,
    drawBody: drawStandardBody,
    fullBlock: true,
    drawDetail: (g, w, h) => {
      g.lineStyle(2, 0x1e293b, 1)
      g.strokeRect(6, 6, w - 12, h - 12)
    }
  },
  computer: {
    id: 'computer',
    type: 'equipment',
    category: 'Équipements',
    w: 1,
    h: 1,
    label: 'Ordinateur',
    description: 'Poste de travail',
    icon: 'i-lucide-monitor',
    drawBody: drawEquipmentBody,
    drawDetail: (g, w, h, dir) => {
      g.lineStyle(1.5, 0x1e293b, 1)
      const cx = w / 2
      const cy = h / 2
      g.save()
      g.translateCanvas(cx, cy)
      g.rotateCanvas(dir * (Math.PI / 2))
      g.lineBetween(-8, -6, 8, -6)
      g.lineBetween(-2, -6, -2, -4)
      g.lineBetween(2, -6, 2, -4)
      g.strokeRect(-6, -2, 12, 6)
      g.restore()
    }
  },
  zone: {
    id: 'zone',
    type: 'zone',
    category: 'Zones',
    w: 1,
    h: 1,
    label: 'Zone',
    description: 'Zone d\'activité (Tool ou Repos)',
    icon: 'i-lucide-box',
    drawBody: (g, w, h, isS, isV, isG) => drawZoneBody(g, w, h, isS, isV, isG, 0xef4444) // Red
  },
  entry_exit: {
    id: 'entry_exit',
    type: 'zone',
    category: 'Zones',
    w: 1,
    h: 1,
    label: 'Entrée/Sortie',
    description: 'Point de passage (Apparition/Disparition)',
    icon: 'i-lucide-door-open',
    drawBody: (g, w, h, isS, isV, isG) => drawZoneBody(g, w, h, isS, isV, isG, 0x10b981) // Green
  }
}

export type FurnitureId = keyof typeof FURNITURE_REGISTRY
export { ROOM_COLOR, WALL_COLOR }
