"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Sparkles, Loader2, Paperclip, X, FileText, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AIChatPanelProps {
  activeTab: string
}

const initialMessages: Record<string, Message[]> = {
  confidential: [
    {
      id: "1",
      role: "assistant",
      content:
        "こんにちは！機密情報チェックモードです。PDFをアップロードすると、機密情報の検出・リスク評価を行います。\n\nファイルを添付するか、質問を入力してください。",
      timestamp: new Date(),
    },
  ],
  summary: [
    {
      id: "1",
      role: "assistant",
      content:
        "要約生成モードへようこそ。PDFをアップロードすると、内容を分析して簡潔な要約を生成します。\n\n📎 ボタンからPDFを添付してください。",
      timestamp: new Date(),
    },
  ],
  tasks: [
    {
      id: "1",
      role: "assistant",
      content:
        "タスク抽出モードです。PDFをアップロードすると、アクションアイテムを自動抽出します。\n\n📎 ボタンからPDFを添付してください。",
      timestamp: new Date(),
    },
  ],
}

const suggestedPrompts: Record<string, string[]> = {
  confidential: [
    "このPDFに機密情報は含まれていますか？",
    "個人情報の検出結果を教えてください",
    "コンプライアンスリスクを評価してください",
  ],
  summary: [
    "このPDFを3つのポイントで要約してください",
    "重要な意思決定事項をまとめてください",
    "経営陣向けのエグゼクティブサマリーを作成してください",
  ],
  tasks: [
    "アクションアイテムを抽出してください",
    "タスクの優先順位付けを提案してください",
    "次のステップを整理してください",
  ],
}

export function AIChatPanel({ activeTab }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages[activeTab] || [])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [pdfUri, setPdfUri] = useState<string | null>(null)
  const [pdfName, setPdfName] = useState<string | null>(null)
  const [docContext, setDocContext] = useState<string | null>(null)
  const [docName, setDocName] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMessages(initialMessages[activeTab] || [])
    setPdfUri(null)
    setPdfName(null)
    setDocContext(null)
    setDocName(null)
  }, [activeTab])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const uploadFileToApi = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("/api/upload", { method: "POST", body: formData })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail ?? `HTTP ${res.status}`)
    }
    return res.json() as Promise<{ file_uri: string; display_name: string }>
  }

  const handleLoadDemo = async () => {
    setIsUploading(true)
    try {
      const res = await fetch("/sample.md")
      if (!res.ok) throw new Error(`デモファイルの取得に失敗しました (${res.status})`)
      const text = await res.text()

      // テキストは Files API を使わずそのまま state に保存 → chat リクエストで渡す
      setDocContext(text)
      setDocName("開発議事録.md")

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `📄 **開発議事録.md** を読み込みました。\nこのドキュメントについて質問してください。\n例：「要約して」「開発の流れを教えて」「使った技術は？」「トラブルはあった？」`,
          timestamp: new Date(),
        },
      ])
    } catch (err) {
      const msg = err instanceof Error ? err.message : "不明なエラー"
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `デモファイルの読み込みに失敗しました: ${msg}`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsUploading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const data = await uploadFileToApi(file)
      setPdfUri(data.file_uri)
      setPdfName(data.display_name)

      // アップロード完了メッセージをチャットに追加
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `📄 **${data.display_name}** を読み込みました。\nこのPDFについて質問してください。例：「要約して」「重要なポイントを教えて」`,
          timestamp: new Date(),
        },
      ])
    } catch (err) {
      const msg = err instanceof Error ? err.message : "不明なエラー"
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `PDFのアップロードに失敗しました。\nエラー: ${msg}`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    const history = messages.map((m) => ({ role: m.role, content: m.content }))

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    const assistantId = (Date.now() + 1).toString()

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history,
          ...(pdfUri ? { file_uri: pdfUri } : {}),
          ...(docContext ? { document_context: docContext } : {}),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail ?? `HTTP ${res.status}`)
      }

      const data = await res.json()

      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: data.response ?? "回答を取得できませんでした。",
          timestamp: new Date(),
        },
      ])
    } catch (err) {
      const msg = err instanceof Error ? err.message : "不明なエラー"
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: `エラーが発生しました: ${msg}`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    textareaRef.current?.focus()
  }

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
          <Bot className="size-4 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground">AI アシスタント</h3>
          <p className="text-xs text-muted-foreground">
            {activeTab === "confidential" && "機密情報チェックモード"}
            {activeTab === "summary" && "要約生成モード"}
            {activeTab === "tasks" && "タスク抽出モード"}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1">
          <span className="size-1.5 rounded-full bg-green-500" />
          <span className="text-xs text-green-500">オンライン</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  message.role === "user" ? "bg-secondary" : "bg-primary"
                )}
              >
                {message.role === "user" ? (
                  <User className="size-4 text-secondary-foreground" />
                ) : (
                  <Sparkles className="size-4 text-primary-foreground" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[80%] rounded-xl px-4 py-2.5",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                <p
                  suppressHydrationWarning
                  className={cn(
                    "mt-1 text-[10px]",
                    message.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                  )}
                >
                  {message.timestamp.toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="size-4 text-primary-foreground" />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-3">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">分析中...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* ドキュメント読み込み中バッジ（Markdown / テキスト） */}
      {docName && (
        <div className="flex items-center gap-2 border-t border-border bg-green-500/5 px-4 py-2">
          <BookOpen className="size-4 shrink-0 text-green-600" />
          <span className="flex-1 truncate text-xs text-foreground">{docName}</span>
          <button
            onClick={() => { setDocContext(null); setDocName(null) }}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            title="ドキュメントを削除"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      {/* PDF 添付中バッジ */}
      {pdfName && (
        <div className="flex items-center gap-2 border-t border-border bg-blue-500/5 px-4 py-2">
          <FileText className="size-4 shrink-0 text-blue-500" />
          <span className="flex-1 truncate text-xs text-foreground">{pdfName}</span>
          <button
            onClick={() => { setPdfUri(null); setPdfName(null) }}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            title="PDFを削除"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      {/* Suggestions */}
      <div className="border-t border-border px-4 py-2">
        <p className="mb-2 text-xs text-muted-foreground">よく使う質問:</p>
        <div className="flex flex-wrap gap-2">
          {suggestedPrompts[activeTab]?.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(prompt)}
              className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-secondary-foreground transition-colors hover:bg-secondary"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.md,.txt"
          className="hidden"
          onChange={handleUpload}
        />
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={handleLoadDemo}
            disabled={isUploading || isLoading}
            title="開発議事録（デモ資料）を読み込む"
            className="size-11 shrink-0"
          >
            {isUploading
              ? <Loader2 className="size-4 animate-spin" />
              : <BookOpen className="size-4" />
            }
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isLoading}
            title="ファイルをアップロード（PDF / Markdown）"
            className="size-11 shrink-0"
          >
            <Paperclip className="size-4" />
          </Button>
          <Textarea
            ref={textareaRef}
            placeholder={pdfUri ? "PDFについて質問してください..." : "メッセージを入力..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[44px] max-h-32 resize-none border-border bg-secondary text-sm"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="size-11 shrink-0"
          >
            <Send className="size-4" />
          </Button>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          📖 デモ資料 • 📎 ファイル添付（PDF / MD） • Enter で送信
        </p>
      </div>
    </div>
  )
}
