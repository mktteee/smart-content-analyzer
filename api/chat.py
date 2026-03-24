from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from mangum import Mangum
import anthropic
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
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY が設定されていません")

    client = anthropic.Anthropic(api_key=api_key)

    messages = [
        {"role": m.role, "content": m.content}
        for m in request.history
    ] + [{"role": "user", "content": request.message}]

    def stream_response():
        with client.messages.stream(
            model="claude-opus-4-6",
            max_tokens=4096,
            system=(
                "あなたは優秀なAIアシスタントです。"
                "ユーザーの質問に対して、論理的かつ丁寧に回答してください。"
                "必要に応じてステップバイステップで説明し、具体例を交えて答えてください。"
            ),
            messages=messages,
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {json.dumps({'text': text})}\n\n"
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
