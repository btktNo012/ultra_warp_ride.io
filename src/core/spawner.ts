import { defaultRng } from './rng'
import { EntityBase } from './types'
import { ENERGY_R, HAZARD_R, VIEW_H, VIEW_W, WARP_R } from './constants'

export interface SpawnerState {
  carryHazard: number
  carryEnergy: number
  carryWarp: number
  nextId: number
}

export function makeSpawner(): SpawnerState {
  return { carryHazard: 0, carryEnergy: 0, carryWarp: 0, nextId: 1 }
}

export function trySpawn(
  st: SpawnerState,
  dt: number,
  rateHazard: number,
  rateEnergy: number,
  rateWarp: number,
  push: (e: EntityBase) => void
) {
  st.carryHazard += rateHazard * dt
  while (st.carryHazard >= 1) {
    st.carryHazard -= 1
    push({ id: st.nextId++, kind: 'hazard', x: VIEW_W + 40, y: defaultRng.range(24, VIEW_H - 24), r: HAZARD_R, vy: defaultRng.range(-20, 20) })
  }
  st.carryEnergy += rateEnergy * dt
  while (st.carryEnergy >= 1) {
    st.carryEnergy -= 1
    push({ id: st.nextId++, kind: 'energy', x: VIEW_W + 40, y: defaultRng.range(24, VIEW_H - 24), r: ENERGY_R, vy: defaultRng.range(-15, 15) })
  }
  st.carryWarp += rateWarp * dt
  while (st.carryWarp >= 1) {
    st.carryWarp -= 1
    // warp の色/レアはゲーム側で後付けする
    push({ id: st.nextId++, kind: 'warp', x: VIEW_W + 60, y: defaultRng.range(36, VIEW_H - 36), r: WARP_R, vy: 0 })
  }
}

