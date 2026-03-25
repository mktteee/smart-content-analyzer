from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types
import os

app = Flask(__name__)
CORS(app)


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    if not data:
        return jsonify({"error": "リクエストが不正です"}), 400

    message = data.get("message", "")
    history = data.get("history", [])
    file_uri = data.get("file_uri")
    document_context = data.get("document_context")

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return jsonify({"error": "GEMINI_API_KEY が設定されていません"}), 500

    try:
        client = genai.Client(api_key=api_key)

        contents = []
        context_injected = False
        pdf_attached = False

        # 会話履歴を構築
        for m in history:
            role = "user" if m["role"] == "user" else "model"

            if role == "user" and not context_injected:
                parts = []

                if file_uri and not pdf_attached:
                    parts.append({"file_data": {"file_uri": file_uri, "mime_type": "application/pdf"}})
                    pdf_attached = True

                if document_context:
                    parts.append({"text": f"【参照ドキュメント】\n{document_context}\n\n【質問】\n{m['content']}"})
                else:
                    parts.append({"text": m["content"]})

                contents.append({"role": "user", "parts": parts})
                context_injected = True
            else:
                contents.append({"role": role, "parts": [{"text": m["content"]}]})

        # 現在のメッセージ
        current_parts = []
        if not context_injected:
            if file_uri:
                current_parts.append({"file_data": {"file_uri": file_uri, "mime_type": "application/pdf"}})

            if document_context:
                current_parts.append({"text": f"【参照ドキュメント】\n{document_context}\n\n【質問】\n{message}"})
            else:
                current_parts.append({"text": message})
        else:
            current_parts.append({"text": message})

        contents.append({"role": "user", "parts": current_parts})

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=(
                    "あなたは優秀なAIアシスタントです。"
                    "ユーザーの質問に対して、論理的かつ丁寧に回答してください。"
                    "ドキュメントやPDFが共有されている場合は、その内容をもとに回答してください。"
                ),
            ),
        )

        return jsonify({"response": response.text})

    except Exception as e:
        return jsonify({"error": f"{type(e).__name__}: {str(e)}"}), 500
