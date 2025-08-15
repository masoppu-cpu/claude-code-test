# AI開発オンライン講座プラットフォーム

YouTubeを活用したUdemyライクなオンライン講座プラットフォームのMVP実装です。

## 機能

### 一般ユーザー向け機能
- **コース閲覧**: トップページでコース一覧表示
- **カリキュラム表示**: コース詳細ページでセクションとレッスンの構造を表示
- **動画視聴**: YouTube動画の埋め込み再生
- **進捗管理**: ユーザーが「視聴完了」ボタンを押して進捗をトラッキング
- **認証機能**: Supabase Authを使用したユーザー登録・ログイン
- **プレビュー動画**: 最初のレッスンは未認証ユーザーでも視聴可能

### 管理者向け機能
- **管理画面**: コース・セクション・レッスンの管理
- **コース作成**: 新しいコースの手動作成
- **進捗確認**: ユーザーの学習進捗の確認

## 技術スタック

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS v4
- **Deployment**: Vercel

## データ構造

```
コース
├── セクション（章）
    ├── レッスン（動画）
    ├── レッスン（動画）
    └── ...
├── セクション（章）
    └── ...
```

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseプロジェクトの設定

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. プロジェクトの設定から以下を取得：
   - Project URL
   - Anon public key

### 3. 環境変数の設定

`.env.local` ファイルを作成：

```env
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

### 6. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリを確認してください。

## 開発コマンド

```bash
# 開発サーバー起動（Turbopack使用）
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm start

# リンティング
npm run lint
```

## プロジェクト構造

```
app/                     # Next.js App Router
├── admin/              # 管理画面
├── auth/               # 認証関連
├── courses/            # コース・レッスンページ
├── login/              # ログインページ
└── signup/             # サインアップページ

components/              # 再利用可能コンポーネント
├── admin/              # 管理画面用コンポーネント
├── auth/               # 認証用コンポーネント
├── course/             # コース関連コンポーネント
└── ui/                 # UI基本コンポーネント

lib/                    # ユーティリティ関数
├── auth.ts             # 認証ヘルパー
├── supabase.ts         # Supabaseクライアント
├── supabase-client.ts  # ブラウザ用クライアント
└── supabase-server.ts  # サーバー用クライアント

types/                  # TypeScript型定義
└── database.ts         # データベース型定義
```

## データベース設計

- **courses**: コース情報
- **sections**: セクション（章）情報
- **lessons**: レッスン（動画）情報
- **user_progress**: ユーザーの学習進捗
- **admins**: 管理者権限

詳細は `database-schema.sql` を参照してください。

## 注意事項

- プレビュー動画は `is_preview = true` に設定
- YouTube動画IDは `youtube_video_id` フィールドに保存
- 管理者権限は手動でデータベースに追加が必要
- 未認証ユーザーはプレビュー動画のみ視聴可能

## デプロイ

### Vercelでのデプロイ

1. プロジェクトをGitHubにプッシュ
2. [Vercel](https://vercel.com) でプロジェクトをインポート
3. 環境変数を設定
4. デプロイ

詳細は [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) を参照してください。
# claude-code-test
