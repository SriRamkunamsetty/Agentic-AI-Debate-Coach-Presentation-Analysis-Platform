"""Deterministic local fallbacks for the standalone AI/ML agents.

These heuristics are intentionally explainable and dependency-free. They are not
intended to replace a trained classifier, but they make the package usable,
testable, and demonstrable when external LLM providers are unavailable.
"""
from __future__ import annotations

import re
from typing import Any


SUPPORTED_FALLACIES = (
    "Ad Hominem",
    "Straw Man",
    "False Dilemma",
    "Slippery Slope",
    "Appeal to Authority",
    "Circular Reasoning",
    "Hasty Generalization",
    "Red Herring",
    "Post Hoc Ergo Propter Hoc",
    "Bandwagon (Ad Populum)",
    "Tu Quoque (Whataboutism)",
    "Appeal to Emotion",
    "Texas Sharpshooter",
    "Genetic Fallacy",
    "No True Scotsman",
    "Non Sequitur",
    "Appeal to Ignorance",
    "Equivocation",
    "Fallacy Fallacy",
)


def _clamp(value: float, low: int = 0, high: int = 100) -> int:
    return int(round(max(low, min(high, value))))


def _sentences(text: str) -> list[str]:
    return [part.strip() for part in re.split(r"(?<=[.!?])\s+|\n+", text.strip()) if part.strip()]


def _evidence(text: str) -> list[str]:
    sentences = _sentences(text)
    evidence: list[str] = []
    for sentence in sentences:
        if re.search(r"\b(because|since|therefore|according to|evidence|data|study|research|for example|so)\b", sentence, re.I):
            evidence.append(sentence)
    if len(sentences) > 1 and not evidence:
        evidence = sentences[1:]
    return evidence[:5]


def analyze_argument(text: str) -> dict[str, Any]:
    normalized = " ".join((text or "").split())
    if not normalized:
        return {
            "claim": "",
            "evidence": [],
            "strength_label": "weak",
            "strength_score": 0,
            "clarity_score": 0,
            "relevance_score": 0,
            "logical_consistency_score": 0,
            "notes": "No argument text was provided.",
        }

    words = normalized.split()
    sentences = _sentences(normalized)
    claim = sentences[0] if sentences else normalized
    evidence = _evidence(normalized)
    evidence_score = min(35, len(evidence) * 12 + (8 if re.search(r"\b(data|study|research|according to|percent|%|evidence)\b", normalized, re.I) else 0))
    clarity_score = _clamp(78 - max(0, len(words) - 35) * 1.4 - normalized.count("(") * 4)
    relevance_score = _clamp(62 + min(28, len(evidence) * 8) - (18 if re.search(r"\b(anyway|unrelated|besides|who cares)\b", normalized, re.I) else 0))
    logical_consistency_score = _clamp(76 + min(18, len(evidence) * 4) - (25 if re.search(r"\b(either .* or .*|if .* then .* collapse|always|never)\b", normalized, re.I) else 0))
    strength_score = _clamp(0.30 * clarity_score + 0.25 * relevance_score + 0.25 * logical_consistency_score + 0.20 * (35 + evidence_score * 1.8))
    label = "strong" if strength_score >= 75 else "moderate" if strength_score >= 50 else "weak"
    notes = (
        f"Local heuristic analysis found {len(words)} words, {len(evidence)} evidence cue(s), "
        f"and {len(sentences)} sentence(s). Scores are deterministic estimates and should be calibrated against labeled data."
    )
    return {
        "claim": claim,
        "evidence": evidence,
        "strength_label": label,
        "strength_score": strength_score,
        "clarity_score": clarity_score,
        "relevance_score": relevance_score,
        "logical_consistency_score": logical_consistency_score,
        "notes": notes,
    }


_FALLACY_PATTERNS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("Ad Hominem", (r"(?:can't|cannot) trust .*\b(?:because|since)\b", r"\b(?:idiot|stupid|ignorant|uneducated|didn't even study|not qualified|hypocrite)\b")),
    ("Straw Man", (r"\bwhich means\b.*\b(?:bankrupt|destroy|abolish|everyone)\b", r"\bso you want\b.*\b(?:all|everyone|never)\b")),
    ("False Dilemma", (r"\beither\b.+\bor\b", r"\b(?:only|just)\s+(?:two|these two)\s+(?:choices|options)\b")),
    ("Slippery Slope", (r"\bif\b.+\b(?:allow|let|permit|accept)\b.+\b(?:soon|eventually|next|collapse|doomed|bankrupt)\b", r"\bif\b.+\bthen\b.+\b(?:collapse|doomed|disaster)\b")),
    ("Appeal to Authority", (r"\b(?:because|since)\b.+\b(?:famous|celebrity|actor|expert|authority|doctor)\b.+\b(?:said|says|uses| recommends?)\b", r"\b(?:expert|authority|celebrity|famous actor)\b.+\b(?:said|says)\b")),
    ("Circular Reasoning", (r"\b(?:true|correct|right)\b.+\bbecause\b.+\b(?:true|correct|right|says so)\b", r"\bbecause it says so\b", r"\bnever wrong\b")),
    ("Hasty Generalization", (r"\b(?:all|every|none)\b.+\b(?:must|are|is)\b", r"\bone\b.+\bso\b.+\b(?:all|every)\b", r"\b(?:always|never)\b")),
    ("Red Herring", (r"\bwhy worry\b.+\bwhen\b", r"\b(?:instead|rather)\b.+\b(?:discuss|talk about)\b")),
    ("Post Hoc Ergo Propter Hoc", (r"\bafter\s+(?:this|that),?\s+therefore\s+because\b", r"\bhappened\s+right\s+after,?\s+so\s+it\s+caused\b", r"\bcorrelation\s+proves\b")),
    ("Bandwagon (Ad Populum)", (r"\bmost\s+people\s+agree\s+that\b", r"\beveryone\s+is\s+doing\s+it\b", r"\bpopular\s+opinion\s+proves\b")),
    ("Tu Quoque (Whataboutism)", (r"\byou\s+did\s+(?:the\s+same|it\s+too)\b", r"\bwho\s+are\s+you\s+to\s+talk\b", r"\blook\s+at\s+your\s+own\s+record\b")),
    ("Appeal to Emotion", (r"\bthink\s+of\s+the\s+children\b", r"\bif\s+you\s+have\s+any\s+heart\b", r"\bdisgusting\s+and\s+terrifying\b")),
    ("Texas Sharpshooter", (r"\bconveniently\s+ignoring\s+the\s+rest\b", r"\blook\s+at\s+this\s+one\s+single\s+metric\b", r"\bcherry[- ]pick(?:ed|ing)?\b")),
    ("Genetic Fallacy", (r"\bcomes\s+from\s+a\s+(?:discredited|corrupt|foreign)\s+source\b", r"\bidea\s+was\s+first\s+proposed\s+by\b")),
    ("No True Scotsman", (r"\bno\s+real\s+(?:debater|citizen|expert|patriot)\s+would\b", r"\btrue\s+(?:believers|scientists)\s+never\b")),
    ("Non Sequitur", (r"\btherefore\s+we\s+must\s+ban\b", r"\bit\s+follows\s+automatically\s+that\b")),
    ("Appeal to Ignorance", (r"\bno\s+one\s+has\s+proven\s+it\s+false\b", r"\bhasn't\s+been\s+disproven\b")),
    ("Equivocation", (r"\bshifting\s+definitions?\b", r"\bword\s+means\s+both\b")),
    ("Fallacy Fallacy", (r"\byou\s+used\s+a\s+fallacy,?\s+so\s+your\s+claim\s+is\s+false\b",)),
)


def detect_fallacies(text: str) -> dict[str, Any]:
    normalized = " ".join((text or "").split())
    found: list[dict[str, Any]] = []
    for fallacy_type, patterns in _FALLACY_PATTERNS:
        match = next((re.search(pattern, normalized, re.I) for pattern in patterns if re.search(pattern, normalized, re.I)), None)
        if not match:
            continue
        excerpt = match.group(0).strip()
        explanations = {
            "Ad Hominem": "The statement attacks a person’s background instead of addressing the argument.",
            "Straw Man": "The statement replaces the opponent’s position with an exaggerated version that is easier to attack.",
            "False Dilemma": "The statement presents limited choices as if they were the only possible options.",
            "Slippery Slope": "The statement assumes a chain of extreme consequences without establishing the links.",
            "Appeal to Authority": "The statement treats a person’s status or endorsement as sufficient evidence.",
            "Circular Reasoning": "The conclusion is used as its own support rather than independent evidence.",
            "Hasty Generalization": "The statement generalizes broadly from insufficient or unrepresentative evidence.",
            "Red Herring": "The statement shifts attention from the issue under discussion to an unrelated point.",
            "Post Hoc Ergo Propter Hoc": "Assuming that because event B followed event A, event A caused event B.",
            "Bandwagon (Ad Populum)": "Claiming that an idea is right solely because it is popular.",
            "Tu Quoque (Whataboutism)": "Discrediting an argument by claiming the opponent is guilty of the same behavior.",
            "Appeal to Emotion": "Manipulating emotion in place of reasoned argument.",
            "Texas Sharpshooter": "Cherry-picking a narrow cluster of favorable data points.",
            "Genetic Fallacy": "Judging an idea by its origin rather than its factual merits.",
            "No True Scotsman": "Altering an arbitrary definition to dismiss counterexamples.",
            "Non Sequitur": "The conclusion does not follow from the premises.",
            "Appeal to Ignorance": "Claiming an assertion is true because it hasn't been disproven.",
            "Equivocation": "Shifting the definition of a key word mid-argument.",
            "Fallacy Fallacy": "Assuming a conclusion is wrong merely because a flawed argument was used.",
        }
        found.append({
            "type": fallacy_type,
            "excerpt": excerpt,
            "explanation": explanations.get(fallacy_type, "Fallacious reasoning pattern detected."),
            "correction_suggestion": "Address the claim directly and support it with relevant, independently verifiable evidence.",
            "confidence": 78,
        })
    if not found:
        return {
            "fallacies_found": [],
            "status": "no_clear_fallacies_detected",
            "message": "No clear logical fallacy was detected by the local heuristic rules.",
            "argument_preview": normalized[:120],
        }
    return {
        "fallacies_found": found,
        "status": "fallacies_detected",
        "message": f"Detected {len(found)} possible logical fallacy/ies using local heuristic rules.",
    }


def local_json_response(system_prompt: str, user_prompt: str) -> dict[str, Any]:
    """Infer which documented JSON contract is requested and answer locally."""
    quoted = re.search(r'"(.*)"', user_prompt, re.S)
    text = quoted.group(1) if quoted else user_prompt.split("\n\n", 1)[-1]
    if "fallac" in system_prompt.lower() or "fallac" in user_prompt.lower():
        return detect_fallacies(text)
    return analyze_argument(text)
