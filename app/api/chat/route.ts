import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY が設定されていません" }, { status: 500 })
  }

  let data: {
    message: string
    history: { role: string; content: string }[]
    pdf_base64?: string
    document_context?: string
  }

  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { message, history = [], pdf_base64, document_context } = data

  try {
    // Build messages array (OpenAI-compatible format)
    const messages: { role: string; content: string }[] = [
      {
        role: "system",
        content:
          "あなたは優秀なAIアシスタントです。ユーザーの質問に対して、論理的かつ丁寧に回答してください。ドキュメントが共有されている場合は、その内容をもとに回答してください。",
      },
    ]

    // Add history (skip leading assistant messages)
    let firstUserSeen = false
    let contextInjected = false

    for (const m of history) {
      const role = m.role === "user" ? "user" : "assistant"
      if (role === "assistant" && !firstUserSeen) continue
      firstUserSeen = true

      if (role === "user" && !contextInjected && document_context) {
        messages.push({
          role: "user",
          content: `【参照ドキュメント】\n${document_context}\n\n【質問】\n${m.content}`,
        })
        contextInjected = true
      } else {
        messages.push({ role, content: m.content })
      }
    }

    // Current user message
    // Note: Groq text-only models don't support inline PDF — include extracted hint if present
    let userContent = message
    if (!contextInjected && document_context) {
      userContent = `【参照ドキュメント】\n${document_context}\n\n【質問】\n${message}`
    } else if (pdf_base64) {
      userContent = `（PDFが添付されています。内容に基づいて回答してください）\n\n${message}`
    }
    messages.push({ role: "user", content: userContent })

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        max_tokens: 2048,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error("Groq API error:", res.status, errBody)
      return NextResponse.json({ error: errBody }, { status: 500 })
    }

    const json = await res.json()
    const text: string = json.choices?.[0]?.message?.content ?? "回答を取得できませんでした。"

    return NextResponse.json({ response: text })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("Unexpected error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
