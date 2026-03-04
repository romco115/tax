import datetime
import re
from typing import Any

CURRENT_YEAR: int = datetime.date.today().year

THRESHOLDS: dict[str, int] = {
    "individual_gift": 100_000,
    "corp_gift": 16_649,  # 2024 threshold — update annually
}


def validate_field(field: str, value: Any) -> dict:
    errors: list[str] = []
    warnings: list[str] = []

    if field == "taxpayer_tin":
        if not re.match(r"^\d{3}-\d{2}-\d{4}$|^\d{2}-\d{7}$|^\d{9}$", str(value or "")):
            errors.append(
                "Enter a valid SSN (XXX-XX-XXXX), EIN (XX-XXXXXXX), or 9 digits without dashes."
            )

    elif field == "tax_year":
        try:
            yr = int(value)
            if not (2000 <= yr <= CURRENT_YEAR):
                errors.append(f"Tax year must be between 2000 and {CURRENT_YEAR}.")
        except (ValueError, TypeError):
            errors.append("Tax year must be a 4-digit number.")

    elif field == "p1_is_grantor" and value == "yes":
        warnings.append(
            "Transfers to foreign grantor trusts have special reporting requirements "
            "under IRC §679."
        )

    elif field == "p1_property_type" and value != "Cash":
        warnings.append(
            "If you transferred appreciated property, you may also need to file Form 8938."
        )

    elif field == "p1_3520a_filed" and value == "no":
        warnings.append(
            "⚠ The foreign trust must file Form 3520-A annually. "
            "Penalties apply for failure to file."
        )

    elif field == "p2_ownership_pct":
        try:
            pct = float(value)
            if pct == 100:
                warnings.append(
                    "ℹ You are treated as the sole grantor of this trust."
                )
            elif not (0 <= pct <= 100):
                errors.append("Ownership percentage must be between 0 and 100.")
        except (ValueError, TypeError):
            errors.append("Enter a valid percentage between 0 and 100.")

    elif field == "p2_3520a_filed" and value == "no":
        warnings.append(
            "⚠ As a U.S. owner, you are responsible for ensuring Form 3520-A is filed. "
            "Penalties can reach 5% of gross trust assets per year."
        )

    elif field == "p3_is_accumulation" and value == "yes":
        warnings.append(
            "⚠ Accumulation distributions from foreign non-grantor trusts are subject to "
            "throwback rules and may require Schedule B calculations."
        )

    elif field == "p3_dist_amount":
        warnings.append(
            "ℹ Distributions from foreign trusts are generally includible in your gross income."
        )

    elif field == "p4_individual_total":
        if value is not None and value != "":
            try:
                amt = float(value)
                if amt > THRESHOLDS["individual_gift"]:
                    warnings.append(
                        f"⚠ Gifts over ${THRESHOLDS['individual_gift']:,} from foreign individuals "
                        "must be fully reported. Failure-to-report penalty: 5% per month, up to 25%."
                    )
            except (ValueError, TypeError):
                errors.append("Enter a valid dollar amount.")

    elif field == "p4_corp_total":
        if value is not None and value != "":
            try:
                amt = float(value)
                if amt > THRESHOLDS["corp_gift"]:
                    warnings.append(
                        f"⚠ Gifts over ${THRESHOLDS['corp_gift']:,} from foreign "
                        "corps/partnerships must be itemized. Adjust for current tax year threshold."
                    )
            except (ValueError, TypeError):
                errors.append("Enter a valid dollar amount.")

    elif field in ("p4_from_individual", "p4_from_corp"):
        warnings.append(
            "ℹ Gifts from foreign persons are generally not taxable income but must still "
            "be reported on Form 3520."
        )

    return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}
