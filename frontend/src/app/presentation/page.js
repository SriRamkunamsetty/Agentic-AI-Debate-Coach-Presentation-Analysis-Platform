'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, clearAuth, getStoredUser } from '../../lib/api';


export default function PresentationPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [speechText, setSpeechText] = useState('Um, so basically, we believe that AI policy, you know, must be strictly enforced. Without proper controls, risks could increase.');
  const [duration, setDuration] = useState(30);
  const [audioFile, setAudioFile] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadSessions = async () => {
    try {
      const items = await apiFetch('/sessions/user/me');
      const list = items || [];
      setSessions(list);
      if (!sessionId && list[0]?.id) {
        setSessionId(String(list[0].id));
      }
    } catch (err) {
      if (err.status === 401) { clearAuth(); router.push('/login'); }
      else setError(err.message || 'Unable to load sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!getStoredUser()?.access_token) { router.push('/login'); return; }
    loadSessions();
  }, [router]);

  const selectedSession = sessions.find(s => String(s.id) === String(sessionId));

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setAnalyzing(true);
    setError('');
    setSuccessMsg('');
    setMetrics(null);
    try {
      if (!sessionId) throw new Error('Create or select a debate session before analyzing a presentation.');
      let data;
      if (audioFile) {
        const form = new FormData();
        form.append('session_id', sessionId);
        form.append('transcript', speechText);
        form.append('audio_file', audioFile);
        data = await apiFetch('/presentation-analysis/analyze-audio', { method: 'POST', body: form });
      } else {
        data = await apiFetch('/presentation-analysis/evaluate', {
          method: 'POST',
          body: JSON.stringify({ session_id: Number(sessionId), speech_text: speechText, audio_duration_seconds: Number(duration) }),
        });
      }
      setMetrics(data);
    } catch (err) {
      if (err.status === 401) { clearAuth(); router.push('/login'); }
      else setError(err.message || 'Unable to analyze the presentation.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleToggleSessionStatus = async (newStatus) => {
    if (!sessionId) return;
    setUpdatingStatus(true);
    setError('');
    setSuccessMsg('');
    try {
      await apiFetch(`/sessions/${sessionId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setSuccessMsg(`Session #${sessionId} marked as ${newStatus}!`);
      setSessions(prev => prev.map(s => String(s.id) === String(sessionId) ? { ...s, status: newStatus } : s));
    } catch (err) {
      setError(err.message || `Unable to mark session as ${newStatus}.`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <main className="watermark-container">
      <div className="section-container" style={{ position: 'relative', zIndex: 1, paddingTop: '2.5rem', paddingBottom: '5rem' }}>
        <div className="badge-red-pill">PROSODY & SPEECH ENGINE</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Vocal Metrics & Presentation Suite
            </h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '700px' }}>
              Evaluate speaking pace, filler-word density, vocal confidence, clarity, pauses, silence, and volume from transcript or uploaded audio with instant AI coaching feedback.
            </p>
          </div>
          {selectedSession && (
            <div style={{ background: '#fff', border: '1px solid var(--border-light)', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div>
                <div className="font-mono text-muted" style={{ fontSize: '0.7rem' }}>SESSION #{selectedSession.id}</div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{selectedSession.title}</div>
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.25rem 0.65rem',
                borderRadius: '4px',
                background: selectedSession.status === 'Completed' || selectedSession.status === 'Ended' ? '#ecfdf5' : '#fff7ed',
                color: selectedSession.status === 'Completed' || selectedSession.status === 'Ended' ? '#15803d' : '#c2410c',
                border: `1px solid ${selectedSession.status === 'Completed' || selectedSession.status === 'Ended' ? '#bbf7d0' : '#fed7aa'}`
              }}>
                {selectedSession.status}
              </span>
              {selectedSession.status === 'Active' ? (
                <button
                  disabled={updatingStatus}
                  onClick={() => handleToggleSessionStatus('Completed')}
                  className="btn btn-dark"
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', cursor: 'pointer' }}
                >
                  {updatingStatus ? 'UPDATING…' : 'END SESSION'}
                </button>
              ) : (
                <button
                  disabled={updatingStatus}
                  onClick={() => handleToggleSessionStatus('Active')}
                  className="btn btn-dark"
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', cursor: 'pointer' }}
                >
                  {updatingStatus ? 'UPDATING…' : 'REOPEN SESSION'}
                </button>
              )}
            </div>
          )}
        </div>

        {error && (
          <div role="alert" style={{ marginBottom: '1.25rem', padding: '.8rem 1rem', color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div role="status" style={{ marginBottom: '1.25rem', padding: '.8rem 1rem', color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', fontWeight: 600 }}>
            {successMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(320px, 1fr)', gap: '2rem', alignItems: 'start' }}>
          {/* Submission Form */}
          <form onSubmit={handleAnalyze} style={{ background: 'var(--bg-secondary)', padding: '2rem', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
              <label className="font-mono" style={{ fontSize: '.85rem', fontWeight: 700 }}>DEBATE SESSION</label>
              <Link href="/dashboard" style={{ fontSize: '.75rem', color: 'var(--accent-red)', fontWeight: 700, textDecoration: 'underline' }}>
                + Create New in Analytics
              </Link>
            </div>
            <select
              required
              disabled={loading || sessions.length === 0}
              value={sessionId}
              onChange={e => setSessionId(e.target.value)}
              style={{ width: '100%', padding: '.75rem', marginBottom: '1.25rem', border: '1px solid var(--border-light)', background: '#fff' }}
            >
              <option value="">{loading ? 'Loading sessions…' : sessions.length ? 'Select a session' : 'No sessions available'}</option>
              {sessions.map(item => (
                <option key={item.id} value={item.id}>
                  #{item.id}: {item.title} [{item.status}]
                </option>
              ))}
            </select>

            <label className="font-mono" style={{ display: 'block', fontSize: '.85rem', fontWeight: 700, marginBottom: '.5rem' }}>
              TRANSCRIPT (OPTIONAL WHEN AUDIO IS UPLOADED)
            </label>
            <textarea
              rows={8}
              value={speechText}
              onChange={e => setSpeechText(e.target.value)}
              className="font-mono"
              placeholder="Paste or type speech transcript..."
              style={{ width: '100%', padding: '1rem', border: '1px solid var(--border-light)', fontSize: '.9rem', marginBottom: '1.25rem', boxSizing: 'border-box' }}
            />

            <label className="font-mono" style={{ display: 'block', fontSize: '.85rem', fontWeight: 700, marginBottom: '.5rem' }}>
              AUDIO FILE (WAV, MP3, M4A, WEBM, OGG)
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={e => setAudioFile(e.target.files?.[0] || null)}
              style={{ width: '100%', marginBottom: '1.25rem' }}
            />

            {!audioFile && (
              <>
                <label className="font-mono" style={{ display: 'block', fontSize: '.85rem', fontWeight: 700, marginBottom: '.5rem' }}>
                  TRANSCRIPT DURATION (SECONDS)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  style={{ width: '100%', padding: '.75rem', border: '1px solid var(--border-light)', marginBottom: '1.5rem', boxSizing: 'border-box' }}
                />
              </>
            )}

            <button
              type="submit"
              disabled={analyzing || loading || !sessionId}
              className="btn btn-red"
              style={{ width: '100%', cursor: 'pointer', padding: '0.9rem' }}
            >
              {analyzing ? 'COMPUTING VOCAL METRICS…' : audioFile ? 'ANALYZE AUDIO RECORDING' : 'ANALYZE SPEECH TRANSCRIPT'}
            </button>
          </form>

          {/* Results Side */}
          <section>
            {metrics ? (
              <div style={{ display: 'grid', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  {[
                    ['SPEECH PACE', `${metrics.speech_pace_wpm} WPM`],
                    ['FILLER WORDS', `${metrics.filler_words_count} count`],
                    ['CONFIDENCE', `${metrics.confidence_score}%`],
                    ['CLARITY', `${metrics.clarity_score}%`],
                    ['ENGAGEMENT', `${metrics.engagement_score}%`],
                    ['AUDIO SIGNALS', metrics.duration_seconds ? `${metrics.duration_seconds}s · ${metrics.pause_count ?? 0} pauses` : 'Transcript mode']
                  ].map(([label, value]) => (
                    <div key={label} style={{ padding: '1.25rem', border: '1px solid var(--border-light)', background: '#fff' }}>
                      <div className="font-mono text-muted" style={{ fontSize: '.72rem' }}>{label}</div>
                      <div className="font-display" style={{ fontSize: '1.75rem', fontWeight: 900, marginTop: '0.3rem' }}>{value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: '1rem 1.25rem', border: '1px solid var(--border-light)', background: '#fff', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <strong>Filler Word Breakdown:</strong> {metrics.filler_words_list || 'None detected (0)'}
                </div>

                {/* AI FEEDBACK SECTION */}
                {metrics.ai_feedback && (
                  <div style={{ background: '#111827', color: '#fff', border: '1px solid #1f2937', padding: '1.5rem', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #374151', paddingBottom: '0.75rem' }}>
                      <div className="font-mono text-red" style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.1em' }}>
                        AI VOCAL & RHETORICAL COACHING FEEDBACK
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontFamily: 'monospace' }}>
                        LIVE EVALUATION
                      </span>
                    </div>

                    <div style={{ fontSize: '0.88rem', lineHeight: '1.6', color: '#e5e7eb', whiteSpace: 'pre-line' }}>
                      {metrics.ai_feedback}
                    </div>

                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #374151', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {selectedSession?.status === 'Active' && (
                        <button
                          disabled={updatingStatus}
                          onClick={() => handleToggleSessionStatus('Completed')}
                          className="btn btn-red"
                          style={{ fontSize: '0.78rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
                        >
                          {updatingStatus ? 'SAVING…' : '✓ END & SAVE SESSION'}
                        </button>
                      )}
                      <Link
                        href="/dashboard"
                        className="btn btn-dark"
                        style={{ fontSize: '0.78rem', padding: '0.5rem 1rem', textDecoration: 'none', display: 'inline-block' }}
                      >
                        VIEW IN ANALYTICS DASHBOARD →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '3.5rem 2rem', border: '1px dashed var(--border-light)', textAlign: 'center', color: 'var(--text-muted)', background: '#fafafa' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎙️</div>
                <h3 style={{ fontSize: '1.1rem', color: '#18181b', marginBottom: '0.5rem' }}>Awaiting Presentation Input</h3>
                <p style={{ maxWidth: '400px', margin: '0 auto', fontSize: '0.85rem' }}>
                  Select a debate session and click <strong>Analyze Speech Transcript</strong> or upload an audio recording to compute instant vocal metrics and AI coaching feedback.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
