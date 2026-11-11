"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="container" style={{ paddingTop: "2.5rem", paddingBottom: "5rem" }}>
      {/* Top Header Badge */}
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <div className="badge-red-pill" style={{ display: "inline-flex" }}>
          <span>🏛️</span> ARCHITECTURAL SPECIFICATION & MISSION
        </div>
        <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", fontWeight: 900, margin: "0.8rem 0" }}>
          About <span style={{ background: "linear-gradient(135deg, #4f46e5, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>LOGOS.AI</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.15rem", maxWidth: "780px", margin: "0 auto", lineHeight: 1.6 }}>
          Transforming competitive debating, rhetorical persuasion, and executive public speaking from an intuitive art into a data-driven, verifiable science through distributed agentic intelligence.
        </p>
      </div>

      {/* Mission & Vision Statement */}
      <div className="glass-card" style={{ padding: "2.5rem", marginBottom: "2.5rem", borderLeft: "4px solid #4f46e5" }}>
        <h2 className="font-display" style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.8rem" }}>
          Our Core Mission
        </h2>
        <p style={{ fontSize: "1.05rem", color: "#334155", lineHeight: 1.7, marginBottom: "1rem" }}>
          In an era dominated by rapid information dissemination and polarized public discourse, the ability to formulate cogent arguments, stress-test logic, and speak with authentic vocal poise is essential for leaders, educators, and students. Historically, world-class debate coaching has been locked behind elite private academies and expensive competitive circuits.
        </p>
        <p style={{ fontSize: "1.05rem", color: "#334155", lineHeight: 1.7 }}>
          <strong>LOGOS.AI</strong> democratizes master-level rhetorical training. By fusing <strong>Stephen Toulmin's analytical argument model</strong>, <strong>World Schools / British Parliamentary 3-judge adjudication swarms</strong>, and <strong>distributed real-time prosody analysis</strong>, the platform delivers instant, non-judgmental, and rigorous feedback for every spoken or written assertion.
        </p>
      </div>

      {/* 4 Pillars Grid */}
      <div style={{ marginBottom: "3rem" }}>
        <h2 className="font-display" style={{ fontSize: "1.8rem", fontWeight: 800, textAlign: "center", marginBottom: "2rem" }}>
          Architectural Pillars
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {/* Pillar 1 */}
          <div className="glass-card" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(79, 70, 229, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
                📐
              </div>
              <div>
                <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748b" }}>PILLAR 01</span>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800 }}>Toulmin Argument Engine</h3>
              </div>
            </div>
            <p style={{ fontSize: "0.92rem", color: "#475569", lineHeight: 1.6 }}>
              Deconstructs argumentation into the six foundational components of Stephen Toulmin's philosophical model: <strong>Claim, Grounds, Warrant, Backing, Qualifier, and Rebuttal</strong>. Emits directed dependency graphs to identify missing structural warrants.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="glass-card" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
                ⚖️
              </div>
              <div>
                <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748b" }}>PILLAR 02</span>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800 }}>3-Judge WSDC / BP Swarm</h3>
              </div>
            </div>
            <p style={{ fontSize: "0.92rem", color: "#475569", lineHeight: 1.6 }}>
              Simulates a three-judge championship tournament panel: <strong>Judge Matter</strong> (factual grounding and logical cogency), <strong>Judge Manner</strong> (persuasion, delivery, and rhetorical ethos), and <strong>Judge Method</strong> (strategy, responsiveness, and rebuttal priority) on an official 60–90 scale.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="glass-card" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(244, 63, 94, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
                🛡️
              </div>
              <div>
                <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748b" }}>PILLAR 03</span>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800 }}>Fact Check & Truth Index</h3>
              </div>
            </div>
            <p style={{ fontSize: "0.92rem", color: "#475569", lineHeight: 1.6 }}>
              Automated extraction of numerical statistics, percentages, and empirical citations. Computes an <strong>Evidence Truth Index (0–100%)</strong> to flag cherry-picked data clusters and unverified empirical assertions during live debates.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="glass-card" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(236, 72, 153, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
                🎙️
              </div>
              <div>
                <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748b" }}>PILLAR 04</span>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800 }}>Prosody & Vocal Cadence</h3>
              </div>
            </div>
            <p style={{ fontSize: "0.92rem", color: "#475569", lineHeight: 1.6 }}>
              Direct acoustic processing evaluating Words Per Minute (target 130–160 WPM), RMS volume stability, silence-to-speech ratio, and pause duration to train authoritative presence without vocal strain.
            </p>
          </div>
        </div>
      </div>

      {/* Production Infrastructure Overview */}
      <div className="glass-card" style={{ padding: "2.5rem", marginBottom: "3rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div className="badge-red-pill">DEVOPS & DISTRIBUTED INFRASTRUCTURE</div>
            <h2 className="font-display" style={{ fontSize: "1.6rem", fontWeight: 800, margin: "0.3rem 0 0" }}>
              Enterprise Cloud & Production Stack
            </h2>
          </div>
          <span className="font-mono" style={{ fontSize: "0.85rem", color: "#10b981", background: "#ecfdf5", padding: "0.3rem 0.8rem", borderRadius: "9999px", fontWeight: 800 }}>
            ● Production Ready
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
          <div style={{ background: "rgba(248, 250, 252, 0.8)", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a", marginBottom: "0.4rem" }}>🚀 Distributed Celery & Redis</div>
            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Asynchronous queue processing routing heavy speech acoustics, PDF rendering, and tournament swarm ballots across isolated queues.
            </div>
          </div>

          <div style={{ background: "rgba(248, 250, 252, 0.8)", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a", marginBottom: "0.4rem" }}>☸️ Production Kubernetes (k8s)</div>
            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
              StatefulSet storage for PostgreSQL 16, Horizontal Pod Autoscaling (HPA 2–10 replicas), and TLS-terminated Ingress routing.
            </div>
          </div>

          <div style={{ background: "rgba(248, 250, 252, 0.8)", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a", marginBottom: "0.4rem" }}>📊 Prometheus & Grafana</div>
            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Comprehensive real-time API latency, request throughput, and background queue telemetry exposed via <code style={{ fontSize: "0.8rem", background: "#f1f5f9", padding: "0.1rem 0.3rem", borderRadius: "4px" }}>/metrics</code>.
            </div>
          </div>

          <div style={{ background: "rgba(248, 250, 252, 0.8)", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a", marginBottom: "0.4rem" }}>🔒 SAST, Secret & CVE CI/CD</div>
            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Multi-stage GitHub Actions enforcing Bandit static analysis, Gitleaks token checks, Trivy container CVE scans, and GHCR publishing.
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch CTA Banner */}
      <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #31104b 100%)", borderRadius: "20px", padding: "3rem 2rem", textAlign: "center", color: "#fff", position: "relative", overflow: "hidden" }}>
        <h2 className="font-display" style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "0.8rem" }}>
          Experience the Platform Live
        </h2>
        <p style={{ color: "#cbd5e1", maxWidth: "600px", margin: "0 auto 1.8rem", fontSize: "1rem" }}>
          Test your assertions in the Tournament Arena, sharpen your speed in the Drill Gymnasium, or engage an AI opponent in the Simulation Terminal.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="/arena" className="btn btn-red" style={{ padding: "0.75rem 2rem", fontSize: "0.92rem" }}>
            ⚔️ Open Tournament Arena
          </Link>
          <Link href="/drills" className="btn" style={{ padding: "0.75rem 2rem", fontSize: "0.92rem", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}>
            ⚡ Enter Drill Gymnasium
          </Link>
          <Link href="/simulation" className="btn" style={{ padding: "0.75rem 2rem", fontSize: "0.92rem", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}>
            🤖 AI Debate Simulation
          </Link>
        </div>
      </div>
    </div>
  );
}
