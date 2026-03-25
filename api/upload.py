from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
import google.generativeai as genai
import os
import tempfile
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY が設定されていません")

    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="PDFファイルのみ対応しています")

    genai.configure(api_key=api_key)

    content = await file.read()

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        uploaded = genai.upload_file(
            tmp_path,
            mime_type="application/pdf",
            display_name=file.filename or "uploaded.pdf",
        )

        # ACTIVE になるまで最大 20 秒待つ
        for _ in range(20):
            if uploaded.state.name == "ACTIVE":
                break
            if uploaded.state.name == "FAILED":
                raise HTTPException(status_code=500, detail="PDFの処理に失敗しました")
            time.sleep(1)
            uploaded = genai.get_file(uploaded.name)

        if uploaded.state.name != "ACTIVE":
            raise HTTPException(status_code=408, detail="PDFの処理がタイムアウトしました。再試行してください")

        return {
            "file_uri": uploaded.uri,
            "display_name": file.filename or "uploaded.pdf",
        }
    finally:
        os.unlink(tmp_path)


handler = Mangum(app, lifespan="off")
