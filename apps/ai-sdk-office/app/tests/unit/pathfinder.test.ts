import { describe, it, expect } from 'vitest'
import { Pathfinder } from '~/game/core/Pathfinder'
import type { OfficeLayout } from '~/types/office'

describe('Pathfinder - Scénarios Réels', () => {
  /**
   * Layout :
   * [R1] | [R2]
   * R1: 0,0 à 2,2 (exclu)
   * R2: 2,0 à 4,2 (exclu)
   * Porte: Verticale en (2,0)
   */
  const complexLayout: OfficeLayout = {
    rooms: [
      { id: 'r1', x: 0, y: 0, w: 64, h: 64, color: '#000' },
      { id: 'r2', x: 64, y: 0, w: 64, h: 64, color: '#000' }
    ],
    items: [],
    doors: [
      { id: 'd1', gx: 2, gy: 0, orientation: 'v' } // Porte en haut
    ],
    equipments: [],
    zones: []
  }

  const pathfinder = new Pathfinder(complexLayout)

  it('devrait trouver son chemin entre deux pièces via la porte', () => {
    // Départ en (0,0) [R1], Destination en (3,0) [R2]
    // Chemin attendu : (0,0) -> (1,0) -> (2,0) [Porte] -> (3,0)
    const start = { gx: 0, gy: 0 }
    const end = { gx: 3, gy: 0 }
    
    const path = pathfinder.findPath(start, end)
    
    expect(path).not.toBeNull()
    expect(path?.[2]).toEqual({ gx: 2, gy: 0 }) // Doit passer par la porte
    expect(path?.[3]).toEqual({ gx: 3, gy: 0 }) // Destination atteinte
  })

  it('devrait contourner un mur s\'il n\'y a pas de porte directe', () => {
    // Départ en (0,1), Destination en (3,1)
    // Il n'y a pas de porte en gy:1. L'agent doit remonter en gy:0 pour passer la porte
    const start = { gx: 0, gy: 1 }
    const end = { gx: 3, gy: 1 }
    
    const path = pathfinder.findPath(start, end)
    
    expect(path).not.toBeNull()
    // Le chemin doit inclure le passage par la porte en (2,0)
    const hasDoorInPath = path?.some(p => p.gx === 2 && p.gy === 0)
    expect(hasDoorInPath).toBe(true)
  })

  it('devrait renvoyer null s\'il n\'y a aucune connexion possible', () => {
    const layoutSansPorte: OfficeLayout = { ...complexLayout, doors: [] }
    const pf = new Pathfinder(layoutSansPorte)
    
    const path = pf.findPath({ gx: 0, gy: 0 }, { gx: 3, gy: 0 })
    expect(path).toBeNull()
  })
})
