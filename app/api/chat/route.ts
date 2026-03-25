import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const maxDuration = 30
export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
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
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { message, history = [], pdf_base64, document_context } = data

  try {
    const genai = new GoogleGenerativeAI(apiKey)
    const model = genai.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction:
        "あなたは優秀なAIアシスタントです。ユーザーの質問に対して、論理的かつ丁寧に回答してください。ドキュメントやPDFが共有されている場合は、その内容をもとに回答してください。",
    })

    // Build chat history
    const chatHistory: { role: string; parts: { text: string }[] }[] = []
    let contextInjected = false

    for (const m of history) {
      const role = m.role === "user" ? "user" : "model"
      if (role === "user" && !contextInjected) {
        const text = document_context
          ? `【参照ドキュメント】\n${document_context}\n\n【質問】\n${m.content}`
          : m.content
        chatHistory.push({ role: "user", parts: [{ text }] })
        contextInjected = true
      } else {
        chatHistory.push({ role, parts: [{ text: m.content }] })
      }
    }

    const chat = model.startChat({ history: chatHistory })

    // Build current message parts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = []

    if (pdf_base64) {
      parts.push({ inlineData: { mimeType: "application/pdf", data: pdf_base64 } })
    }

    if (!contextInjected && document_context) {
      parts.push({ text: `【参照ドキュメント】\n${document_context}\n\n【質問】\n${message}` })
    } else {
      parts.push({ text: message })
    }

    const result = await chat.sendMessage(parts)
    const text = result.response.text()

    return NextResponse.json({ response: text })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
