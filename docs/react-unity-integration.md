# React と Unity の連携まとめ

## 概要
Illuminote では、Unity WebGL でビルドしたライティングシミュレータを React アプリに埋め込み、対象ページでのみキャンバスを表示している。フロントエンド側で Unity の初期化とキャンバス制御を行い、Router と連携した表示制御やプレビュー用途で再利用できるコンポーネントを用意している。

## 初期化フロー
- `src/unity.js` で共有の `<canvas>` 要素 `unityCanvas` を生成し、`createUnityInstance` を通じて Unity WebGL ビルドを 1 度だけ読み込む。`initUnity` は複数回呼び出されても二重初期化を防ぐ。
- Unity にライト設定を適用し、フレーム描画完了を待ってスクリーンショットを取得する補助関数 `renderOnUnity` もここで提供。

## React との連携レイヤー
- `src/UnityRoot.jsx` は React Router の現在パスを監視し、プロジェクト詳細やステージ画面など対象ルートに遷移したときだけ `initUnity` を呼び出す。
- `UnityRoot` はターゲットルート以外では `null` を返し、Unity キャンバスを非表示にするためのクラスを付与。
- `src/UnityContainer.jsx` は `unityCanvas` を指定コンテナへ挿入し、表示状態に応じてサイズ調整や `hidden` クラスの付け外しを行う。

## ページでの利用例
- プロジェクト詳細ページでは Unity プレビュー領域に `UnityContainer` を配置し、ライト調整結果をリアルタイム表示。
- ステージ一覧画面でも Unity プレビューカードに `UnityContainer` を挿入。