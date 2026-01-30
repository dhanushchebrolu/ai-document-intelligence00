FROM python:3.11-slim

# ---- install OCR engine ----
RUN apt-get update && apt-get install -y tesseract-ocr

WORKDIR /app

# ✅ copy backend requirements specifically
COPY backend/requirements.txt requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

# ✅ copy backend code folder
COPY backend /app/backend

# ---- start server ----
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
