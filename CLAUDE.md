# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Common development tasks:

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## プロジェクト概要

YouTube動画を活用したUdemyライクなオンライン講座プラットフォームのMVP開発

### 対象ユーザー
- AIでプログラム開発したいエンジニア
- AIでプログラム開発したい非エンジニア

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS v4 with PostCSS
- **Fonts**: Geist Sans and Geist Mono from Google Fonts
- **React**: v19 (latest)
- **Deployment**: Vercel

## Project Structure

This is a Next.js App Router application with the following structure:

- `app/` - Next.js App Router directory containing pages and layouts
  - `layout.tsx` - Root layout with font configuration and global styles
  - `page.tsx` - Home page component
  - `globals.css` - Global styles with Tailwind CSS and CSS custom properties
- `public/` - Static assets (SVG icons)
- `next.config.ts` - Next.js configuration (currently minimal)
- `postcss.config.mjs` - PostCSS configuration for Tailwind CSS
- `tsconfig.json` - TypeScript configuration with strict mode and path aliases (`@/*`)

## Styling Approach

- Uses Tailwind CSS v4 with the new `@theme inline` syntax
- Dark mode support via CSS custom properties and `prefers-color-scheme`
- Font variables configured in layout and available throughout the app
- Custom CSS properties for consistent theming (`--background`, `--foreground`)

## TypeScript Configuration

- Strict mode enabled
- Path aliases configured (`@/*` maps to root directory)  
- Next.js plugin enabled for enhanced TypeScript support
- ESNext module resolution with bundler mode

## データ構造（3階層）

```
コース
├── セクション（章）
    ├── レッスン（動画）
    ├── レッスン（動画）
    └── ...
├── セクション（章）
    └── ...
```

**例**:
- コース: 「AI開発入門コース」
  - セクション: 「第1章：基礎知識」
    - レッスン: 「1-1：ChatGPT入門動画」
    - レッスン: 「1-2：プロンプト設計」

## 必須機能（MVP）

### 一般ユーザー向け機能
- **コース閲覧**
  - トップページでコース一覧表示
  - コースクリックでカリキュラム（セクション・レッスン一覧）表示
- **動画視聴**
  - YouTube動画の埋め込み再生
  - 最初の動画：誰でも視聴可能
  - それ以外の動画：認証必須
- **認証機能**
  - Supabase Authを使用したユーザー登録・ログイン
- **進捗管理**
  - ユーザーが「視聴完了」ボタンを押すとチェックマーク表示
  - 手動での進捗管理
- **レスポンシブ対応**
  - PC・スマートフォン両対応

### 管理者向け機能
- **管理画面**
  - 特定のメールアドレスのユーザーのみアクセス可能
  - コース・セクション・レッスンの手動登録・編集
  - YouTube動画URL/IDの手動入力

## 画面構成
1. **トップページ** - コース一覧
2. **コース詳細ページ** - カリキュラム（セクション・レッスン一覧）
3. **動画視聴ページ** - YouTube埋め込み + 進捗ボタン
4. **認証ページ** - ログイン・サインアップ
5. **管理画面** - コース管理

## データベース設計（Supabase）

### テーブル構成
```sql
-- コーステーブル
courses (
  id: UUID (Primary Key)
  title: TEXT
  description: TEXT
  thumbnail_url: TEXT
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
)

-- セクションテーブル
sections (
  id: UUID (Primary Key)
  course_id: UUID (Foreign Key -> courses.id)
  title: TEXT
  order: INTEGER
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
)

-- レッスンテーブル
lessons (
  id: UUID (Primary Key)
  section_id: UUID (Foreign Key -> sections.id)
  title: TEXT
  youtube_video_id: TEXT
  order: INTEGER
  is_preview: BOOLEAN (最初の動画はtrue)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
)

-- 進捗管理テーブル
user_progress (
  id: UUID (Primary Key)
  user_id: UUID (Foreign Key -> auth.users.id)
  lesson_id: UUID (Foreign Key -> lessons.id)
  completed: BOOLEAN
  completed_at: TIMESTAMP
  created_at: TIMESTAMP
)

-- 管理者テーブル
admins (
  id: UUID (Primary Key)
  user_id: UUID (Foreign Key -> auth.users.id)
  email: TEXT
  created_at: TIMESTAMP
)
```

## Next.js App Router ベストプラクティス

### ディレクトリ構成
- `app/` ディレクトリにページとレイアウトを配置
- `components/` ディレクトリに再利用可能なコンポーネントを配置
- `lib/` ディレクトリにユーティリティ関数とAPI設定を配置
- `types/` ディレクトリにTypeScript型定義を配置

### ファイル命名規則
- ページ：`page.tsx`
- レイアウト：`layout.tsx`
- ローディング：`loading.tsx`
- エラー：`error.tsx`
- 404ページ：`not-found.tsx`

### コンポーネント設計
- Server ComponentsとClient Componentsを適切に使い分け
- `"use client"`は必要最小限に使用
- props型定義は必須（TypeScript）
- デフォルトエクスポートを使用

### データフェッチング
- Server Componentsでのfetchを優先
- クライアントサイドでのデータフェッチは最小限に
- Suspenseを活用したローディング状態の管理
- エラーハンドリングの実装

### パフォーマンス最適化
- `next/image`を使用した画像最適化
- `next/font`を使用したフォント最適化
- 動的インポート（lazy loading）の活用
- メタデータAPI（`metadata`）の活用

### SEO対策
- 適切なメタデータの設定
- 構造化データの実装
- Open Graphタグの設定
- サイトマップの生成

## Supabase Auth + Next.js ベストプラクティス

### パッケージインストール
```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 環境変数設定
`.env.local`に以下を追加：
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabaseクライアント設定
- **Client Component用**：ブラウザでの認証処理
- **Server Component用**：サーバーサイドでの認証処理
- 各ルートごとに新しいクライアントを作成（軽量で適切な設定を保証）

### Middleware設定（必須）
- 認証トークンの自動リフレッシュ
- リフレッシュされたトークンをServer Componentsに渡す
- リフレッシュされたトークンをブラウザに渡す

### セキュリティ重要事項
- ⚠️ **重要**：ページ保護時はクッキーベースの認証は偽装可能
- 必ず`supabase.auth.getUser()`を使用してページとデータを保護
- サーバーサイドでの認証検証を実装

### 認証フロー実装
- Server Actionsを使用したログインページ作成
- メール確認テンプレートの設定
- メール確認用のRoute Handlerの作成

### 開発における注意事項

- YouTube埋め込み動画使用
- 手動での進捗管理（自動視聴検知は後回し）
- 特定メールアドレスベースの管理者権限制御
- レスポンシブデザイン必須
- 未認証ユーザーには認証画面へ誘導
- Server Componentsを優先し、必要な場合のみClient Componentsを使用
- 適切なTypeScript型定義の実装
- エラーバウンダリの実装
- Supabase認証では必ず`getUser()`を使用してセキュアな認証チェックを実装

## タスク管理とドキュメンテーション

### 必須要件

**チケット実装時の進捗管理**

チケットごとの実装を行う際は、以下を必ず実行すること：

1. **TodoWrite ツールの使用**
   - 各チケットの実装開始時に TodoWrite ツールを使用してタスクリストを作成
   - タスクの状態を正確に管理：`pending` → `in_progress` → `completed`

2. **完了マーキングの徹底**
   - タスクが完了したら **即座に** `completed` ステータスに更新
   - 複数タスクをまとめて完了マーキングしない
   - 各タスク完了ごとに個別に TodoWrite ツールを実行

3. **進捗の可視化**
   - チケットドキュメント内で完了したタスクに `[×]` を記入
   - 未完了タスクは `[ ]` のまま保持
   - どこまで完了したかが一目で分かる状態を維持

4. **実装ルール**
   - 一つのタスクを `in_progress` にしたら、完了するまで他のタスクに移らない
   - エラーや問題が発生した場合は、そのタスクは `in_progress` のまま保持し、解決策を新しいタスクとして追加

**例**：
```
[×] データベーススキーマの作成
[×] Supabaseプロジェクトの設定
[ ] 認証機能の実装
[ ] ユーザー登録画面の作成
```

この管理方式により、実装の進捗状況を常に把握でき、効率的な開発を実現する。