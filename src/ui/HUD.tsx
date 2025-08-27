import React from 'react'

export default function HUD({ follow, score, time }: { follow: number; score: number; time: number }) {
  const pct = Math.max(0, Math.min(1, (follow - 0.25) / (2.0 - 0.25)))
  return (
    <div className="hud">
      <div>パワー：</div>
      <div className="gauge">
        <span style={{ width: `${Math.floor(pct * 100)}%` }} />
      </div>
      <div style={{ marginLeft: 8 }}>スコア: {score}光年</div>
    </div>
  )
}
