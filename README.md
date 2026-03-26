# Smart Content Analyzer

企業内のPDF・ドキュメントをアップロードし、AIと対話しながら要約・タスク抽出・機密情報チェックを行うエンタープライズ向けAIエージェントプラットフォームのプロトタイプです。

## 機能

| 機能 | 概要 |
|------|------|
| 機密情報チェック | ドキュメントから個人情報・機密情報を検出 |
| 要約生成 | PDF・ドキュメントの内容をAIが要約 |
| タスク抽出 | 議事録からアクションアイテムを抽出 |
| PDFアップロード | PDFをアップロードしてAIとリアルタイムに対話 |

## 技術スタック

- **フロントエンド:** Next.js 16 (App Router) / TypeScript / Tailwind CSS / shadcn/ui
- **バックエンド:** Next.js Route Handlers
- **AI:** Groq API（llama-3.3-70b-versatile）
- **デプロイ:** Vercel

## デモの使い方

デプロイ済みアプリ: [smart-content-analyzer.vercel.app](https://smart-content-analyzer.vercel.app)

### サンプルドキュメントで試す（ファイル不要）

1. 画面右側のチャットパネルを開く
2. 入力欄の左にある **📖 ボタン**（本アイコン）をクリック
3. 「開発議事録を読み込みました」と表示されたら準備完了
4. チャットで「要約して」「課題を一覧で出して」などと入力して送信

### PDFをアップロードして試す

1. 入力欄の左にある **📎 ボタン**（クリップアイコン）をクリック
2. PDFファイルを選択
3. ファイル名バッジが表示されたら準備完了
4. チャットで質問を入力して送信

## ローカル起動

```bash
npm install
cp .env.local.example .env.local  # GROQ_API_KEY を設定
npm run dev
```

環境変数:

| 変数名 | 説明 |
|--------|------|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) で発行 |
