# Ultra Warp-like Browser Game — React + TypeScript + Canvas 指示書

この `.md` を Codex CLI へ渡して、**React + TypeScript + Canvas** 構成のプロジェクトを生成させる。以下の仕様・フォルダ構成・型・アルゴリズム・コンポーネント分割・受け入れ基準に従って実装すること。

---

## 目的 / 概要

- 『USUM』の「ウルトラワープライド」をイメージした**横スクロール**ゲーム。

- **自機**は上下のみ移動（左右へは動かない）。右から流れてくる**危険物**と**エネルギー**、**ワープホール**を生成。

- **追尾力（followStrength）**：マウス（PC）／タップ位置（スマホ）へ向かう力。ダメージで低下、エネルギー取得で上昇。

- **ワープホール吸引**：自機へ引力。触れたら**ゲーム終了**。

- **スマホ入力**：マウスではなく **タッチ座標**に追尾。

- **スキン選択**：開始前に2種類（例：Solgaleo / Lunala）の画像から選択。

- **ワープホール**：色5種（赤・青・黄・緑・白）×**レア度4段階**。スコア上昇とともに**高レア出現率が増加**。

- **ゲーム終了時の抽選表示**：最初に選んだ**自機スキン**と**ワープホール（色・レア度）**に応じて「出会ったポケモン」を抽選し、画像を表示。  
  抽選テーブルは**JSON**で管理（ワープホール名、色、レア度、スキン別の出現テーブル：ポケモン名、画像ファイル名、出現確率）。

---

## 技術スタック

- **Vite** + **React 18** + **TypeScript**

- 描画：**Canvas 2D API**（`requestAnimationFrame` / delta-time）

- 状態管理：React hooks（`useState`, `useRef`, `useEffect`, `useReducer`）

- 依存：できるだけ標準のみ。外部ゲームエンジンは使わない。

---

## フォルダ構成

ultra-warp/
├─ public/
│  ├─ index.html
│  ├─ images/
│  │  ├─ skin-solgaleo.png
│  │  ├─ skin-lunala.png
│  │  └─ pokemon/   # 抽選表示用
│  │     ├─ mewtwo.png
│  │     ├─ kyogre.png
│  │     └─ ...
│  └─ data/
│     └─ warp_tables.json   # ワープホール定義＋抽選テーブル
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ core/
│  │  ├─ types.ts
│  │  ├─ constants.ts
│  │  ├─ rng.ts
│  │  ├─ physics.ts
│  │  ├─ spawner.ts
│  │  └─ probabilities.ts
│  ├─ game/
│  │  ├─ GameCanvas.tsx
│  │  ├─ renderer.ts
│  │  └─ loop.ts
│  ├─ ui/
│  │  ├─ HUD.tsx
│  │  ├─ Overlay.tsx
│  │  ├─ SkinSelect.tsx
│  │  └─ ResultModal.tsx
│  ├─ data/
│  │  └─ loadWarpTables.ts
│  └─ styles.css
├─ package.json
├─ tsconfig.json
└─ README.md

---

## ゲーム状態マシン

- `MENU`（スキン選択画面）

- `PLAYING`

- `PAUSED`（オーバーレイで再開可）

- `GAME_OVER`（結果表示：抽選ポケモン）

状態は `useReducer` で管理。`GameState` にはスコア、タイム、followStrength、選択スキン、最後に触れたワープホール情報などを持たせる。

---

## 入力仕様

- **PC**：`mousemove`（キャンバス相対座標）。自機は上下のみ移動するため、**目標Y**に追尾。X は固定（例：全体幅の 25%）。

- **スマホ**：`touchstart` / `touchmove` の **タッチY**に追尾。マウス入力は無効化。

- 追尾力は `followStrength`。ステアリング加速度 `accel = k * followStrength` で Y 速度を更新。

---

## 物理・座標系

- スクロール速度：`WORLD_SPEED`（px/sec）。**背景とオブジェクトは左方向へ流れる**。

- 自機：
  
  - 位置 `(playerX, playerY)`、速度 `vy` のみ使用（横は固定）。
  
  - `playerX = VIEWPORT_WIDTH * 0.25` 固定。
  
  - 更新：`vy += clamp((targetY - playerY), -1, 1) * ACCEL * followStrength * dt`
  
  - `playerY += vy * dt`、ダンピング `vy *= DAMPING`
  
  - 上下端でクリップ。

- ワープ引力：ワープ中心との距離に応じて**Y方向**へ引力。  
  ※ 自機は横移動しないため、引力は **Y成分のみ**適用して吸い寄せを表現。

- 当たり判定：円 × 円（`(dx^2 + dy^2) <= (r1+r2)^2`）。  
  自機は `(playerX, playerY, r)`、相手は `(x, y, r)`。

---

## オブジェクト種別と効果

- **hazard（危険物）**：接触で `followStrength += damageDelta (<0)`、iフレームあり

- **energy（エネルギー）**：接触で `followStrength += energyDelta (>0)`

- **warp（ワープホール）**：
  
  - 色：`red` | `blue` | `yellow` | `green` | `white`
  
  - レア度：`1..4`（高いほど派手・強吸引でも可）
  
  - 接触で **GAME_OVER**。接触時の **色・レア度**を結果へ記録。

---

## スポーンとレアリティ

- 毎フレーム、Poisson 近似で **hazard / energy / warp** を生成。

- **warp** の出現は、スコアとともに**高レア優遇**。

- レア度分布例（スコア `S` を 0..∞ で正規化した `p = clamp(S / S_MAX, 0, 1)`）：

| レア度 | 重み関数の例                     |
| --- | -------------------------- |
| 1   | `w1 = (1 - p) * 0.6 + 0.1` |
| 2   | `w2 = 0.3 + 0.4 * p`       |
| 3   | `w3 = 0.08 + 0.35 * p^1.3` |
| 4   | `w4 = 0.02 + 0.15 * p^2.0` |

正規化してルーレット選択。**色**は等確率（またはわずかに白を稀少化）。

---

## データモデル（TypeScript）

```
// src/core/types.ts
export type SkinId = 'solgaleo' | 'lunala';

export type WarpColor = 'red' | 'blue' | 'yellow' | 'green' | 'white';
export type Rarity = 1 | 2 | 3 | 4;

export interface PokemonEntry {
  name: string;            // 表示名
  image: string;           // public/images/pokemon/ 内のファイル名
  weight: number;          // 出現確率（重み）
}

export interface SkinEncounterTable {
  skin: SkinId;
  encounters: PokemonEntry[]; // 重み付きリスト
}

export interface WarpHoleDef {
  id: string;              // 例: "white-4"
  name: string;            // 例: "ウルトラホワイト★4"
  color: WarpColor;
  rarity: Rarity;
  skins: SkinEncounterTable[]; // スキン別テーブル
}

export interface WarpTablesFile {
  version: number;
  warps: WarpHoleDef[];
}

```

---

## JSON 例（`public/data/warp_tables.json`）

```
{
  "version": 1,
  "warps": [
    {
      "id": "red-1",
      "name": "ウルトラレッド★1",
      "color": "red",
      "rarity": 1,
      "skins": [
        {
          "skin": "solgaleo",
          "encounters": [
            { "name": "ヒードラン", "image": "heatran.png", "weight": 60 },
            { "name": "グラードン", "image": "groudon.png", "weight": 40 }
          ]
        },
        {
          "skin": "lunala",
          "encounters": [
            { "name": "ラティアス", "image": "latias.png", "weight": 50 },
            { "name": "ラティオス", "image": "latios.png", "weight": 50 }
          ]
        }
      ]
    },
    {
      "id": "white-4",
      "name": "ウルトラホワイト★4",
      "color": "white",
      "rarity": 4,
      "skins": [
        {
          "skin": "solgaleo",
          "encounters": [
            { "name": "ミュウツー", "image": "mewtwo.png", "weight": 50 },
            { "name": "レックウザ", "image": "rayquaza.png", "weight": 50 }
          ]
        },
        {
          "skin": "lunala",
          "encounters": [
            { "name": "パルキア", "image": "palkia.png", "weight": 50 },
            { "name": "ルギア", "image": "lugia.png", "weight": 50 }
          ]
        }
      ]
    }
  ]
}

```

> 5色×4レア度＝計20定義を用意。画像ファイルは `public/images/pokemon/` に配置。

---

## 主要定数（`src/core/constants.ts`）

```
export const VIEW_W = 960;
export const VIEW_H = 540;

export const WORLD_SPEED = 240; // px/s

export const PLAYER_X = VIEW_W * 0.25;
export const PLAYER_RADIUS = 16;
export const PLAYER_DAMPING = 0.96;
export const PLAYER_ACCEL_BASE = 800;  // 追尾加速度の基準

export const FOLLOW_MIN = 0.25;
export const FOLLOW_MAX = 2.0;
export const FOLLOW_INIT = 1.0;

export const DAMAGE_DELTA = -0.25;
export const ENERGY_DELTA = +0.20;
export const IFRAME_SEC = 0.30;

export const SPAWN_RATE_HAZARD = 0.9;  // per sec
export const SPAWN_RATE_ENERGY = 0.6;  // per sec
export const SPAWN_RATE_WARP   = 0.25; // per sec

export const HAZARD_R = 14;
export const ENERGY_R = 12;
export const WARP_R   = 28;
export const WARP_GRAVITY_RADIUS = 180;
export const WARP_GRAVITY_STRENGTH = 65000; // 引力係数（Y方向のみに適用）

```

---

## ループ／描画

- `requestAnimationFrame` で `update(dt)` → `render(ctx)`。

- HiDPI 対応（CSSピクセルとキャンバス実ピクセルのスケーリング）。

- レイヤ：
  
  1. 背景（星層・パララックス）
  
  2. オブジェクト（warp → energy → hazard）
  
  3. 自機（スキン画像の drawImage、被弾フラッシュ）
  
  4. HUD（React DOM）

`GameCanvas.tsx` で `canvas` を `ref` し、`useEffect` でループ開始。UI は別コンポーネントで React が制御。

---

## スポーンロジック（`src/core/spawner.ts`）

- 各種 `carry += rate * dt`、`carry >= 1` で生成。

- 生成位置：`x = VIEW_W + margin`、`y = rand(padding, VIEW_H - padding)`。

- 速度：オブジェクト自身の `vx` は小さく、実質は背景スクロールで左へ流れる。  
  自機が上下のみなので、**危険物／エネルギーは Y に少し揺らぎ**を持たせる。

---

## 追尾・引力の計算（`src/core/physics.ts`）

- **追尾**：目標Yとの差 `dy = targetY - playerY` を `sign(dy)` で向きだけ取り、  
  `vy += sign(dy) * PLAYER_ACCEL_BASE * followStrength * dt`

- **速度制限**：`|vy| <= V_MAX(followStrength)`。追尾力が低いほど抗力が弱い挙動になる。

- **ワープ引力**：ワープ中心 `(wx, wy)` との `dy = wy - playerY`、距離二乗 `d2` を計算し、  
  `vy += dy * (WARP_GRAVITY_STRENGTH / (d2 + 100)) * dt` を **Y成分だけ**適用。  
  適用は `d2 < WARP_GRAVITY_RADIUS^2` のとき。

---

## HUD / UI

- `SkinSelect.tsx`：2枚のスキン画像から選択（Solgaleo / Lunala）。選択後 `PLAY`。

- `HUD.tsx`：スコア、時間、追尾力ゲージの表示。

- `Overlay.tsx`：`PAUSED` / `MENU` の説明・操作切替（PC/スマホは自動判定で表示を変える）。

- `ResultModal.tsx`：ゲーム終了時、**ワープホール（色・レア度）**と**選択スキン**に基づく抽選結果（ポケモン名・画像）を表示。**再プレイ**ボタン。

---

## JSON ロードと抽選（`src/data/loadWarpTables.ts`, `src/core/probabilities.ts`）

1. 起動時（または初回ゲーム開始時）に `fetch('/data/warp_tables.json')`。

2. `WarpHoleDef[]` を `Map` 化（`id` や `(color, rarity)` 検索に高速アクセス）。

3. **結果抽選**：`(color, rarity, skin)` → `encounters` を取得。`weight` によるルーレット選択で1体決定。

4. **レア度選出**：スコアに応じた重みからレア度を選択 → 色を選択 → ワープ生成。

---

## 終了時のロジック

- 自機がワープホールに接触した瞬間：
  
  - `lastWarp = { color, rarity, id }` を記録。
  
  - `skin` は開始時選択済み。
  
  - `drawEncounter(skin, lastWarp)` を呼び、JSONテーブルから1体抽選。
  
  - `GAME_OVER` に遷移し `ResultModal` 表示。

---

## アセット差し替え

- 自機スキン：`public/images/skin-solgaleo.png`, `public/images/skin-lunala.png`  
  透過PNG、基準サイズは任意（Canvas 側で `drawImage` 時に縮尺）。

- ポケモン画像：`public/images/pokemon/*.png`  
  JSONの `image` フィールドと一致させる。

---

## 開発スクリプト（`package.json` 例）

```
{
  "name": "ultra-warp",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  }
}

```

`tsconfig.json` は Vite の標準で良い（`jsx: "react-jsx"`）。Canvas 用に `dom` lib を含める。

---

## 受け入れ基準（Acceptance Criteria）

1. **上下のみ移動**：PC マウスでキャンバス上を動かすと、自機は **X 固定**で **Y のみ追尾**する。スマホでは **タッチ位置Y** に追尾。

2. **追尾力の可変**：`hazard` 接触で低下、`energy` 接触で上昇。HUD のゲージと数値が更新される。

3. **ワープ吸引**：ワープ近傍で Y 方向引力が働き、**追尾力が低いほど**吸引に抗しにくい。

4. **ワープ接触で終了**：接触時に `GAME_OVER`。結果モーダルに **選択スキン**・**最後のワープ（色・レア度）**に応じた**抽選ポケモン名と画像**が表示される。

5. **レア度エスカレーション**：スコア上昇で高レアの出現確率が上がる（テスト用にスコア操作のデバッグフックを用意しても良い）。

6. **スキン選択**：タイトル（MENU）で 2 枚のスキンから選べる。選択がゲーム中の自機表示に反映される。

7. **フレーム安定**：`requestAnimationFrame`＋delta-time。画面サイズ変更で HiDPI に追随。

8. **型安全**：`src/core/types.ts` に基づき TypeScript で実装。`any` は原則禁止。

9. **JSON 管理**：`warp_tables.json` に 5色×4レア度のエントリが存在。抽選は JSON の `weight` を用いる。

---

## 実装メモ

- **モバイル判定**：`navigator.userAgent` ではなく、`ontouchstart in window` を優先。UI文言（操作説明）を切り替え。

- **iFrame**：被弾時は一定時間、同一フレームでの多重ヒットを防ぐ。

- **スクリーンシェイク**：被弾時に微小実装可（任意）。

- **パフォーマンス**：描画はパスを再利用し、グラデや影は最小限に。オブジェクト配列は**逆走査**でスプライス。

- **乱数**：`rng.ts` にシード可能な LCG 実装を置いても良い（リプレイ性が必要なら）。

---

## 最低限の関数シグネチャ（抜粋）

```
// physics.ts
export function updatePlayerY(
  playerY: number,
  vy: number,
  targetY: number,
  followStrength: number,
  dt: number
): { y: number; vy: number };

export function applyWarpGravityY(
  playerY: number,
  warps: { x: number; y: number; r: number }[],
  dt: number
): number; // 追加の vy 変化量を返す

// probabilities.ts
export function chooseRarity(score: number): Rarity;
export function chooseColor(): WarpColor;
export function drawEncounter(
  tables: WarpTablesFile,
  color: WarpColor,
  rarity: Rarity,
  skin: SkinId
): PokemonEntry;

```

---

## テスト観点（手動）

- 追尾力最小でワープ近傍に入ると、ほぼ回避不能になる。

- スコア 0 付近では★1中心、スコア上昇で★3〜4が増える。

- JSON のエントリを極端に変更すると抽選結果が反映される。

- スマホでタッチ移動がスムーズに動作する（上下のみ）。

---

## 今後の拡張（任意）

- 効果音／BGM（ミュート切替）

- 難易度カーブ（時間でスポーン率・引力強化）

- バフ／デバフ（一定時間 followStrength 上限突破、減衰など）

- スコア送信・ランキング

---

## 実装開始コマンド例（参考）

```

```

この指示書どおりに、コンポーネント・型・JSON・Canvas ループを実装すること。

---

## 付録A: 本リポジトリの実装メモ（再開用）

### 実装済みの主な変更
- Vite + React + TS で構築。`index.html` はリポジトリ直下。
- 画像は GIF 前提（スキン/ポケモン）。`public/data/warp_tables.json` は 5色×4レア度。
- GitHub Pages 対応: `vite.config.ts` の `base` は `/ultra_warp_ride.io/`。画像/JSON参照に `import.meta.env.BASE_URL` を使用。
- デプロイ: `.github/workflows/deploy.yml`（main push で `dist/` を Pages へ）。リポジトリ Settings → Pages → Source は GitHub Actions。
- 物理・描画の安定化:
  - 目標Yローパス（`TARGET_SMOOTH_TAU`）と速度上限（`PLAYER_VEL_MAX_BASE`）。
  - ワープ吸引は `followStrength` でスケール（高追尾時は弱く）。
  - 追尾力は自然減衰（`FOLLOW_DECAY_PER_SEC`）。
  - 背景はランダム星（3層パララックス、dt移動、整数ピクセル）。
  - ワープ視覚: レア2=リング1、レア3=リング2、レア4=リング2 + 外周6点固定。
  - バースト導入: `HAZARD_BURST_INTERVAL`/`DURATION`。バースト中は hazard のみ。倍率は `score` で `HAZARD_BURST_MULT..MAX` に補間。

### 主要定数（追加・調整）
- `PLAYER_VEL_MAX_BASE = 600`
- `TARGET_SMOOTH_TAU = 0.08`
- `FOLLOW_DECAY_PER_SEC = 0.015`
- `SCORE_RARITY_SMAX = 60000`
- `HAZARD_BURST_INTERVAL = 12`, `HAZARD_BURST_DURATION = 4`,
  `HAZARD_BURST_MULT = 3.0`, `HAZARD_BURST_MULT_MAX = 6.0`

### 既知の注意点
- `App.tsx` の Overlay 条件は `meta.mode === 'PAUSED'` のみ（型エラー解消済み）。
- 画像未配置時はプレースホルダ表示（実機では `public/images` に GIF を配置）。

### 次回TODO
- GIF最適化/サイズ調整（必要なら WebP 併用）。
- HUD の追尾力ゲージを内部値に厳密同期（現状は10Hz更新）。
- モバイル向け調整（入力感度・パフォーマンス）。
- 効果音/演出（バースト時の画面効果など）。
