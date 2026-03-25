import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "ファイルが見つかりません" }, { status: 400 })
    }

    const contentType = file.type.split(";")[0].trim()
    if (contentType !== "application/pdf") {
      return NextResponse.json({ error: "PDFファイルのみ対応しています" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")

    return NextResponse.json({
      pdf_base64: base64,
      display_name: file.name || "uploaded.pdf",
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
