export const VIEW_W = 960
export const VIEW_H = 540

export const WORLD_SPEED = 480 // px/s

export const PLAYER_X = VIEW_W * 0.25
export const PLAYER_RADIUS = 16
export const PLAYER_DAMPING = 0.96
export const PLAYER_ACCEL_BASE = 800 // 追尾加速度の基準
export const PLAYER_VEL_MAX_BASE = 600 // 追尾の最大速度の基準（px/s）
export const TARGET_SMOOTH_TAU = 0.08 // 目標Yローパス時定数（秒）

export const FOLLOW_MIN = 0.25
export const FOLLOW_MAX = 2.0
export const FOLLOW_INIT = 1.0
export const FOLLOW_DECAY_PER_SEC = 0.015 // 何もしていないときの追尾力自然減衰量

export const DAMAGE_DELTA = -0.25
export const ENERGY_DELTA = +0.2
export const IFRAME_SEC = 0.3

export const SPAWN_RATE_HAZARD = 0.9 // per sec
export const SPAWN_RATE_ENERGY = 0.6 // per sec
export const SPAWN_RATE_WARP = 0.25 // per sec
// スコアに応じたエネルギー出現率の低下カーブ
export const ENERGY_SPAWN_MIN_FACTOR = 0.25 // スコア最大時の下限（通常比）
export const ENERGY_SPAWN_CURVE = 1.2 // 減少カーブ（>1で後半で強く低下）

// 一定周期で hazard だけが出現するバースト期間
export const HAZARD_BURST_INTERVAL = 12 // バースト間隔（秒）
export const HAZARD_BURST_DURATION = 4 // バースト継続時間（秒）
export const HAZARD_BURST_MULT = 3.0 // バースト中のhazard湧き倍率
export const HAZARD_BURST_MULT_MAX = 20.0 // スコア最大時の湧き倍率上限

export const HAZARD_R = 14
export const ENERGY_R = 12
export const WARP_R = 28
export const WARP_GRAVITY_RADIUS = 180
export const WARP_GRAVITY_STRENGTH = 30000 // 引力係数（Y方向のみに適用）

export const SCORE_RARITY_SMAX = 60000 // レア度用の正規化上限（任意）

// 表示用スコア倍率（ゲーム内部ロジックには影響しない）
export const SCORE_DISPLAY_SCALE = 0.1
