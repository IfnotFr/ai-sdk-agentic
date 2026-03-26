export interface Point {
  gx: number
  gy: number
}

export interface IRoom {
  id: string
  x: number
  y: number
  w: number
  h: number
  color: string
  name?: string
  positionLabel?: string
}

export interface IDoor {
  id: string
  gx: number
  gy: number
  orientation: 'h' | 'v'
}

export interface IFurniture {
  id: string
  registryId: string
  type: 'chair' | 'table' | 'decoration' | 'equipment' | 'zone'
  gx: number
  gy: number
  w: number
  h: number
  direction: number
  positionLabel?: string
}

export interface IEquipment {
  id: string
  registryId: string
  parentId: string
  gx: number
  gy: number
  direction: number
}

export interface IZone {
  id: string
  registryId: 'zone' | 'entry_exit'
  gx: number
  gy: number
  direction: number
  properties?: {
    /** tool names OR idlePosition names */
    targets?: string[]
  }
}

export interface OfficeLayout {
  rooms: IRoom[]
  doors: IDoor[]
  items: IFurniture[]
  equipments: IEquipment[]
  zones: IZone[]
}

/**
 * Type utilitaire pour les événements de mutation Pinia (interne)
 */
export interface PiniaMutationEvent {
  key: string
  newValue: any
  oldValue: any
  path: string[]
  type: string
}
