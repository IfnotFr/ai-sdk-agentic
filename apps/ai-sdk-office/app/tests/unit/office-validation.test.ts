import { describe, it, expect } from 'vitest'
import { OfficeValidationService } from '~/utils/office-validation-service'
import type { OfficeLayout, Point } from '~/types/office'

describe('OfficeValidationService - Cas complexes', () => {
  const layout: OfficeLayout = {
    rooms: [
      { id: 'r1', x: 0, y: 0, w: 64, h: 64, color: '#000' },     // Chambre 1: 0,0 à 2,2 (exclu)
      { id: 'r2', x: 64, y: 0, w: 64, h: 64, color: '#000' }    // Chambre 2: 2,0 à 4,2 (exclu)
    ],
    items: [],
    doors: [
      { id: 'd1', gx: 2, gy: 0, orientation: 'v' }             // Porte entre R1 et R2 à (2,0)
    ],
    equipments: [],
    zones: []
  }

  const validation = new OfficeValidationService(layout)

  it('devrait autoriser le passage à travers une porte entre deux pièces', () => {
    const from: Point = { gx: 1, gy: 0 } // Dans R1
    const to: Point = { gx: 2, gy: 0 }   // Sur la porte vers R2
    
    // Direction 1 (Est) de R1 vers R2
    expect(validation.canMove(from, to, 1)).toBe(true)
  })

  it('devrait refuser le passage à travers un mur (pas de porte)', () => {
    const from: Point = { gx: 1, gy: 1 } // Dans R1
    const to: Point = { gx: 2, gy: 1 }   // Vers R2 mais pas de porte ici
    
    expect(validation.canMove(from, to, 1)).toBe(false)
  })

  it('devrait identifier correctement les pièces à un point donné', () => {
    expect(validation.getRoomsAt({ gx: 0, gy: 0 }).length).toBe(1)
    expect(validation.getRoomsAt({ gx: 10, gy: 10 }).length).toBe(0)
  })
})
