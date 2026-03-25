from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mangum import Mangum
import google.generativeai as genai
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)


class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[Message] = []
    file_uri: str | None = None          # PDF（Gemini Files API）
    document_context: str | None = None  # テキスト・Markdownの内容をそのまま渡す


@app.post("/api/chat")
async def chat(request: ChatRequest):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY が設定されていません")

    genai.configure(api_key=api_key)

    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        system_instruction=(
            "あなたは優秀なAIアシスタントです。"
            "ユーザーの質問に対して、論理的かつ丁寧に回答してください。"
            "ドキュメントやPDFが共有されている場合は、その内容をもとに回答してください。"
        ),
    )

    # --- 会話履歴を構築 ---
    history = []
    context_injected = False
    pdf_attached = False

    for m in request.history:
        role = "user" if m.role == "user" else "model"

        if role == "user" and not context_injected:
            parts = []

            # PDF を最初のユーザーメッセージに添付
            if request.file_uri and not pdf_attached:
                parts.append({"file_data": {"mime_type": "application/pdf", "file_uri": request.file_uri}})
                pdf_attached = True

            # テキストドキュメントを最初のユーザーメッセージの先頭に挿入
            if request.document_context:
                parts.append(
                    f"【参照ドキュメント】\n{request.document_context}\n\n【質問】\n{m.content}"
                )
            else:
                parts.append(m.content)

            history.append({"role": "user", "parts": parts})
            context_injected = True
        else:
            history.append({"role": role, "parts": [m.content]})

    try:
        chat_session = model.start_chat(history=history)

        # 現在のメッセージ
        if not context_injected:
            current_parts = []

            if request.file_uri:
                current_parts.append({"file_data": {"mime_type": "application/pdf", "file_uri": request.file_uri}})

            if request.document_context:
                current_parts.append(
                    f"【参照ドキュメント】\n{request.document_context}\n\n【質問】\n{request.message}"
                )
            else:
                current_parts.append(request.message)

            response = chat_session.send_message(current_parts)
        else:
            response = chat_session.send_message(request.message)

        return {"response": response.text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API エラー: {type(e).__name__}: {str(e)}")


# Vercel serverless handler
handler = Mangum(app, lifespan="off")
