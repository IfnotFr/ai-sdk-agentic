import { describe, it, expect } from 'vitest'
import { calculateRoomMovement, calculateItemMovement, isZoneInRoom } from '~/utils/office-geometry'
import type { IRoom, IFurniture, IDoor, IEquipment, IZone } from '~/types/office'

describe('OfficeGeometryService', () => {
  const mockRoom: IRoom = { id: 'r1', x: 0, y: 0, w: 128, h: 128, color: '#000' }
  const mockFurniture: IFurniture[] = [
    { id: 'f1', registryId: 'desk', type: 'table', gx: 1, gy: 1, w: 2, h: 2, direction: 0 }
  ]
  const mockDoors: IDoor[] = [
    { id: 'd1', gx: 4, gy: 2, orientation: 'v' }
  ]

  it('devrait calculer correctement le mouvement d\'une pièce et de ses enfants avec arrondi de grille', () => {
    const dx = 33 // Devrait être arrondi à 1 case (32px)
    const dy = 63 // Devrait être arrondi à 2 cases (64px)
    
    const result = calculateRoomMovement(
      mockRoom,
      dx,
      dy,
      mockFurniture,
      mockDoors,
      [],
      [],
      ['f1'],
      ['d1']
    )

    expect(result.room.x).toBe(33)
    expect(result.room.y).toBe(63)
    
    // Vérification meuble (gx=1 + 1 case = 2)
    expect(result.furniture[0]?.gx).toBe(2)
    expect(result.furniture[0]?.gy).toBe(3)
    
    // Vérification porte (gx=4 + 1 case = 5)
    expect(result.doors[0]?.gx).toBe(5)
    expect(result.doors[0]?.gy).toBe(4)
  })

  it('devrait identifier si une zone est dans une pièce', () => {
    const room: IRoom = { id: 'r1', x: 32, y: 32, w: 64, h: 64, color: '#000' } // Grille 1,1 à 2,2
    const zoneInside: IZone = { id: 'z1', registryId: 'zone', gx: 1, gy: 1, direction: 0 }
    const zoneOutside: IZone = { id: 'z2', registryId: 'zone', gx: 3, gy: 3, direction: 0 }

    expect(isZoneInRoom(zoneInside, room)).toBe(true)
    expect(isZoneInRoom(zoneOutside, room)).toBe(false)
  })

  it('devrait propager le mouvement d\'un meuble à ses équipements avec précision', () => {
    const furniture: IFurniture = { id: 'f1', registryId: 'desk', type: 'table', gx: 10, gy: 10, w: 2, h: 2, direction: 0 }
    const equipments: IEquipment[] = [
      { id: 'e1', registryId: 'pc', parentId: 'f1', gx: 11, gy: 11, direction: 0 }
    ]

    const result = calculateItemMovement(furniture, 20, 20, equipments)

    expect(result.item.gx).toBe(20)
    // Le mouvement relatif est de +10,+10. e1 doit passer de 11,11 à 21,21
    expect(result.equipments[0]?.gx).toBe(21)
    expect(result.equipments[0]?.gy).toBe(21)
  })
})
