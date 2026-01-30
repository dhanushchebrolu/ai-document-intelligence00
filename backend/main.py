from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from PIL import Image
import pytesseract
import os
import io
import json

app = FastAPI(title="AI Document Intelligence API")

# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Groq Client ----------
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


# ---------- Health ----------
@app.get("/")
def home():
    return {"message": "AI Document App Running"}


# ---------- Utility: clean LLM JSON ----------
def clean_llm_json(raw: str) -> str:
    raw = raw.strip()

    # remove ```json fences
    if raw.startswith("```"):
        parts = raw.split("```")
        if len(parts) >= 2:
            raw = parts[1]

        if raw.startswith("json"):
            raw = raw[4:]

    return raw.strip()


# ---------- Analyze Endpoint ----------
@app.post("/analyze")
async def analyze_document(file: UploadFile = File(...)):
    try:
        content = await file.read()
        filename = file.filename.lower()

        # ---------- OCR ----------
        if filename.endswith((".jpg", ".jpeg", ".png")):
            image = Image.open(io.BytesIO(content))
            text = pytesseract.image_to_string(image)
        else:
            text = content.decode("utf-8", errors="ignore")

        if not text.strip():
            return {"error": "No readable text found"}

        # ---------- LLM Prompt ----------
        prompt = f"""
Extract Driving License information from this OCR text.

Return STRICT JSON only.
Do NOT include markdown.
Do NOT include explanation.

Fields:
name
date_of_birth
license_number
issue_date
expiry_date
address
document_type

OCR TEXT:
{text}
"""

        chat = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You output only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0
        )

        raw = chat.choices[0].message.content

        # ---------- Clean + Parse ----------
        cleaned = clean_llm_json(raw)

        try:
            structured = json.loads(cleaned)
        except Exception as e:
            structured = {
                "name": "",
                "date_of_birth": "",
                "license_number": "",
                "issue_date": "",
                "expiry_date": "",
                "address": "",
                "document_type": "unknown",
                "llm_raw_output": cleaned,
                "parse_error": str(e)
            }

        # ---------- Ensure keys always exist ----------
        for key in [
            "name",
            "date_of_birth",
            "license_number",
            "issue_date",
            "expiry_date",
            "address",
            "document_type"
        ]:
            structured.setdefault(key, "")

        # ---------- Final Response ----------
        return {
            "filename": file.filename,
            "raw_text_preview": text[:500],
            "extracted_data": structured,
            "document_type": structured.get("document_type", "unknown")
        }

    except Exception as e:
        return {"error": str(e)}
