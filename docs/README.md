# 開発チケット一覧

オンライン講座プラットフォームの開発を以下のチケットに分割して進めます。

## チケット一覧

1. **[01-setup-environment.md](./01-setup-environment.md)** - 環境セットアップ
2. **[02-supabase-setup.md](./02-supabase-setup.md)** - Supabaseセットアップ
3. **[03-supabase-client-setup.md](./03-supabase-client-setup.md)** - Supabaseクライアント設定
4. **[04-authentication-system.md](./04-authentication-system.md)** - 認証システム実装
5. **[05-home-page.md](./05-home-page.md)** - ホームページ（コース一覧）
6. **[06-course-detail-page.md](./06-course-detail-page.md)** - コース詳細ページ
7. **[07-video-watch-page.md](./07-video-watch-page.md)** - 動画視聴ページ
8. **[08-progress-management.md](./08-progress-management.md)** - 進捗管理システム
9. **[09-admin-system.md](./09-admin-system.md)** - 管理者システム
10. **[10-responsive-design.md](./10-responsive-design.md)** - レスポンシブデザイン
11. **[11-testing-deployment.md](./11-testing-deployment.md)** - テスト・デプロイ

## 進捗管理

各チケットのTodoリストで進捗を管理します：
- `[ ]` - 未完了
- `[x]` - 完了

## 開発順序

推奨の開発順序は番号順ですが、必要に応じて並行して進めることも可能です。

## 注意事項

- 各チケットの完了条件をすべて満たしてから次に進んでください
- 問題が発生した場合は、CLAUDE.mdのベストプラクティスを参照してください
- Supabase認証では必ず`getUser()`を使用してセキュアな実装を心がけてください