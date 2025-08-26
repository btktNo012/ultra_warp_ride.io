import { EntityBase } from '../core/types'
import { PLAYER_RADIUS, PLAYER_X, VIEW_H, VIEW_W } from '../core/constants'

export interface RenderAssets {
  skinImage: HTMLImageElement | null
}

type Star = { x: number; y: number; size: number; speed: number; alpha: number }
let stars: Star[] | null = null

function initStars() {
  if (stars) return
  stars = []
  const addLayer = (count: number, speed: number, alpha: number) => {
    for (let i = 0; i < count; i++) {
      stars!.push({
        x: Math.random() * VIEW_W,
        y: Math.random() * VIEW_H,
        size: Math.random() < 0.85 ? 1 : 2,
        speed,
        alpha,
      })
    }
  }
  // 遅/中/速の3層（パララックス）
  addLayer(90, 12, 0.35)
  addLayer(120, 28, 0.55)
  addLayer(150, 48, 0.8)
}

export function updateBackground(dt: number) {
  initStars()
  for (const s of stars!) {
    s.x -= s.speed * dt
    if (s.x < 0) s.x += VIEW_W
  }
}

export function drawBackground(ctx: CanvasRenderingContext2D) {
  initStars()
  ctx.save()
  ctx.fillStyle = '#081420'
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)
  for (const s of stars!) {
    ctx.globalAlpha = s.alpha
    ctx.fillStyle = '#e8f4ff'
    // 整数寄せでチラつき低減
    const x = Math.floor(s.x)
    const y = Math.floor(s.y)
    ctx.fillRect(x, y, s.size, s.size)
  }
  ctx.globalAlpha = 1
  ctx.restore()
}

export function drawEntities(ctx: CanvasRenderingContext2D, entities: EntityBase[], t: number) {
  for (const e of entities) {
    if (e.kind === 'hazard') {
      ctx.strokeStyle = '#ff6b6b'
      ctx.fillStyle = '#ff2d2d'
    } else if (e.kind === 'energy') {
      ctx.strokeStyle = '#6bffb0'
      ctx.fillStyle = '#2dffa2'
    } else {
      const color = e.color ?? 'white'
      const map: Record<string, string> = { red: '#ff7a7a', blue: '#6fb3ff', yellow: '#ffe46f', green: '#73ff9c', white: '#ffffff' }
      ctx.strokeStyle = map[color]
      ctx.fillStyle = map[color]
    }
    ctx.beginPath()
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2)
    if (e.kind !== 'warp') {
      ctx.globalAlpha = 0.9
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.lineWidth = 2
      ctx.stroke()
      continue
    }

    // warp 表示（レア度別）
    const rarity = e.rarity ?? 1
    // 本体
    ctx.globalAlpha = 0.25
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.lineWidth = 3
    ctx.stroke()

    // リング: レア2=1本, レア3/4=2本
    if (rarity >= 2) {
      const ring1 = e.r + 8
      ctx.beginPath()
      ctx.arc(e.x, e.y, ring1, 0, Math.PI * 2)
      ctx.stroke()
    }
    if (rarity >= 3) {
      const ring2 = e.r + 16
      ctx.beginPath()
      ctx.arc(e.x, e.y, ring2, 0, Math.PI * 2)
      ctx.stroke()
    }

    // レア4: 衛星6つを回転
    if (rarity >= 4) {
      const orbitR = e.r + 32
      const smallR = 5
      // 外周上に6つの小円を等間隔に固定配置
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI * 2) / 6
        const sx = e.x + Math.cos(ang) * orbitR
        const sy = e.y + Math.sin(ang) * orbitR
        ctx.beginPath()
        ctx.globalAlpha = 0.9
        ctx.arc(sx, sy, smallR, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }
    }
  }
}

export function drawPlayer(ctx: CanvasRenderingContext2D, y: number, assets: RenderAssets) {
  const img = assets.skinImage
  if (img && img.complete) {
    const w = 80
    const h = 60
    ctx.drawImage(img, PLAYER_X - w / 2, y - h / 2, w, h)
  } else {
    // プレースホルダ（円）
    ctx.fillStyle = '#9ad6ff'
    ctx.beginPath()
    ctx.arc(PLAYER_X, y, PLAYER_RADIUS + 6, 0, Math.PI * 2)
    ctx.fill()
  }
}
