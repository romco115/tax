from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

import io
import json
import os
import re
import time
from datetime import date
import urllib.request

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

import questions as questions_module
import validator
import form_filler
import w7_questions as w7_questions_module
import w7_validator
import w7_form_filler

IRS_3520_URL = "https://www.irs.gov/pub/irs-pdf/f3520.pdf"
IRS_W7_URL   = "https://www.irs.gov/pub/irs-pdf/fw7.pdf"
PDF_3520_PATH = "form3520_blank.pdf"
PDF_W7_PATH   = "w7_blank.pdf"


def download_form(url: str, path: str, label: str) -> None:
    if not os.path.exists(path):
        try:
            urllib.request.urlretrieve(url, path)
            print(f"✓ Downloaded {label} → {path}")
        except Exception as e:
            print(f"✗ {label} download failed: {e}. Place {path} in backend/ manually.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    download_form(IRS_3520_URL, PDF_3520_PATH, "Form 3520")
    download_form(IRS_W7_URL,   PDF_W7_PATH,   "Form W-7")
    if os.environ.get("GEMINI_API_KEY"):
        print("✓ GEMINI_API_KEY detected — AI-powered ID extraction enabled")
    else:
        print("⚠ GEMINI_API_KEY not set — ID extraction will not work")
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health ──────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}


# ─── Form 3520 ───────────────────────────────────────────────────────────────

@app.get("/api/questions")
async def get_questions() -> list:
    return questions_module.QUESTIONS


@app.post("/api/validate")
async def validate_field(body: dict) -> dict:
    field = body.get("field", "")
    value = body.get("value")
    if not field:
        raise HTTPException(status_code=422, detail="field is required")
    return validator.validate_field(field, value)


@app.post("/api/generate-pdf")
async def generate_pdf(answers: dict) -> FileResponse:
    if not os.path.exists(PDF_3520_PATH):
        raise HTTPException(status_code=503, detail="form3520_blank.pdf is missing.")
    output_path = f"output/form3520_filled_{int(time.time())}.pdf"
    os.makedirs("output", exist_ok=True)
    try:
        form_filler.fill_form(answers, output_path)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"PDF generation failed: {e}")

    raw_name = str(answers.get("taxpayer_name", "client")).strip()
    safe_name = re.sub(r"[^A-Za-z0-9]+", "_", raw_name).strip("_")
    today = date.today().strftime("%Y-%m-%d")
    return FileResponse(output_path, media_type="application/pdf",
                        filename=f"Form3520_{safe_name}_{today}.pdf")


# ─── Form W-7 ────────────────────────────────────────────────────────────────

@app.get("/api/w7/questions")
async def get_w7_questions() -> list:
    return w7_questions_module.W7_QUESTIONS


@app.post("/api/w7/validate")
async def validate_w7_field(body: dict) -> dict:
    field = body.get("field", "")
    value = body.get("value")
    if not field:
        raise HTTPException(status_code=422, detail="field is required")
    return w7_validator.validate_field(field, value)


@app.post("/api/w7/generate-pdf")
async def generate_w7_pdf(answers: dict) -> FileResponse:
    if not os.path.exists(PDF_W7_PATH):
        raise HTTPException(status_code=503, detail="w7_blank.pdf is missing.")
    output_path = f"output/w7_filled_{int(time.time())}.pdf"
    os.makedirs("output", exist_ok=True)
    try:
        w7_form_filler.fill_form(answers, output_path)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"W7 PDF generation failed: {e}")

    first = re.sub(r"[^A-Za-z0-9]+", "_", str(answers.get("first_name", ""))).strip("_")
    last  = re.sub(r"[^A-Za-z0-9]+", "_", str(answers.get("last_name",  ""))).strip("_")
    today = date.today().strftime("%Y-%m-%d")
    return FileResponse(output_path, media_type="application/pdf",
                        filename=f"FormW7_{first}_{last}_{today}.pdf")


@app.post("/api/w7/extract-id")
async def extract_id(files: list[UploadFile] = File(...)) -> dict:
    """Send uploaded ID images/PDFs directly to Gemini for data extraction."""
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_key:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY environment variable is not set.",
        )

    if not files:
        raise HTTPException(status_code=422, detail="At least one file is required.")

    file_parts: list[dict] = []
    for upload in files:
        contents = await upload.read()
        filename = (upload.filename or "").lower()

        mime = upload.content_type or "application/octet-stream"
        if filename.endswith(".pdf"):
            mime = "application/pdf"
        elif filename.endswith((".jpg", ".jpeg")):
            mime = "image/jpeg"
        elif filename.endswith(".png"):
            mime = "image/png"
        elif filename.endswith(".webp"):
            mime = "image/webp"

        file_parts.append({"mime_type": mime, "data": contents})

    return await _extract_with_gemini(file_parts, gemini_key)


# ─── ID Extraction Helpers ────────────────────────────────────────────────────

_GEMINI_PROMPT = """\
Analyze the provided government-issued identification document image(s) \
(passport, driver's license, or national ID card) and extract the following \
fields. Return ONLY a valid JSON object with these exact keys. \
Use null for any field you cannot confidently determine.

{
  "first_name":  "given / first name (string or null)",
  "last_name":   "surname / last name (string or null)",
  "dob":         "date of birth in MM/DD/YYYY format (string or null)",
  "doc_number":  "document number such as passport number (string or null)",
  "doc_expiry":  "expiration date in MM/DD/YYYY format (string or null)",
  "doc_type":    "EXACTLY one of: Passport | Driver's license / State I.D. | USCIS documentation | Other",
  "issued_by":   "issuing country or authority (string or null)",
  "country":     "nationality / citizenship — use standard English country name (string or null)",
  "address":     "full address if visible (string or null)",
  "sex":         "Male or Female (string or null)"
}

Rules:
- Dates MUST use MM/DD/YYYY format.
- doc_type MUST be exactly one of the four values listed above, or null.
- If there is a MRZ (Machine Readable Zone), use it to cross-verify other fields.
- Return ONLY the JSON object. No markdown, no explanation, no extra text."""

_EXTRACTED_FIELDS = [
    "first_name", "last_name", "dob", "doc_number", "doc_expiry",
    "doc_type", "issued_by", "country", "address", "sex",
]


async def _extract_with_gemini(file_parts: list[dict], api_key: str) -> dict:
    """Send files directly to Gemini and return structured ID fields."""
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")

    response = await model.generate_content_async(
        [_GEMINI_PROMPT, *file_parts],
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.1,
        ),
    )

    parsed = json.loads(response.text.strip())
    result = {k: parsed.get(k) for k in _EXTRACTED_FIELDS}

    if result.get("country"):
        result["country"] = _best_country_match(result["country"])
    if result.get("issued_by"):
        matched = _best_country_match(result["issued_by"])
        if matched != result["issued_by"]:
            result["issued_by"] = matched

    return result


def _best_country_match(name: str) -> str:
    """Return the closest match from the W7 countries list, or the original."""
    lower = name.lower().strip()
    for c in w7_questions_module.COUNTRIES:
        if c.lower() == lower:
            return c
    for c in w7_questions_module.COUNTRIES:
        if lower in c.lower() or c.lower() in lower:
            return c
    return name


# ─── SPA static files ────────────────────────────────────────────────────────

_frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(_frontend_dist):
    app.mount("/", StaticFiles(directory=_frontend_dist, html=True), name="spa")
