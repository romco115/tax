"""
Question schema for IRS Form W-7 (Rev. December 2024) interview.
"""

COUNTRIES: list[str] = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
    "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
    "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
    "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
    "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada",
    "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
    "Congo (Brazzaville)", "Congo (Kinshasa)", "Costa Rica", "Croatia", "Cuba", "Cyprus",
    "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador",
    "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini",
    "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany",
    "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
    "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
    "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya",
    "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho",
    "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi",
    "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius",
    "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco",
    "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand",
    "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman",
    "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru",
    "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda",
    "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa",
    "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia",
    "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands",
    "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka",
    "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan",
    "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago",
    "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine",
    "United Arab Emirates", "United Kingdom", "Uruguay", "Uzbekistan", "Vanuatu",
    "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
]

W7_QUESTIONS: list[dict] = [
    # ─── APPLICATION TYPE ────────────────────────────────────────────────────────
    {
        "id": "application_type",
        "part": "identification",
        "label": "What type of ITIN application is this?",
        "help_text": "Select whether you are applying for a new ITIN or renewing an existing one.",
        "type": "select",
        "options": ["Apply for a new ITIN", "Renew an existing ITIN"],
        "required": True,
        "validation": {},
    },

    # ─── REASON FOR APPLYING ─────────────────────────────────────────────────────
    {
        "id": "reason",
        "part": "identification",
        "label": "What is your reason for applying for an ITIN?",
        "help_text": (
            "Select the box that best describes your situation. "
            "a = Nonresident alien for tax treaty benefit. "
            "b = Nonresident alien filing U.S. federal return. "
            "c = U.S. resident alien filing U.S. federal return. "
            "d = Dependent of U.S. citizen/resident alien. "
            "e = Spouse of U.S. citizen/resident alien. "
            "f = Nonresident alien student, professor, or researcher. "
            "g = Dependent/spouse of nonresident alien with U.S. visa. "
            "h = Other (see instructions)."
        ),
        "type": "select",
        "options": [
            "a — Nonresident alien: tax treaty benefit",
            "b — Nonresident alien: filing U.S. federal return",
            "c — U.S. resident alien: filing U.S. federal return",
            "d — Dependent of U.S. citizen/resident alien",
            "e — Spouse of U.S. citizen/resident alien",
            "f — Nonresident alien student/professor/researcher",
            "g — Dependent/spouse of nonresident alien (U.S. visa)",
            "h — Other",
        ],
        "required": True,
        "validation": {},
    },

    # ─── PERSONAL NAME ───────────────────────────────────────────────────────────
    {
        "id": "first_name",
        "part": "identification",
        "label": "What is your legal first name (1a)?",
        "help_text": "Enter your first name exactly as it appears on your identification document.",
        "type": "text",
        "required": True,
        "validation": {},
    },
    {
        "id": "middle_name",
        "part": "identification",
        "label": "What is your middle name or initial (1a)? (optional)",
        "help_text": "Enter your middle name or initial, or leave blank if none.",
        "type": "text",
        "required": False,
        "validation": {},
    },
    {
        "id": "last_name",
        "part": "identification",
        "label": "What is your legal last name (1a)?",
        "help_text": "Enter your last name (surname) as it appears on your identification document.",
        "type": "text",
        "required": True,
        "validation": {},
    },

    # ─── NAME AT BIRTH ───────────────────────────────────────────────────────────
    {
        "id": "name_different_at_birth",
        "part": "identification",
        "label": "Is your current legal name different from the name on your birth certificate (1b)?",
        "help_text": "Answer Yes if you legally changed your name (e.g., by marriage or court order).",
        "type": "yesno",
        "required": True,
        "validation": {},
    },
    {
        "id": "birth_first_name",
        "part": "identification",
        "label": "What was your first name at birth (1b)?",
        "help_text": "Enter your first name exactly as it appears on your birth certificate.",
        "type": "text",
        "required": False,
        "validation": {},
    },
    {
        "id": "birth_last_name",
        "part": "identification",
        "label": "What was your last name at birth (1b)?",
        "help_text": "Enter your last name (surname) as it appears on your birth certificate.",
        "type": "text",
        "required": False,
        "validation": {},
    },

    # ─── MAILING ADDRESS ─────────────────────────────────────────────────────────
    {
        "id": "mailing_street",
        "part": "identification",
        "label": "What is your mailing street address (line 2)?",
        "help_text": "Enter your street address, apartment number, or rural route number. If you have a P.O. box, see separate instructions.",
        "type": "text",
        "required": True,
        "validation": {},
    },
    {
        "id": "mailing_city_country",
        "part": "identification",
        "label": "What is your mailing city, state/province, postal code, and country?",
        "help_text": "Include ZIP code or postal code where appropriate. Example: Miami, FL 33101, United States",
        "type": "text",
        "required": True,
        "validation": {},
    },

    # ─── FOREIGN ADDRESS ─────────────────────────────────────────────────────────
    {
        "id": "has_foreign_address",
        "part": "identification",
        "label": "Do you have a foreign (non-U.S.) address different from your mailing address (line 3)?",
        "help_text": "Answer Yes if you reside outside the United States at an address different from the one you listed above. Do not use a P.O. box.",
        "type": "yesno",
        "required": True,
        "validation": {},
    },
    {
        "id": "foreign_street",
        "part": "identification",
        "label": "What is your foreign street address (line 3)?",
        "help_text": "Enter your foreign street address. Do not use a P.O. box number.",
        "type": "text",
        "required": False,
        "validation": {},
    },
    {
        "id": "foreign_city_country",
        "part": "identification",
        "label": "What is your foreign city, state/province, postal code, and country?",
        "help_text": "Include the postal code where appropriate.",
        "type": "text",
        "required": False,
        "validation": {},
    },

    # ─── BIRTH INFORMATION ───────────────────────────────────────────────────────
    {
        "id": "dob",
        "part": "identification",
        "label": "What is your date of birth (line 4)?",
        "help_text": "Enter in MM/DD/YYYY format. Example: 03/15/1985",
        "type": "text",
        "required": True,
        "validation": {"pattern": r"^\d{2}/\d{2}/\d{4}$"},
    },
    {
        "id": "country_of_birth",
        "part": "identification",
        "label": "What is your country of birth (line 4)?",
        "help_text": "Enter the country where you were born.",
        "type": "select",
        "options": COUNTRIES,
        "required": True,
        "validation": {},
    },
    {
        "id": "city_of_birth",
        "part": "identification",
        "label": "What is your city (and state/province) of birth? (optional)",
        "help_text": "Enter the city and, if applicable, state or province where you were born.",
        "type": "text",
        "required": False,
        "validation": {},
    },
    {
        "id": "sex",
        "part": "identification",
        "label": "What is your sex (line 5)?",
        "help_text": "Select Male or Female as it appears on your identification document.",
        "type": "select",
        "options": ["Male", "Female"],
        "required": True,
        "validation": {},
    },

    # ─── OTHER INFORMATION ───────────────────────────────────────────────────────
    {
        "id": "country_citizenship",
        "part": "identification",
        "label": "What is your country (or countries) of citizenship (6a)?",
        "help_text": "Enter the country or countries of which you are a citizen.",
        "type": "select",
        "options": COUNTRIES,
        "required": True,
        "validation": {},
    },
    {
        "id": "has_foreign_tin",
        "part": "identification",
        "label": "Do you have a foreign tax identification number (6b)?",
        "help_text": "A foreign tax ID is a number assigned by your home country's tax authority (not a U.S. TIN).",
        "type": "yesno",
        "required": True,
        "validation": {},
    },
    {
        "id": "foreign_tin",
        "part": "identification",
        "label": "What is your foreign tax identification number (6b)?",
        "help_text": "Enter the tax ID number issued to you by your home country.",
        "type": "text",
        "required": False,
        "validation": {},
    },
    {
        "id": "has_us_visa",
        "part": "identification",
        "label": "Do you have a U.S. visa (6c)?",
        "help_text": "Answer Yes if you currently hold any type of U.S. nonimmigrant visa.",
        "type": "yesno",
        "required": True,
        "validation": {},
    },
    {
        "id": "visa_type",
        "part": "identification",
        "label": "What type of U.S. visa do you hold (6c)?",
        "help_text": "Examples: F-1 (student), J-1 (exchange visitor), H-1B (specialty occupation), B-1/B-2 (visitor), etc.",
        "type": "text",
        "required": False,
        "validation": {},
    },

    # ─── IDENTIFICATION DOCUMENT ─────────────────────────────────────────────────
    {
        "id": "doc_type",
        "part": "identification",
        "label": "What type of identification document are you submitting (6d)?",
        "help_text": (
            "Choose the primary document you are submitting with this application. "
            "A passport is the only stand-alone document accepted. "
            "All other documents must be submitted with a second supporting document."
        ),
        "type": "select",
        "options": ["Passport", "Driver's license / State I.D.", "USCIS documentation", "Other"],
        "required": True,
        "validation": {},
    },
    {
        "id": "doc_issued_by",
        "part": "identification",
        "label": "Who issued your identification document (6d — Issued by)?",
        "help_text": "Enter the country or authority that issued the document. Example: 'France', 'State of California', 'USCIS'.",
        "type": "text",
        "required": True,
        "validation": {},
    },
    {
        "id": "doc_number",
        "part": "identification",
        "label": "What is your identification document number (6d — Number)?",
        "help_text": "Enter the document number exactly as it appears on your ID (e.g., passport number, driver's license number).",
        "type": "text",
        "required": True,
        "validation": {},
    },
    {
        "id": "doc_expiry",
        "part": "identification",
        "label": "What is the expiration date of your identification document (6d — Exp. date)?",
        "help_text": "Enter in MM/DD/YYYY format. Example: 11/30/2028. Enter N/A if the document does not expire.",
        "type": "text",
        "required": True,
        "validation": {},
    },

    # ─── PREVIOUS TIN ────────────────────────────────────────────────────────────
    {
        "id": "prev_tin",
        "part": "identification",
        "label": "Have you previously received a U.S. TIN (ITIN or SSN) from the IRS (6e)?",
        "help_text": "Answer Yes if you have ever been assigned a U.S. Individual Taxpayer Identification Number (ITIN) or an IRS-issued Internal Revenue Service Number (IRSN).",
        "type": "select",
        "options": ["No / Don't know", "Yes"],
        "required": True,
        "validation": {},
    },
    {
        "id": "prev_itin",
        "part": "identification",
        "label": "What is your previously issued ITIN (6f)? (format: 9XX-XX-XXXX)",
        "help_text": "Enter the ITIN previously assigned to you. ITINs always begin with the digit 9 and have the format 9XX-XX-XXXX.",
        "type": "text",
        "required": False,
        "validation": {"pattern": r"^9\d{2}-\d{2}-\d{4}$|^9\d{8}$"},
    },
    {
        "id": "applicant_phone",
        "part": "identification",
        "label": "What is your phone number?",
        "help_text": "Enter your phone number including country code if outside the U.S. Example: +1 (305) 555-1234",
        "type": "text",
        "required": False,
        "validation": {},
    },
]
