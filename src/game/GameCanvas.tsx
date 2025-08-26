import React, { useEffect, useMemo, useRef, useState } from 'react'
import { VIEW_W, VIEW_H, PLAYER_X, PLAYER_RADIUS, WORLD_SPEED, FOLLOW_INIT, FOLLOW_MAX, FOLLOW_MIN, DAMAGE_DELTA, ENERGY_DELTA, IFRAME_SEC, SPAWN_RATE_ENERGY, SPAWN_RATE_HAZARD, SPAWN_RATE_WARP, TARGET_SMOOTH_TAU, HAZARD_BURST_DURATION, HAZARD_BURST_INTERVAL, HAZARD_BURST_MULT, FOLLOW_DECAY_PER_SEC, HAZARD_BURST_MULT_MAX, SCORE_RARITY_SMAX } from '../core/constants'
import { clamp, circleCollide, updatePlayerY, applyWarpGravity } from '../core/physics'
import { createTicker } from './loop'
import { EntityBase, Rarity, SkinId, WarpHoleDef, WarpColor } from '../core/types'
import { drawBackground, drawEntities, drawPlayer, updateBackground } from './renderer'
import { makeSpawner, trySpawn } from '../core/spawner'
import { pickEncounterFor, pickRarity, pickWarpColor, findWarpByColorRarity } from '../core/probabilities'

type Mode = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'

interface Props {
  skin: SkinId
  mode: Mode
  setMode: (m: Mode) => void
  warpDefs: WarpHoleDef[]
  onGameOver: (params: { warpId: string; warpName: string; encounterName: string; encounterImage: string }) => void
  onHudUpdate?: (h: { follow: number; score: number; time: number }) => void
}

export default function GameCanvas({ skin, mode, setMode, warpDefs, onGameOver, onHudUpdate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const targetYRef = useRef<number>(VIEW_H / 2)
  const playerYRef = useRef<number>(VIEW_H / 2)
  const vyRef = useRef<number>(0)
  const followStrengthRef = useRef<number>(FOLLOW_INIT)
  const scoreRef = useRef<number>(0)
  const timeRef = useRef<number>(0)
  const iframeRef = useRef<number>(0)
  const entitiesRef = useRef<EntityBase[]>([])
  const spawner = useMemo(() => makeSpawner(), [])
  const [assets, setAssets] = useState<{ skinImage: HTMLImageElement | null }>({ skinImage: null })
  const smoothTargetRef = useRef<number>(VIEW_H / 2)
  const lastHudSentRef = useRef<number>(0)
  const burstLeftRef = useRef<number>(0)
  const burstCooldownRef = useRef<number>(0)

  // 画像ロード（スキン）
  useEffect(() => {
    const base = import.meta.env.BASE_URL || '/'
    const img = new Image()
    img.src = skin === 'lunala' ? `${base}images/skin-lunala.gif` : `${base}images/skin-solgaleo.gif`
    img.onload = () => setAssets({ skinImage: img })
    img.onerror = () => setAssets({ skinImage: null })
  }, [skin])

  // 入力（マウス/タッチ）
  useEffect(() => {
    const canvas = canvasRef.current!
    const rectOf = () => canvas.getBoundingClientRect()
    const onMouse = (e: MouseEvent) => {
      if ('ontouchstart' in window) return // タッチ優先
      const r = rectOf()
      const y = e.clientY - r.top
      targetYRef.current = clamp(y, 0, VIEW_H)
    }
    const onTouch = (e: TouchEvent) => {
      const r = rectOf()
      const t = e.touches[0]
      if (!t) return
      const y = t.clientY - r.top
      targetYRef.current = clamp(y, 0, VIEW_H)
    }
    canvas.addEventListener('mousemove', onMouse)
    canvas.addEventListener('touchstart', onTouch)
    canvas.addEventListener('touchmove', onTouch)
    return () => {
      canvas.removeEventListener('mousemove', onMouse)
      canvas.removeEventListener('touchstart', onTouch)
      canvas.removeEventListener('touchmove', onTouch)
    }
  }, [])

  // ループ
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    // HiDPI スケール
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
    canvas.width = Math.floor(VIEW_W * dpr)
    canvas.height = Math.floor(VIEW_H * dpr)
    canvas.style.width = VIEW_W + 'px'
    canvas.style.height = VIEW_H + 'px'
    ctx.scale(dpr, dpr)

    let stopped = false
    const ticker = createTicker((dt, t) => {
      if (mode !== 'PLAYING' || stopped) return
      // 更新
      let py = playerYRef.current
      let vy0 = vyRef.current
      // 追尾力の自然減衰
      followStrengthRef.current = clamp(
        followStrengthRef.current - FOLLOW_DECAY_PER_SEC * dt,
        FOLLOW_MIN,
        FOLLOW_MAX
      )
      // 目標Yのローパス（カクつき抑制）
      const smoothedTarget = (() => {
        const current = smoothTargetRef.current
        const alpha = 1 - Math.exp(-dt / TARGET_SMOOTH_TAU)
        const next = current + (targetYRef.current - current) * alpha
        smoothTargetRef.current = next
        return next
      })()
      // ワープ吸引（Yのみ）
      for (const e of entitiesRef.current) {
        if (e.kind === 'warp') {
          vy0 = applyWarpGravity(py, vy0, e.x, e.y, dt, followStrengthRef.current)
        }
      }
      const upd = updatePlayerY(py, vy0, smoothedTarget, followStrengthRef.current, dt)
      py = upd.playerY
      vy0 = upd.vy

      // スポーン
      // バースト状態更新
      if (burstLeftRef.current > 0) {
        burstLeftRef.current -= dt
        if (burstLeftRef.current < 0) burstLeftRef.current = 0
      } else {
        burstCooldownRef.current += dt
        if (burstCooldownRef.current >= HAZARD_BURST_INTERVAL) {
          burstCooldownRef.current = 0
          burstLeftRef.current = HAZARD_BURST_DURATION
        }
      }
      // レート切替（バースト中は hazard のみ）
      const rateH = (() => {
        if (burstLeftRef.current > 0) {
          const p = clamp(scoreRef.current / SCORE_RARITY_SMAX, 0, 1)
          const mult = HAZARD_BURST_MULT + (HAZARD_BURST_MULT_MAX - HAZARD_BURST_MULT) * p
          return SPAWN_RATE_HAZARD * mult
        }
        return SPAWN_RATE_HAZARD
      })()
      const rateE = burstLeftRef.current > 0 ? 0 : SPAWN_RATE_ENERGY
      const rateW = burstLeftRef.current > 0 ? 0 : SPAWN_RATE_WARP
      trySpawn(spawner, dt, rateH, rateE, rateW, (e) => {
        if (e.kind === 'warp') {
          // レア度と色を付与
          const rarity: Rarity = pickRarity(scoreRef.current)
          const color: WarpColor = pickWarpColor()
          e.rarity = rarity
          e.color = color
        }
        entitiesRef.current.push(e)
      })

      // 位置更新とスクロール
      for (let i = entitiesRef.current.length - 1; i >= 0; i--) {
        const e = entitiesRef.current[i]
        e.x -= WORLD_SPEED * dt
        e.y += e.vy * dt
        if (e.y < 12 || e.y > VIEW_H - 12) e.vy *= -1
        if (e.x < -40) {
          entitiesRef.current.splice(i, 1)
        }
      }

      // 当たり判定
      let iframeLeft = Math.max(0, iframeRef.current - dt)
      for (let i = entitiesRef.current.length - 1; i >= 0; i--) {
        const e = entitiesRef.current[i]
        if (!circleCollide(PLAYER_X, py, PLAYER_RADIUS, e.x, e.y, e.r)) continue
        if (e.kind === 'hazard') {
          if (iframeLeft <= 0) {
            followStrengthRef.current = clamp(followStrengthRef.current + DAMAGE_DELTA, FOLLOW_MIN, FOLLOW_MAX)
            iframeLeft = IFRAME_SEC
          }
          entitiesRef.current.splice(i, 1)
        } else if (e.kind === 'energy') {
          followStrengthRef.current = clamp(followStrengthRef.current + ENERGY_DELTA, FOLLOW_MIN, FOLLOW_MAX)
          entitiesRef.current.splice(i, 1)
        } else if (e.kind === 'warp') {
          const def = findWarpByColorRarity(warpDefs, e.color!, e.rarity!)
          const enc = def ? pickEncounterFor(def, skin) : null
          onGameOver({
            warpId: def?.id ?? `${e.color}-${e.rarity}`,
            warpName: def?.name ?? `${e.color}★${e.rarity}`,
            encounterName: enc?.name ?? '???',
            encounterImage: enc?.image ?? '',
          })
          setMode('GAME_OVER')
          stopped = true
          break
        }
      }
      const newTime = timeRef.current + dt
      const newScore = scoreRef.current + Math.floor(WORLD_SPEED * dt)
      iframeRef.current = iframeLeft
      playerYRef.current = py
      vyRef.current = vy0
      timeRef.current = newTime
      scoreRef.current = newScore
      // HUD更新は10Hzに間引き
      if (onHudUpdate) {
        if (newTime - lastHudSentRef.current >= 0.1) {
          lastHudSentRef.current = newTime
          onHudUpdate({ follow: followStrengthRef.current, score: newScore, time: newTime })
        }
      }

      // 描画
      updateBackground(dt)
      drawBackground(ctx)
      drawEntities(ctx, entitiesRef.current, t)
      drawPlayer(ctx, py, assets)
    })

    ticker.start()
    return () => ticker.stop()
  }, [mode, assets, warpDefs, setMode])

  // モード変更にあわせて初期化
  useEffect(() => {
    if (mode === 'PLAYING') return
    // 非PLAYING時は状態を初期化（refs）
    targetYRef.current = VIEW_H / 2
    playerYRef.current = VIEW_H / 2
    vyRef.current = 0
    followStrengthRef.current = FOLLOW_INIT
    scoreRef.current = 0
    timeRef.current = 0
    iframeRef.current = 0
    entitiesRef.current = []
    burstLeftRef.current = 0
    burstCooldownRef.current = 0
  }, [mode])

  return <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} />
}
