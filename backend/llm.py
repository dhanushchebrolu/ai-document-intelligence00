import requests
import json
import re

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3"


def clean_text(text: str) -> str:
    # remove OCR artifacts
    return re.sub(r"[~^_|`]", "", text)


def repair_json_if_needed(s: str) -> str:
    # auto-close braces if model forgot last }
    open_braces = s.count("{")
    close_braces = s.count("}")
    if open_braces > close_braces:
        s = s + ("}" * (open_braces - close_braces))
    return s


def extract_with_llm(text: str):

    text = clean_text(text)

    prompt = f"""
You are an AI system extracting Driving License fields.

RETURN ONLY VALID JSON.
NO markdown.
NO explanation.
NO code block.

Fields required:
document_type
name
dob
license_number
issue_date
expiry_date
address

Rules:
- Remove OCR artifacts
- License number only A-Z and digits
- Dates format DD-MM-YYYY
- Always output valid JSON

TEXT:
{text}
"""

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": MODEL,
            "prompt": prompt,
            "stream": False
        },
        timeout=120
    )

    raw_output = response.json()["response"]

    # Extract JSON block
    match = re.search(r"\{.*", raw_output, re.DOTALL)

    if not match:
        return {"error": "No JSON found", "raw": raw_output}

    json_text = repair_json_if_needed(match.group(0))

    try:
        data = json.loads(json_text)

        # normalize license number
        if "license_number" in data:
            data["license_number"] = re.sub(
                r"[^A-Z0-9]",
                "",
                data["license_number"].upper()
            )

        return data

    except Exception:
        return {
            "error": "JSON parse failed",
            "raw": raw_output
        }
