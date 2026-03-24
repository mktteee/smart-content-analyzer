from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from mangum import Mangum
import google.generativeai as genai
import os
import json

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
            "必要に応じてステップバイステップで説明し、具体例を交えて答えてください。"
        ),
    )

    # Gemini は role が "user" / "model"（"assistant" は不可）
    history = [
        {
            "role": "user" if m.role == "user" else "model",
            "parts": [m.content],
        }
        for m in request.history
    ]

    chat_session = model.start_chat(history=history)

    def stream_response():
        response = chat_session.send_message(request.message, stream=True)
        for chunk in response:
            if chunk.text:
                yield f"data: {json.dumps({'text': chunk.text})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        stream_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# Vercel serverless handler
handler = Mangum(app, lifespan="off")
