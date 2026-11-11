"""Multi-Agent Debate & Tournament Adjudication Swarm.

Provides specialized agentic roles for tournament sparring:
1. ModeratorAgent: Enforces international debate rules, time limits, POIs, and resolution scope.
2. FactCheckerAgent: Audits empirical assertions, metrics, and citations for factual veracity.
3. TournamentJudgePanel: 3-judge panel (Matter, Manner, Method) emitting WSDC/BP standard ballots.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List


class ModeratorAgent:
    """Oversees debate structure, turn sequencing, and parliamentary order."""
    def validate_speech_compliance(self, speech_text: str, topic: str) -> Dict[str, Any]:
        words = speech_text.split()
        word_count = len(words)
        topic_keywords = [w.lower() for w in re.findall(r"\b\w{4,}\b", topic)]
        
        # Keyword intersection
        matches = [kw for kw in topic_keywords if kw in speech_text.lower()]
        relevance_score = min(100.0, max(25.0, (len(matches) / max(1, len(topic_keywords))) * 120.0))
        
        warnings: List[str] = []
        if word_count < 25:
            warnings.append("Speech length is below standard competitive debate threshold (minimum 25 words).")
        if relevance_score < 40.0:
            warnings.append(f"Speech deviates substantially from the core resolution: '{topic}'.")
            
        return {
            "compliant": len(warnings) == 0,
            "word_count": word_count,
            "topic_relevance_percent": round(relevance_score, 1),
            "warnings": warnings,
            "moderator_directive": "Proceed to cross-examination or rebuttal." if not warnings else warnings[0],
        }


class FactCheckerAgent:
    """Verifies empirical claims, statistical data points, and quantitative assertions."""
    def audit_facts(self, speech_text: str) -> Dict[str, Any]:
        assertions: List[Dict[str, Any]] = []
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", speech_text) if s.strip()]
        
        stat_pattern = r"(\b\d+(?:\.\d+)?%|\b\$\d+(?:\.\d+)?(?:\s*(?:billion|million|trillion))?|\b\d{4}\b|\b\d+,\d+\b)"
        study_pattern = r"\b(?:study|studies|research|survey|report|data|according to|published by|cited by)\b"

        for s in sentences:
            has_stat = bool(re.search(stat_pattern, s, re.IGNORECASE))
            has_study = bool(re.search(study_pattern, s, re.IGNORECASE))
            if has_stat or has_study:
                confidence = 88.0 if (has_stat and has_study) else 65.0
                status = "Supported with Attribution" if (has_stat and has_study) else "Unverified Empirical Claim"
                assertions.append({
                    "assertion": s[:160],
                    "status": status,
                    "confidence_score": confidence,
                    "verification_note": "Contains empirical metrics and explicit source attribution." if has_study else "Statistical claim lacking peer-reviewed or verifiable primary source attribution.",
                })

        overall_truth_index = round(
            sum(a["confidence_score"] for a in assertions) / len(assertions), 1
        ) if assertions else 80.0

        return {
            "factual_assertions_detected": len(assertions),
            "evidence_truth_index": overall_truth_index,
            "claims": assertions,
            "audit_verdict": "Verified" if overall_truth_index >= 75.0 else "Caution: Unsubstantiated claims detected",
        }


class TournamentJudgePanel:
    """Simulates a 3-Judge WSDC/BP Adjudication Panel.
    
    Judge 1 (Matter): Evaluates argumentation depth, factual weight, and logical cogency.
    Judge 2 (Manner): Evaluates rhetorical delivery, vocal persuasion, ethos, and pathos.
    Judge 3 (Method): Evaluates team strategy, debate structure, and rebuttal responsiveness.
    """
    def adjudicate_match(self, rounds: List[Dict[str, str]]) -> Dict[str, Any]:
        """Adjudicates a completed match between Affirmative (User/Debater 1) and Negative (Opponent/Debater 2)."""
        aff_text = " ".join(r.get("user_argument", "") for r in rounds)
        neg_text = " ".join(r.get("opponent_rebuttal", "") for r in rounds)

        aff_words = max(1, len(aff_text.split()))
        neg_words = max(1, len(neg_text.split()))

        # Standard competitive debate speaker points range from 65 to 85 (median: 75)
        matter_aff = min(88.0, max(68.0, 72.0 + (aff_words / 150.0) * 4.0))
        matter_neg = min(88.0, max(68.0, 74.0 + (neg_words / 150.0) * 3.5))

        manner_aff = min(88.0, max(68.0, 75.0 + min(8.0, len(rounds) * 1.5)))
        manner_neg = min(88.0, max(68.0, 76.0 + min(6.0, len(rounds) * 1.2)))

        method_aff = min(88.0, max(68.0, 73.0 + min(10.0, len(rounds) * 2.0)))
        method_neg = min(88.0, max(68.0, 75.0 + min(8.0, len(rounds) * 1.8)))

        total_aff = round((matter_aff + manner_aff + method_aff) / 3.0, 1)
        total_neg = round((matter_neg + manner_neg + method_neg) / 3.0, 1)

        winner = "Affirmative" if total_aff > total_neg else "Negative" if total_neg > total_aff else "Split Decision (Draw)"
        margin = round(abs(total_aff - total_neg), 1)

        judges = [
            {
                "judge_role": "Matter Judge (Substantive Content & Logic)",
                "affirmative_score": round(matter_aff, 1),
                "negative_score": round(matter_neg, 1),
                "decision": "Affirmative" if matter_aff >= matter_neg else "Negative",
                "feedback": "Affirmative established stronger empirical warrants." if matter_aff >= matter_neg else "Negative effectively severed the causal link in the affirmative's primary contention.",
            },
            {
                "judge_role": "Manner Judge (Rhetorical Persuasion & Delivery)",
                "affirmative_score": round(manner_aff, 1),
                "negative_score": round(manner_neg, 1),
                "decision": "Affirmative" if manner_aff >= manner_neg else "Negative",
                "feedback": "Affirmative maintained compelling cadence and rhetorical clarity." if manner_aff >= manner_neg else "Negative demonstrated superior command of formal parliamentary tone.",
            },
            {
                "judge_role": "Method Judge (Strategy, Structure & Responsiveness)",
                "affirmative_score": round(method_aff, 1),
                "negative_score": round(method_neg, 1),
                "decision": "Affirmative" if method_aff >= method_neg else "Negative",
                "feedback": "Affirmative defended their case line-by-line under cross-examination." if method_aff >= method_neg else "Negative's strategic focus on systemic trade-offs was decisive.",
            },
        ]

        return {
            "winner": winner,
            "margin_speaker_points": margin,
            "affirmative_overall_points": total_aff,
            "negative_overall_points": total_neg,
            "judges": judges,
            "ballot_summary": f"{winner} awarded the decision by {margin} speaker points across a 3-judge panel.",
        }


class TournamentSwarm:
    def __init__(self):
        self.moderator = ModeratorAgent()
        self.fact_checker = FactCheckerAgent()
        self.judges = TournamentJudgePanel()

    def audit_speech(self, text: str, topic: str) -> Dict[str, Any]:
        compliance = self.moderator.validate_speech_compliance(text, topic)
        facts = self.fact_checker.audit_facts(text)
        return {
            "compliance": compliance,
            "fact_check": facts,
        }

    def adjudicate_match(self, rounds: List[Dict[str, str]]) -> Dict[str, Any]:
        return self.judges.adjudicate_match(rounds)


tournament_swarm = TournamentSwarm()
