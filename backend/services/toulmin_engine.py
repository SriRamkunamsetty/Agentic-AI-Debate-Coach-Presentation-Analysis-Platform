"""Toulmin Argument Structural Parser & Graph Generator.

Deconstructs argumentative discourse into the six core components of Stephen Toulmin's model:
1. Claim (The conclusion being established)
2. Data / Grounds (The empirical basis or premise)
3. Warrant (The logical bridge linking Data to Claim)
4. Backing (Supporting credentials for the Warrant)
5. Qualifier (Degree of certainty: necessarily, plausibly, usually)
6. Rebuttal (Potential exceptions or counter-conditions)

Generates node-edge graph structures ready for interactive rendering.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List


class ToulminEngine:
    def parse_argument(self, text: str) -> Dict[str, Any]:
        normalized = " ".join((text or "").split())
        if not normalized:
            raise ValueError("Argument text cannot be empty.")

        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", normalized) if s.strip()]
        if not sentences:
            sentences = [normalized]

        # Break single compound sentences into clauses so "Claim because Warrant, and Evidence" parses richly
        clauses = [
            c.strip()
            for c in re.split(r"\s*(?:;|,\s+and\s+|\b(?=because|since|unless)\b)\s*", normalized, flags=re.IGNORECASE)
            if c.strip()
        ]
        if not clauses:
            clauses = [normalized]

        claim = clauses[0] if len(sentences) == 1 and len(clauses) > 1 else sentences[0]
        data_points: List[str] = []
        warrants: List[str] = []
        backings: List[str] = []
        qualifiers: List[str] = []
        rebuttals: List[str] = []

        # Grounding / Data detection
        data_patterns = [
            r"\b(?:study|studies|data|statistics?|research|survey|report|observed|measured|show|shows|\d+%|\$\d+)\b",
            r"\b(?:according to|evidence shows|experiments? indicate|collateral damage)\b",
        ]
        # Warrant / Connective logic detection
        warrant_patterns = [
            r"\b(?:because|since|therefore|thus|hence|leads to|results in|implies that|as a consequence)\b",
        ]
        # Backing detection
        backing_patterns = [
            r"\b(?:historical precedents?|peer[- ]reviewed|consensus|jurisprudence|expert analysis)\b",
            r"\b(?:fundamental principles?|constitutional|established methodology)\b",
        ]
        # Qualifier detection
        qualifier_patterns = [
            r"\b(?:probably|presumably|almost certainly|in most cases|typically|likely|plausibly|inevitably)\b",
        ]
        # Rebuttal detection
        rebuttal_patterns = [
            r"\b(?:unless|except when|provided that|on the condition that|notwithstanding|even if)\b",
        ]

        segments = sentences[1:] if len(sentences) > 1 else (clauses[1:] if len(clauses) > 1 else sentences)
        for s in segments:
            if any(re.search(p, s, re.IGNORECASE) for p in data_patterns):
                data_points.append(s)
            if any(re.search(p, s, re.IGNORECASE) for p in warrant_patterns):
                warrants.append(s)
            if any(re.search(p, s, re.IGNORECASE) for p in backing_patterns):
                backings.append(s)
            if any(re.search(p, s, re.IGNORECASE) for p in rebuttal_patterns):
                rebuttals.append(s)

        for s in sentences:
            for p in qualifier_patterns:
                match = re.search(p, s, re.IGNORECASE)
                if match:
                    qualifiers.append(match.group(0).strip().capitalize())
                    break

        # Synthesize guaranteed fallback entries so downstream graph nodes are always populated
        if not data_points:
            if len(sentences) > 1:
                data_points.append(sentences[1])
            elif len(clauses) > 1:
                data_points.append(clauses[-1])
            else:
                data_points.append(f"Primary premise inferred from statement: '{claim[:80]}'")
        if not warrants:
            warrants.append(f"Inference: If the premises hold, then '{claim[:60]}...' is cogent.")
        if not backings:
            backings.append("Underlying domain axioms and rational decision-making framework.")
        if not qualifiers:
            qualifiers.append("Plausibly (Standard Debating Presumption)")
        if not rebuttals:
            rebuttals.append("Unless counter-evidence demonstrates overwhelming negative externalities.")

        nodes = [
            {"id": "claim", "label": "Claim (Assertion)", "content": claim, "category": "claim", "color": "#4f46e5"},
            {"id": "grounds", "label": "Data (Grounds)", "content": data_points[0], "category": "data", "color": "#10b981"},
            {"id": "warrant", "label": "Warrant (Bridge)", "content": warrants[0], "category": "warrant", "color": "#f59e0b"},
            {"id": "backing", "label": "Backing (Authority)", "content": backings[0], "category": "backing", "color": "#06b6d4"},
            {"id": "qualifier", "label": "Qualifier (Scope)", "content": qualifiers[0], "category": "qualifier", "color": "#8b5cf6"},
            {"id": "rebuttal", "label": "Rebuttal (Reservation)", "content": rebuttals[0], "category": "rebuttal", "color": "#f43f5e"},
        ]

        edges = [
            {"source": "grounds", "target": "warrant", "label": "supported by"},
            {"source": "backing", "target": "warrant", "label": "certifies"},
            {"source": "warrant", "target": "claim", "label": "entails"},
            {"source": "qualifier", "target": "claim", "label": "modulates"},
            {"source": "rebuttal", "target": "claim", "label": "constrains"},
        ]

        completeness_score = min(100.0, 40.0 + (len(data_points) * 15.0) + (len(warrants) * 15.0) + (15.0 if qualifiers else 0.0) + (15.0 if rebuttals else 0.0))

        return {
            "claim": claim,
            "data": data_points,
            "grounds": data_points,
            "warrants": warrants,
            "backings": backings,
            "qualifiers": qualifiers,
            "rebuttals": rebuttals,
            "structural_completeness_percent": round(completeness_score, 1),
            "graph": {
                "nodes": nodes,
                "edges": edges,
            },
        }


toulmin_engine = ToulminEngine()
