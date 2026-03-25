import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 30

export async function POST(req: NextRequest) {
  console.log("=== /api/chat 受領開始 ===")

  const apiKey = process.env.GEMINI_API_KEY
  console.log("APIキー存在:", !!apiKey)

  if (!apiKey) {
    console.error("GEMINI_API_KEY が未設定")
    return NextResponse.json({ error: "GEMINI_API_KEY が設定されていません" }, { status: 500 })
  }

  let data: {
    message: string
    history: { role: string; content: string }[]
    pdf_base64?: string
    document_context?: string
  }

  try {
    data = await req.json()
    console.log("リクエスト受信 message:", data?.message?.slice(0, 30))
  } catch (e) {
    console.error("JSON parse error:", e)
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { message, history = [], pdf_base64, document_context } = data

  try {
    // Build contents array for Gemini REST API
    // Gemini requires conversation to start with "user" — skip leading model messages
    const contents: { role: string; parts: object[] }[] = []
    let contextInjected = false
    let firstUserSeen = false

    for (const m of history) {
      const role = m.role === "user" ? "user" : "model"
      if (role === "model" && !firstUserSeen) continue  // skip initial assistant greeting
      firstUserSeen = true
      if (role === "user" && !contextInjected) {
        const text = document_context
          ? `【参照ドキュメント】\n${document_context}\n\n【質問】\n${m.content}`
          : m.content
        contents.push({ role: "user", parts: [{ text }] })
        contextInjected = true
      } else {
        contents.push({ role, parts: [{ text: m.content }] })
      }
    }

    // Current message
    const currentParts: object[] = []
    if (pdf_base64) {
      currentParts.push({ inlineData: { mimeType: "application/pdf", data: pdf_base64 } })
    }
    if (!contextInjected && document_context) {
      currentParts.push({ text: `【参照ドキュメント】\n${document_context}\n\n【質問】\n${message}` })
    } else {
      currentParts.push({ text: message })
    }
    contents.push({ role: "user", parts: currentParts })

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

    console.log("Gemini API呼び出し開始")
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{
            text: "あなたは優秀なAIアシスタントです。ユーザーの質問に対して、論理的かつ丁寧に回答してください。ドキュメントやPDFが共有されている場合は、その内容をもとに回答してください。",
          }],
        },
        contents,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error("Gemini API error:", res.status, errBody)
      return NextResponse.json({ error: errBody }, { status: 500 })
    }

    const json = await res.json()
    const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "回答を取得できませんでした。"

    return NextResponse.json({ response: text })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
