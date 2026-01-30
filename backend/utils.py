import os
from fastapi import UploadFile

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


async def save_upload_file(file: UploadFile) -> str:
    path = os.path.join(UPLOAD_DIR, file.filename)

    with open(path, "wb") as f:
        content = await file.read()
        f.write(content)

    return path
