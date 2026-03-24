"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react"
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
        "こんにちは！機密情報チェックモードです。アップロードされたコンテンツの機密情報を自動検出し、リスク評価を行います。\n\nコンテンツを選択するか、確認したい内容について質問してください。",
      timestamp: new Date(),
    },
  ],
  summary: [
    {
      id: "1",
      role: "assistant",
      content:
        "要約生成モードへようこそ。ドキュメントや動画の内容を分析し、簡潔な要約を生成します。\n\n要約のスタイル（箇条書き、段落形式など）もカスタマイズ可能です。",
      timestamp: new Date(),
    },
  ],
  tasks: [
    {
      id: "1",
      role: "assistant",
      content:
        "タスク抽出モードです。ミーティング議事録やドキュメントからアクションアイテムを自動抽出します。\n\n担当者の割り当てや期限の設定も提案できます。",
      timestamp: new Date(),
    },
  ],
}

const suggestedPrompts: Record<string, string[]> = {
  confidential: [
    "このドキュメントに機密情報は含まれていますか？",
    "個人情報の検出結果を教えてください",
    "コンプライアンスリスクを評価してください",
  ],
  summary: [
    "このドキュメントを3つのポイントで要約してください",
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
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setMessages(initialMessages[activeTab] || [])
  }, [activeTab])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

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
        body: JSON.stringify({ message: userMessage.content, history }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (!res.body) throw new Error("No response body")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let started = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const lines = decoder.decode(value, { stream: true }).split("\n")

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6)
          if (data === "[DONE]") continue

          try {
            const { text } = JSON.parse(data)
            if (!started) {
              started = true
              setIsLoading(false)
              setMessages((prev) => [
                ...prev,
                { id: assistantId, role: "assistant", content: text, timestamp: new Date() },
              ])
            } else {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + text } : m
                )
              )
            }
          } catch {
            // JSON parse error は無視
          }
        }
      }

      if (!started) setIsLoading(false)
    } catch {
      setIsLoading(false)
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "エラーが発生しました。もう一度お試しください。",
          timestamp: new Date(),
        },
      ])
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
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            placeholder="メッセージを入力..."
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
          Shift + Enter で改行 • Enter で送信
        </p>
      </div>
    </div>
  )
}
