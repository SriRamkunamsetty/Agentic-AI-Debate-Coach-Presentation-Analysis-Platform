'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { apiFetch, clearAuth, getStoredUser } from '../../lib/api';

const endpointFor = {
  Learner: (id) => `/dashboards/learner/${id}`,
  'Debate Coach': (id) => `/dashboards/coach/${id}`,
  Educator: (id) => `/dashboards/educator/${id}`,
  Administrator: () => '/dashboards/admin',
};

function Stat({ label, value, hint }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '1.25rem' }}>
      <div style={{ color: '#71717a', fontSize: '.7rem', fontWeight: 800, letterSpacing: '.12em' }}>{label}</div>
      <div style={{ marginTop: '.55rem', fontSize: '2rem', fontWeight: 900 }}>{value}</div>
      {hint && <div style={{ color: '#71717a', fontSize: '.78rem', marginTop: '.3rem' }}>{hint}</div>}
    </div>
  );
}

function ErrorBox({ children }) {
  return children ? (
    <div role="alert" style={{ marginBottom: '1rem', padding: '.8rem 1rem', color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca' }}>
      {children}
    </div>
  ) : null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');
  const [form, setForm] = useState({ title: '', topic: '', assigned_position: 'Affirmative', format: 'Parliamentary Debate' });
  const [creating, setCreating] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ full_name: '', preferred_topics: '', learning_goals: '', coaching_preferences: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);

  // Session Details Modal state
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailActionError, setDetailActionError] = useState('');

  const load = async (current = user) => {
    if (!current?.user_id) return;
    setLoading(true);
    setError('');
    try {
      const [main, currentProfile] = await Promise.all([
        apiFetch(endpointFor[current.role]?.(current.user_id) || endpointFor.Learner(current.user_id)),
        apiFetch('/auth/profile/me'),
      ]);
      setData(main);
      setProfile(currentProfile);
      setProfileForm({
        full_name: currentProfile.full_name || '',
        preferred_topics: currentProfile.preferred_topics || '',
        learning_goals: currentProfile.learning_goals || '',
        coaching_preferences: currentProfile.coaching_preferences || '',
      });
      if (current.role === 'Learner') {
        const [history, received] = await Promise.all([apiFetch('/sessions/user/me'), apiFetch('/feedback/received')]);
        setSessions(history || []);
        setFeedback(received || []);
      }
      if (current.role === 'Administrator') {
        const users = await apiFetch('/auth/admin/users');
        setAdminUsers(users || []);
      }
    } catch (err) {
      if (err.status === 401) {
        clearAuth();
        router.push('/login');
        return;
      }
      setError(err.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const current = getStoredUser();
    if (!current?.access_token || !current?.user_id) {
      router.push('/login');
      return;
    }
    setUser(current);
    load(current);
  }, [router]);

  const learner = user?.role === 'Learner' ? data : null;
  const staff = user && user.role !== 'Learner' ? data : null;
  const sessionCount = useMemo(() => sessions.length, [sessions]);

  async function openSessionDetails(sessionId) {
    setSelectedSessionId(sessionId);
    setLoadingDetail(true);
    setDetailActionError('');
    setSessionDetail(null);
    try {
      const details = await apiFetch(`/sessions/${sessionId}/details`);
      setSessionDetail(details);
    } catch (err) {
      setDetailActionError(err.message || 'Unable to load session details.');
    } finally {
      setLoadingDetail(false);
    }
  }

  async function toggleSessionStatus(sessionId, targetStatus, e) {
    if (e) e.stopPropagation();
    try {
      await apiFetch(`/sessions/${sessionId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: targetStatus }),
      });
      // Refresh list and detail
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, status: targetStatus } : s)));
      if (selectedSessionId === sessionId) {
        setSessionDetail((prev) => (prev ? { ...prev, session: { ...prev.session, status: targetStatus } } : prev));
      }
      await load(user);
    } catch (err) {
      setError(err.message || 'Unable to update session status.');
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSavingProfile(true);
    setError('');
    try {
      const updated = await apiFetch('/auth/profile/me', { method: 'PUT', body: JSON.stringify(profileForm) });
      setProfile(updated);
      setUser((old) => ({ ...old, full_name: updated.full_name }));
      localStorage.setItem('logos_ai_user', JSON.stringify({ ...getStoredUser(), full_name: updated.full_name }));
    } catch (err) {
      setError(err.message || 'Unable to save profile.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function changeUserRole(userId, role) {
    setError('');
    try {
      const updated = await apiFetch(`/auth/admin/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
      setAdminUsers((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err.message || 'Unable to update the user role.');
    }
  }

  async function createSession(event) {
    event.preventDefault();
    setCreating(true);
    setError('');
    try {
      const newSession = await apiFetch('/sessions/create', { method: 'POST', body: JSON.stringify({ ...form, status: 'Active' }) });
      setForm({ title: '', topic: '', assigned_position: 'Affirmative', format: 'Parliamentary Debate' });
      await load(user);
      if (newSession?.id) {
        openSessionDetails(newSession.id);
      }
    } catch (err) {
      setError(err.message || 'Unable to create a session.');
    } finally {
      setCreating(false);
    }
  }

  if (!user || loading) return <main className="section-container" style={{ paddingTop: '3rem' }}>Loading persisted analytics…</main>;

  return (
    <>
      <main className="section-container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1.5rem' }}>
          <div>
            <div className="font-mono text-red" style={{ fontSize: '.72rem' }}>LIVE ANALYTICS // {user.role.toUpperCase()}</div>
            <h1 className="font-display" style={{ margin: '.5rem 0 0', fontSize: 'clamp(2rem, 5vw, 3.4rem)', textTransform: 'uppercase' }}>
              Welcome, {user.full_name || 'Debater'}
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '.4rem' }}>{user.email || ''}</p>
          </div>
          <div style={{ display: 'flex', gap: '.6rem' }}>
            <button onClick={() => load(user)} className="btn btn-dark" style={{ border: 0, cursor: 'pointer' }}>
              REFRESH
            </button>
            <button onClick={() => { clearAuth(); router.push('/login'); }} className="btn btn-login" style={{ cursor: 'pointer' }}>
              LOGOUT
            </button>
          </div>
        </header>

        <ErrorBox>{error}</ErrorBox>

        {learner && (
          <>
            <nav style={{ display: 'flex', gap: '.4rem', overflowX: 'auto', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
              {['overview', 'history', 'settings'].map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  style={{
                    border: 0,
                    borderBottom: tab === item ? '3px solid #dc2626' : '3px solid transparent',
                    background: 'transparent',
                    padding: '.7rem 1rem',
                    cursor: 'pointer',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    fontSize: '.75rem',
                  }}
                >
                  {item}
                </button>
              ))}
            </nav>

            {tab === 'overview' && (
              <>
                <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <Stat label="Debates completed" value={learner.total_debates_completed} />
                  <Stat label="Average score" value={`${learner.average_overall_score}%`} hint="Weighted performance" />
                  <Stat label="Speech pace" value={learner.average_speech_pace_wpm ?? '—'} hint="Words per minute" />
                  <Stat label="Filler words" value={learner.average_filler_words ?? '—'} hint="Average per analysis" />
                  <Stat label="Unread alerts" value={learner.unread_notifications} />
                </section>

                <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, .8fr)', gap: '1.5rem', alignItems: 'start' }}>
                  {/* Recent Sessions List */}
                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Recent sessions</h2>
                      <span style={{ color: '#71717a', fontSize: '.8rem', fontFamily: 'monospace' }}>{sessionCount} total</span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '1.25rem' }}>
                      Click on any session to inspect its detailed <strong>Vocal Metrics, AI Feedback & Debate Analysis</strong>, or complete/reopen it.
                    </p>

                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {sessions.slice(0, 10).map((item) => {
                        const isCompleted = item.status === 'Completed' || item.status === 'Ended';
                        return (
                          <div
                            key={item.id}
                            onClick={() => openSessionDetails(item.id)}
                            style={{
                              border: '1px solid #e5e7eb',
                              borderLeft: `4px solid ${isCompleted ? '#15803d' : '#ea580c'}`,
                              padding: '1rem',
                              background: '#fafafa',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '1rem',
                              transition: 'all 0.15s ease-in-out',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f4f4f5')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#fafafa')}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span className="font-mono" style={{ fontSize: '0.7rem', color: '#71717a' }}>#{item.id}</span>
                                <strong style={{ fontSize: '0.95rem' }}>{item.title}</strong>
                              </div>
                              <div style={{ color: '#71717a', fontSize: '.82rem', marginTop: '.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.topic}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.3rem' }}>
                                {item.format} · Position: {item.assigned_position}
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                              <span
                                style={{
                                  color: isCompleted ? '#15803d' : '#c2410c',
                                  background: isCompleted ? '#ecfdf5' : '#fff7ed',
                                  border: `1px solid ${isCompleted ? '#bbf7d0' : '#fed7aa'}`,
                                  fontWeight: 800,
                                  fontSize: '.72rem',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '3px',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {item.status}
                              </span>

                              {item.status === 'Active' ? (
                                <button
                                  onClick={(e) => toggleSessionStatus(item.id, 'Completed', e)}
                                  className="btn btn-dark"
                                  style={{ fontSize: '0.68rem', padding: '0.25rem 0.6rem', cursor: 'pointer' }}
                                >
                                  End Session
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => toggleSessionStatus(item.id, 'Active', e)}
                                  className="btn"
                                  style={{ fontSize: '0.68rem', padding: '0.25rem 0.6rem', border: '1px solid #d4d4d8', background: '#fff', cursor: 'pointer' }}
                                >
                                  Reopen
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {sessions.length === 0 && <p style={{ color: '#71717a', padding: '1rem 0' }}>No persisted sessions yet.</p>}
                    </div>
                  </div>

                  {/* Create Session Form */}
                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
                    <h2 style={{ marginTop: 0, fontSize: '1.25rem' }}>Create practice session</h2>
                    <form onSubmit={createSession} style={{ display: 'grid', gap: '.85rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem' }}>SESSION TITLE</label>
                        <input
                          required
                          maxLength={200}
                          value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                          placeholder="e.g. AI Ethics & Governance Debate"
                          style={{ width: '100%', padding: '.75rem', border: '1px solid #d4d4d8', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem' }}>DEBATE PROPOSITION / TOPIC</label>
                        <textarea
                          required
                          maxLength={2000}
                          rows={4}
                          value={form.topic}
                          onChange={(e) => setForm({ ...form, topic: e.target.value })}
                          placeholder="e.g. Autonomous AI systems should be held strictly liable for unintended damages."
                          style={{ width: '100%', padding: '.75rem', border: '1px solid #d4d4d8', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem' }}>POSITION</label>
                          <select
                            value={form.assigned_position}
                            onChange={(e) => setForm({ ...form, assigned_position: e.target.value })}
                            style={{ width: '100%', padding: '.75rem', border: '1px solid #d4d4d8', background: '#fff' }}
                          >
                            <option>Affirmative</option>
                            <option>Negative</option>
                            <option>Neutral</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem' }}>FORMAT</label>
                          <select
                            value={form.format}
                            onChange={(e) => setForm({ ...form, format: e.target.value })}
                            style={{ width: '100%', padding: '.75rem', border: '1px solid #d4d4d8', background: '#fff' }}
                          >
                            <option>Parliamentary Debate</option>
                            <option>1-on-1 Debate</option>
                            <option>Oxford Debate</option>
                            <option>Policy Debate</option>
                            <option>Public Forum Debate</option>
                          </select>
                        </div>
                      </div>

                      <button disabled={creating} className="btn btn-red" style={{ border: 0, padding: '.85rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                        {creating ? 'CREATING…' : 'CREATE PRACTICE SESSION'}
                      </button>
                    </form>
                  </div>
                </section>

                <section style={{ marginTop: '1.5rem', background: '#111827', color: '#fff', padding: '1.5rem', borderRadius: '4px' }}>
                  <div className="font-mono text-red" style={{ fontSize: '.7rem', letterSpacing: '0.1em' }}>COACHING ENGINE</div>
                  <h2 style={{ margin: '.4rem 0' }}>{learner.average_overall_score ? 'Personalized coaching plan' : 'Start your baseline assessment'}</h2>
                  <p style={{ color: '#d4d4d8', maxWidth: '760px', lineHeight: '1.5' }}>
                    {(learner.recommended_exercises || []).join(' ') || 'Complete a debate and presentation analysis to generate personalized recommendations.'}
                  </p>
                </section>
              </>
            )}

            {tab === 'history' && (
              <section style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
                <h2 style={{ marginTop: 0 }}>Complete practice history</h2>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1.5rem' }}>
                  Click on any session to review full speech analytics, fallacy detections, and AI opponent responses.
                </p>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {sessions.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => openSessionDetails(item.id)}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderLeft: `4px solid ${item.status === 'Completed' || item.status === 'Ended' ? '#15803d' : '#ea580c'}`,
                        padding: '1rem 1.25rem',
                        cursor: 'pointer',
                        background: '#fafafa',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f4f4f5')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#fafafa')}
                    >
                      <div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span className="font-mono" style={{ fontSize: '0.75rem', color: '#71717a' }}>#{item.id}</span>
                          <strong>{item.title}</strong>
                        </div>
                        <div style={{ color: '#52525b', fontSize: '0.85rem', marginTop: '0.2rem' }}>{item.topic}</div>
                        <small style={{ color: '#71717a' }}>Format: {item.format} · Position: {item.assigned_position}</small>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <span style={{ color: item.status === 'Completed' || item.status === 'Ended' ? '#15803d' : '#b45309', fontWeight: 800, fontSize: '.75rem', textTransform: 'uppercase' }}>
                          {item.status}
                        </span>
                        <button className="btn btn-dark" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
                          Inspect →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {tab === 'settings' && (
              <section style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
                <h2>Profile settings</h2>
                <form onSubmit={saveProfile} style={{ display: 'grid', gap: '.85rem', maxWidth: '720px' }}>
                  {[
                    ['full_name', 'Full name'],
                    ['preferred_topics', 'Preferred topics'],
                    ['learning_goals', 'Learning goals'],
                    ['coaching_preferences', 'Coaching preferences'],
                  ].map(([key, label]) => (
                    <label key={key} style={{ display: 'grid', gap: '.3rem', fontWeight: 700 }}>
                      {label}
                      <input
                        value={profileForm[key]}
                        onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                        style={{ padding: '.75rem', border: '1px solid #d4d4d8', fontWeight: 400 }}
                      />
                    </label>
                  ))}
                  <button disabled={savingProfile} className="btn btn-red" style={{ width: 'fit-content', border: 0, cursor: 'pointer', padding: '0.75rem 1.5rem' }}>
                    {savingProfile ? 'SAVING…' : 'SAVE PROFILE'}
                  </button>
                </form>
                {feedback.length > 0 && (
                  <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
                    <h3>Latest coach feedback</h3>
                    <p style={{ color: '#52525b' }}>{feedback[0].content}</p>
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {staff && (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
            {user.role === 'Debate Coach' && (
              <>
                <Stat label="Learners" value={staff.assigned_students_count} />
                <Stat label="Pending evaluations" value={staff.pending_evaluations} />
                <Stat label="Skill gaps" value={staff.class_skill_gaps?.length || 0} />
              </>
            )}
            {user.role === 'Educator' && (
              <>
                <Stat label="Active classes" value={staff.active_classes} />
                <Stat label="Enrolled learners" value={staff.total_enrolled_students} />
                <Stat label="Class average" value={`${staff.average_class_score}%`} />
              </>
            )}
            {user.role === 'Administrator' && (
              <>
                <Stat label="Platform users" value={staff.platform_users_total} />
                <Stat label="Total sessions" value={staff.sessions_total} />
                <Stat label="Completed sessions" value={staff.completed_sessions_total} />
                <Stat label="AI provider" value={staff.llm_api_health} />
              </>
            )}
            {user.role === 'Administrator' && (
              <div style={{ gridColumn: '1 / -1', background: '#fff', border: '1px solid #e5e7eb', padding: '1.25rem' }}>
                <h2>User role management</h2>
                <p style={{ color: '#71717a' }}>Only administrators can change roles. Your own administrator role cannot be demoted.</p>
                {adminUsers.map((item) => (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 180px', gap: '1rem', alignItems: 'center', borderTop: '1px solid #f1f1f4', padding: '.75rem 0' }}>
                    <div>
                      <strong>{item.full_name}</strong>
                      <div style={{ color: '#71717a', fontSize: '.8rem' }}>
                        {item.email}
                        {item.id === user.user_id ? ' · You' : ''}
                      </div>
                    </div>
                    <select
                      value={item.role}
                      disabled={item.id === user.user_id}
                      onChange={(event) => changeUserRole(item.id, event.target.value)}
                      style={{ padding: '.55rem', border: '1px solid #d4d4d8', background: item.id === user.user_id ? '#f4f4f5' : '#fff' }}
                    >
                      <option>Learner</option>
                      <option>Debate Coach</option>
                      <option>Educator</option>
                      <option>Administrator</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
            <div style={{ gridColumn: '1 / -1', background: '#fff', border: '1px solid #e5e7eb', padding: '1.25rem' }}>
              <h2>Operational detail</h2>
              <pre style={{ whiteSpace: 'pre-wrap', color: '#52525b', fontFamily: 'inherit' }}>{JSON.stringify(staff, null, 2)}</pre>
            </div>
          </section>
        )}
      </main>

      {/* SESSION DETAILS MODAL */}
      {selectedSessionId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '1.5rem',
          }}
          onClick={() => setSelectedSessionId(null)}
        >
          <div
            style={{
              background: '#fff',
              maxWidth: '880px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '4px',
              padding: '2rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  <span className="font-mono text-red" style={{ fontSize: '0.75rem', fontWeight: 800 }}>SESSION #{selectedSessionId}</span>
                  {sessionDetail && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '3px',
                        background: sessionDetail.session.status === 'Completed' || sessionDetail.session.status === 'Ended' ? '#ecfdf5' : '#fff7ed',
                        color: sessionDetail.session.status === 'Completed' || sessionDetail.session.status === 'Ended' ? '#15803d' : '#c2410c',
                        border: `1px solid ${sessionDetail.session.status === 'Completed' || sessionDetail.session.status === 'Ended' ? '#bbf7d0' : '#fed7aa'}`,
                      }}
                    >
                      {sessionDetail.session.status}
                    </span>
                  )}
                </div>
                <h2 style={{ margin: '0.4rem 0 0.2rem', fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase' }}>
                  {sessionDetail?.session.title || 'Session Details'}
                </h2>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>
                  {sessionDetail?.session.topic}
                </p>
              </div>

              <button
                onClick={() => setSelectedSessionId(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            {loadingDetail ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#71717a' }}>Loading session analytics & AI feedback…</div>
            ) : detailActionError ? (
              <ErrorBox>{detailActionError}</ErrorBox>
            ) : sessionDetail ? (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Status Toggle Bar */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                    Format: <strong>{sessionDetail.session.format}</strong> · Position: <strong>{sessionDetail.session.assigned_position}</strong>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {sessionDetail.session.status === 'Active' ? (
                      <button
                        onClick={() => toggleSessionStatus(sessionDetail.session.id, 'Completed')}
                        className="btn btn-red"
                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.9rem', cursor: 'pointer' }}
                      >
                        ✓ Mark as Completed / End Session
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleSessionStatus(sessionDetail.session.id, 'Active')}
                        className="btn btn-dark"
                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.9rem', cursor: 'pointer' }}
                      >
                        ↺ Reopen Session as Active
                      </button>
                    )}
                  </div>
                </div>

                {/* 1. VOCAL & SPEECH METRICS WITH AI FEEDBACK */}
                <div style={{ border: '1px solid #e5e7eb', padding: '1.25rem', background: '#fff' }}>
                  <div className="font-mono text-red" style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                    1. VOCAL METRICS & PRESENTATION ANALYSIS
                  </div>

                  {sessionDetail.latest_presentation_metric ? (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                        {[
                          ['SPEECH PACE', `${sessionDetail.latest_presentation_metric.speech_pace_wpm} WPM`],
                          ['FILLER WORDS', `${sessionDetail.latest_presentation_metric.filler_words_count} count`],
                          ['CONFIDENCE', `${sessionDetail.latest_presentation_metric.confidence_score}%`],
                          ['CLARITY', `${sessionDetail.latest_presentation_metric.clarity_score}%`],
                          ['ENGAGEMENT', `${sessionDetail.latest_presentation_metric.engagement_score}%`],
                        ].map(([lbl, val]) => (
                          <div key={lbl} style={{ background: '#f8fafc', padding: '0.85rem', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>{lbl}</div>
                            <div style={{ fontSize: '1.35rem', fontWeight: 900, marginTop: '0.2rem' }}>{val}</div>
                          </div>
                        ))}
                      </div>

                      {/* AI FEEDBACK BLOCK */}
                      {sessionDetail.latest_presentation_metric.ai_feedback && (
                        <div style={{ background: '#0f172a', color: '#f8fafc', padding: '1.25rem', borderRadius: '4px', marginTop: '0.75rem' }}>
                          <div className="font-mono text-red" style={{ fontSize: '0.72rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                            🤖 AI COACHING & VOCAL EVALUATION
                          </div>
                          <div style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#e2e8f0', whiteSpace: 'pre-line' }}>
                            {sessionDetail.latest_presentation_metric.ai_feedback}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ color: '#71717a', fontSize: '0.85rem', margin: '0.5rem 0' }}>
                      No vocal analysis performed for this session yet.{' '}
                      <Link href="/presentation" style={{ color: 'var(--accent-red)', fontWeight: 700, textDecoration: 'underline' }}>
                        Run Vocal Metrics Analysis →
                      </Link>
                    </p>
                  )}
                </div>

                {/* 2. PERFORMANCE SCORE MATRIX */}
                {sessionDetail.performance_score && (
                  <div style={{ border: '1px solid #e5e7eb', padding: '1.25rem', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div className="font-mono text-red" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                        2. WEIGHTED PERFORMANCE SCORE
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent-red)' }}>
                        {sessionDetail.performance_score.overall_weighted_score}%
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
                      {[
                        ['Argument Quality (30%)', sessionDetail.performance_score.argument_quality],
                        ['Evidence Use (20%)', sessionDetail.performance_score.evidence_use],
                        ['Logic & Consistency (20%)', sessionDetail.performance_score.logical_consistency],
                        ['Rebuttal Effectiveness (15%)', sessionDetail.performance_score.rebuttal_effectiveness],
                        ['Communication Skills (15%)', sessionDetail.performance_score.communication_skills],
                      ].map(([lbl, val]) => (
                        <div key={lbl} style={{ padding: '0.6rem', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                          <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>{lbl}</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.15rem' }}>{val}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. AI SIMULATION TURNS */}
                {sessionDetail.simulation_turns?.length > 0 && (
                  <div style={{ border: '1px solid #e5e7eb', padding: '1.25rem', background: '#fff' }}>
                    <div className="font-mono text-red" style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                      3. LIVE DEBATE SIMULATION TURNS ({sessionDetail.simulation_turns.length})
                    </div>

                    <div style={{ display: 'grid', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto' }}>
                      {sessionDetail.simulation_turns.map((turn, idx) => (
                        <div key={idx} style={{ background: '#0e0e12', color: '#fff', padding: '0.85rem', borderRadius: '4px', fontSize: '0.82rem' }}>
                          <div style={{ color: '#38bdf8', marginBottom: '0.2rem' }}>
                            <strong>Turn #{turn.turn_index} You:</strong> {turn.user_argument}
                          </div>
                          <div style={{ color: '#f87171', marginTop: '0.4rem' }}>
                            <strong>AI Opponent ({turn.opponent_persona}):</strong> {turn.opponent_rebuttal}
                          </div>
                          {turn.coaching_tip && (
                            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.4rem', borderTop: '1px solid #27272a', paddingTop: '0.3rem' }}>
                              💡 Coaching Tip: {turn.coaching_tip}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                  <Link href="/presentation" className="btn btn-dark" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                    Open in Vocal Metrics
                  </Link>
                  <Link href="/simulation" className="btn btn-red" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                    Open in AI Simulation
                  </Link>
                  <Link href="/reports" className="btn" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', border: '1px solid #d4d4d8' }}>
                    Export PDF / Excel
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
