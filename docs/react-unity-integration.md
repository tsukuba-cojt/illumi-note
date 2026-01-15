# React と Unity の連携まとめ

## 概要
Illuminote では、Unity WebGL でビルドしたライティングシミュレータを React アプリに埋め込み、対象ページでのみキャンバスを表示する仕組みを採用しています。フロントエンド側で Unity の初期化とキャンバス制御を行い、Router と連携した表示制御やプレビュー用途で再利用できるコンポーネントを用意しています。

## 初期化フロー
- `src/unity.js` で共有の `<canvas>` 要素 `unityCanvas` を生成し、`createUnityInstance` を通じて Unity WebGL ビルドを 1 度だけ読み込みます。`initUnity` は複数回呼び出されても二重初期化を防ぎます。
- Unity にライト設定を適用し、フレーム描画完了を待ってスクリーンショットを取得する補助関数 `renderOnUnity` もここで提供されます。

## React との連携レイヤー
- `src/UnityRoot.jsx` は React Router の現在パスを監視し、プロジェクト詳細やステージ画面など対象ルートに遷移したときだけ `initUnity` を呼び出します。また、フォーム入力時に Unity 側のキーハンドラに阻害されないよう、フォーム要素に対するキーボードイベントをバブリング前に止める処理を追加しています。
- `UnityRoot` はターゲットルート以外では `null` を返し、Unity キャンバスを非表示にするためのクラスを付与します。
- `src/UnityContainer.jsx` は `unityCanvas` を指定コンテナへ挿入し、表示状態に応じてサイズ調整や `hidden` クラスの付け外しを行います。リサイズ時はコンテナの幅から高さを算出し、非表示のときはデフォルト解像度 (900×640) を維持します。

## ページでの利用例
- プロジェクト詳細ページでは Unity プレビュー領域に `UnityContainer` を配置し、ライト調整結果をリアルタイム表示します。
- ステージ一覧画面でも Unity プレビューカードに `UnityContainer` を挿入し、他カードとの差別化を図っています。
- シーン一覧では見えない場所で `UnityContainer visible={false}` をレンダリングし、キャンバスを事前に初期化して必要時にすぐ差し込めるようにしています。

## Unity ビルド資産
- Unity WebGL のビルド成果物は `public/WebGLBuild` 配下に配置され、`initUnity` の設定で各ファイルを参照します。
- Vite の開発サーバーを利用する際も `public/` 下のファイルは自動的に配信されるため、Unity 側でビルドした `*.data`, `*.framework.js`, `*.wasm` をここに置くことで React からアクセスできます。

## 運用上の注意
1. `unityCanvas` は単一インスタンスのため、複数コンポーネントから参照する場合は常に `UnityContainer` を通じて append/remove することを推奨します。
2. 新しいページで Unity を表示したい場合は、`UnityRoot` の `shouldDisplay` 判定に対象ルートを追加し、レイアウト内で `UnityContainer` を配置してください。
3. Unity 側から `UnityFrameReady` イベントを発火できるようにし、`renderOnUnity` がフレームの完成を検知できる状態を維持してください。
