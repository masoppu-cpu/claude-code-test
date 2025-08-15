# セットアップガイド

このプロジェクトをローカルで実行するためのセットアップ手順です。

## 必要な環境

- Node.js 18+
- npm
- Supabaseアカウント

## セットアップ手順

### 1. パッケージのインストール

```bash
npm install
```

### 2. Supabaseプロジェクトの設定

1. [Supabase](https://supabase.com) でアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクトの設定から以下の情報を取得：
   - Project URL
   - Anon public key

### 3. 環境変数の設定

`.env.local` ファイルを作成し、以下を追加：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. データベーススキーマの作成

Supabaseダッシュボードの SQL Editor で `database-schema.sql` ファイルの内容を実行してください。

### 5. 管理者ユーザーの設定

アプリにサインアップした後、管理者権限を付与するには以下のSQLを実行：

```sql
INSERT INTO admins (user_id, email)
VALUES ('your_user_id', 'your_email@example.com');
```

ユーザーIDは Supabase の Authentication > Users から確認できます。

### 6. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開いてアプリを確認してください。

## 機能

- **コース一覧表示**: トップページでコース一覧を表示
- **コース詳細**: セクションとレッスンの構造を表示
- **動画視聴**: YouTube動画の埋め込み再生
- **進捗管理**: ユーザーがレッスン完了をマーク
- **認証機能**: Supabase Authを使用した登録・ログイン
- **管理画面**: 管理者によるコース・セクション・レッスンの管理

## 注意事項

- 最初のレッスンは `is_preview = true` に設定して、未認証ユーザーでも視聴可能にしてください
- YouTube動画IDは `youtube_video_id` フィールドに保存されます（例: `dQw4w9WgXcQ`）
- 管理者権限は手動でデータベースに追加する必要があります