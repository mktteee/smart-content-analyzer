# Smart Content Analyzer — 開発議事録

## 概要

本ドキュメントは「Smart Content Analyzer」の設計・開発・デプロイのプロセスを記録した議事録です。
AIツール（Google AI / v0.dev / Claude Code）との協業を通じて、数時間でエンタープライズ向けAIコンテンツ解析プラットフォームのプロトタイプを構築しました。

---

## 背景・目的

### 状況

- 就職活動においてポートフォリオの提出を求められた
- 現職・副業先のプロダクトは社内限定のため公開不可
- 応募先は「動画・PDF・AIエージェント機能を中核にした次世代コンテンツプラットフォーム」への移行を推進中
- 募集要項：「AIツールを最大限活用し、コードを書くスピードよりもAIと協業して成果を出せるかを重視」

### 目的

- AIとどう協業して開発を進めたかを具体的に証明する
- 応募先企業の事業ドメイン（コンテンツ活用 × AIエージェント）に直結するプロダクトを作る
- AIを「指揮」することで高品質なアウトプットを最短で生み出せることを実証する

---

## プロダクト仕様

### プロダクト名

**Smart Content Analyzer**

### コンセプト

企業内のPDF・議事録などのコンテンツをアップロードし、AIが自動的に解析・要約・タスク抽出・機密情報チェックを行うエンタープライズ向けAIエージェントプラットフォーム。

### 主要機能

| 機能 | 概要 |
|------|------|
| 機密情報チェック | アップロードされたコンテンツから個人情報・機密情報を検出 |
| 要約生成 | PDF・ドキュメントの内容をAIが要約 |
| タスク抽出 | 議事録・ドキュメントからアクションアイテムを抽出 |
| PDFアップロード | ファイルをアップロードしてAIとリアルタイムに対話 |

### 技術スタック

| 区分 | 技術 |
|------|------|
| フロントエンド | Next.js 16 (App Router), TypeScript |
| UI | Tailwind CSS, shadcn/ui, Lucide React |
| バックエンド | Next.js Route Handlers（TypeScript） |
| AI | Groq API（llama-3.3-70b-versatile） |
| デプロイ | Vercel（Serverless Functions） |
| バージョン管理 | GitHub（public リポジトリ） |

---

## 開発フェーズ

### Phase 1: 要件定義・技術選定（Google AI との壁打ち）

**実施内容:**

Google AI に「最短でAI協業ポートフォリオを作るには？」と問い合わせ、応募先企業の募集要項を分析した。

**AIへの主なプロンプト:**

```
エンタープライズ向けのAIコンテンツ解析プラットフォームのUIを作って。
左側にPDFや動画のプレビューエリア、右側にAIエージェントとのチャット欄がある2カラム構成。
上部に『機密情報チェック』『要約生成』『タスク抽出』のタブ切り替え。
Next.js, Tailwind CSS, Lucide React を使用。
モダンで清潔感のあるダークモード対応のUI。
サイドバーにはアップロード済みのコンテンツ一覧を表示して。
```

**決定事項:**

- UI は v0.dev で高速生成（Next.js + Tailwind CSS）
- バックエンドは Next.js Route Handlers（TypeScript）
- AI は無料で使える LLM API を使用
- DB は不使用（Vercel のサーバーレス環境に最適化）

---

### Phase 2: UI 生成（v0.dev）

**実施内容:**

v0.dev に上記プロンプトを投入し、エンタープライズ向けダッシュボード UI を生成。生成されたコードを ZIP ダウンロードし、ローカルで開いた。

**生成されたコンポーネント:**

- `app/page.tsx` — メインレイアウト（ResizablePanelGroup 使用）
- `components/ai-chat-panel.tsx` — AI チャットパネル
- `components/content-preview.tsx` — コンテンツプレビューエリア
- `components/content-sidebar.tsx` — コンテンツ一覧サイドバー
- `components/analysis-tabs.tsx` — タブ切り替え

---

### Phase 3: バックエンド構築・フロントエンド連携（Claude Code）

**ツール:** Claude Code（Anthropic 公式 CLI）

#### 3-1. 依存ライブラリのインストール

- v0 生成のプロジェクトはパッケージが未インストールの状態
- Claude Code が `npm install` を実行し、89 パッケージをインストール
- `npm run build` でビルド成功を確認

#### 3-2. バックエンドの作成（Python → TypeScript への移行）

当初 `api/chat.py`（Python + FastAPI）で実装を試みたが、Vercel の Python ランタイムが `issubclass TypeError` で動作しないことが判明。Claude Code と原因を分析し、**Next.js Route Handlers（TypeScript）** に全面移行した。

`app/api/chat/route.ts` を新規作成:

- `POST /api/chat` エンドポイント
- Groq API（llama-3.3-70b-versatile）を `fetch` で直接呼び出し
- 会話履歴・ドキュメントコンテキストの注入処理

#### 3-3. フロントエンドとバックエンドの連携

`components/ai-chat-panel.tsx` の `handleSend` 関数を改修:

- モック（`setTimeout` + ハードコード返答）→ `fetch("/api/chat")` への実 API コール
- エラーハンドリング追加
- 会話履歴（`history`）をリクエストに含めて文脈を維持

---

### Phase 4: AI プロバイダーの選定と切り替え

当初 Anthropic Claude API を使用予定だったが、コスト最適化のため無料枠のある API を検討。以下の順で切り替えを実施した。

| 試行順 | プロバイダー | 結果 |
|--------|------------|------|
| 1 | Anthropic Claude API | 有料のため断念 |
| 2 | Google Gemini 2.0 Flash | 無料枠クォータが 0（割り当てなし）で使用不可 |
| 3 | Google Gemini 1.5 Flash | 同様にクォータ制限で使用不可 |
| 4 | **Groq API（llama-3.3-70b-versatile）** | **無料枠で動作確認 ✅** |

**Groq を選んだ理由:**
- 無料枠が充分（1日あたり多数のリクエスト可能）
- OpenAI 互換フォーマットで実装がシンプル
- レスポンスが非常に高速

---

### Phase 5: デプロイ・トラブルシューティング

#### 5-1. GitHub プッシュ

```bash
git init
git remote add origin https://github.com/mktteee/smart-content-analyzer.git
git branch -m main
git add .
git commit -m "Initial commit"
git push -u origin main
```

#### 5-2. Vercel デプロイ 1回目 — 失敗

**エラー:**
```
Error: Function Runtimes must have a valid version, for example 'now-php@1.0.0'.
```

**原因:** `vercel.json` の `runtime` 指定フォーマットが不正
**修正:** `vercel.json` を空オブジェクト `{}` に変更

#### 5-3. React hydration エラー #418

- 原因: `new Date()` がサーバー・クライアントで異なる値を生成
- 修正: タイムスタンプ `<p>` に `suppressHydrationWarning` を追加

#### 5-4. Python ランタイムの `issubclass TypeError`

- **原因:** Vercel の Python ランタイム初期化コードが Flask/FastAPI インスタンスを `BaseHTTPRequestHandler` のサブクラスかチェックする際に `TypeError` が発生
- **解決:** Python バックエンドを全廃し、Next.js Route Handlers（TypeScript）に完全移行

#### 5-5. Gemini API クォータエラー（429）

- **原因:** `gemini-2.0-flash` / `gemini-1.5-flash` ともに無料枠の割り当てが 0
- **解決:** Groq API に切り替え、`llama-3.3-70b-versatile` モデルで動作確認

---

### Phase 6: PDF アップロード機能の追加

#### 設計方針

- DB 不使用（Vercel サーバーレスに最適）
- PDF を base64 に変換してフロントエンドの React state で保持
- チャット時に base64 をリクエストに含めて送信

#### 追加・変更ファイル

**`app/api/upload/route.ts`（新規）:**

- `POST /api/upload` エンドポイント
- アップロードされた PDF を base64 に変換して返却
- 外部 API 不使用、依存ゼロのシンプル実装

**`components/ai-chat-panel.tsx`（修正）:**

- 📎 アップロードボタン追加（Paperclip アイコン）
- PDF 名表示バッジ（削除ボタン付き）
- `pdfBase64`, `pdfName`, `isUploading` の state 管理
- タブ切り替え時に PDF 状態をリセット
- デモ資料ワンクリック読み込みボタン追加（BookOpen アイコン）

---

## AIとの協業プロセス詳細

### 使用ツール

| ツール | 用途 |
|--------|------|
| Google AI（Gemini） | 要件定義・技術選定の壁打ち |
| v0.dev | UI の高速プロトタイピング |
| Claude Code（CLI） | バックエンド実装・デバッグ・デプロイ対応 |

### 協業のポイント

1. **要件定義の精度**
   応募先のドメイン（コンテンツ × AI）を理解し、刺さるプロダクトコンセプトを AI と言語化した

2. **UI の高速生成**
   v0.dev に一言のプロンプトを投げて、エンタープライズ向け 2 カラムダッシュボードを瞬時に生成した

3. **技術的課題の解決**
   Vercel のデプロイエラーやランタイムエラーをログごと AI に渡して、原因特定と修正を即座に完了した

4. **プロバイダー選定の柔軟な判断**
   Gemini のクォータ問題に直面した際、代替プロバイダー（Groq）を即座に選定・切り替えた

5. **アーキテクチャ共同設計**
   DB 不使用で PDF を扱うための「base64 + React state キャッシュ」構成を AI と設計した

---

## トラブルシューティング記録

| フェーズ | 問題 | 原因 | 解決策 |
|---------|------|------|-------|
| デプロイ | Vercel ビルド失敗 | `runtime` 指定フォーマット不正 | `vercel.json` を空オブジェクトに変更 |
| フロント | React hydration エラー #418 | `new Date()` の SSR/Client 不一致 | `suppressHydrationWarning` 追加 |
| API | Python ランタイム 500 | Vercel の `issubclass TypeError` | TypeScript Route Handlers に全面移行 |
| AI | Gemini API 429 クォータ超過 | 無料枠の割り当てが 0 | Groq API（llama-3.3-70b）に切り替え |
| UI | チャットがスクロールしない | ScrollArea の ref が viewport に届かない | `div` + `overflow-y-auto` に置き換え |

---

## 学び・気づき

- **AIは「指揮」するもの**: コードの詳細を理解していなくても、「何を作りたいか」「どんな問題が起きているか」を明確に伝えれば、AI が実装・デバッグ・改善まで担ってくれる

- **エラーは AI に丸投げ**: Vercel のデプロイエラーも、ログをコピーして AI に渡すだけで解決策が即座に出てきた

- **想定外の問題も乗り越えられる**: Python ランタイムの互換性問題・Gemini のクォータ問題など、複数の想定外トラブルが発生したが、AI と対話しながらすべて解決した

- **プロセスの記録が価値になる**: 「動くもの」と同じくらい、「どうやって作ったか」の記録が採用担当者に対して強いアピール力を持つ

- **無料で本格 AI 機能が実現可能**: Groq の無料枠を活用し、高性能な LLM（Llama 3.3 70B）による PDF 解析・要約・Q&A が動作するプロダクトを構築できた

---

## 成果物

| 項目 | 内容 |
|------|------|
| GitHub リポジトリ | https://github.com/mktteee/smart-content-analyzer |
| デプロイ URL | Vercel（自動発行 URL） |
| 開発期間 | 数時間（要件定義〜デプロイまで） |
| 自分で書いたコード行数 | 0行（全て AI が生成・修正） |
| 使用した AI ツール | Google AI, v0.dev, Claude Code |

---

*本ドキュメントは AI（Claude Code）との対話ログをもとに生成されました。*
