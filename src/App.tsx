import React, { useEffect, useMemo, useReducer, useState } from 'react'
import { VIEW_W, VIEW_H } from './core/constants'
import { SkinId, WarpHoleDef } from './core/types'
import { loadWarpTables } from './data/loadWarpTables'
import GameCanvas from './game/GameCanvas'
import SkinSelect from './ui/SkinSelect'
import Overlay from './ui/Overlay'
import HUD from './ui/HUD'
import ResultModal from './ui/ResultModal'

type Mode = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'

interface GameMeta {
  mode: Mode
  skin: SkinId | null
  lastWarpId: string | null
  lastWarpName: string | null
  lastEncounterName: string | null
  lastEncounterImage: string | null
}

type Action =
  | { type: 'SET_MODE'; mode: Mode }
  | { type: 'SET_SKIN'; skin: SkinId }
  | { type: 'GAME_OVER'; warpId: string; warpName: string; encounterName: string; encounterImage: string }
  | { type: 'RESET' }

const initialMeta: GameMeta = {
  mode: 'MENU',
  skin: null,
  lastWarpId: null,
  lastWarpName: null,
  lastEncounterName: null,
  lastEncounterImage: null,
}

function reducer(state: GameMeta, action: Action): GameMeta {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.mode }
    case 'SET_SKIN':
      return { ...state, skin: action.skin }
    case 'GAME_OVER':
      return {
        ...state,
        mode: 'GAME_OVER',
        lastWarpId: action.warpId,
        lastWarpName: action.warpName,
        lastEncounterName: action.encounterName,
        lastEncounterImage: action.encounterImage,
      }
    case 'RESET':
      return { ...initialMeta, skin: state.skin }
    default:
      return state
  }
}

export default function App() {
  const [meta, dispatch] = useReducer(reducer, initialMeta)
  const [warpDefs, setWarpDefs] = useState<WarpHoleDef[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [hud, setHud] = useState<{ follow: number; score: number; time: number }>({ follow: 1, score: 0, time: 0 })
  const [scale, setScale] = useState<number>(1)

  // ビューポートに応じてゲーム全体を縮小
  useEffect(() => {
    const updateScale = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const s = Math.min(1, Math.min(vw / VIEW_W, vh / VIEW_H))
      setScale(s)
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    window.addEventListener('orientationchange', updateScale)
    return () => {
      window.removeEventListener('resize', updateScale)
      window.removeEventListener('orientationchange', updateScale)
    }
  }, [])

  useEffect(() => {
    loadWarpTables()
      .then((tables) => setWarpDefs(tables.warps))
      .catch((e) => setLoadError(String(e)))
  }, [])

  const onPlay = (skin: SkinId) => {
    dispatch({ type: 'SET_SKIN', skin })
    dispatch({ type: 'SET_MODE', mode: 'PLAYING' })
  }

  const onPause = () => dispatch({ type: 'SET_MODE', mode: 'PAUSED' })
  const onResume = () => dispatch({ type: 'SET_MODE', mode: 'PLAYING' })
  const onRetry = () => dispatch({ type: 'RESET' })

  const onGameOver = (params: { warpId: string; warpName: string; encounterName: string; encounterImage: string }) => {
    dispatch({ type: 'GAME_OVER', ...params })
  }

  const isTouch = useMemo(() => {
    return typeof window !== 'undefined' && 'ontouchstart' in window
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'p') {
        dispatch({ type: 'SET_MODE', mode: meta.mode === 'PLAYING' ? 'PAUSED' : 'PLAYING' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [meta.mode])

  return (
    <div className="app-root">
      <div
        className="game-scale-wrapper"
        style={{ width: Math.floor(VIEW_W * scale), height: Math.floor(VIEW_H * scale) }}
      >
        <div
          className="game-container"
          style={{ width: VIEW_W, height: VIEW_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
        {meta.mode === 'MENU' && <SkinSelect onPlay={onPlay} />}
        {meta.mode !== 'MENU' && (
          <>
            <GameCanvas
              skin={meta.skin ?? 'solgaleo'}
              mode={meta.mode}
              setMode={(m) => dispatch({ type: 'SET_MODE', mode: m as any })}
              warpDefs={warpDefs ?? []}
              onGameOver={onGameOver}
              // HUDへフレーム毎に渡す
              onHudUpdate={setHud}
            />
            <HUD follow={hud.follow} score={hud.score} time={hud.time} />
            {meta.mode === 'PAUSED' && (
              <Overlay mode={meta.mode} isTouch={isTouch} onResume={onResume} />
            )}
            {meta.mode === 'GAME_OVER' && (
              <ResultModal
                skin={meta.skin ?? 'solgaleo'}
                warpName={meta.lastWarpName ?? ''}
                encounterName={meta.lastEncounterName ?? ''}
                encounterImage={meta.lastEncounterImage ?? ''}
                onRetry={onRetry}
              />
            )}
          </>
        )}
        </div>
      </div>
      {loadError && <div className="error">データ読み込みエラー: {loadError}</div>}
    </div>
  )
}
