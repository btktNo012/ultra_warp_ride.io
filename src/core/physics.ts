import { FOLLOW_MAX, FOLLOW_MIN, PLAYER_ACCEL_BASE, PLAYER_DAMPING, PLAYER_RADIUS, PLAYER_VEL_MAX_BASE, VIEW_H, WARP_GRAVITY_RADIUS, WARP_GRAVITY_STRENGTH } from './constants'

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

export function sign(v: number) {
  return v < 0 ? -1 : v > 0 ? 1 : 0
}

export function circleCollide(ax: number, ay: number, ar: number, bx: number, by: number, br: number) {
  const dx = ax - bx
  const dy = ay - by
  return dx * dx + dy * dy <= (ar + br) * (ar + br)
}

export function updatePlayerY(
  playerY: number,
  vy: number,
  targetY: number,
  followStrength: number,
  dt: number
) {
  const dy = targetY - playerY
  vy += sign(dy) * PLAYER_ACCEL_BASE * followStrength * dt
  // 速度上限（追尾力が高いほど上限を高く）
  const vmax = PLAYER_VEL_MAX_BASE * Math.max(0.5, followStrength)
  if (vy > vmax) vy = vmax
  else if (vy < -vmax) vy = -vmax
  playerY += vy * dt
  vy *= PLAYER_DAMPING
  // clamp to viewport
  if (playerY < PLAYER_RADIUS) {
    playerY = PLAYER_RADIUS
    vy = 0
  } else if (playerY > VIEW_H - PLAYER_RADIUS) {
    playerY = VIEW_H - PLAYER_RADIUS
    vy = 0
  }
  return { playerY, vy }
}

export function applyWarpGravity(playerY: number, vy: number, wx: number, wy: number, dt: number, followStrength: number) {
  const dy = wy - playerY
  const d2 = dy * dy // Xは固定なのでY成分のみ
  if (d2 < WARP_GRAVITY_RADIUS * WARP_GRAVITY_RADIUS) {
    // 追尾力が強いほど吸引を弱める（逆比例スケール）
    const scale = clamp((FOLLOW_MAX - followStrength) / (FOLLOW_MAX - FOLLOW_MIN), 0.1, 1.0)
    const eff = WARP_GRAVITY_STRENGTH * scale
    vy += dy * (eff / (d2 + 100)) * dt
  }
  return vy
}
