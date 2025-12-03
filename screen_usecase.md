# 画面別ユースケース整理

## 目的
画面遷移図の各画面で必要となるデータ／操作を一覧化したドキュメント

## サマリーテーブル
| 画面 | 参照PNG | 主目的 | 必要データ／操作 | 優先度 |
| --- | --- | --- | --- | --- |
| ログイン | `login.png` | 既存ユーザーが認証 | email+password送信、エラー表示、JWT保管 | ★★★ |
| 新規登録 | `Registration.png` | アカウント作成 | name/email/password登録、重複チェック | ★★ |
| プロジェクト一覧 | `Project_home1.png`, `Project_home2.png` | 所属プロジェクトの確認・検索 | プロジェクトカード、検索/フィルタ、通知バッジ | ★★★ |
| プロジェクト詳細 | `Project1-5.png`, `Project_home*.png` | プロジェクト情報と各タブ（シーン/ライブラリ等）操作 | プロジェクト基本情報、タブごとのサマリ、Unity埋め込み設定 | ★★★ |
| Stage（Unity埋め込み） | `Stage.png` | ステージ形状の選択 | Unity WebGL表示、ステージプリセット選択、選択結果の保存・反映 | ★★ |
| シーンエクスポート | `Exported1.png`, `Exported2.png` | シーン出力確認 | シーンデータ、CSV/スクショURL、ダウンロード実行 | ★ |
| コメント | `Comment1.png`, `Comment2.png` | プロジェクトコメントの閲覧・投稿 | コメント一覧、投稿フォーム、既読表示 | ★★ |
| 通知 | `notification.png` | アプリ通知の確認 | 通知一覧、既読操作、紐づくリンク | ★ |
| ライブラリ | `library.png` | アセット参照 | アセット一覧、プレビュー、メタ情報 | ★ |
| ユーザープロフィール | `UserProfile.png` | 個人設定変更 | 表示名、アバター、通知設定 | ★ |

---

## 詳細

### 1. ログイン画面 (`login.png`)
- **目的**: 既存ユーザーが認証してアプリに入る。
- **操作**: email/password入力 → サブミット → 成功時にトークン保存＆リダイレクト、失敗時にエラー表示。
- **データ**:
  - 入力値: `email`, `password`。
  - 応答: `user`, `accessToken`, `refreshToken`, エラーメッセージ。
- **メモ**: 「次回から自動ログイン」チェック有無でrefresh token保存方法を定義。

### 2. 新規登録画面 (`Registration.png`)
- **目的**: 新規アカウントを作成。
- **操作**: name/email/password登録、規約同意チェック。
- **データ**:
  - 入力: `name`, `email`, `password`, `confirmPassword`。
  - 応答: `user`, `token` もしくはログイン画面へ遷移。
- **バリデーション**: パスワード強度、メール重複チェック、エラーメッセージ表示領域。

### 3. プロジェクト一覧（ホーム） (`Project_home1.png`, `Project_home2.png`)
- **目的**: 所属するプロジェクトを一覧で確認＆検索。
- **UI要素**: プロジェクトカード（サムネイル、更新日、シーン数）、検索バー、フィルタ、通知数。
- **データ**:
  - 一覧: `id`, `name`, `updatedAt`, `thumbnailUrl`, `sceneCount`, `unreadComments`。
  - フィルタ条件: `search`, `status`, `sort`, `limit/offset`。
- **操作**: プロジェクト新規作成ボタン、カードクリックで詳細へ。

- **目的**: プロジェクトの詳細操作一式（概要、ライト調整、シーンリスト、共有）をタブ構成で提供。
- **共通データ**:
  - `projectId`, `projectName`, `owner`, `members`, `currentScene`, `timecode`。
  - ナビゲーション状態: 選択タブ、通知件数。
- **共通操作**: 上部メニュー（共有、メンバー、コメント）操作、タブ切替、Unityビューの埋め込み。

#### Project1: 概要タブ
- **UI特徴**: 左にUnityビュー、右上にライト設定の概要、右下にメモ欄。
- **目的**: プロジェクト全体のステージ状態を俯瞰し、ライト設定サマリとメモを確認。
- **データ**:
  - ライトサマリ: `lightType`, `intensity`, `color`, `positionSummary`。
  - メモ: `notes`, `updatedBy`, `updatedAt`。
- **操作**: メモ編集、ライトサマリ表示、Unityビューの再生/停止、上部でシーン名・タイムコード変更。

#### Project2: ライト調整タブ（スライダー一覧）
- **UI特徴**: 右側に複数スライダー（SS/BS等）とカラー選択、オン/オフスイッチ。
- **目的**: 複数ライトの強度・色を個別に操作しUnityへ即時反映。
- **データ**:
  - `lights[]`: `{ id, label, description, intensity(0-100), color, enabled, infoTooltip }`。
- **操作**: スライダー操作で intensity 更新、カラーPicker、infoボタンで説明表示、オン/オフスイッチ。
- **連携**: 各操作を postMessage 経由でUnityへ送信し、保存時にはまとめて lightState としてAPIへ送信。

#### Project3: ライト詳細ヘルプタブ
- **UI特徴**: Project2と同じレイアウトだが、各ライトにヒントツールチップ。
- **目的**: ライトの役割（例: サイドスポット）を説明しつつ調整できるようにする。
- **データ**:
  - `lights[].tooltip`: 役割説明、日本語テキスト。
- **操作**: infoアイコンやラベルホバーでツールチップ表示。その他操作はProject2と同様。
- **備考**: API側ではライトメタ情報（名称、説明）を別テーブルで提供し、React側でマージ。

#### Project4: シーン一覧タブ
- **UI特徴**: シーンカード縦並び（サムネイル＋メモ）。右下にエクスポートボタン。
- **目的**: 過去シーンを一覧で閲覧し、任意シーンを読み込み／エクスポート。
- **データ**:
  - `scenes[]`: `{ id, name, timestamp, thumbnailUrl, lightSummary, memo }`。
- **操作**: シーンカードクリックで詳細に遷移、エクスポートボタンでCSV/画像出力、並べ替えや検索（必要に応じて）。
- **備考**: `GET /api/scenes?projectId=` の結果と紐付け。

#### Project5: 共有タブ
- **UI特徴**: 画面右上に共有ポップアップ（メール入力、共有リンク表示）。
- **目的**: プロジェクトURLをチームメンバーと共有、メール送信。
- **データ**:
  - `shareLink`, `inviteEmail`, `accessLevel`。
- **操作**: メール入力→送信、リンクのコピー、アクセス権設定（将来拡張）。
- **備考**: Express側で `/api/projects/:id/share` (POST) 等を用意し、メール送信は別サービスを想定。

### 5. Stage画面 (`Stage.png`)
- **目的**: Unity WebGLでステージ全景を表示し、Stage1〜4などの形状プリセットのみを選択して他画面（ライト調整タブなど）に反映させる。
- **データ**:
  - 表示: `stagePresetList`（`id`, `name`, `thumbnail`, `description`）。
  - 保存: `projectId`, `stagePresetId`（選択結果）、`updatedAt`。
- **操作**: ステージ選択ボタン（Stage1〜Stage4）、選択状態のハイライト、決定ボタン（必要なら）。
- **連携**: 選択したステージIDのみをUnityへ postMessage で通知し、照明情報は保持しない。ライト数・明るさは他画面（Project2/3タブ）で扱う。

### 6. シーンエクスポート (`Exported1.png`, `Exported2.png`)
- **目的**: シーンをCSVやスクショでエクスポート。
- **データ**:
  - `sceneId`, `exportType`, `downloadUrl`, `metadata`。
- **操作**: プレビュー表示、ファイルダウンロード、エクスポート履歴。

### 7. コメント (`Comment1.png`, `Comment2.png`)
- **目的**: プロジェクト内のコメント確認・投稿。
- **データ**:
  - 一覧: `commentId`, `author`, `body`, `createdAt`, `isUnread`。
  - 投稿: `body`, `attachments?`。
- **操作**: 無限スクロールまたはページング、既読処理。

### 8. 通知 (`notification.png`)
- **目的**: アプリ全体の通知を確認し、既読にする。
- **データ**:
  - `notificationId`, `type`, `title`, `description`, `isRead`, `linkedResource`。
- **操作**: 一覧表示、既読ボタン、詳細ページへのリンク。

### 9. ライブラリ (`library.png`)
- **目的**: 登録済みアセット（ライト、ステージ素材）の参照。
- **データ**:
  - `assetId`, `name`, `category`, `previewUrl`, `tags`, `updatedAt`。
- **操作**: 検索、タグフィルタ、詳細モーダル。

### 10. ユーザープロフィール (`UserProfile.png`)
- **目的**: 個人設定（表示名・通知設定）を変更。
- **データ**:
  - `displayName`, `email`, `avatarUrl`, `notificationPreference`。
- **操作**: 画像アップロード、設定保存、パスワード変更リンク。

---

## 次のステップ
1. このユースケース表を基に API と画面の対応表（Action 2）を作成。
2. 優先ユースケース（ログイン・プロジェクト一覧・シーン保存）から詳細API仕様テンプレートを埋める。
