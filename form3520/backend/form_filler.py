"""
PDF form filler for IRS Form 3520.
Maps FormAnswers dict to PDF field IDs and writes the filled PDF.
"""

import json
import os
from pathlib import Path
from typing import Any

from pypdf import PdfReader, PdfWriter
from pypdf.generic import BooleanObject, NameObject

PDF_PATH: str = os.path.join(os.path.dirname(__file__), "form3520_blank.pdf")
FIELD_MAP_PATH: str = os.path.join(os.path.dirname(__file__), "field_map.json")

with open(FIELD_MAP_PATH) as _f:
    FIELD_MAP: dict[str, str] = {
        k: v for k, v in json.load(_f).items() if not k.startswith("_")
    }

# Checkbox on-values per field (derived from PDF inspection)
CHECKBOX_ON_VALUES: dict[str, str] = {
    "topmostSubform[0].Page1[0].c1_3[0]": "1",   # amended return
    "topmostSubform[0].Page1[0].c1_4[0]": "1",   # Individual
    "topmostSubform[0].Page1[0].c1_4[1]": "2",   # Partnership
    "topmostSubform[0].Page1[0].c1_4[2]": "3",   # Corporation
    "topmostSubform[0].Page1[0].c1_4[3]": "4",   # Trust
    "topmostSubform[0].Page1[0].c1_4[4]": "5",   # Executor
    "topmostSubform[0].Page1[0].c1_6[0]": "1",   # Part I routing
    "topmostSubform[0].Page1[0].c1_7[0]": "1",   # Part II routing
    "topmostSubform[0].Page1[0].c1_8[0]": "1",   # Part III routing
    "topmostSubform[0].Page1[0].c1_9[0]": "1",   # Part IV routing
    "topmostSubform[0].Page2[0].c2_2[0]": "1",   # transfer was gift - Yes
    "topmostSubform[0].Page2[0].c2_2[1]": "2",   # transfer was gift - No
    "topmostSubform[0].Page2[0].c2_9[0]": "1",   # gratuitous transfer - Yes
    "topmostSubform[0].Page2[0].c2_9[1]": "2",   # gratuitous transfer - No
    "topmostSubform[0].Page4[0].c4_1[0]": "1",   # 3520-A filed - Yes
    "topmostSubform[0].Page4[0].c4_1[1]": "2",   # 3520-A filed - No
    "topmostSubform[0].Page6[0].c6_1[0]": "1",   # individual gifts - Yes
    "topmostSubform[0].Page6[0].c6_1[1]": "2",   # individual gifts - No
    "topmostSubform[0].Page6[0].c6_2[0]": "1",   # corp gifts - Yes
    "topmostSubform[0].Page6[0].c6_2[1]": "2",   # corp gifts - No
}

# Map from page prefix to page index (0-based)
PAGE_MAP: dict[str, int] = {
    "Page1": 0,
    "Page2": 1,
    "Page3": 2,
    "Page4": 3,
    "Page5": 4,
    "Page6": 5,
}


def fill_form(answers: dict, output_path: str) -> None:
    """Fill IRS Form 3520 with the provided answers and save to output_path."""
    reader = PdfReader(PDF_PATH)
    writer = PdfWriter()
    writer.append(reader)

    # Strip XFA layer so PDF viewers fall back to AcroForm (which we populate)
    if "/AcroForm" in writer._root_object:
        acroform = writer._root_object["/AcroForm"]
        if "/XFA" in acroform:
            del acroform["/XFA"]
        acroform[NameObject("/NeedAppearances")] = BooleanObject(True)

    flat = _flatten_answers(answers)

    # Group updates by page to minimize redundant writes
    page_updates: dict[int, dict[str, Any]] = {}

    for friendly_name, raw_value in flat.items():
        if friendly_name not in FIELD_MAP:
            continue
        pdf_field_id = FIELD_MAP[friendly_name]
        page_idx = _page_for_field(pdf_field_id)
        formatted = _format_value(friendly_name, raw_value, pdf_field_id)
        if formatted is None:
            continue
        if page_idx not in page_updates:
            page_updates[page_idx] = {}
        page_updates[page_idx][pdf_field_id] = formatted

    for page_idx, field_dict in page_updates.items():
        if page_idx < len(writer.pages):
            try:
                writer.update_page_form_field_values(
                    writer.pages[page_idx],
                    field_dict,
                    auto_regenerate=False,
                )
            except Exception as e:
                print(f"Warning: failed to update page {page_idx+1} fields: {e}")

    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)
    with open(output_path, "wb") as f:
        writer.write(f)


def _flatten_answers(answers: dict) -> dict[str, Any]:
    """Flatten nested FormAnswers into a flat dict of friendly_name → value."""
    flat: dict[str, Any] = {}

    # Identification
    ident = answers.get("identification", {})
    flat["taxpayer_name"] = ident.get("taxpayer_name", "")
    flat["taxpayer_tin"] = ident.get("taxpayer_tin", "")
    flat["taxpayer_address"] = ident.get("taxpayer_address", "")

    # Split city_state_zip → city, state, zip
    csz = str(ident.get("taxpayer_city_state_zip", ""))
    parts = csz.rsplit(",", 1)
    if len(parts) == 2:
        flat["taxpayer_city"] = parts[0].strip()
        sz = parts[1].strip().split(None, 1)
        flat["taxpayer_state"] = sz[0] if sz else ""
        flat["taxpayer_zip"] = sz[1] if len(sz) > 1 else ""
    else:
        flat["taxpayer_city"] = csz

    # Tax year (last 2 digits for calendar year field)
    tax_year = str(ident.get("tax_year", ""))
    flat["tax_year"] = tax_year[-2:] if len(tax_year) >= 2 else tax_year

    # Amended return
    if ident.get("is_amended") == "yes":
        flat["is_amended_yes"] = True

    # Filer type → checkbox
    filer_map = {
        "Individual": "filer_type_individual",
        "Estate": "filer_type_executor",
        "Trust": "filer_type_trust",
    }
    filer_type = ident.get("filer_type", "")
    if filer_type in filer_map:
        flat[filer_map[filer_type]] = True

    # Routing checkboxes
    parts_applicable = answers.get("parts_applicable", {})
    if parts_applicable.get("part_i"):
        flat["route_part_i_yes"] = True
    if parts_applicable.get("part_ii"):
        flat["route_part_ii_yes"] = True
    if parts_applicable.get("part_iii"):
        flat["route_part_iii_yes"] = True
    if parts_applicable.get("part_iv"):
        flat["route_part_iv_yes"] = True

    # Part I transfers
    transfers = answers.get("part_i_transfers", [])
    if transfers:
        first = transfers[0]
        flat["trust_name_main"] = first.get("p1_trust_name", "")
        flat["trust_ein_main"] = first.get("p1_trust_ein", "")
        flat["p1_trust_creator_name"] = ident.get("taxpayer_name", "")
        flat["p1_trust_creator_tin"] = ident.get("taxpayer_tin", "")
        flat["p1_trust_country_code_created"] = first.get("p1_trust_country", "")[:2].upper()
        flat["p1_trust_country_code_governs"] = first.get("p1_trust_country", "")[:2].upper()
        flat["p1_trust_creation_date"] = first.get("p1_transfer_date", "")

        # Gratuitous transfer checkbox
        received_fmv = first.get("p1_received_fmv", "yes")
        if received_fmv == "no":
            flat["p1_gratuitous_transfer_yes"] = True
        else:
            flat["p1_gratuitous_transfer_no"] = True

        # Fill transfer rows
        for i, transfer in enumerate(transfers[:3]):
            suffix = str(i + 1)
            flat[f"p1_transfer_date_{suffix}"] = transfer.get("p1_transfer_date", "")
            flat[f"p1_property_desc_{suffix}"] = transfer.get("p1_property_type", "")
            fmv = transfer.get("p1_fmv", 0)
            flat[f"p1_fmv_transferred_{suffix}"] = _fmt_currency(fmv)

    # Part II ownerships
    ownerships = answers.get("part_ii_ownerships", [])
    if ownerships:
        first = ownerships[0]
        flat["trust_name_main"] = flat.get("trust_name_main") or first.get("p2_trust_name", "")
        flat["trust_ein_main"] = flat.get("trust_ein_main") or first.get("p2_trust_ein", "")
        flat["p2_trust_owner_name"] = ident.get("taxpayer_name", "")
        flat["p2_trust_owner_tin"] = ident.get("taxpayer_tin", "")
        flat["p2_trust_owner_address"] = ident.get("taxpayer_address", "")
        flat["p2_trust_owner_country"] = "US"
        flat["p2_country_code_created"] = first.get("p2_trust_country", "")[:2].upper()
        flat["p2_country_code_governs"] = first.get("p2_trust_country", "")[:2].upper()
        flat["p2_creation_date"] = first.get("p2_creation_date", "")
        flat["p2_asset_value"] = _fmt_currency(first.get("p2_asset_value", 0))

        if first.get("p2_3520a_filed") == "yes":
            flat["p2_3520a_filed_yes"] = True
        else:
            flat["p2_3520a_filed_no"] = True

    # Part III distributions
    distributions = answers.get("part_iii_distributions", [])
    total_dist = 0.0
    for i, dist in enumerate(distributions[:3]):
        suffix = str(i + 1)
        flat[f"p3_dist_date_{suffix}"] = dist.get("p3_dist_date", "")
        flat[f"p3_dist_desc_{suffix}"] = dist.get("p3_trust_name", "")
        amt = float(dist.get("p3_dist_amount", 0) or 0)
        flat[f"p3_dist_fmv_{suffix}"] = _fmt_currency(amt)
        total_dist += amt
    if distributions:
        flat["p3_total_distributions"] = _fmt_currency(total_dist)

    # Part IV gifts
    part_iv = answers.get("part_iv_gifts")
    if part_iv:
        from_individual = part_iv.get("p4_from_individual") == "yes"
        from_corp = part_iv.get("p4_from_corp") == "yes"

        flat["p4_from_individual_yes" if from_individual else "p4_from_individual_no"] = True
        flat["p4_from_corp_yes" if from_corp else "p4_from_corp_no"] = True

        gifts = part_iv.get("p4_gifts", [])

        # Individual gifts section (line 54): date, description, FMV only — IRS form has no donor name column here
        if from_individual:
            if part_iv.get("p4_individual_total"):
                flat["p4_individual_total"] = _fmt_currency(float(part_iv["p4_individual_total"]))
            for i, gift in enumerate(gifts[:3]):
                suffix = str(i + 1)
                flat[f"p4_gift_date_{suffix}"] = gift.get("date_received", "")
                flat[f"p4_gift_desc_{suffix}"] = gift.get("description", "")
                flat[f"p4_gift_fmv_{suffix}"] = _fmt_currency(float(gift.get("fmv", 0) or 0))

        # Corp/partnership gifts section (line 55): includes donor name and address
        if from_corp:
            for i, gift in enumerate(gifts[:3]):
                suffix = str(i + 1)
                flat[f"p4_corp_gift_date_{suffix}"] = gift.get("date_received", "")
                flat[f"p4_corp_gift_donor_name_{suffix}"] = gift.get("donor_name", "")
                flat[f"p4_corp_gift_donor_address_{suffix}"] = gift.get("donor_address", "")
                flat[f"p4_corp_gift_desc_{suffix}"] = gift.get("description", "")
                flat[f"p4_corp_gift_fmv_{suffix}"] = _fmt_currency(float(gift.get("fmv", 0) or 0))

    return flat


def _format_value(friendly_name: str, value: Any, pdf_field_id: str) -> Any:
    """Format a value for writing to a PDF field."""
    if value is None:
        return None

    # Boolean → checkbox
    if isinstance(value, bool):
        if not value:
            return None
        on_val = CHECKBOX_ON_VALUES.get(pdf_field_id, "1")
        return NameObject("/" + on_val)

    s = str(value).strip()
    if not s:
        return None
    return s


def _fmt_currency(amount: float) -> str:
    """Format a number as US currency string."""
    try:
        return f"{float(amount):,.2f}"
    except (ValueError, TypeError):
        return str(amount)


def _page_for_field(field_id: str) -> int:
    """Return 0-based page index from field ID."""
    for page_key, page_idx in PAGE_MAP.items():
        if page_key in field_id:
            return page_idx
    return 0


if __name__ == "__main__":
    # Standalone test with hardcoded data covering all 4 parts
    test_answers = {
        "identification": {
            "taxpayer_name": "Jane A. Smith",
            "taxpayer_tin": "123-45-6789",
            "taxpayer_address": "100 Main Street, Apt 4B",
            "taxpayer_city_state_zip": "New York, NY 10001",
            "tax_year": 2024,
            "filer_type": "Individual",
            "is_amended": "no",
        },
        "parts_applicable": {
            "part_i": True,
            "part_ii": True,
            "part_iii": True,
            "part_iv": True,
        },
        "part_i_transfers": [
            {
                "p1_trust_name": "Smith Family Foreign Trust",
                "p1_trust_country": "Cayman Islands",
                "p1_transfer_date": "2024-06-15",
                "p1_trust_ein": "98-1234567",
                "p1_property_type": "Cash",
                "p1_fmv": 500000.00,
                "p1_is_grantor": "yes",
                "p1_received_fmv": "no",
                "p1_3520a_filed": "yes",
            }
        ],
        "part_ii_ownerships": [
            {
                "p2_trust_name": "Smith Family Foreign Trust",
                "p2_trust_country": "Cayman Islands",
                "p2_creation_date": "2020-01-15",
                "p2_trust_ein": "98-1234567",
                "p2_asset_value": 1250000.00,
                "p2_ownership_pct": 100,
                "p2_trustee_name": "Offshore Trust Co. Ltd.",
                "p2_trustee_address": "PO Box 1234, Grand Cayman KY1-1111",
                "p2_trustee_is_us": "no",
                "p2_3520a_filed": "yes",
            }
        ],
        "part_iii_distributions": [
            {
                "p3_trust_name": "Smith Family Foreign Trust",
                "p3_trust_country": "Cayman Islands",
                "p3_dist_date": "2024-09-01",
                "p3_dist_amount": 75000.00,
                "p3_is_grantor_trust": "yes",
                "p3_is_accumulation": "no",
                "p3_loans": "no",
            }
        ],
        "part_iv_gifts": {
            "p4_from_individual": "yes",
            "p4_individual_total": 150000.00,
            "p4_from_corp": "no",
            "p4_corp_total": None,
            "p4_gifts": [
                {
                    "date_received": "2024-03-10",
                    "description": "Cash gift from foreign relative",
                    "fmv": 150000.00,
                    "donor_name": "Johann Mueller",
                    "donor_address": "Hauptstrasse 12, Berlin, Germany 10115",
                }
            ],
        },
    }

    output = "output/test_filled.pdf"
    os.makedirs("output", exist_ok=True)
    fill_form(test_answers, output)
    print(f"✓ Test PDF written to {output}")
