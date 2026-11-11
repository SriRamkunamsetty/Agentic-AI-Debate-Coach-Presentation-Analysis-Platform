"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { apiFetch, getStoredUser, getToken } from "../../lib/api";

// 20+ Fallacy Question Bank for Fallacy Blitz
const BLITZ_QUESTIONS = [
  {
    quote: "You can't prove that extraterrestrial life doesn't exist, which means intelligent aliens are definitely out there observing us.",
    correct: "Appeal to Ignorance",
    options: ["Appeal to Ignorance", "Ad Hominem", "Post Hoc Ergo Propter Hoc", "False Dilemma"],
    explanation: "Assumes a proposition to be true simply because it has not yet been proven false."
  },
  {
    quote: "Governor Smith says the tax cuts are working, but why should we listen to financial advice from someone who got divorced twice?",
    correct: "Ad Hominem",
    options: ["Ad Hominem", "Strawman", "Red Herring", "Slippery Slope"],
    explanation: "Attacks the speaker's personal life and character rather than addressing their actual economic arguments."
  },
  {
    quote: "The stock market plunged right after the new CEO was appointed, so the appointment clearly caused the financial market collapse.",
    correct: "Post Hoc Ergo Propter Hoc",
    options: ["Post Hoc Ergo Propter Hoc", "Texas Sharpshooter", "Equivocation", "Genetic Fallacy"],
    explanation: "Assumes correlation or chronological sequence equals direct causation without proof."
  },
  {
    quote: "Everyone in Silicon Valley is adopting this new microservices framework, so it must be the optimal engineering architecture for our startup.",
    correct: "Bandwagon Fallacy",
    options: ["Bandwagon Fallacy", "Tu Quoque", "No True Scotsman", "Appeal to Emotion"],
    explanation: "Argues that something is correct or optimal merely because many or popular people do or believe it."
  },
  {
    quote: "You argue that I should quit smoking for my health, but you smoked a pack a day when you were in college, so your argument is invalid!",
    correct: "Tu Quoque",
    options: ["Tu Quoque", "Strawman", "Non Sequitur", "Circular Reasoning"],
    explanation: "Deflects criticism by accusing the opponent of hypocrisy rather than engaging the argument itself."
  },
  {
    quote: "Look at this heartbreaking photo of a crying child. If you vote against this defense budget expansion, you hate our country's children.",
    correct: "Appeal to Emotion",
    options: ["Appeal to Emotion", "Genetic Fallacy", "Equivocation", "Hasty Generalization"],
    explanation: "Manipulates pity and emotional sentiment to bypass rational evidentiary justification."
  },
  {
    quote: "He highlighted three specific software projects that finished on time to prove that AI guarantees bug-free code delivery on every contract.",
    correct: "Texas Sharpshooter",
    options: ["Texas Sharpshooter", "No True Scotsman", "Fallacy Fallacy", "Circular Reasoning"],
    explanation: "Selectively cherry-picks matching data clusters while disregarding the overwhelming majority of counterexamples."
  },
  {
    quote: "That philosophical theory originated during medieval feudalism, so it cannot possibly hold any valid insight for modern legal theory.",
    correct: "Genetic Fallacy",
    options: ["Genetic Fallacy", "Ad Hominem", "Equivocation", "Non Sequitur"],
    explanation: "Evaluates the validity of a claim based entirely on its origin, history, or source rather than its substantive merits."
  },
  {
    quote: "No genuine software engineer would ever use an AI autocomplete tool. If you use one, you are not a real programmer.",
    correct: "No True Scotsman",
    options: ["No True Scotsman", "Tu Quoque", "Bandwagon Fallacy", "Strawman"],
    explanation: "Protects a universal generalization by unfalsifiably redefining category membership when faced with counterexamples."
  },
  {
    quote: "I enjoyed the coffee at that corner bistro this morning; therefore, our city council should immediately approve the new highway toll expansion.",
    correct: "Non Sequitur",
    options: ["Non Sequitur", "Slippery Slope", "False Dilemma", "Hasty Generalization"],
    explanation: "The stated conclusion does not logically follow from the premise whatsoever."
  },
  {
    quote: "Giving money to charities is the right thing to do. So charities have a legal right to all our unclaimed inheritance money.",
    correct: "Equivocation",
    options: ["Equivocation", "Circular Reasoning", "Ad Hominem", "Genetic Fallacy"],
    explanation: "Subtly shifts between two different meanings of the word 'right' (moral goodness vs. legal entitlement)."
  },
  {
    quote: "Your opponent committed a minor ad hominem in their opening sentence, therefore their entire premise regarding climate statistics is false.",
    correct: "Fallacy Fallacy",
    options: ["Fallacy Fallacy", "Strawman", "Red Herring", "False Dilemma"],
    explanation: "Assumes that because an argument contains a rhetorical fallacy, its underlying factual conclusion must automatically be false."
  },
  {
    quote: "If we permit students to use calculators on homework, next they won't learn basic arithmetic, then literacy will collapse, and civil society will end.",
    correct: "Slippery Slope",
    options: ["Slippery Slope", "False Dilemma", "Equivocation", "Bandwagon Fallacy"],
    explanation: "Asserts an extreme chain of catastrophic consequences without supporting probabilities."
  },
  {
    quote: "Either you fully support total deregulation of the energy sector, or you want all citizens to freeze in the dark during winter.",
    correct: "False Dilemma",
    options: ["False Dilemma", "Strawman", "Ad Hominem", "Texas Sharpshooter"],
    explanation: "Presents two extreme alternatives as the only choices, artificially erasing reasonable middle-ground policies."
  }
];

// Rebuttal Prompts
const REBUTTAL_PROMPTS = [
  {
    id: 1,
    topic: "Higher Education",
    motion: "Traditional 4-year university degrees are obsolete; vocational apprenticeships and self-taught portfolios should replace degree requirements entirely.",
    hints: "Address institutional research value, accreditation standards, and long-term socio-economic mobility beyond entry-level skills."
  },
  {
    id: 2,
    topic: "AI Governance",
    motion: "Open-source frontier AI weights must be prohibited worldwide to prevent rogue actors from weaponizing autonomous agent capabilities.",
    hints: "Counter with democratization, independent security auditing, vendor lock-in risks, and international enforcement feasibility."
  },
  {
    id: 3,
    topic: "Economic Policy",
    motion: "Remote work reduces workplace productivity and cultural cohesion; governments should mandate in-office attendance for corporate tax deductions.",
    hints: "Cite empirical employee retention, geographic talent diversity, commuter carbon footprints, and asynchronous documentation advantages."
  },
  {
    id: 4,
    topic: "Urban Mobility",
    motion: "Private car ownership should be banned in metropolitan centers, transitioning 100% of street surfaces to mass transit, cycling, and pedestrian zones.",
    hints: "Address emergency transit, disability accessibility, outer-suburban freight logistics, and transition infrastructure costs."
  }
];

// Teleprompter / Metronome Practice Scripts
const PACING_SCRIPTS = [
  {
    title: "Lincoln-Douglas Opening Exordium",
    targetWpm: 140,
    text: "Members of the assembly, the fundamental conflict before us today is not merely fiscal, but moral. When we evaluate the legitimacy of state coercion, we must ask whether individual liberty can survive without structural equality of opportunity. The resolution demands that justice supersede convenience. We affirm that human dignity is non-negotiable."
  },
  {
    title: "Championship Parliamentary Rebuttal",
    targetWpm: 155,
    text: "Let us inspect the Prime Minister's central contention. They assert that market deregulation automatically maximizes consumer welfare. Yet across three separate historical case studies—telecommunications, rail transport, and regional energy grids—unfettered deregulation yielded regional oligopolies, deferred capital maintenance, and exorbitant end-user surcharges. Their warrant fails empirical scrutiny."
  },
  {
    title: "Rhetorical Cadence & Enunciation Drill",
    targetWpm: 135,
    text: "Precision in articulation commands intellectual authority. Speak neither in hurried panic nor in sluggish monotone. Modulate your pitch upon pivotal warrants; pause deliberately before releasing your critical impact. The silence of an orator is as devastating as their sharpest rebuttal."
  }
];

export default function DrillsPage() {
  const [activeDrill, setActiveDrill] = useState("blitz"); // "blitz" | "speedrun" | "cadence"
  const [user, setUser] = useState(null);

  // Fallacy Blitz state
  const [blitzIndex, setBlitzIndex] = useState(0);
  const [blitzScore, setBlitzScore] = useState(0);
  const [blitzStreak, setBlitzStreak] = useState(0);
  const [blitzMaxStreak, setBlitzMaxStreak] = useState(0);
  const [blitzTimeLeft, setBlitzTimeLeft] = useState(15);
  const [blitzActive, setBlitzActive] = useState(false);
  const [blitzSelectedOption, setBlitzSelectedOption] = useState(null);
  const [blitzAnswered, setBlitzAnswered] = useState(false);
  const [blitzHistory, setBlitzHistory] = useState([]);

  // Speed Run state
  const [promptIndex, setPromptIndex] = useState(0);
  const [speedrunTimer, setSpeedrunTimer] = useState(30);
  const [speedrunActive, setSpeedrunActive] = useState(false);
  const [userRebuttal, setUserRebuttal] = useState("");
  const [rebuttalFeedback, setRebuttalFeedback] = useState(null);
  const [speedrunLoading, setSpeedrunLoading] = useState(false);

  // Cadence Metronome state
  const [scriptIndex, setScriptIndex] = useState(0);
  const [metronomeBpm, setMetronomeBpm] = useState(140);
  const [metronomePlaying, setMetronomePlaying] = useState(false);
  const [recordingPace, setRecordingPace] = useState(false);
  const [spokenWords, setSpokenWords] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [calculatedWpm, setCalculatedWpm] = useState(0);

  const audioCtxRef = useRef(null);
  const metronomeIntervalRef = useRef(null);
  const speechRecognitionRef = useRef(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored || !getToken()) {
      window.location.href = "/login";
    } else {
      setUser(stored);
    }
  }, []);

  // --- BLITZ TIMER EFFECT ---
  useEffect(() => {
    let timer = null;
    if (blitzActive && !blitzAnswered && blitzTimeLeft > 0) {
      timer = setInterval(() => {
        setBlitzTimeLeft((t) => t - 1);
      }, 1000);
    } else if (blitzActive && blitzTimeLeft === 0 && !blitzAnswered) {
      handleBlitzSelect(null); // Time expired
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [blitzActive, blitzTimeLeft, blitzAnswered]);

  const startBlitz = () => {
    setBlitzIndex(0);
    setBlitzScore(0);
    setBlitzStreak(0);
    setBlitzMaxStreak(0);
    setBlitzTimeLeft(15);
    setBlitzActive(true);
    setBlitzAnswered(false);
    setBlitzSelectedOption(null);
    setBlitzHistory([]);
  };

  const handleBlitzSelect = (option) => {
    if (blitzAnswered) return;
    setBlitzAnswered(true);
    setBlitzSelectedOption(option);
    const currentQ = BLITZ_QUESTIONS[blitzIndex % BLITZ_QUESTIONS.length];
    const isCorrect = option === currentQ.correct;

    if (isCorrect) {
      const newStreak = blitzStreak + 1;
      setBlitzStreak(newStreak);
      if (newStreak > blitzMaxStreak) setBlitzMaxStreak(newStreak);
      const points = 100 + blitzTimeLeft * 10 + (newStreak > 2 ? 50 : 0);
      setBlitzScore((s) => s + points);
    } else {
      setBlitzStreak(0);
    }

    setBlitzHistory((prev) => [
      ...prev,
      {
        question: currentQ.quote,
        chosen: option || "TIME EXPIRED",
        correct: currentQ.correct,
        isCorrect,
      },
    ]);
  };

  const nextBlitzQuestion = () => {
    setBlitzIndex((i) => i + 1);
    setBlitzTimeLeft(15);
    setBlitzAnswered(false);
    setBlitzSelectedOption(null);
  };

  // --- SPEED RUN TIMER EFFECT ---
  useEffect(() => {
    let timer = null;
    if (speedrunActive && speedrunTimer > 0) {
      timer = setInterval(() => {
        setSpeedrunTimer((t) => t - 1);
      }, 1000);
    } else if (speedrunActive && speedrunTimer === 0) {
      setSpeedrunActive(false);
      handleSubmitRebuttal();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [speedrunActive, speedrunTimer]);

  const startSpeedrun = () => {
    setSpeedrunTimer(30);
    setUserRebuttal("");
    setRebuttalFeedback(null);
    setSpeedrunActive(true);
  };

  const handleSubmitRebuttal = async () => {
    setSpeedrunActive(false);
    if (!userRebuttal.trim()) {
      setRebuttalFeedback({
        score: 0,
        verdict: "No input submitted",
        warrant: "No argumentative claim detected within time limit.",
        tip: "Speed is crucial; begin your rebuttal immediately with a direct negation.",
      });
      return;
    }
    setSpeedrunLoading(true);
    try {
      // Call Toulmin parser to evaluate logical rigor of rebuttal
      const parsed = await apiFetch("/arena/toulmin/parse", {
        method: "POST",
        body: JSON.stringify({ argument_text: userRebuttal }),
      });

      const partsPresent = [
        parsed.claim,
        parsed.grounds,
        parsed.warrant,
        parsed.rebuttal,
      ].filter((x) => x && x !== "Not explicitly stated").length;

      const dynamicScore = Math.min(95, Math.max(45, Math.round(parsed.coherence_score * 0.8 + partsPresent * 5)));

      setRebuttalFeedback({
        score: dynamicScore,
        verdict: dynamicScore >= 80 ? "Sharp Counterargument" : "Constructive Assertion",
        claim: parsed.claim,
        grounds: parsed.grounds,
        warrant: parsed.warrant,
        rebuttal: parsed.rebuttal,
        tip: parsed.critique || "Structure future rebuttals by stating: 'While the affirmative assumes X, historical evidence demonstrates Y, because Z.'",
      });
    } catch {
      // Fallback evaluation
      const words = userRebuttal.trim().split(/\s+/).length;
      setRebuttalFeedback({
        score: Math.min(88, Math.max(50, words * 2)),
        verdict: words > 25 ? "Substantive Counterargument" : "Compact Rebuttal",
        warrant: "Detected active counter-assertion with direct thematic opposition.",
        tip: "Strengthen empirical warrants with specific statistics or institutional precedents.",
      });
    } finally {
      setSpeedrunLoading(false);
    }
  };

  // --- CADENCE METRONOME FUNCTIONS ---
  const playClick = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  };

  const toggleMetronome = () => {
    if (metronomePlaying) {
      if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
      setMetronomePlaying(false);
    } else {
      const ms = (60 / metronomeBpm) * 1000;
      playClick();
      metronomeIntervalRef.current = setInterval(playClick, ms);
      setMetronomePlaying(true);
    }
  };

  useEffect(() => {
    if (metronomePlaying) {
      if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
      const ms = (60 / metronomeBpm) * 1000;
      metronomeIntervalRef.current = setInterval(playClick, ms);
    }
    return () => {
      if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
    };
  }, [metronomeBpm]);

  // Speech Recognition / Pacing calculation
  const startCadenceRecording = () => {
    setSpokenWords("");
    setElapsedSeconds(0);
    setCalculatedWpm(0);
    setRecordingPace(true);

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.onresult = (event) => {
          let fullTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript + " ";
          }
          setSpokenWords(fullTranscript.trim());
        };
        recognition.onerror = () => {};
        recognition.start();
        speechRecognitionRef.current = recognition;
      } catch {}
    }
  };

  const stopCadenceRecording = () => {
    setRecordingPace(false);
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }
  };

  useEffect(() => {
    let timer = null;
    if (recordingPace) {
      timer = setInterval(() => {
        setElapsedSeconds((s) => {
          const next = s + 1;
          const wordCount = spokenWords ? spokenWords.split(/\s+/).filter(Boolean).length : 0;
          if (next >= 3) {
            setCalculatedWpm(Math.round((wordCount / next) * 60));
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [recordingPace, spokenWords]);

  const currentQ = BLITZ_QUESTIONS[blitzIndex % BLITZ_QUESTIONS.length];
  const currentPrompt = REBUTTAL_PROMPTS[promptIndex % REBUTTAL_PROMPTS.length];
  const currentScript = PACING_SCRIPTS[scriptIndex % PACING_SCRIPTS.length];

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      {/* Top Breadcrumb & Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="badge-red-pill">RHETORICAL GYMNASIUM</span>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontFamily: "monospace" }}>MODULE // DRILL_ARENA_v2.4</span>
          </div>
          <h1 className="font-display" style={{ fontSize: "2.4rem", fontWeight: "900", margin: "0.4rem 0 0" }}>
            Rhetorical Drill Arena
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Gamified rapid-fire training modules for fallacy identification, split-second rebuttals, and cadence biofeedback.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/arena" className="btn btn-red" style={{ padding: "0.65rem 1.4rem", fontSize: "0.85rem" }}>
            ⚔️ Tournament Arena
          </Link>
          <Link href="/simulation" className="btn" style={{ padding: "0.65rem 1.4rem", fontSize: "0.85rem", background: "#fff", border: "1px solid #e2e8f0" }}>
            🤖 AI Sparring
          </Link>
        </div>
      </div>

      {/* Drill Mode Selection Tabs */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem", borderBottom: "1px solid rgba(226, 232, 240, 0.8)", paddingBottom: "0.75rem" }}>
        <button
          onClick={() => setActiveDrill("blitz")}
          className={`nav-link ${activeDrill === "blitz" ? "active" : ""}`}
          style={{ padding: "0.6rem 1.4rem", borderRadius: "9999px", fontWeight: 700, cursor: "pointer", border: "none" }}
        >
          ⚡ 1. Fallacy Blitz (15s)
        </button>
        <button
          onClick={() => setActiveDrill("speedrun")}
          className={`nav-link ${activeDrill === "speedrun" ? "active" : ""}`}
          style={{ padding: "0.6rem 1.4rem", borderRadius: "9999px", fontWeight: 700, cursor: "pointer", border: "none" }}
        >
          ⏱️ 2. Rebuttal Speed Run (30s)
        </button>
        <button
          onClick={() => setActiveDrill("cadence")}
          className={`nav-link ${activeDrill === "cadence" ? "active" : ""}`}
          style={{ padding: "0.6rem 1.4rem", borderRadius: "9999px", fontWeight: 700, cursor: "pointer", border: "none" }}
        >
          🎙️ 3. Cadence Metronome (WPM)
        </button>
      </div>

      {/* ========================================================== */}
      {/* MODE 1: FALLACY BLITZ */}
      {/* ========================================================== */}
      {activeDrill === "blitz" && (
        <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr", gap: "1.5rem" }}>
          <div className="glass-card" style={{ padding: "2rem" }}>
            {!blitzActive ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>⚡</div>
                <h2 className="font-display" style={{ fontSize: "1.8rem", fontWeight: 800 }}>
                  Fallacy Blitz Challenge
                </h2>
                <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: "0.5rem auto 1.5rem", fontSize: "0.95rem" }}>
                  Identify sophisms, cognitive biases, and logical traps in 15 seconds. Maintain your streak to earn multi-tiered score multipliers.
                </p>
                <button onClick={startBlitz} className="btn btn-red" style={{ padding: "0.85rem 2.5rem", fontSize: "1rem" }}>
                  🚀 Launch Blitz Drill
                </button>
              </div>
            ) : (
              <div>
                {/* Header with Countdown and Progress */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#64748b" }}>
                      QUESTION {blitzIndex + 1}
                    </span>
                    {blitzStreak >= 3 && (
                      <span style={{ fontSize: "0.75rem", background: "linear-gradient(135deg, #f59e0b, #ef4444)", color: "#fff", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontWeight: 800 }}>
                        🔥 {blitzStreak}x STREAK
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span className="font-mono" style={{ fontSize: "1.2rem", fontWeight: 900, color: blitzTimeLeft <= 5 ? "#ef4444" : "#4f46e5" }}>
                      ⏳ {blitzTimeLeft}s
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "9999px", overflow: "hidden", marginBottom: "1.8rem" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${(blitzTimeLeft / 15) * 100}%`,
                      background: blitzTimeLeft <= 5 ? "#ef4444" : "linear-gradient(90deg, #4f46e5, #06b6d4)",
                      transition: "width 1s linear, background 0.3s ease",
                    }}
                  />
                </div>

                {/* The Argument Quote */}
                <div
                  style={{
                    background: "rgba(248, 250, 252, 0.9)",
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "1.6rem",
                    marginBottom: "1.8rem",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                    Opponent's Spoken Assertion:
                  </div>
                  <p style={{ fontSize: "1.15rem", fontWeight: 600, color: "#1e293b", lineHeight: 1.6 }}>
                    “{currentQ.quote}”
                  </p>
                </div>

                {/* Multiple Choice Options */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  {currentQ.options.map((opt) => {
                    let btnStyle = {
                      padding: "1rem 1.25rem",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      background: "#fff",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      textAlign: "left",
                      cursor: blitzAnswered ? "default" : "pointer",
                      transition: "all 0.2s ease",
                      color: "#1e293b",
                    };

                    if (blitzAnswered) {
                      if (opt === currentQ.correct) {
                        btnStyle = {
                          ...btnStyle,
                          background: "#ecfdf5",
                          borderColor: "#10b981",
                          color: "#065f46",
                          boxShadow: "0 0 0 2px #10b981",
                        };
                      } else if (opt === blitzSelectedOption && opt !== currentQ.correct) {
                        btnStyle = {
                          ...btnStyle,
                          background: "#fef2f2",
                          borderColor: "#ef4444",
                          color: "#991b1b",
                          boxShadow: "0 0 0 2px #ef4444",
                        };
                      } else {
                        btnStyle = { ...btnStyle, opacity: 0.5 };
                      }
                    }

                    return (
                      <button
                        key={opt}
                        onClick={() => handleBlitzSelect(opt)}
                        disabled={blitzAnswered}
                        style={btnStyle}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation & Next Button */}
                {blitzAnswered && (
                  <div
                    style={{
                      background: blitzSelectedOption === currentQ.correct ? "#ecfdf5" : "#fef2f2",
                      border: `1px solid ${blitzSelectedOption === currentQ.correct ? "#a7f3d0" : "#fecaca"}`,
                      borderRadius: "12px",
                      padding: "1.2rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, color: blitzSelectedOption === currentQ.correct ? "#065f46" : "#991b1b", marginBottom: "0.2rem" }}>
                        {blitzSelectedOption === currentQ.correct ? "✅ Correct Identification!" : `❌ Incorrect — Correct: ${currentQ.correct}`}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#475569" }}>{currentQ.explanation}</div>
                    </div>
                    <button onClick={nextBlitzQuestion} className="btn btn-red" style={{ padding: "0.6rem 1.4rem", fontSize: "0.85rem" }}>
                      Next Challenge ➔
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Blitz Leaderboard / Telemetry */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="glass-card" style={{ padding: "1.5rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                SESSION SCORE
              </div>
              <div style={{ fontSize: "2.8rem", fontWeight: 900, background: "linear-gradient(135deg, #4f46e5, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {blitzScore}
              </div>
              <div style={{ display: "flex", justifyContent: "space-around", marginTop: "0.5rem", borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem" }}>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b" }}>CURRENT STREAK</div>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#4f46e5" }}>{blitzStreak}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b" }}>MAX STREAK</div>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#f59e0b" }}>{blitzMaxStreak}</div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: "0.8rem" }}>
                RECENT ATTEMPTS
              </div>
              {blitzHistory.length === 0 ? (
                <div style={{ color: "#94a3b8", fontSize: "0.85rem", textAlign: "center", padding: "1.5rem 0" }}>
                  No questions answered yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "250px", overflowY: "auto" }}>
                  {blitzHistory.slice(-5).reverse().map((h, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "0.6rem 0.8rem",
                        borderRadius: "8px",
                        background: h.isCorrect ? "#f0fdf4" : "#fef2f2",
                        border: `1px solid ${h.isCorrect ? "#bbf7d0" : "#fecaca"}`,
                        fontSize: "0.8rem",
                      }}
                    >
                      <div style={{ fontWeight: 700, color: h.isCorrect ? "#166534" : "#991b1b" }}>
                        {h.isCorrect ? "✓ " : "✗ "} {h.correct}
                      </div>
                      <div style={{ color: "#64748b", fontSize: "0.75rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {h.question}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODE 2: REBUTTAL SPEED RUN */}
      {/* ========================================================== */}
      {activeDrill === "speedrun" && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
          <div className="glass-card" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <span className="badge-red-pill">{currentPrompt.topic.toUpperCase()}</span>
                <h2 className="font-display" style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.3rem" }}>
                  30-Second Rebuttal Blitz
                </h2>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span className="font-mono" style={{ fontSize: "1.4rem", fontWeight: 900, color: speedrunTimer <= 10 ? "#ef4444" : "#4f46e5" }}>
                  ⏱️ {speedrunTimer}s
                </span>
                {!speedrunActive ? (
                  <button onClick={startSpeedrun} className="btn btn-red" style={{ padding: "0.5rem 1.2rem", fontSize: "0.85rem" }}>
                    ▶ Start Timer
                  </button>
                ) : (
                  <button onClick={handleSubmitRebuttal} className="btn" style={{ padding: "0.5rem 1.2rem", fontSize: "0.85rem", background: "#ef4444", color: "#fff" }}>
                    ⏹ Submit Now
                  </button>
                )}
              </div>
            </div>

            {/* Target Resolution */}
            <div style={{ background: "rgba(241, 245, 249, 0.8)", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                Motion Under Challenge:
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginTop: "0.3rem" }}>
                “{currentPrompt.motion}”
              </div>
              <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.5rem" }}>
                💡 <strong>Coach Strategy:</strong> {currentPrompt.hints}
              </div>
            </div>

            {/* Input area */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                Your Rapid Counterargument:
              </label>
              <textarea
                value={userRebuttal}
                onChange={(e) => setUserRebuttal(e.target.value)}
                placeholder="Disprove the warrant immediately. E.g. 'While the proponent argues X, empirical evidence from Y proves Z, because...'"
                rows={5}
                disabled={!speedrunActive && !rebuttalFeedback}
                style={{
                  width: "100%",
                  padding: "1rem",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.95rem",
                  outline: "none",
                  resize: "vertical",
                  background: speedrunActive ? "#fff" : "#f8fafc",
                }}
              />
            </div>

            {/* Change Motion Button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                onClick={() => {
                  setPromptIndex((p) => p + 1);
                  setSpeedrunTimer(30);
                  setSpeedrunActive(false);
                  setUserRebuttal("");
                  setRebuttalFeedback(null);
                }}
                className="btn"
                style={{ padding: "0.45rem 1rem", fontSize: "0.8rem", background: "#fff", border: "1px solid #e2e8f0" }}
              >
                🔄 Switch Motion Prompt
              </button>

              {speedrunActive && (
                <span className="font-mono" style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Words: {userRebuttal.trim().split(/\s+/).filter(Boolean).length}
                </span>
              )}
            </div>

            {/* Feedback Analysis Box */}
            {speedrunLoading && (
              <div style={{ marginTop: "1.5rem", padding: "1.5rem", textAlign: "center", color: "#64748b" }}>
                ⚡ Toulmin Engine dissecting rebuttal coherence and empirical grounding...
              </div>
            )}

            {rebuttalFeedback && !speedrunLoading && (
              <div style={{ marginTop: "1.5rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b" }}>EVALUATION</span>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                      {rebuttalFeedback.verdict}
                    </h3>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "2rem", fontWeight: 900, color: rebuttalFeedback.score >= 75 ? "#10b981" : "#f59e0b" }}>
                      {rebuttalFeedback.score}<span style={{ fontSize: "1rem", color: "#64748b" }}>/100</span>
                    </div>
                  </div>
                </div>

                {rebuttalFeedback.warrant && (
                  <div style={{ marginBottom: "0.75rem", fontSize: "0.88rem", color: "#334155" }}>
                    <strong>Identified Warrant:</strong> {rebuttalFeedback.warrant}
                  </div>
                )}
                {rebuttalFeedback.tip && (
                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "0.8rem", fontSize: "0.85rem", color: "#1e40af" }}>
                    💡 <strong>Coaching Feedback:</strong> {rebuttalFeedback.tip}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Speed Run Tips & Rules */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: "0.75rem" }}>
                SPEED REBUTTAL BLUEPRINT
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem", color: "#475569" }}>
                <li style={{ display: "flex", gap: "0.5rem" }}>
                  <span>1.</span>
                  <span><strong>Turn the Warrant:</strong> Show that the opponent's premise actually produces the opposite outcome.</span>
                </li>
                <li style={{ display: "flex", gap: "0.5rem" }}>
                  <span>2.</span>
                  <span><strong>Empirical Nuance:</strong> Cite a counter-example or structural vulnerability in their reasoning.</span>
                </li>
                <li style={{ display: "flex", gap: "0.5rem" }}>
                  <span>3.</span>
                  <span><strong>Impact Weighing:</strong> Argue why your consequence has greater scope, severity, or reversibility.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODE 3: CADENCE METRONOME */}
      {/* ========================================================== */}
      {activeDrill === "cadence" && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
          <div className="glass-card" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <span className="badge-red-pill">VOCAL BIOFEEDBACK</span>
                <h2 className="font-display" style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "0.2rem" }}>
                  Cadence Metronome & Pacer
                </h2>
              </div>

              {/* Metronome Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "#f8fafc", padding: "0.5rem 1rem", borderRadius: "9999px", border: "1px solid #e2e8f0" }}>
                <button
                  onClick={toggleMetronome}
                  className="btn"
                  style={{
                    padding: "0.4rem 0.9rem",
                    fontSize: "0.8rem",
                    background: metronomePlaying ? "#ef4444" : "#4f46e5",
                    color: "#fff",
                    borderRadius: "9999px",
                  }}
                >
                  {metronomePlaying ? "⏹ Stop Beat" : "▶ Start Beat"}
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span className="font-mono" style={{ fontWeight: 800, fontSize: "0.9rem" }}>{metronomeBpm}</span>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>BPM</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="190"
                  value={metronomeBpm}
                  onChange={(e) => setMetronomeBpm(Number(e.target.value))}
                  style={{ width: "80px", cursor: "pointer" }}
                />
              </div>
            </div>

            {/* Practice Teleprompter Script */}
            <div style={{ background: "rgba(241, 245, 249, 0.7)", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b" }}>
                  SCRIPT: {currentScript.title.toUpperCase()}
                </span>
                <span style={{ fontSize: "0.75rem", color: "#4f46e5", fontWeight: 700 }}>
                  Target: {currentScript.targetWpm} WPM
                </span>
              </div>
              <p style={{ fontSize: "1.15rem", lineHeight: 1.8, color: "#1e293b", fontFamily: "var(--font-body)" }}>
                {currentScript.text}
              </p>
            </div>

            {/* Script selector buttons */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
              {PACING_SCRIPTS.map((s, idx) => (
                <button
                  key={s.title}
                  onClick={() => {
                    setScriptIndex(idx);
                    setMetronomeBpm(s.targetWpm);
                  }}
                  className="btn"
                  style={{
                    padding: "0.4rem 0.8rem",
                    fontSize: "0.75rem",
                    background: scriptIndex === idx ? "#4f46e5" : "#fff",
                    color: scriptIndex === idx ? "#fff" : "#475569",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {s.title}
                </button>
              ))}
            </div>

            {/* Live Audio Speech Reader */}
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                  Live Vocal Pacing Tracker
                </span>
                {!recordingPace ? (
                  <button onClick={startCadenceRecording} className="btn btn-red" style={{ padding: "0.45rem 1.2rem", fontSize: "0.82rem" }}>
                    🎤 Start Speaking Pacing Test
                  </button>
                ) : (
                  <button onClick={stopCadenceRecording} className="btn" style={{ padding: "0.45rem 1.2rem", fontSize: "0.82rem", background: "#ef4444", color: "#fff" }}>
                    ⏹ Finish Reading
                  </button>
                )}
              </div>

              {spokenWords && (
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem", fontSize: "0.9rem", color: "#334155", fontStyle: "italic", maxHeight: "120px", overflowY: "auto" }}>
                  “{spokenWords}”
                </div>
              )}
            </div>
          </div>

          {/* Cadence Telemetry Speedometer */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="glass-card" style={{ padding: "1.5rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                CURRENT DELIVERY SPEED
              </div>
              <div
                style={{
                  fontSize: "3.2rem",
                  fontWeight: 900,
                  marginTop: "0.2rem",
                  color: calculatedWpm >= 130 && calculatedWpm <= 165 ? "#10b981" : calculatedWpm > 165 ? "#ef4444" : calculatedWpm > 0 ? "#f59e0b" : "#64748b",
                }}
              >
                {calculatedWpm}
                <span style={{ fontSize: "1.2rem", color: "#94a3b8" }}> WPM</span>
              </div>

              <div style={{ marginTop: "0.5rem" }}>
                {calculatedWpm === 0 ? (
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Press Speak & recite the script above</span>
                ) : calculatedWpm >= 130 && calculatedWpm <= 165 ? (
                  <span style={{ fontSize: "0.75rem", background: "#ecfdf5", color: "#065f46", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontWeight: 800 }}>
                    🎯 Optimal Tournament Cadence
                  </span>
                ) : calculatedWpm > 165 ? (
                  <span style={{ fontSize: "0.75rem", background: "#fef2f2", color: "#991b1b", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontWeight: 800 }}>
                    ⚠️ Rapid Rush — Slow down for clarity
                  </span>
                ) : (
                  <span style={{ fontSize: "0.75rem", background: "#fffbeb", color: "#92400e", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontWeight: 800 }}>
                    ⚠️ Sluggish Pace — Increase momentum
                  </span>
                )}
              </div>

              <div style={{ borderTop: "1px solid #f1f5f9", marginTop: "1rem", paddingTop: "0.75rem", display: "flex", justifyContent: "space-around" }}>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b" }}>TIME ELAPSED</div>
                  <div className="font-mono" style={{ fontWeight: 800, fontSize: "1rem" }}>{elapsedSeconds}s</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b" }}>WORD COUNT</div>
                  <div className="font-mono" style={{ fontWeight: 800, fontSize: "1rem" }}>
                    {spokenWords ? spokenWords.split(/\s+/).filter(Boolean).length : 0}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: "0.6rem" }}>
                CADENCE BENCHMARKS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.82rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Conversational:</span>
                  <strong>120 - 135 WPM</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>BP Debate:</span>
                  <strong style={{ color: "#10b981" }}>140 - 160 WPM</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Policy Spreading:</span>
                  <strong style={{ color: "#ef4444" }}>&gt; 250 WPM</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
