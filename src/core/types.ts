export type SkinId = 'solgaleo' | 'lunala'

export type WarpColor = 'red' | 'blue' | 'yellow' | 'green' | 'white'
export type Rarity = 1 | 2 | 3 | 4

export interface PokemonEntry {
  name: string
  image: string
  weight: number
}

export interface SkinEncounterTable {
  skin: SkinId
  encounters: PokemonEntry[]
}

export interface WarpHoleDef {
  id: string
  name: string
  color: WarpColor
  rarity: Rarity
  skins: SkinEncounterTable[]
}

export interface WarpTablesFile {
  version: number
  warps: WarpHoleDef[]
}

export type EntityKind = 'hazard' | 'energy' | 'warp'

export interface EntityBase {
  id: number
  kind: EntityKind
  x: number
  y: number
  r: number
  vy: number
  color?: WarpColor
  rarity?: Rarity
}

