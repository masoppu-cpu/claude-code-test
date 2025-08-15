# 09. 管理者システム

## 概要
特定メールアドレスのユーザーのみアクセス可能な管理画面を実装します。

## 作業内容
- 管理者権限チェック
- コース管理機能
- セクション・レッスン管理機能

## Todo
- [x] lib/admin.ts作成（管理者権限チェック）
- [x] app/admin/page.tsx作成（管理画面トップ）
- [x] app/admin/courses/page.tsx作成（コース一覧管理）
- [x] app/admin/courses/new/page.tsx作成（新規コース作成）
- [x] app/admin/courses/[courseId]/edit/page.tsx作成（コース編集）
- [x] components/admin/CourseForm.tsx作成
- [x] components/admin/SectionForm.tsx作成
- [x] components/admin/LessonForm.tsx作成
- [x] 管理者権限ミドルウェア実装
- [x] CRUD操作関数実装

## 完了条件
- [x] 管理者のみアクセス可能
- [x] コースの作成・編集・削除ができる
- [x] セクションの作成・編集・削除ができる
- [x] レッスンの作成・編集・削除ができる
- [x] YouTube URL/IDの入力・保存ができる