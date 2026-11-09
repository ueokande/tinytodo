# tiny

AndroidのChromeからホーム画面に追加できる、小さなToDo PWAです。アカウント登録・API・データベースは不要。項目の情報はタイトルだけです。

## 開発

Node.js 22.18以降（この環境では24）、pnpm 11.25.0を利用します。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

## 確認

```sh
pnpm check
pnpm typecheck
pnpm test
pnpm build
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium pnpm test:e2e
```

Chromiumが未インストールの場合は `pnpm exec playwright install chromium` を実行し、`pnpm test:e2e` で実行できます。上のコマンドはこのクラウド環境にインストール済みのChromiumを使います。

E2Eはタスク操作、保存、オフライン動作、下部入力欄、旧データ移行、ボードの切り替え・名前変更・削除・選択復元・保存失敗を確認します。

## Androidで利用

`pnpm build` で生成する `dist/` をHTTPSの静的ホスティングに配置します。ルート以外で公開するときは `VITE_BASE_PATH=/tinytodo/ pnpm build` のように配信パスを指定します。AndroidのChromeで開き、メニューの「ホーム画面に追加」または「アプリをインストール」を選びます。アプリ用サーバーの運用は不要ですが、初回配信には静的ホスティングが必要です。Service Workerは本番ビルドのみで有効です。

一度オンラインで読み込むとオフラインで起動・編集できます。リストは同じ端末・同じブラウザ・同じ配信元のlocalStorageに保存され、同期されません。ブラウザデータの消去、プライベートブラウズの終了、端末の紛失で失われる場合があります。

## 操作

- 左上のボード名から一覧を開いて切り替え。選択中のボードにチェックを表示
- 一覧の「＋ ボードを追加」で作成（名前は1〜40文字、同名不可）
- 各ボードの「⋮」から名前変更・削除。最後の1枚は削除不可
- 画面下部の固定入力欄でタイトルを入力し、↑またはキーボードの確定で追加（最大200文字）。追加後も続けて入力可能
- 項目を右にスワイプ、または丸いボタンで完了・未完了を切り替え
- 完了した項目は折りたたみ・まとめて削除可能
- タスクの完了や一括削除は7秒以内なら「元に戻す」で取り消し。ボード切り替え・追加操作後は取り消し通知を閉じる
- ボード削除は項目数を確認して実行し、取り消し不可
- 最後に開いたボードを保存。入力途中の文字はボード別に画面を開いている間のみ保持

旧バージョンのリストは初回起動時に「マイリスト」へ引き継ぎます。保存形式は `tiny.boards.v2` に移行し、元の `tiny.todos.v1` データは変更しません。新形式のデータが壊れている場合は上書きせず、変更操作を停止します。

外部フォント・解析・外部APIへの通信は行いません。

## コード構造

- `src/domain/todo.ts`: ToDoの型、タイトル検証、完了の切り替え（DOMや保存先に依存しない）
- `src/domain/board.ts`: ボードの型、追加・名前変更・削除と名前検証
- `src/storage/board-storage.ts`: ボードと選択状態の保存、旧データ移行と検証
- `src/storage/todo-storage.ts`: 旧リストの読み込みと項目の検証
- `src/ui/`: HTMLレイアウト、スワイプ可能な行、通知と取り消し、キーボード表示時の入力欄位置調整
- `src/app.ts`: 保存成功後に状態を反映する処理、ユーザー操作と各モジュールの接続
- `src/ui/todo-list.ts`: リストの描画・折りたたみと、更新前後のアニメーション
- `src/ui/dom.ts`: HTML要素の存在と型を検証する共通取得処理
- `src/ui/board-sheet.css`, `src/ui/motion.css`: ボードパネルとアニメーションのスタイル
- `src/main.ts`: 起動処理
- `scripts/build-sw.ts`: ビルド成果物からオフライン用Service Workerを生成
- `tests/`, `e2e/`: ロジック・保存の単体テストと実ブラウザテスト

TypeScriptはstrictモードです。`pnpm check` でBiomeのlintとフォーマットを確認し、`pnpm format` で修正できます。依存関係は `pnpm-lock.yaml` に固定し、npmのロックファイルは使用しません。

このクラウド環境ではホームディレクトリが書き込み不可のため、コマンド実行時に次を設定します。通常のローカル環境では不要です。

```sh
export XDG_DATA_HOME=/workspace/.local/share
export XDG_CACHE_HOME=/workspace/.cache
pnpm install --frozen-lockfile --store-dir /workspace/.pnpm-store
```

## アニメーション

UIライブラリは追加せず、Web Animations APIとCSSを使用しています。既存の素のTypeScript・DOM構成で必要な開閉・行移動を扱えるため、フレームワークや追加のランタイム依存を持たない構成を選びました。

- パネル開閉・ドラッグ・戻り: `sheet-motion.ts`
- タスクの追加・完了・削除と行の詰め直し: `list-motion.ts`
- 共通の時間・イージングと動きの抑制: `motion.ts`
- 通知の出入り: `toast.ts`

動きは160〜260msを基本に、transformとopacityを中心にしています。OSの `prefers-reduced-motion` に従って動きを省略し、保存の成否や状態更新はアニメーションの終了に依存させません。パネルは終了までモーダルを維持し、閉じた後にボード切り替えボタンへフォーカスを戻します。連続Escape・再表示・ドラッグ・動きの抑制・連続完了と取り消しをブラウザテストで確認しています。Android実機のジェスチャー・キーボード挙動は別途確認が必要です。

## GitHub Actions / Pages

`.github/workflows/ci.yml` は全ブランチへのPushとPRでLint・フォーマット、単体テスト、型チェック、本番ビルド、Chromiumのブラウザテストを実行します。CIはPagesと同じ `/tinytodo/` 配下で動作を検証します。失敗時はトレース・レポートを7日間保存します。

`master` へのマージ（Push）後はチェック成功時のみGitHub Pagesへデプロイします。`master` を対象に手動実行も可能です。デプロイ用のパスはPages設定から取得するため、カスタムドメインにも対応できます。

初回のみGitHubのリポジトリ **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定してください。リポジトリでActionsが無効になっている場合は有効化も必要です。個人アクセストークンの登録は不要で、デプロイジョブだけにPages書き込みとOIDC権限を付与しています。

ローカルでPagesと同じパスを確認する場合:

```sh
VITE_BASE_PATH=/tinytodo/ PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium pnpm test:e2e
```

公開先を変更するとオリジンが変わる場合があり、その場合は端末内の既存リストとは別の保存領域になります。
