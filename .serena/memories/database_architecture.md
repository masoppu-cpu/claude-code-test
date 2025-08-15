# データベース設計

## テーブル構成

### courses（コース）
- `id`: UUID (Primary Key)
- `title`: TEXT（コースタイトル）
- `description`: TEXT（コース説明）
- `thumbnail_url`: TEXT（サムネイル画像URL）
- `created_at`, `updated_at`: TIMESTAMP

### sections（セクション・章）
- `id`: UUID (Primary Key)
- `course_id`: UUID (Foreign Key -> courses.id)
- `title`: TEXT（セクションタイトル）
- `order`: INTEGER（表示順）
- `created_at`, `updated_at`: TIMESTAMP

### lessons（レッスン・動画）
- `id`: UUID (Primary Key)
- `section_id`: UUID (Foreign Key -> sections.id)
- `title`: TEXT（レッスンタイトル）
- `youtube_video_id`: TEXT（YouTube動画ID）
- `order`: INTEGER（表示順）
- `is_preview`: BOOLEAN（プレビュー動画フラグ）
- `created_at`, `updated_at`: TIMESTAMP

### user_progress（進捗管理）
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key -> auth.users.id)
- `lesson_id`: UUID (Foreign Key -> lessons.id)
- `completed`: BOOLEAN（完了フラグ）
- `completed_at`: TIMESTAMP（完了日時）
- `created_at`: TIMESTAMP
- UNIQUE制約: (user_id, lesson_id)

### admins（管理者）
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key -> auth.users.id)
- `email`: TEXT（管理者メールアドレス）
- `created_at`: TIMESTAMP

## 重要な設計ポイント

### 認証
- Supabase Auth使用
- `auth.users`テーブルは自動管理
- 管理者権限は`admins`テーブルで管理

### プレビュー機能
- `lessons.is_preview = true`の動画は未認証でも視聴可能
- 通常は最初のレッスンのみプレビュー設定

### カスケード削除
- コース削除時：関連セクション・レッスン・進捗も削除
- ユーザー削除時：進捗・管理者権限も削除

### インデックス
- 外部キーにインデックス設定済み
- クエリパフォーマンス最適化