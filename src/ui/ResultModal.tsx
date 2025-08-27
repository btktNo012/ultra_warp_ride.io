import React from 'react'
import { SkinId } from '../core/types'

const skinLabel: Record<SkinId, string> = {
  solgaleo: 'ソルガレオ',
  lunala: 'ルナアーラ',
}

export default function ResultModal({ skin, warpName, encounterName, encounterImage, onRetry }: { skin: SkinId; warpName: string; encounterName: string; encounterImage: string; onRetry: () => void }) {
  const base = import.meta.env.BASE_URL || '/'
  return (
    <div className="result">
      <div className="panel">
        <h3>{skinLabel[skin]}とともに{warpName}にたどり着いた！</h3>
        <div>
          {encounterImage ? (
            <img src={`${base}images/pokemon/${encounterImage}`} alt={encounterName} />
          ) : (
            <div style={{ width: 180, height: 180, background: '#0a111a', display: 'grid', placeItems: 'center' }}>
              画像なし
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 8 }}> {encounterName}と出会った！</div>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button onClick={onRetry}>もう一度</button>
        </div>
      </div>
    </div>
  )
}
