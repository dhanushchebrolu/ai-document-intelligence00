from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pypdf import PdfReader
from PIL import Image
import pytesseract
import os
import json
import tempfile

app = FastAPI(title="AI Document Intelligence API — PDF + JPG")

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
def extract_pdf_text(path: str) -> str:
    reader = PdfReader(path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text


# ---------- JPG OCR Extract ----------
def extract_jpg_text(path: str) -> str:
    img = Image.open(path)
    return pytesseract.image_to_string(img)


# ---------- Analyze ----------
@app.post("/analyze")
async def analyze_document(file: UploadFile = File(...)):
    try:
        # ----- API KEY -----
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            return {"error": "GROQ_API_KEY not set in environment"}

        client = Groq(api_key=api_key)

        # ----- Save File -----
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        name = file.filename.lower()

        # ----- Type Routing -----
        if name.endswith(".pdf"):
            text = extract_pdf_text(tmp_path)

        elif name.endswith((".jpg", ".jpeg")):
            text = extract_jpg_text(tmp_path)

        else:
            return {"error": "Only PDF and JPG supported"}

        if not text.strip():
            return {"error": "No readable text found"}

        # ----- Prompt -----
        prompt = f"""
Extract Driving License information from this text.

Return STRICT JSON only.

Fields:
name
date_of_birth
license_number
issue_date
expiry_date
address
document_type

TEXT:
{text}
"""

        # ----- Groq Call -----
        chat = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You output only valid JSON."},
                {"role": "user", "content": prompt}
            ]
        )

        raw = chat.choices[0].message.content.strip()

        try:
            structured = json.loads(raw)
        except:
            structured = {"llm_raw_output": raw}

        return {
            "filename": file.filename,
            "raw_text_preview": text[:500],
            "extracted_data": structured
        }

    except Exception as e:
        return {"error": str(e)}
