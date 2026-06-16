import re

CRISIS_PATTERNS = {
    "suicide": [
        r"\bsu[ic]+id(e|al)\b",
        r"\bsuisid(e|al)\b",
        r"\bkill myself\b",
        r"\bend my life\b",
        r"\bwant to die\b",
        r"\bwant to end it all\b",
        r"\bhang myself\b",
        r"\bslit my wrists\b",
        r"\bbetter off dead\b",
        r"\bdont want to live\b",
        r"\bdon't want to live\b",
        r"\bi wish i were dead\b",
        r"\bi wish i was dead\b",
        r"\bbye bye cruel world\b"
    ],
    "self_harm": [
        r"\bself[- ]harm\b",
        r"\bcut myself\b",
        r"\bcutting myself\b",
        r"\bhurt myself\b",
        r"\bburn myself\b",
        r"\bburning myself\b",
        r"\bmutilat(e|ing)\b",
        r"\bslashed my\b",
        r"\bharming myself\b"
    ],
    "abuse": [
        r"\babuse(d|r)?\b",
        r"\bdomestic violence\b",
        r"\bphysically hurt\b",
        r"\bbeaten up\b",
        r"\bbeating me\b",
        r"\bsexual assault\b",
        r"\bmolested\b",
        r"\braped\b",
        r"\bhit me\b",
        r"\bhe hits me\b",
        r"\bshe hits me\b",
        r"\bphysically abusive\b"
    ],
    "violence": [
        r"\bkill\b",
        r"\bkill them\b",
        r"\bhurt them\b",
        r"\bstab\b",
        r"\bshoot\b",
        r"\bweapon\b",
        r"\battack someone\b",
        r"\bassault them\b",
        r"\bharm others\b",
        r"\bkill someone\b",
        r"\bm[ui]rd[eu]r\b",
        r"\bunauthori[sz]ed\b",
        r"\bunwanted\b",
        r"\bunauthori[sz]ed activit(y|ies)\b",
        r"\bdangerous thing(s)?\b",
        r"\bcommit a crime\b",
        r"\bbomb\b",
        r"\bterrorist\b"
    ],
    "emergency": [
        r"\boverdose(d)?\b",
        r"\bpoison(ed|ing)?\b",
        r"\bchok(ed|ing)\b",
        r"\bbleeding out\b",
        r"\bheart attack\b",
        r"\bmedical emergency\b",
        r"\bcall an ambulance\b",
        r"\bcall 911\b",
        r"\bcall 999\b",
        r"\bcall 112\b"
    ]
}

# Precompile regex patterns for efficiency
COMPILED_PATTERNS = {
    category: [re.compile(pattern, re.IGNORECASE) for pattern in patterns]
    for category, patterns in CRISIS_PATTERNS.items()
}

CRISIS_RESPONSES = {
    "suicide": {
        "message": "It sounds like you are thinking or taking a wrong way or wrong decisions. I don't know the answer for this, please contact the licensed authorities to cure your mindset. Please reach out to the given mobile numbers immediately—they are confidential, free, and available 24/7.",
        "helplines": [
            "National Suicide Prevention Lifeline: Call or text 988 (US & Canada)",
            "Crisis Text Line: Text HOME to 741741 (US, UK, Canada)",
            "In the UK: Call 111 (NHS) or call Samaritans at 116 123",
            "In Australia: Call Lifeline at 13 11 14",
            "International Find a Helpline: https://findahelpline.com"
        ]
    },
    "self_harm": {
        "message": "It sounds like you are thinking or taking a wrong way or wrong decisions. I don't know the answer for this, please contact the licensed authorities to cure your mindset. Please reach out to the given mobile numbers immediately.",
        "helplines": [
            "Crisis Text Line: Text HOME to 741741 (US, UK, Canada)",
            "National Suicide Prevention Lifeline: Call or text 988 (US & Canada)",
            "S.A.F.E. Alternatives: Call 1-800-DONT-CUT (1-800-366-8288) for self-harm support",
            "International Find a Helpline: https://findahelpline.com"
        ]
    },
    "abuse": {
        "message": "I don't know the answer for this. If you are facing abuse or unsafe conditions, please contact the licensed authorities to guide you. Please connect with the given mobile numbers below.",
        "helplines": [
            "National Domestic Violence Hotline: Call 1-800-799-SAFE (7233) or text START to 88788 (US)",
            "National Sexual Assault Hotline (RAINN): Call 1-800-656-4673 (US)",
            "Crisis Text Line: Text HOME to 741741 (US, UK, Canada)",
            "International Find a Helpline: https://findahelpline.com"
        ]
    },
    "violence": {
        "message": "You are taking wrong decisions, please don't encourage that type of thinking. I don't know the answer for this, please contact the licensed authorities immediately. Please contact the given mobile numbers below.",
        "helplines": [
            "National Crisis Support: Call or text 988",
            "Crisis Text Line: Text HOME to 741741",
            "If there is an immediate threat to life, please call your local emergency services (like 911, 999, or 112) immediately."
        ]
    },
    "emergency": {
        "message": "I don't know the answer for this. This sounds like an immediate emergency. Please contact the licensed authorities immediately or reach out to the given mobile numbers below.",
        "helplines": [
            "US/Canada: Call 911",
            "UK: Call 999 or 111",
            "Europe: Call 112",
            "Please contact your local emergency services immediately or go to the nearest emergency room."
        ]
    }
}

def detect_crisis(message: str) -> dict:
    """
    Scans the input message for crisis keywords.
    Returns a dict with crisis details if detected, otherwise {"is_crisis": False}.
    """
    if not message or not isinstance(message, str) or not message.strip():
        return {"is_crisis": False}

    for category, regex_list in COMPILED_PATTERNS.items():
        for regex in regex_list:
            if regex.search(message):
                response_data = CRISIS_RESPONSES.get(category, {
                    "message": "Please seek immediate professional or emergency support.",
                    "helplines": ["Contact your local emergency room or helpline."]
                })
                return {
                    "is_crisis": True,
                    "category": category,
                    "message": response_data["message"],
                    "helplines": response_data["helplines"]
                }
                
    return {"is_crisis": False}
