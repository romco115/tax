"""
Complete question schema for IRS Form 3520 interview.
Each question is a dict matching the QuestionDefinition TypeScript interface.
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

QUESTIONS: list[dict] = [
    # ─── SECTION 0: FILER IDENTIFICATION ────────────────────────────────────────
    {
        "id": "taxpayer_name",
        "part": "identification",
        "label": "What is your name as it appears on your tax return?",
        "help_text": "Enter your full legal name — first, middle initial (if any), last.",
        "type": "text",
        "required": True,
        "validation": {},
        "triggers_part": None,
    },
    {
        "id": "taxpayer_tin",
        "part": "identification",
        "label": "What is your U.S. taxpayer identification number (SSN or EIN)?",
        "help_text": "SSN format: XXX-XX-XXXX. EIN format: XX-XXXXXXX.",
        "type": "text",
        "required": True,
        "validation": {"pattern": r"^\d{3}-\d{2}-\d{4}$|^\d{2}-\d{7}$|^\d{9}$"},
        "triggers_part": None,
    },
    {
        "id": "taxpayer_address",
        "part": "identification",
        "label": "What is your street address?",
        "help_text": "Include apartment or suite number if applicable.",
        "type": "text",
        "required": True,
        "validation": {},
        "triggers_part": None,
    },
    {
        "id": "taxpayer_city_state_zip",
        "part": "identification",
        "label": "City, state, and ZIP code?",
        "help_text": "Example: San Francisco, CA 94105",
        "type": "text",
        "required": True,
        "validation": {},
        "triggers_part": None,
    },
    {
        "id": "tax_year",
        "part": "identification",
        "label": "What tax year does this return cover?",
        "help_text": "Enter the 4-digit calendar year (e.g., 2024).",
        "type": "number",
        "required": True,
        "validation": {"min": 2000, "max": 2026},
        "triggers_part": None,
    },
    {
        "id": "filer_type",
        "part": "identification",
        "label": "Are you filing as an individual, estate, or trust?",
        "help_text": "Select the entity type that matches how you file your U.S. tax return.",
        "type": "select",
        "options": ["Individual", "Estate", "Trust"],
        "required": True,
        "validation": {},
        "triggers_part": None,
    },
    {
        "id": "is_amended",
        "part": "identification",
        "label": "Is this an amended return?",
        "help_text": "Check 'Yes' if you are correcting a previously filed Form 3520.",
        "type": "yesno",
        "required": True,
        "validation": {},
        "triggers_part": None,
    },

    # ─── SECTION 1: ROUTING QUESTIONS ───────────────────────────────────────────
    {
        "id": "route_part_i",
        "part": "routing",
        "label": "During the tax year, did you transfer money or property to a foreign trust?",
        "help_text": (
            "A 'foreign trust' is any trust that is not a U.S. trust. "
            "Answer Yes if you made any transfer — even if it was a loan or indirect transfer."
        ),
        "type": "yesno",
        "required": True,
        "validation": {},
        "triggers_part": "I",
    },
    {
        "id": "route_part_ii",
        "part": "routing",
        "label": (
            "Did you own, or were you treated as owning, any part of a foreign trust "
            "at any time during the tax year?"
        ),
        "help_text": (
            "This includes being treated as the owner under grantor trust rules (IRC §§671–679)."
        ),
        "type": "yesno",
        "required": True,
        "validation": {},
        "triggers_part": "II",
    },
    {
        "id": "route_part_iii",
        "part": "routing",
        "label": (
            "Did you receive a distribution from, or were you a beneficiary of, "
            "a foreign trust during the tax year?"
        ),
        "help_text": (
            "Include cash, property, and amounts treated as distributions (e.g., certain loans)."
        ),
        "type": "yesno",
        "required": True,
        "validation": {},
        "triggers_part": "III",
    },
    {
        "id": "route_part_iv",
        "part": "routing",
        "label": (
            "Did you receive more than $100,000 from a foreign person as a gift or bequest, "
            "or more than $16,649 from a foreign corporation or foreign partnership?"
        ),
        "help_text": (
            "These thresholds apply to aggregate amounts for the tax year. "
            "The corporate/partnership threshold is adjusted annually for inflation."
        ),
        "type": "yesno",
        "required": True,
        "validation": {},
        "triggers_part": "IV",
    },

    # ─── PART I: TRANSFERS TO FOREIGN TRUSTS ────────────────────────────────────
    {
        "id": "part_i_transfers",
        "part": "I",
        "label": "Tell us about each transfer you made to a foreign trust.",
        "help_text": (
            "For each separate trust or separate transfer event, add an entry. "
            "You can add multiple entries."
        ),
        "type": "repeating",
        "required": True,
        "validation": {},
        "triggers_part": None,
        "fields": [
            {
                "id": "p1_trust_name",
                "label": "Name of the foreign trust",
                "type": "text",
                "required": True,
            },
            {
                "id": "p1_trust_country",
                "label": "Country under whose laws the trust was created",
                "type": "select",
                "options": COUNTRIES,
                "required": True,
            },
            {
                "id": "p1_transfer_date",
                "label": "Date of transfer",
                "type": "date",
                "required": True,
            },
            {
                "id": "p1_trust_ein",
                "label": "EIN of the trust (if known)",
                "type": "text",
                "required": False,
            },
            {
                "id": "p1_property_type",
                "label": "Type of property transferred",
                "type": "select",
                "options": ["Cash", "Securities", "Real Property", "Other"],
                "required": True,
            },
            {
                "id": "p1_fmv",
                "label": "Fair market value of the transfer (USD)",
                "type": "currency",
                "required": True,
            },
            {
                "id": "p1_is_grantor",
                "label": "Are you the grantor of this trust?",
                "type": "yesno",
                "required": True,
            },
            {
                "id": "p1_received_fmv",
                "label": "Did you receive fair market value in return for the transfer?",
                "type": "yesno",
                "required": True,
            },
            {
                "id": "p1_3520a_filed",
                "label": "Was Form 3520-A filed for this trust for the tax year?",
                "type": "yesno",
                "required": True,
            },
        ],
    },

    # ─── PART II: U.S. OWNERS OF FOREIGN TRUSTS ─────────────────────────────────
    {
        "id": "part_ii_ownerships",
        "part": "II",
        "label": "Tell us about each foreign trust you owned or were treated as owning.",
        "help_text": "Add a separate entry for each foreign trust.",
        "type": "repeating",
        "required": True,
        "validation": {},
        "triggers_part": None,
        "fields": [
            {
                "id": "p2_trust_name",
                "label": "Name of the foreign trust",
                "type": "text",
                "required": True,
            },
            {
                "id": "p2_trust_country",
                "label": "Country under whose laws the trust was created",
                "type": "select",
                "options": COUNTRIES,
                "required": True,
            },
            {
                "id": "p2_creation_date",
                "label": "Date the trust was created",
                "type": "date",
                "required": True,
            },
            {
                "id": "p2_trust_ein",
                "label": "EIN of the trust",
                "type": "text",
                "required": True,
            },
            {
                "id": "p2_asset_value",
                "label": "Total value of trust assets at year end (USD)",
                "type": "currency",
                "required": True,
            },
            {
                "id": "p2_ownership_pct",
                "label": "Your ownership percentage (%)",
                "type": "number",
                "required": True,
            },
            {
                "id": "p2_trustee_name",
                "label": "Name of the trustee",
                "type": "text",
                "required": True,
            },
            {
                "id": "p2_trustee_address",
                "label": "Address of the trustee",
                "type": "text",
                "required": True,
            },
            {
                "id": "p2_trustee_is_us",
                "label": "Is the trustee a U.S. person?",
                "type": "yesno",
                "required": True,
            },
            {
                "id": "p2_3520a_filed",
                "label": "Was Form 3520-A filed for this trust for the tax year?",
                "type": "yesno",
                "required": True,
            },
        ],
    },

    # ─── PART III: DISTRIBUTIONS FROM FOREIGN TRUSTS ────────────────────────────
    {
        "id": "part_iii_distributions",
        "part": "III",
        "label": "Tell us about each distribution you received from a foreign trust.",
        "help_text": "Add a separate entry for each distributing trust.",
        "type": "repeating",
        "required": True,
        "validation": {},
        "triggers_part": None,
        "fields": [
            {
                "id": "p3_trust_name",
                "label": "Name of the distributing foreign trust",
                "type": "text",
                "required": True,
            },
            {
                "id": "p3_trust_country",
                "label": "Country under whose laws the trust was created",
                "type": "select",
                "options": COUNTRIES,
                "required": True,
            },
            {
                "id": "p3_dist_date",
                "label": "Date of distribution",
                "type": "date",
                "required": True,
            },
            {
                "id": "p3_dist_amount",
                "label": "Amount of distribution received (USD)",
                "type": "currency",
                "required": True,
            },
            {
                "id": "p3_is_grantor_trust",
                "label": "Was this distribution from a foreign grantor trust?",
                "type": "yesno",
                "required": True,
            },
            {
                "id": "p3_is_accumulation",
                "label": "Was any part of the distribution an accumulation distribution?",
                "type": "yesno",
                "required": True,
            },
            {
                "id": "p3_loans",
                "label": (
                    "Did you receive loans from this trust that are treated as distributions?"
                ),
                "type": "yesno",
                "required": True,
            },
        ],
    },

    # ─── PART IV: LARGE GIFTS / BEQUESTS FROM FOREIGN PERSONS ───────────────────
    {
        "id": "p4_from_individual",
        "part": "IV",
        "label": (
            "Did you receive gifts or bequests from a foreign individual or estate "
            "totaling more than $100,000 during the tax year?"
        ),
        "help_text": "Aggregate all amounts received from foreign individuals and estates.",
        "type": "yesno",
        "required": True,
        "validation": {},
        "triggers_part": None,
    },
    {
        "id": "p4_individual_total",
        "part": "IV",
        "label": "Total amount received from foreign individuals or estates (USD)",
        "help_text": "Enter the combined fair market value of all gifts and bequests.",
        "type": "currency",
        "required": False,
        "validation": {"show_if": {"p4_from_individual": "yes"}},
        "triggers_part": None,
    },
    {
        "id": "p4_from_corp",
        "part": "IV",
        "label": (
            "Did you receive gifts from a foreign corporation or foreign partnership "
            "totaling more than $16,649 during the tax year?"
        ),
        "help_text": "The $16,649 threshold is the 2024 amount; it is adjusted annually.",
        "type": "yesno",
        "required": True,
        "validation": {},
        "triggers_part": None,
    },
    {
        "id": "p4_corp_total",
        "part": "IV",
        "label": "Total amount received from foreign corporations or partnerships (USD)",
        "help_text": "Enter the combined fair market value of all such gifts.",
        "type": "currency",
        "required": False,
        "validation": {"show_if": {"p4_from_corp": "yes"}},
        "triggers_part": None,
    },
    {
        "id": "p4_gifts",
        "part": "IV",
        "label": "List each individual gift or bequest received.",
        "help_text": (
            "For each separate gift, enter the date received, a brief description, "
            "the fair market value, and the donor's name and address."
        ),
        "type": "repeating",
        "required": True,
        "validation": {},
        "triggers_part": None,
        "fields": [
            {
                "id": "date_received",
                "label": "Date received",
                "type": "date",
                "required": True,
            },
            {
                "id": "description",
                "label": "Description of the gift or bequest",
                "type": "text",
                "required": True,
            },
            {
                "id": "fmv",
                "label": "Fair market value (USD)",
                "type": "currency",
                "required": True,
            },
            {
                "id": "donor_name",
                "label": "Donor's name",
                "type": "text",
                "required": True,
            },
            {
                "id": "donor_address",
                "label": "Donor's address",
                "type": "text",
                "required": True,
            },
        ],
    },
]
