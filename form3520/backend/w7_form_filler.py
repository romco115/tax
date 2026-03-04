"""
PDF fill logic for IRS Form W-7 (Rev. December 2024).
"""
import json
import os

from pypdf import PdfReader, PdfWriter
from pypdf.generic import BooleanObject, NameObject

_DIR = os.path.dirname(__file__)
W7_PDF_PATH = os.path.join(_DIR, "w7_blank.pdf")

with open(os.path.join(_DIR, "w7_field_map.json")) as _f:
    _RAW: dict = json.load(_f)

_PREFIX = "topmostSubform[0].Page1[0]."
FIELD_MAP: dict[str, str] = {
    k: _PREFIX + v for k, v in _RAW.items() if not k.startswith("_")
}

# All W7 checkboxes use "1" as the on-value
CHECKBOX_ON: dict[str, str] = {v: "1" for v in FIELD_MAP.values()}


def fill_form(answers: dict, output_path: str) -> None:
    reader = PdfReader(W7_PDF_PATH)
    writer = PdfWriter()
    writer.append(reader)

    if "/AcroForm" in writer._root_object:
        acroform = writer._root_object["/AcroForm"]
        if "/XFA" in acroform:
            del acroform["/XFA"]
        acroform[NameObject("/NeedAppearances")] = BooleanObject(True)

    flat = _flatten_answers(answers)

    updates: dict[str, object] = {}
    for friendly, raw in flat.items():
        if friendly not in FIELD_MAP:
            continue
        pdf_id = FIELD_MAP[friendly]
        if raw is None:
            continue
        if isinstance(raw, bool):
            if raw:
                on_val = CHECKBOX_ON.get(pdf_id, "1")
                updates[pdf_id] = NameObject("/" + on_val)
        else:
            s = str(raw).strip()
            if s:
                updates[pdf_id] = s

    if updates:
        try:
            writer.update_page_form_field_values(
                writer.pages[0], updates, auto_regenerate=False
            )
        except Exception as e:
            print(f"Warning: W7 PDF fill error: {e}")

    os.makedirs(
        os.path.dirname(output_path) if os.path.dirname(output_path) else ".",
        exist_ok=True,
    )
    with open(output_path, "wb") as f:
        writer.write(f)


def _flatten_answers(answers: dict) -> dict:
    flat: dict = {}

    app_type = str(answers.get("application_type", "")).lower()
    if "new" in app_type:
        flat["apply_new_itin"] = True
    elif "renew" in app_type:
        flat["renew_itin"] = True

    reason = str(answers.get("reason", ""))
    if reason:
        letter = reason.strip()[0].lower()
        reason_map = {
            "a": "reason_a", "b": "reason_b", "c": "reason_c",
            "d": "reason_d", "e": "reason_e", "f": "reason_f",
            "g": "reason_g", "h": "reason_h",
        }
        if letter in reason_map:
            flat[reason_map[letter]] = True

    flat["first_name"]  = answers.get("first_name", "")
    flat["middle_name"] = answers.get("middle_name", "")
    flat["last_name"]   = answers.get("last_name", "")

    if answers.get("name_different_at_birth") == "yes":
        flat["birth_first_name"]  = answers.get("birth_first_name", "")
        flat["birth_middle_name"] = answers.get("birth_middle_name", "")
        flat["birth_last_name"]   = answers.get("birth_last_name", "")

    flat["mailing_street"]       = answers.get("mailing_street", "")
    flat["mailing_city_country"] = answers.get("mailing_city_country", "")

    if answers.get("has_foreign_address") == "yes":
        flat["foreign_street"]       = answers.get("foreign_street", "")
        flat["foreign_city_country"] = answers.get("foreign_city_country", "")

    flat["dob"]              = answers.get("dob", "")
    flat["country_of_birth"] = answers.get("country_of_birth", "")
    flat["city_of_birth"]    = answers.get("city_of_birth", "")

    sex = str(answers.get("sex", "")).lower()
    if sex == "male":
        flat["sex_male"] = True
    elif sex == "female":
        flat["sex_female"] = True

    flat["country_citizenship"] = answers.get("country_citizenship", "")

    if answers.get("has_foreign_tin") == "yes":
        flat["foreign_tin"] = answers.get("foreign_tin", "")

    if answers.get("has_us_visa") == "yes":
        flat["visa_type"] = answers.get("visa_type", "")

    doc_type = str(answers.get("doc_type", "")).lower()
    if "passport" in doc_type:
        flat["doc_passport"] = True
    elif "driver" in doc_type or "state" in doc_type:
        flat["doc_driver_license"] = True
    elif "uscis" in doc_type:
        flat["doc_uscis"] = True
    else:
        flat["doc_other_cb"]   = True
        flat["doc_other_desc"] = answers.get("doc_type", "")

    flat["doc_issued_by"] = answers.get("doc_issued_by", "")
    flat["doc_number"]    = answers.get("doc_number", "")
    flat["doc_expiry"]    = answers.get("doc_expiry", "")

    prev = str(answers.get("prev_tin", "")).lower()
    if "yes" in prev:
        flat["prev_tin_yes"] = True
        itin_raw = str(answers.get("prev_itin", "")).replace("-", "")
        if len(itin_raw) == 9:
            flat["itin_1"] = itin_raw[0:4]
            flat["itin_2"] = itin_raw[4:6]
            flat["itin_3"] = itin_raw[6:9]
    else:
        flat["prev_tin_no"] = True

    flat["applicant_phone"] = answers.get("applicant_phone", "")

    return flat
