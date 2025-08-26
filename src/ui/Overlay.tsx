import React from 'react'

type Mode = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'

export default function Overlay({ mode, isTouch, onResume }: { mode: Mode; isTouch: boolean; onResume: () => void }) {
  const text = isTouch ? '画面をタッチして上下に移動' : 'マウスで上下に移動'
  return (
    <div className="overlay">
      <div className="panel">
        <h3>{mode === 'PAUSED' ? '一時停止' : 'メニュー'}</h3>
        <p>{text}</p>
        {mode === 'PAUSED' && (
          <div className="row">
            <button onClick={onResume}>再開</button>
          </div>
        )}
      </div>
    </div>
  )
}

