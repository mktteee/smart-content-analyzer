from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types
import os
import tempfile
import time

app = Flask(__name__)
CORS(app)


@app.route("/api/upload", methods=["POST"])
def upload():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return jsonify({"error": "GEMINI_API_KEY が設定されていません"}), 500

    if "file" not in request.files:
        return jsonify({"error": "ファイルが見つかりません"}), 400

    file = request.files["file"]
    content_type = (file.content_type or "").split(";")[0].strip()

    if content_type != "application/pdf":
        return jsonify({"error": "PDFファイルのみ対応しています"}), 400

    try:
        client = genai.Client(api_key=api_key)
        content = file.read()

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            uploaded = client.files.upload(
                file=tmp_path,
                config=types.UploadFileConfig(
                    mime_type="application/pdf",
                    display_name=file.filename or "uploaded.pdf",
                ),
            )

            # ACTIVE になるまで最大 20 秒待つ
            for _ in range(20):
                state = str(uploaded.state)
                if "ACTIVE" in state:
                    break
                if "FAILED" in state:
                    return jsonify({"error": "PDFの処理に失敗しました"}), 500
                time.sleep(1)
                uploaded = client.files.get(name=uploaded.name)

            if "ACTIVE" not in str(uploaded.state):
                return jsonify({"error": "PDFの処理がタイムアウトしました"}), 408

            return jsonify({
                "file_uri": uploaded.uri,
                "display_name": file.filename or "uploaded.pdf",
            })

        finally:
            os.unlink(tmp_path)

    except Exception as e:
        return jsonify({"error": f"{type(e).__name__}: {str(e)}"}), 500
