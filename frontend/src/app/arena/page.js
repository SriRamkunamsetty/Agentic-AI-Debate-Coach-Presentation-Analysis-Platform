"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch, getStoredUser, getToken } from "../../lib/api";

export default function ArenaPage() {
  const [topic, setTopic] = useState("Autonomous AI weapon systems should be preemptively prohibited under international law.");
  const [activeTab, setActiveTab] = useState("arena"); // "arena" | "toulmin" | "factcheck" | "ballot"
  
  // Debate match state
  const [sessionId, setSessionId] = useState(null);
  const [speakerSide, setSpeakerSide] = useState("Affirmative"); // "Affirmative" | "Negative"
  const [currentTurnInput, setCurrentTurnInput] = useState("");
  const [matchTurns, setMatchTurns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Toulmin parser state
  const [toulminText, setToulminText] = useState("Banning autonomous lethal weapons is urgently necessary because algorithmic targeting systems lack human moral agency, and historical precedents show that automated warfare inevitably increases civilian collateral damage in urban combat zones.");
  const [toulminResult, setToulminResult] = useState(null);
  const [toulminLoading, setToulminLoading] = useState(false);

  // Fact check state
  const [factText, setFactText] = useState("According to a 2024 Harvard defense study, automated targeting algorithms have an error rate of 14.8%, which resulted in over $2.4 billion in unintended asset destruction.");
  const [factResult, setFactResult] = useState(null);
  const [factLoading, setFactLoading] = useState(false);

  // 3-Judge Ballot state
  const [ballotResult, setBallotResult] = useState(null);
  const [adjudicating, setAdjudicating] = useState(false);

  useEffect(() => {
    if (!getStoredUser() || !getToken()) {
      window.location.href = "/login";
    }
  }, []);

  const handleAddTurn = () => {
    if (!currentTurnInput.trim()) return;
    const newTurn = {
      turn_index: matchTurns.length + 1,
      speaker: speakerSide,
      user_argument: speakerSide === "Affirmative" ? currentTurnInput.trim() : (matchTurns[matchTurns.length - 1]?.user_argument || "Previous assertion"),
      opponent_rebuttal: speakerSide === "Negative" ? currentTurnInput.trim() : "Pending rebuttal",
      opponent_persona: "Human Challenger",
    };
    setMatchTurns((prev) => [...prev, newTurn]);
    setCurrentTurnInput("");
    setSpeakerSide(speakerSide === "Affirmative" ? "Negative" : "Affirmative");
  };

  const handleParseToulmin = async () => {
    setToulminLoading(true);
    setError("");
    try {
      const data = await apiFetch("/arena/toulmin/parse", {
        method: "POST",
        body: JSON.stringify({ argument_text: toulminText }),
      });
      setToulminResult(data);
    } catch (err) {
      setError(err.message || "Failed to parse Toulmin structure.");
    } finally {
      setToulminLoading(false);
    }
  };

  const handleFactCheck = async () => {
    setFactLoading(true);
    setError("");
    try {
      const data = await apiFetch("/arena/fact-check", {
        method: "POST",
        body: JSON.stringify({ speech_text: factText, topic }),
      });
      setFactResult(data);
    } catch (err) {
      setError(err.message || "Fact check failed.");
    } finally {
      setFactLoading(false);
    }
  };

  const handleAdjudicateMatch = async () => {
    if (matchTurns.length < 2) {
      setError("Please record at least 2 debate turns before requesting a 3-judge panel decision.");
      return;
    }
    setAdjudicating(true);
    setError("");
    try {
      const turnsPayload = matchTurns.map((t) => ({
        turn_index: t.turn_index,
        user_argument: t.user_argument,
        opponent_rebuttal: t.opponent_rebuttal,
        opponent_persona: t.opponent_persona,
      }));

      const data = await apiFetch("/arena/match/adjudicate", {
        method: "POST",
        body: JSON.stringify({
          session_id: sessionId || null,
          topic,
          turns: turnsPayload,
        }),
      });
      setBallotResult(data.ballot);
      setActiveTab("ballot");
    } catch (err) {
      setError(err.message || "Adjudication failed.");
    } finally {
      setAdjudicating(false);
    }
  };

  return (
    <div className="section-container" style={{ paddingTop: "2rem", paddingBottom: "5rem" }}>
      {/* Header Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
        <div>
          <div className="badge-red-pill">
            <span className="badge-dot"></span> TOURNAMENT ARENA & ADJUDICATION SWARM
          </div>
          <h1 className="font-display" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, marginTop: "0.4rem" }}>
            Debate Arena & <span className="text-gradient">3-Judge Panel</span>
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.92rem", maxWidth: "750px" }}>
            Experience competitive debate sparring with automated Toulmin argument visualizers, empirical fact-verification, and official WSDC/BP 3-judge adjudication ballots.
          </p>
        </div>

        {/* Action Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", background: "rgba(255, 255, 255, 0.8)", padding: "0.35rem", borderRadius: "16px", border: "1px solid rgba(226, 232, 240, 0.9)" }}>
          {[
            { id: "arena", label: "Sparring Arena", icon: "⚔️" },
            { id: "toulmin", label: "Toulmin Graph", icon: "📐" },
            { id: "factcheck", label: "Fact Verifier", icon: "🔍" },
            { id: "ballot", label: "Judge Ballot", icon: "⚖️" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 1rem",
                borderRadius: "12px",
                border: "none",
                background: activeTab === t.id ? "var(--accent-gradient)" : "transparent",
                color: activeTab === t.id ? "#fff" : "#475569",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: "1.5rem", padding: "0.9rem 1.25rem", borderRadius: "16px", background: "rgba(254, 242, 242, 0.9)", color: "#dc2626", border: "1px solid #fca5a5", fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* --- TAB 1: SPARRING ARENA --- */}
      {activeTab === "arena" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem" }}>
          <div className="glass-card" style={{ padding: "2rem" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>DEBATE RESOLUTION</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={{ width: "100%", marginTop: "0.3rem", fontWeight: 700 }}
              />
            </div>

            {/* Rounds Log */}
            <div style={{ minHeight: "240px", maxHeight: "420px", overflowY: "auto", border: "1px solid rgba(226, 232, 240, 0.9)", borderRadius: "16px", padding: "1.25rem", background: "rgba(248, 250, 252, 0.7)", marginBottom: "1.5rem" }}>
              {matchTurns.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", padding: "3rem 1rem" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🏛️</div>
                  <div style={{ fontWeight: 700 }}>Arena is ready. Enter the first turn below.</div>
                  <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Start with the Affirmative constructive proposition.</div>
                </div>
              ) : (
                matchTurns.map((turn, i) => (
                  <div key={i} style={{ marginBottom: "1rem", padding: "1rem", borderRadius: "14px", background: turn.speaker === "Affirmative" ? "rgba(238, 242, 255, 0.9)" : "rgba(254, 242, 242, 0.9)", border: turn.speaker === "Affirmative" ? "1px solid #c7d2fe" : "1px solid #fecdd3" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 800, color: turn.speaker === "Affirmative" ? "#4f46e5" : "#e11d48" }}>
                        TURN {turn.turn_index} // {turn.speaker.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#0f172a", lineHeight: 1.5 }}>
                      {turn.speaker === "Affirmative" ? turn.user_argument : turn.opponent_rebuttal}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Turn Input */}
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 800, color: speakerSide === "Affirmative" ? "#4f46e5" : "#e11d48" }}>
                  Next Speaker: {speakerSide} Speech
                </label>
                <textarea
                  rows={3}
                  value={currentTurnInput}
                  onChange={(e) => setCurrentTurnInput(e.target.value)}
                  placeholder={`Enter ${speakerSide} argument...`}
                  style={{ width: "100%", marginTop: "0.3rem" }}
                />
              </div>
              <button onClick={handleAddTurn} className="btn btn-red" style={{ height: "48px", padding: "0 1.5rem" }}>
                Add Turn
              </button>
            </div>
          </div>

          {/* Arena Control Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "0.5rem" }}>Match Status</h3>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid rgba(226, 232, 240, 0.8)", fontSize: "0.85rem" }}>
                <span style={{ color: "#64748b" }}>Turns Completed:</span>
                <span style={{ fontWeight: 800 }}>{matchTurns.length}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid rgba(226, 232, 240, 0.8)", fontSize: "0.85rem" }}>
                <span style={{ color: "#64748b" }}>Adjudication Format:</span>
                <span style={{ fontWeight: 800 }}>3-Judge WSDC</span>
              </div>
              <button
                onClick={handleAdjudicateMatch}
                disabled={adjudicating || matchTurns.length < 2}
                className="btn btn-login"
                style={{ width: "100%", marginTop: "1.25rem", padding: "0.85rem", fontSize: "0.85rem", opacity: matchTurns.length < 2 ? 0.6 : 1 }}
              >
                {adjudicating ? "DELIBERATING..." : "⚖️ Request Judge Decision"}
              </button>
            </div>

            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "0.5rem" }}>Agentic Tools</h3>
              <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "1rem" }}>
                Use automated tools to analyze arguments or check facts before speaking.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <button onClick={() => setActiveTab("toulmin")} className="btn btn-login" style={{ fontSize: "0.8rem", padding: "0.6rem" }}>
                  📐 Open Toulmin Parser
                </button>
                <button onClick={() => setActiveTab("factcheck")} className="btn btn-login" style={{ fontSize: "0.8rem", padding: "0.6rem" }}>
                  🔍 Open Fact Verifier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: TOULMIN STRUCTURAL GRAPH --- */}
      {activeTab === "toulmin" && (
        <div className="glass-card" style={{ padding: "2.5rem" }}>
          <div style={{ maxWidth: "800px", marginBottom: "1.5rem" }}>
            <h2 className="font-display" style={{ fontSize: "1.5rem", fontWeight: 800 }}>
              Toulmin Argument Structural Graph
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Deconstructs an argument into Claim, Grounds, Warrant, Backing, Qualifier, and Rebuttal according to Stephen Toulmin's analytical framework.
            </p>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <textarea
              rows={3}
              value={toulminText}
              onChange={(e) => setToulminText(e.target.value)}
              placeholder="Paste speech or argument text..."
              style={{ width: "100%" }}
            />
            <button
              onClick={handleParseToulmin}
              disabled={toulminLoading}
              className="btn btn-red"
              style={{ marginTop: "0.75rem", padding: "0.7rem 1.75rem", fontSize: "0.85rem" }}
            >
              {toulminLoading ? "PARSING STRUCTURE..." : "Deconstruct Toulmin Schema"}
            </button>
          </div>

          {toulminResult && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 800 }}>Structural Completeness:</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#4f46e5" }}>
                  {toulminResult.structural_completeness_percent}%
                </div>
              </div>

              {/* Toulmin Node Schema Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                {toulminResult.graph.nodes.map((node) => (
                  <div
                    key={node.id}
                    style={{
                      padding: "1.25rem",
                      borderRadius: "16px",
                      background: "rgba(255, 255, 255, 0.9)",
                      border: `1.5px solid ${node.color}`,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div style={{ fontSize: "0.7rem", fontWeight: 800, color: node.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.35rem" }}>
                      {node.label}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#0f172a", lineHeight: 1.45, fontWeight: 500 }}>
                      {node.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: FACT VERIFIER --- */}
      {activeTab === "factcheck" && (
        <div className="glass-card" style={{ padding: "2.5rem" }}>
          <div style={{ maxWidth: "800px", marginBottom: "1.5rem" }}>
            <h2 className="font-display" style={{ fontSize: "1.5rem", fontWeight: 800 }}>
              Real-Time Fact & Citation Verifier
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Audits quantitative assertions, cited studies, statistics, and empirical statements for grounding and citation integrity.
            </p>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <textarea
              rows={3}
              value={factText}
              onChange={(e) => setFactText(e.target.value)}
              placeholder="Paste argument to verify factual claims..."
              style={{ width: "100%" }}
            />
            <button
              onClick={handleFactCheck}
              disabled={factLoading}
              className="btn btn-red"
              style={{ marginTop: "0.75rem", padding: "0.7rem 1.75rem", fontSize: "0.85rem" }}
            >
              {factLoading ? "AUDITING CLAIMS..." : "Run Evidence Fact Check"}
            </button>
          </div>

          {factResult && (
            <div>
              <div style={{ display: "flex", gap: "2rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 800 }}>EVIDENCE TRUTH INDEX</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, color: factResult.fact_check.evidence_truth_index >= 75 ? "#10b981" : "#f59e0b" }}>
                    {factResult.fact_check.evidence_truth_index}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 800 }}>AUDIT VERDICT</div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, marginTop: "0.3rem" }}>
                    {factResult.fact_check.audit_verdict}
                  </div>
                </div>
              </div>

              {factResult.fact_check.claims.length === 0 ? (
                <div style={{ padding: "1.5rem", borderRadius: "12px", background: "rgba(241, 245, 249, 0.8)", fontSize: "0.85rem", color: "#64748b" }}>
                  No quantitative or empirical claims detected in this statement.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {factResult.fact_check.claims.map((claim, idx) => (
                    <div key={idx} style={{ padding: "1rem 1.25rem", borderRadius: "14px", background: "#ffffff", border: "1px solid rgba(226, 232, 240, 0.9)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>"{claim.assertion}"</span>
                        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: claim.confidence_score >= 80 ? "#10b981" : "#f59e0b" }}>
                          {claim.status} ({claim.confidence_score}%)
                        </span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        {claim.verification_note}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: 3-JUDGE BALLOT DECISION --- */}
      {activeTab === "ballot" && (
        <div className="glass-card" style={{ padding: "2.5rem" }}>
          <h2 className="font-display" style={{ fontSize: "1.6rem", fontWeight: 900, marginBottom: "0.5rem" }}>
            Official WSDC / BP Tournament Adjudication Ballot
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "2rem" }}>
            Deliberation summary from the 3-judge panel evaluating Matter, Manner, and Method.
          </p>

          {!ballotResult ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748b" }}>
              <div>⚖️</div>
              <div style={{ fontWeight: 700, marginTop: "0.5rem" }}>No ballot yet. Conduct a debate match in the Sparring Arena and click "Request Judge Decision".</div>
            </div>
          ) : (
            <div>
              {/* Decision Banner */}
              <div style={{ padding: "1.5rem", borderRadius: "18px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.9 }}>VERDICT</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900 }}>Winner: {ballotResult.winner}</div>
                  <div style={{ fontSize: "0.85rem", opacity: 0.95 }}>{ballotResult.ballot_summary}</div>
                </div>
                <div style={{ display: "flex", gap: "1.5rem" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>Affirmative Points:</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{ballotResult.affirmative_overall_points}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>Negative Points:</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{ballotResult.negative_overall_points}</div>
                  </div>
                </div>
              </div>

              {/* Individual Judge Ballots */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
                {ballotResult.judges.map((judge, idx) => (
                  <div key={idx} style={{ padding: "1.5rem", borderRadius: "16px", background: "#ffffff", border: "1px solid rgba(226, 232, 240, 0.9)", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#4f46e5", marginBottom: "0.4rem" }}>
                      JUDGE #{idx + 1}
                    </div>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                      {judge.judge_role}
                    </h3>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid #f1f5f9", fontSize: "0.82rem" }}>
                      <span style={{ color: "#64748b" }}>Affirmative Score:</span>
                      <span style={{ fontWeight: 800 }}>{judge.affirmative_score} / 90</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid #f1f5f9", fontSize: "0.82rem" }}>
                      <span style={{ color: "#64748b" }}>Negative Score:</span>
                      <span style={{ fontWeight: 800 }}>{judge.negative_score} / 90</span>
                    </div>
                    <div style={{ marginTop: "0.85rem", fontSize: "0.8rem", color: "#334155", fontStyle: "italic", lineHeight: 1.4 }}>
                      "{judge.feedback}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
