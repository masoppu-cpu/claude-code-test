# 推奨開発コマンド

## 基本開発コマンド
```bash
# 開発サーバー起動（Turbopack使用）
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm start

# リンティング
npm run lint

# 型チェック
npm run type-check
```

## パッケージ管理
```bash
# 依存関係インストール
npm install

# 依存関係追加
npm install <package-name>

# 開発用依存関係追加
npm install -D <package-name>
```

## Git コマンド（macOS）
```bash
# 状態確認
git status

# 変更をステージング
git add .

# コミット
git commit -m "commit message"

# プッシュ
git push origin main
```

## macOS システムコマンド
```bash
# ディレクトリ表示
ls -la

# ファイル検索
find . -name "*.tsx"

# 内容検索
grep -r "search_term" .

# ディレクトリ移動
cd path/to/directory
```

## Supabase開発
- Supabaseダッシュボード: プロジェクト管理
- SQL Editor: データベーススキーマの実行・編集
- Authentication: ユーザー管理