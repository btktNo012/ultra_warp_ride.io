import React from 'react'
import { SkinId } from '../core/types'

export default function SkinSelect({ onPlay }: { onPlay: (skin: SkinId) => void }) {
  const base = import.meta.env.BASE_URL || '/'
  return (
    <div className="overlay">
      <div className="panel">
        <h3>プレイヤー選択</h3>
        <div className="skins">
          <button onClick={() => onPlay('solgaleo')}>
            <img src={`${base}images/skin-solgaleo.gif`} alt="Solgaleo" />
            <div>ソルガレオ</div>
          </button>
          <button onClick={() => onPlay('lunala')}>
            <img src={`${base}images/skin-lunala.gif`} alt="Lunala" />
            <div>ルナアーラ</div>
          </button>
        </div>
      </div>
    </div>
  )
}
