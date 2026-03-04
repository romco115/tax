"""
Validation logic for IRS Form W-7 fields.
"""
import re
from datetime import date


def validate_field(field: str, value: object) -> dict:
    errors: list[str] = []
    warnings: list[str] = []

    if field == "dob":
        s = str(value or "").strip()
        if s:
            if not re.match(r"^\d{2}/\d{2}/\d{4}$", s):
                errors.append("Date of birth must be in MM/DD/YYYY format.")
            else:
                try:
                    month, day, year = int(s[:2]), int(s[3:5]), int(s[6:])
                    dob = date(year, month, day)
                    if dob >= date.today():
                        errors.append("Date of birth cannot be today or in the future.")
                    if dob.year < 1900:
                        warnings.append("Date of birth year appears unusually early — please verify.")
                except ValueError:
                    errors.append("Date of birth contains an invalid date.")

    elif field == "doc_expiry":
        s = str(value or "").strip()
        if s and s.upper() != "N/A":
            if not re.match(r"^\d{2}/\d{2}/\d{4}$", s):
                errors.append("Expiration date must be in MM/DD/YYYY format or 'N/A'.")
            else:
                try:
                    month, day, year = int(s[:2]), int(s[3:5]), int(s[6:])
                    exp = date(year, month, day)
                    if exp < date.today():
                        warnings.append(
                            "Your identification document appears to be expired. "
                            "The IRS requires valid (unexpired) identification documents."
                        )
                except ValueError:
                    errors.append("Expiration date contains an invalid date.")

    elif field == "prev_itin":
        s = str(value or "").strip()
        if s:
            if not re.match(r"^9\d{2}-\d{2}-\d{4}$|^9\d{8}$", s):
                errors.append("ITIN must start with 9 and follow the format 9XX-XX-XXXX.")

    elif field == "first_name" or field == "last_name":
        s = str(value or "").strip()
        if not s:
            errors.append("This field is required.")

    elif field == "reason":
        s = str(value or "").strip()
        if not s:
            errors.append("You must select a reason for applying.")
        if s.startswith("d —") or s.startswith("e —"):
            warnings.append(
                "For reason d or e, you must attach a copy of your U.S. citizen/resident's SSN card or ITIN assignment letter."
            )
        if s.startswith("a —") or s.startswith("f —"):
            warnings.append(
                "For reason a or f, you must also complete the treaty country and treaty article number fields."
            )

    elif field == "doc_type":
        s = str(value or "").strip()
        if s and s != "Passport":
            warnings.append(
                "A passport is the only stand-alone document accepted. "
                "If submitting another document type, you must also include a second supporting document."
            )

    elif field == "application_type":
        s = str(value or "").strip()
        if s == "Renew an existing ITIN":
            warnings.append(
                "To renew an ITIN, you must include your most recently filed U.S. federal tax return (or an explanation if no return was filed)."
            )

    return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}
