# プロジェクト概要

## 目的
YouTubeを活用したUdemyライクなオンライン講座プラットフォームのMVP実装。AI開発学習に特化したオンライン講座プラットフォーム。

## 対象ユーザー
- AIでプログラム開発したいエンジニア
- AIでプログラム開発したい非エンジニア

## 技術スタック
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS v4 with PostCSS
- **Fonts**: Geist Sans and Geist Mono from Google Fonts
- **React**: v19 (latest)
- **State Management**: TanStack React Query
- **Animation**: Framer Motion
- **Deployment**: Vercel

## データ構造（3階層）
```
コース (courses)
├── セクション（章）(sections)
    ├── レッスン（動画）(lessons)
    ├── レッスン（動画）
    └── ...
├── セクション（章）
    └── ...
```

## 主要機能
### ユーザー向け
- コース閲覧・動画視聴（YouTube埋め込み）
- 認証機能（Supabase Auth）
- 進捗管理（手動「視聴完了」ボタン）
- プレビュー動画（未認証でも視聴可能）

### 管理者向け
- 管理画面（特定メールアドレスのみ）
- コース・セクション・レッスンの管理
- 進捗確認機能