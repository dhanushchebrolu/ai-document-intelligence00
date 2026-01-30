from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from backend.ocr import extract_text_from_image
from backend.pdf_parser import extract_text_from_pdf
from backend.llm import extract_with_llm
from backend.utils import save_upload_file

app = FastAPI()

# ✅ CORS (required for frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health():
    return {"status": "backend running"}

@app.post("/process-document")
async def process_document(file: UploadFile = File(...)):
    try:
        print("🚀 Processing:", file.filename)

        file_path = await save_upload_file(file)

        # 1️⃣ Extract text
        if file.filename.lower().endswith((".png", ".jpg", ".jpeg")):
            text = extract_text_from_image(file_path)

        elif file.filename.lower().endswith(".pdf"):
            text = extract_text_from_pdf(file_path)

        else:
            return {"error": "Unsupported file type"}

        if not text or len(text.strip()) < 20:
            return {"error": "No readable text found in document"}

        # 2️⃣ LLM extraction
        extracted = extract_with_llm(text)

        return {
            "document_type": extracted.get("document_type", "Driving License"),
            "extracted_data": extracted,
            "raw_text_preview": text[:500]
        }

    except Exception as e:
        print("❌ SERVER ERROR:", str(e))
        return {"error": str(e)}
