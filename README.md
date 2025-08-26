# Ultra Warp-Ride Browser Game
## ゲーム概要
- ウルトラワープライドをイメージしたブラウザゲーム
- マウスまたはタップした座標に自機が追尾する
- ダメージを受けたりエネルギーを補給するとスピードが変化
- ワープホールに入るとゲーム終了

## ローカル起動手順

- 前提: Node.js 18 以上を推奨（LTS 推奨）。確認コマンド: `node -v`, `npm -v`
- 初回セットアップ:
  - 依存関係を導入: `npm i`
- 開発サーバ起動:
  - `npm run dev`
  - 既定URL: `http://localhost:5173`（Vite 既定ポート。占有時は自動で代替ポートに割当）
- 本番ビルド:
  - `npm run build` → `dist/` に成果物出力
  - 動作確認（静的プレビュー）: `npm run preview` → 表示されたURLにアクセス

### アセット配置（GIF）
- スキン画像（必須）:
  - `public/images/skin-solgaleo.gif`
  - `public/images/skin-lunala.gif`
- ポケモン画像（抽選結果表示）:
  - `public/images/pokemon/*.gif`
  - ファイル名は `public/data/warp_tables.json` の `image` フィールドと一致させる

### よくあるトラブルと対処
- 画像が表示されない: パスと拡張子（.gif）を確認。ブラウザのNetworkタブで 404 が出ていないか確認
- `warp_tables.json` が 404: 配置パスは `public/data/warp_tables.json` であることを確認
- TypeScript 型エラー: `npm i` が完了しているか、`tsconfig.json` を改変していないか確認
- ポートが使用中: `npm run dev` 実行時にViteが代替ポートを提示します。URLをそのポートに変更


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
