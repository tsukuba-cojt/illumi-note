# Illumi-note

Illuminote は、ステージ照明のプランニングとビジュアライズを支援する Web アプリケーションです。Unity WebGL によるレンダリングと React 製フロントエンドを組み合わせ、プロジェクト単位のライトシーン管理やユーザー認証機能を提供します。

## 主な機能
- ログイン / 新規登録 / ログアウトによる簡易認証機能（メール・パスワード）
- プロジェクト・シーンの一覧表示と詳細編集画面
- Unity WebGL を用いたライトシーンのプレビュー描画
- プロフィール編集とローカル JSON への永続化
- 通知やステージ選択など将来的な拡張ページの雛形

## 技術スタック
- 言語: JavaScript（フロントエンド）, TypeScript（バックエンド）
- フロントエンド: React 19, Vite, React Router, Unity WebGL 連携
- スタイリング: プレーン CSS（`App.css` / `index.css`）
- バックエンド: Hono (Node.js)

## リポジトリ構成
- `backend/`: Hono ベースの API サーバー。
  - `src/index.ts`: 認証・プロフィール・ライト設定 API を定義するエントリポイント。
  - `data/`: ユーザー情報やライト設定を保持する JSON ファイル群。
  - `docker-compose.yml`: MySQL 開発用コンテナ定義（将来の DB 移行を想定）。
- `frontend/`: React + Vite による SPA。
  - `src/pages/`: ログイン、プロジェクト一覧などのページコンポーネント。
  - `src/layouts/`: 認証レイアウトとメインレイアウトのラッパー。
  - `src/api/`: 認証 API との通信ヘルパー。
  - `src/unity.js` / `src/UnityRoot.jsx`: Unity WebGL の初期化と表示制御ロジック。
  - `public/WebGLBuild/`: Unity のビルド成果物を配置するディレクトリ。
- `README.md`: このドキュメント。

## セットアップ
### 前提条件
- Node.js 20 以降（推奨）
- npm 10 以降

### 1. バックエンドの起動
```bash
cd backend
npm install
npm run dev
```
- デフォルトで `http://localhost:3000` が起動します。
- `backend/src/index.ts` 内で `/api` 以下のエンドポイントとファイルベースのデータ永続化を提供しています @backend/src/index.ts#42-372。

### 2. フロントエンドの起動
```bash
cd frontend
npm install
npm run dev
```
- デフォルトで `http://localhost:5173` が起動します。
- `frontend/.env` の `VITE_API_BASE_URL` は API サーバーを指すように設定してください（初期値: `http://localhost:3000/api`）。
- Vite 開発サーバーは `vite.config.js` のプロキシ設定により `/api` をバックエンドへ転送します。`VITE_API_PROXY_TARGET` で上書き可能です @frontend/vite.config.js#1-21。

### 3. ブラウザでアクセス
- フロントエンド起動後、`http://localhost:5173` へアクセスするとログイン画面が表示されます @frontend/src/App.jsx#20-41。
- 新規登録実行後は自動的にプロジェクト一覧へ遷移します。

## 環境変数
| 変数名 | 定義場所 | 説明 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `frontend/.env` | フロントエンドから直接 fetch する API エンドポイントのベース URL。 |
| `VITE_API_PROXY_TARGET` | システム環境変数 | Vite の開発サーバープロキシが参照するバックエンド URL。未設定時は `http://192.168.17.45:3100` を利用します @frontend/vite.config.js#6-19。 |
| `HOST`, `PORT` | バックエンド | `serve` 呼び出し時に参照され、API サーバーの待受アドレス/ポートを制御します @backend/src/index.ts#374-383。 |

## API 概要
| メソッド | パス | 説明 |
| --- | --- | --- |
| `POST` | `/api/auth/register` | ユーザー登録。入力バリデーションと重複チェックを実行します。 |
| `POST` | `/api/auth/login` | ログイン。トークン（疑似値）とユーザーデータを返却します。 |
| `POST` | `/api/auth/logout` | 現在のユーザー情報をリセットします。 |
| `GET` | `/api/profile` | アクティブユーザーのプロフィール取得。 |
| `PUT` | `/api/profile` | プロフィール更新とパスワード変更。 |
| `GET` | `/api/projects/:projectId/scenes/:sceneId/light` | ライト設定 JSON を取得。 |
| `PUT` | `/api/projects/:projectId/scenes/:sceneId/light` | ライト設定 JSON を保存。 |
| `GET` | `/api/health` | ヘルスチェック。 |

詳細実装は `backend/src/index.ts` を参照してください @backend/src/index.ts#42-372。

## データ永続化
- バックエンドは `backend/data/` 配下に JSON ファイルを保存します。
  - `auth/users.json`: 登録済みユーザー一覧 @backend/src/index.ts#199-260
  - `auth/current-user.json`: 現在ログイン中のユーザー ID @backend/src/index.ts#215-236
  - `profile/user.json`: プロフィール情報 @backend/src/index.ts#238-254
  - `light/<projectId>/<sceneId>.json`: ライト設定 @backend/src/index.ts#169-317
- 初回起動時は必要なディレクトリを自動生成します。

## フロントエンド構成
- ルーティングは `App.jsx` で定義されています。認証系とメインレイアウトを分離し、`/projects` 以下に主要機能が集約されています @frontend/src/App.jsx#20-38。
- Unity WebGL の描画キャンバスは `UnityRoot.jsx` と `unity.js` で管理され、対象ページでのみ初期化されます @frontend/src/UnityRoot.jsx#5-73。
- API との通信は `src/api/auth.js` の薄いラッパーを通じて行います @frontend/src/api/auth.js#1-41。

## Docker
`backend/docker-compose.yml` には MySQL 8 のコンテナ定義が含まれていますが、現状の実装はファイルベースのストレージを使用しており、MySQL への依存はありません。今後の拡張時に活用できます @backend/docker-compose.yml#1-21。

## 開発時のヒント
1. 認証状態は `localStorage` に保存され、ログアウト時にクリアされます @frontend/src/pages/LoginPage.jsx#18-38 @frontend/src/components/navigation/SideNav.jsx#7-38。
2. プロジェクト・シーンのモックデータは `frontend/src/mock/projects.js` 内に定義されています。必要に応じて API 連携へ置き換えてください。
3. Unity ビルドアセットは `public/WebGLBuild` と `public/StreamingAssets` に配置する想定です。`initUnity` の設定を変更することで差し替え可能です @frontend/src/UnityRoot.jsx#51-66。

## ライセンス
本リポジトリのライセンスが未定の場合は、チーム方針に従って `LICENSE` ファイルを追加してください。
