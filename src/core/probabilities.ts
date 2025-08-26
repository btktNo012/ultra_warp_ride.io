import { Rarity, SkinId, WarpColor, WarpHoleDef } from './types'
import { SCORE_RARITY_SMAX } from './constants'

export function normalizeWeights(ws: number[]) {
  const sum = ws.reduce((a, b) => a + Math.max(0, b), 0)
  return sum > 0 ? ws.map((w) => Math.max(0, w) / sum) : ws.map(() => 0)
}

export function pickIndexByWeights(ws: number[], rnd: () => number = Math.random) {
  const ps = normalizeWeights(ws)
  let r = rnd()
  for (let i = 0; i < ps.length; i++) {
    r -= ps[i]
    if (r <= 0) return i
  }
  return ps.length - 1
}

export function rarityWeights(score: number) {
  const p = Math.max(0, Math.min(1, score / SCORE_RARITY_SMAX))
  const w1 = (1 - p) * 0.6 + 0.1
  const w2 = 0.3 + 0.4 * p
  const w3 = 0.08 + 0.35 * Math.pow(p, 1.3)
  const w4 = 0.02 + 0.15 * Math.pow(p, 2.0)
  return [w1, w2, w3, w4]
}

export function pickRarity(score: number, rnd: () => number = Math.random): Rarity {
  const idx = pickIndexByWeights(rarityWeights(score), rnd)
  return (idx + 1) as Rarity
}

export function pickWarpColor(rnd: () => number = Math.random): WarpColor {
  // 等確率（白を若干レアにしたい場合はここを調整）
  const colors: WarpColor[] = ['red', 'blue', 'yellow', 'green', 'white']
  return colors[Math.floor(rnd() * colors.length)]
}

export function findWarpByColorRarity(warps: WarpHoleDef[], color: WarpColor, rarity: Rarity): WarpHoleDef | undefined {
  return warps.find((w) => w.color === color && w.rarity === rarity)
}

export function pickEncounterFor(warp: WarpHoleDef, skin: SkinId, rnd: () => number = Math.random) {
  const table = warp.skins.find((s) => s.skin === skin)
  if (!table || table.encounters.length === 0) return null
  const weights = table.encounters.map((e) => e.weight)
  const idx = pickIndexByWeights(weights, rnd)
  return table.encounters[idx]
}

