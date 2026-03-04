from contextlib import asynccontextmanager
import io
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
    """
    Accept one or more images/PDFs of a government-issued ID, run OCR on
    each, merge the results, and return structured fields to pre-fill W-7.
    """
    try:
        import pytesseract
        from PIL import Image, ImageEnhance, ImageFilter
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="OCR dependencies not installed. Run: pip install pytesseract Pillow",
        )

    if not files:
        raise HTTPException(status_code=422, detail="At least one file is required.")

    all_pages: list[Image.Image] = []

    for upload in files:
        contents = await upload.read()
        filename = (upload.filename or "").lower()
        is_pdf = upload.content_type == "application/pdf" or filename.endswith(".pdf")

        if is_pdf:
            try:
                from pdf2image import convert_from_bytes
                pages = convert_from_bytes(contents, dpi=200)
                all_pages.extend(pages)
            except Exception as e:
                raise HTTPException(status_code=422, detail=f"Could not convert PDF '{upload.filename}': {e}")
        else:
            try:
                img = Image.open(io.BytesIO(contents))
                all_pages.append(img)
            except Exception:
                raise HTTPException(status_code=422, detail=f"Could not read image '{upload.filename}'.")

    if not all_pages:
        raise HTTPException(status_code=422, detail="No readable pages found in the uploaded files.")

    # Run OCR on every page, collect all text
    combined_lines: list[str] = []
    combined_raw = ""
    for img in all_pages:
        img = img.convert("L")
        img = img.filter(ImageFilter.SHARPEN)
        img = ImageEnhance.Contrast(img).enhance(2.0)
        raw = pytesseract.image_to_string(img, config="--psm 6")
        combined_raw += "\n" + raw
        combined_lines.extend(ln.strip() for ln in raw.splitlines() if ln.strip())

    # Parse and merge: first non-null value per field wins
    result = _parse_id_text(combined_lines, combined_raw)
    return result


def _parse_id_text(lines: list[str], raw: str) -> dict:
    """Extract structured fields from OCR text of a government ID."""
    extracted: dict[str, str | None] = {
        "first_name":   None,
        "last_name":    None,
        "dob":          None,
        "doc_number":   None,
        "doc_expiry":   None,
        "doc_type":     None,
        "issued_by":    None,
        "country":      None,
        "address":      None,
    }

    raw_upper = raw.upper()

    # ── Document type ────────────────────────────────────────────────────────
    if "PASSPORT" in raw_upper:
        extracted["doc_type"] = "Passport"
    elif "DRIVER" in raw_upper or "DRIVING" in raw_upper or "LICENSE" in raw_upper:
        extracted["doc_type"] = "Driver's license / State I.D."
    elif "NATIONAL" in raw_upper and "ID" in raw_upper:
        extracted["doc_type"] = "USCIS documentation"

    # ── Date patterns ────────────────────────────────────────────────────────
    date_patterns = [
        r"\b(\d{2})[/.\-](\d{2})[/.\-](\d{4})\b",   # DD/MM/YYYY or MM/DD/YYYY
        r"\b(\d{4})[/.\-](\d{2})[/.\-](\d{2})\b",   # YYYY-MM-DD
        r"\b(\d{2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{4})\b",
    ]

    found_dates: list[str] = []
    for pattern in date_patterns:
        for m in re.finditer(pattern, raw_upper):
            found_dates.append(m.group(0))

    # Match dates to labels
    for i, line in enumerate(lines):
        lu = line.upper()
        context = " ".join(lines[max(0, i-1):i+2]).upper()

        if any(kw in context for kw in ["BIRTH", "DOB", "BORN", "DATE OF BIRTH", "BIRTHDATE"]):
            for d in found_dates:
                if d in context.upper():
                    extracted["dob"] = _normalize_date(d)
                    break

        if any(kw in context for kw in ["EXPIR", "EXP.", "VALID UNTIL", "EXPIRY", "EXPIRES"]):
            for d in found_dates:
                if d in context.upper():
                    if extracted["doc_expiry"] is None:
                        extracted["doc_expiry"] = _normalize_date(d)
                    break

    # ── Document number ──────────────────────────────────────────────────────
    doc_num_pattern = r"\b([A-Z]{1,3}\d{6,9}|\d{8,9}|[A-Z0-9]{8,12})\b"
    for i, line in enumerate(lines):
        context = " ".join(lines[max(0, i-1):i+2]).upper()
        if any(kw in context for kw in ["NO.", "NUMBER", "PASSPORT", "LICENSE", "ID NO"]):
            m = re.search(doc_num_pattern, line.upper())
            if m and extracted["doc_number"] is None:
                extracted["doc_number"] = m.group(1)

    # ── Names ────────────────────────────────────────────────────────────────
    for i, line in enumerate(lines):
        lu = line.upper()
        next_line = lines[i + 1] if i + 1 < len(lines) else ""

        if any(lu.startswith(kw) for kw in ["SURNAME", "LAST NAME", "APELLIDO", "NOM"]):
            candidate = next_line or re.sub(r"^(SURNAME|LAST NAME|APELLIDO|NOM)[:\s]*", "", line, flags=re.I).strip()
            if candidate and extracted["last_name"] is None:
                extracted["last_name"] = candidate.title()

        if any(lu.startswith(kw) for kw in ["GIVEN NAME", "FIRST NAME", "GIVEN NAMES", "PRENOM", "NOMBRE"]):
            candidate = next_line or re.sub(r"^(GIVEN NAME|FIRST NAME|GIVEN NAMES|PRENOM|NOMBRE)[S]?[:\s]*", "", line, flags=re.I).strip()
            if candidate and extracted["first_name"] is None:
                extracted["first_name"] = candidate.title().split()[0] if candidate else None

    # ── Country / issuing authority ──────────────────────────────────────────
    for i, line in enumerate(lines):
        lu = line.upper()
        if any(kw in lu for kw in ["NATIONALITY", "CITIZENSHIP", "COUNTRY OF"]):
            next_line = lines[i + 1] if i + 1 < len(lines) else ""
            candidate = re.sub(r"(NATIONALITY|CITIZENSHIP|COUNTRY OF)[:\s]*", "", line, flags=re.I).strip()
            if not candidate and next_line:
                candidate = next_line.strip()
            if candidate:
                extracted["country"] = candidate.title()
                extracted["issued_by"] = candidate.title()
                break

    # ── Address (driver's licenses) ──────────────────────────────────────────
    for i, line in enumerate(lines):
        if re.search(r"\d+\s+\w+\s+(ST|AVE|BLVD|DR|RD|LN|WAY|CT|PL|ROAD|STREET|AVENUE)", line.upper()):
            extracted["address"] = line.strip()
            break

    return extracted


def _normalize_date(raw: str) -> str:
    """Attempt to normalize a date string to MM/DD/YYYY."""
    raw = raw.strip()
    month_abbrs = {
        "JAN": "01", "FEB": "02", "MAR": "03", "APR": "04",
        "MAY": "05", "JUN": "06", "JUL": "07", "AUG": "08",
        "SEP": "09", "OCT": "10", "NOV": "11", "DEC": "12",
    }

    # DD MON YYYY
    m = re.match(r"(\d{2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{4})", raw.upper())
    if m:
        return f"{month_abbrs[m.group(2)]}/{m.group(1)}/{m.group(3)}"

    # YYYY-MM-DD
    m = re.match(r"(\d{4})[/.\-](\d{2})[/.\-](\d{2})", raw)
    if m:
        return f"{m.group(2)}/{m.group(3)}/{m.group(1)}"

    # DD/MM/YYYY — if day > 12 it must be DD/MM
    m = re.match(r"(\d{2})[/.\-](\d{2})[/.\-](\d{4})", raw)
    if m:
        a, b, year = m.group(1), m.group(2), m.group(3)
        if int(a) > 12:      # definitely day first
            return f"{b}/{a}/{year}"
        return f"{a}/{b}/{year}"  # keep as-is (assume MM/DD)

    return raw


# ─── SPA static files ────────────────────────────────────────────────────────

_frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(_frontend_dist):
    app.mount("/", StaticFiles(directory=_frontend_dist, html=True), name="spa")
