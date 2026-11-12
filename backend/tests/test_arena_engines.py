import unittest
import asyncio
import sys
import os

# Ensure backend and ai-ml are in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../ai-ml")))

from services.toulmin_engine import toulmin_engine
from services.agent_swarm import tournament_swarm
from services.voice_engine import voice_engine_service


class TestArenaEngines(unittest.TestCase):
    def test_toulmin_deconstruction(self):
        argument = (
            "We must immediately transition to renewable solar and wind energy because burning fossil fuels "
            "accelerates catastrophic global atmospheric warming. Intergovernmental climate panel reports confirm "
            "that carbon emissions have surged by 45% since 1990. Therefore, barring unexpected technological geoengineering breakthroughs, "
            "continued reliance on coal guarantees irreversible sea level rise, unless aggressive carbon taxes are instituted."
        )
        result = toulmin_engine.parse_argument(argument)
        self.assertIn("claim", result)
        self.assertIn("grounds", result)
        self.assertIn("warrants", result)
        self.assertIn("backings", result)
        self.assertIn("qualifiers", result)
        self.assertIn("rebuttals", result)
        self.assertIn("graph", result)
        self.assertGreater(len(result["graph"]["nodes"]), 0)
        self.assertGreater(len(result["graph"]["edges"]), 0)
        self.assertGreaterEqual(result["structural_completeness_percent"], 0)
        self.assertLessEqual(result["structural_completeness_percent"], 100)

        # Single-sentence compound argument regression test
        single_res = toulmin_engine.parse_argument(
            "Banning autonomous lethal weapons is urgently necessary because algorithmic targeting systems lack human moral agency, "
            "and historical precedents show that automated warfare inevitably increases civilian collateral damage in urban combat zones."
        )
        self.assertGreater(len(single_res["grounds"]), 0)
        self.assertGreater(len(single_res["warrants"]), 0)
        self.assertEqual(len(single_res["graph"]["nodes"]), 6)

    def test_fact_checking_assertions(self):
        text = (
            "According to a 2023 United Nations report, global temperatures rose by 1.2 degrees Celsius, "
            "costing worldwide economies over $300 billion annually in flood damage."
        )
        fact_audit = tournament_swarm.fact_checker.audit_facts(text)
        self.assertIn("factual_assertions_detected", fact_audit)
        self.assertIn("evidence_truth_index", fact_audit)
        self.assertIn("claims", fact_audit)
        self.assertGreaterEqual(fact_audit["factual_assertions_detected"], 1)
        self.assertTrue(0 <= fact_audit["evidence_truth_index"] <= 100)

    def test_tournament_panel_adjudication(self):
        turns = [
            {
                "turn_index": 1,
                "user_argument": "Universal Basic Income reduces systemic poverty and empowers creative entrepreneurship by providing a secure economic floor.",
                "opponent_rebuttal": "UBI induces labor market disincentives and runaway inflation, decreasing net purchasing power for low-income households.",
                "opponent_persona": "The Contrarian",
            },
            {
                "turn_index": 2,
                "user_argument": "Empirical trials in Finland and Stockton demonstrated that employment participation remained steady while health outcomes improved dramatically.",
                "opponent_rebuttal": "Those municipal pilots were funded by philanthropy rather than taxation, failing to model the macroeconomic friction of nationwide capital taxes.",
                "opponent_persona": "The Contrarian",
            },
        ]
        decision = tournament_swarm.adjudicate_match(rounds=turns)
        self.assertIn("winner", decision)
        self.assertIn("judges", decision)
        self.assertEqual(len(decision["judges"]), 3)
        judge_roles = [j["judge_role"] for j in decision["judges"]]
        self.assertTrue(any("Matter" in role for role in judge_roles))
        self.assertTrue(any("Manner" in role for role in judge_roles))
        self.assertTrue(any("Method" in role for role in judge_roles))
        for judge in decision["judges"]:
            self.assertTrue(60 <= judge["affirmative_score"] <= 90)
            self.assertTrue(60 <= judge["negative_score"] <= 90)

    def test_voice_synthesis_audio_format(self):
        audio_bytes = asyncio.run(voice_engine_service.synthesize_speech("Debate assertion accepted.", persona="The Contrarian"))
        self.assertIsInstance(audio_bytes, bytes)
        self.assertGreater(len(audio_bytes), 40)
        # Should either be MP3 (starts with FF FB or ID3) or WAV (starts with RIFF)
        is_audio = audio_bytes.startswith(b"RIFF") or audio_bytes.startswith(b"\xff\xfb") or audio_bytes.startswith(b"ID3")
        self.assertTrue(is_audio)


if __name__ == "__main__":
    unittest.main()
