FROM python:3.11-slim

RUN apt-get update && apt-get install -y tesseract-ocr

WORKDIR /app

# copy backend folder into container
COPY backend /app/backend

# move into backend as working dir
WORKDIR /app/backend

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
