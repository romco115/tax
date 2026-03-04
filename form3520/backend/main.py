from contextlib import asynccontextmanager
import os
import re
import time
from datetime import date
import urllib.request

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

import questions as questions_module
import validator
import form_filler

IRS_PDF_URL = "https://www.irs.gov/pub/irs-pdf/f3520.pdf"
PDF_PATH = "form3520_blank.pdf"


def download_form() -> None:
    if not os.path.exists(PDF_PATH):
        try:
            urllib.request.urlretrieve(IRS_PDF_URL, PDF_PATH)
            print(f"✓ Downloaded Form 3520 → {PDF_PATH}")
        except Exception as e:
            print(
                f"✗ PDF download failed: {e}. "
                "Place form3520_blank.pdf in backend/ manually."
            )


@asynccontextmanager
async def lifespan(app: FastAPI):
    download_form()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}


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
    if not os.path.exists(PDF_PATH):
        raise HTTPException(
            status_code=503,
            detail="form3520_blank.pdf is missing. Place it in the backend/ directory.",
        )
    output_path = f"output/form3520_filled_{int(time.time())}.pdf"
    os.makedirs("output", exist_ok=True)
    try:
        form_filler.fill_form(answers, output_path)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"PDF generation failed: {e}")

    raw_name = str(answers.get("taxpayer_name", "client")).strip()
    safe_name = re.sub(r"[^A-Za-z0-9]+", "_", raw_name).strip("_")
    today = date.today().strftime("%Y-%m-%d")
    download_name = f"Form3520_{safe_name}_{today}.pdf"

    return FileResponse(
        output_path,
        media_type="application/pdf",
        filename=download_name,
    )


_frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(_frontend_dist):
    app.mount("/", StaticFiles(directory=_frontend_dist, html=True), name="spa")
