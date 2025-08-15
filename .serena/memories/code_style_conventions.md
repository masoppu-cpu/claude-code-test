# コードスタイルと規約

## TypeScript設定
- **strict mode**: 有効
- **target**: ES2017
- **module**: ESNext with bundler resolution
- **Path aliases**: `@/*` で root directory にアクセス
- **JSX**: preserve（Next.js処理）

## ESLint設定
- `next/core-web-vitals` 使用
- `next/typescript` 拡張

## ファイル命名規則
### Next.js App Router
- ページ：`page.tsx`
- レイアウト：`layout.tsx`
- ローディング：`loading.tsx`
- エラー：`error.tsx`
- 404ページ：`not-found.tsx`

### コンポーネント
- PascalCase（例：`CourseCard.tsx`）
- デフォルトエクスポート使用

## ディレクトリ構成
- `app/`: Next.js App Router（ページとレイアウト）
- `components/`: 再利用可能コンポーネント
  - `ui/`: 基本UIコンポーネント
  - `course/`: コース関連コンポーネント
  - `auth/`: 認証関連コンポーネント
  - `admin/`: 管理画面コンポーネント
- `lib/`: ユーティリティ関数とAPI設定
- `types/`: TypeScript型定義
- `hooks/`: カスタムフック

## コンポーネント設計原則
- Server ComponentsとClient Componentsの適切な使い分け
- `"use client"`は必要最小限に使用
- props型定義は必須
- デフォルトエクスポート使用

## スタイリング
- Tailwind CSS v4使用
- `@theme inline` syntax
- ダークモード対応（CSS custom properties + prefers-color-scheme）
- フォント変数：Geist Sans, Geist Mono

## データフェッチング
- Server Componentsでのfetch優先
- TanStack React Query使用
- Suspenseでローディング状態管理
- エラーハンドリング実装