from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pypdf import PdfReader
import os
import json
import tempfile

app = FastAPI(title="AI Document Intelligence API — No OCR Mode")

# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Health ----------
@app.get("/")
def home():
    return {"message": "AI Document App Running"}


# ---------- PDF Text Extract ----------
def extract_pdf_text(file_path: str) -> str:
    reader = PdfReader(file_path)
    text = ""

    for page in reader.pages:
        text += page.extract_text() or ""

    return text


# ---------- Analyze ----------
@app.post("/analyze")
async def analyze_document(file: UploadFile = File(...)):
    tmp_path = None

    try:
        # ---------- Check API Key ----------
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            return {"error": "GROQ_API_KEY not set in environment"}

        client = Groq(api_key=api_key)

        # ---------- Validate File Type ----------
        suffix = os.path.splitext(file.filename)[1].lower()
        if suffix != ".pdf":
            return {"error": "Only digital PDF supported in deployed version"}

        # ---------- Save Upload ----------
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        # ---------- Extract Text ----------
        text = extract_pdf_text(tmp_path)

        if not text.strip():
            return {"error": "No readable text found in PDF"}

        # ---------- Prompt ----------
        prompt = f"""
Extract Driving License information from this text.

Return STRICT JSON only — no explanation.

Fields required:
name
date_of_birth
license_number
issue_date
expiry_date
address
document_type

Text:
{text}
"""

        # ---------- Groq Call ----------
        chat = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a JSON extraction engine."},
                {"role": "user", "content": prompt}
            ]
        )

        if not chat.choices:
            return {"error": "Model returned no output"}

        raw = chat.choices[0].message.content.strip()

        # ---------- Safe JSON Parse ----------
        try:
            structured = json.loads(raw)
        except Exception:
            structured = {
                "name": "",
                "date_of_birth": "",
                "license_number": "",
                "issue_date": "",
                "expiry_date": "",
                "address": "",
                "document_type": "unknown",
                "llm_raw_output": raw
            }

        return {
            "filename": file.filename,
            "raw_text_preview": text[:500],
            "extracted_data": structured,
            "document_type": structured.get("document_type", "unknown")
        }

    except Exception as e:
        return {"error": str(e)}

    finally:
        # ---------- Cleanup Temp File ----------
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
