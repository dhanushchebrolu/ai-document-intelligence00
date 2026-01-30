FROM python:3.11-slim

# install OCR engine
RUN apt-get update && apt-get install -y tesseract-ocr

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
