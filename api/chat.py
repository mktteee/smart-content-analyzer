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
    file_uri: str | None = None  # Gemini Files API の URI（PDFアップロード後に取得）


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
            "PDFが共有されている場合は、その内容をもとに回答してください。"
        ),
    )

    # --- 会話履歴を構築 ---
    # PDF が渡されている場合、最初のユーザーメッセージに file_data を添付する
    history = []
    pdf_attached = False

    for m in request.history:
        role = "user" if m.role == "user" else "model"
        if role == "user" and request.file_uri and not pdf_attached:
            history.append({
                "role": "user",
                "parts": [
                    {"file_data": {"mime_type": "application/pdf", "file_uri": request.file_uri}},
                    m.content,
                ],
            })
            pdf_attached = True
        else:
            history.append({"role": role, "parts": [m.content]})

    chat_session = model.start_chat(history=history)

    # 現在のメッセージ（PDF がまだ添付されていなければここで添付）
    if request.file_uri and not pdf_attached:
        current_parts = [
            {"file_data": {"mime_type": "application/pdf", "file_uri": request.file_uri}},
            request.message,
        ]
        response = chat_session.send_message(current_parts)
    else:
        response = chat_session.send_message(request.message)

    return {"response": response.text}


# Vercel serverless handler
handler = Mangum(app, lifespan="off")
