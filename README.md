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

E2Eは追加、右スワイプ完了、取り消し、再読込での保存、完了一括削除、オフラインでの再起動・編集、HTML文字列の安全な表示を確認します。

## Androidで利用

`pnpm build` で生成する `dist/` をHTTPSの静的ホスティングのルートに配置します（GitHub Pagesのサブパス配置は未対応）。AndroidのChromeで開き、メニューの「ホーム画面に追加」または「アプリをインストール」を選びます。アプリ用サーバーの運用は不要ですが、初回配信には静的ホスティングが必要です。Service Workerは本番ビルドのみで有効です。

一度オンラインで読み込むとオフラインで起動・編集できます。リストは同じ端末・同じブラウザ・同じ配信元のlocalStorageに保存され、同期されません。ブラウザデータの消去、プライベートブラウズの終了、端末の紛失で失われる場合があります。

## 操作

- タイトルを入力して追加（最大200文字）
- 項目を右にスワイプ、または丸いボタンで完了・未完了を切り替え
- 完了した項目は折りたたみ・まとめて削除可能
- 完了や削除は7秒以内なら「元に戻す」で取り消し

外部フォント・解析・外部APIへの通信は行いません。

## コード構造

- `src/domain/todo.ts`: ToDoの型、タイトル検証、完了の切り替え（DOMや保存先に依存しない）
- `src/storage/todo-storage.ts`: localStorageへの読み書きと保存データの検証。既存の保存キーを維持
- `src/ui/`: HTMLレイアウト、スワイプ可能な行、通知と取り消し
- `src/app.ts`: 状態の保持、ユーザー操作と各モジュールの接続
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
