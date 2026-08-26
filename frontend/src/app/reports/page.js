'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, clearAuth, downloadReport, getStoredUser } from '../../lib/api';
import Navbar from '../../components/Navbar';

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [certificateCode, setCertificateCode] = useState('');
  const [verification, setVerification] = useState(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored?.access_token) { router.push('/login'); return; }
    setUser(stored);
    apiFetch('/sessions/user/me').then(items => {
      const list = items || [];
      setSessions(list);
      setSelectedId(list[0]?.id ? String(list[0].id) : '');
    }).catch(err => {
      if (err.status === 401) { clearAuth(); router.push('/login'); return; }
      setError(err.message || 'Unable to load sessions.');
    }).finally(() => setLoading(false));
  }, [router]);

  async function downloadSessionReport(kind, path, filename) {
    if (!selectedId) { setError('Create or select a debate session first.'); return; }
    setBusy(kind); setError('');
    try { await downloadReport(path.replace(':id', selectedId), filename.replace(':id', selectedId)); }
    catch (err) { setError(err.message || 'Download failed.'); }
    finally { setBusy(''); }
  }

  async function downloadCoachingPlan() {
    if (!user?.user_id) return;
    setBusy('coaching'); setError('');
    try { await downloadReport(`/reports/export/coaching/pdf/${user.user_id}`, `coaching-plan-${user.user_id}.pdf`); }
    catch (err) { setError(err.message || 'Coaching-plan download failed.'); }
    finally { setBusy(''); }
  }

  async function issueCertificate() {
    if (!selectedId) { setError('Select a completed, qualifying session first.'); return; }
    setBusy('certificate'); setError('');
    try {
      const result = await apiFetch(`/workflows/certificates/${selectedId}`, { method: 'POST' });
      setCertificate(result);
      setCertificateCode(result.certificate_id || '');
    } catch (err) { setError(err.message || 'Certificate issuance failed.'); }
    finally { setBusy(''); }
  }

  async function verifyCertificate(event) {
    event.preventDefault();
    if (!certificateCode.trim()) { setError('Enter a certificate ID to verify.'); return; }
    setBusy('verify'); setError(''); setVerification(null);
    try { setVerification(await apiFetch(`/workflows/certificates/verify/${encodeURIComponent(certificateCode.trim())}`)); }
    catch (err) { setError(err.message || 'Certificate verification failed.'); }
    finally { setBusy(''); }
  }

  return <><Navbar /><main className="section-container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
    <div className="badge-red-pill">EXPORT & COMPLIANCE ENGINE</div>
    <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1rem' }}>Reports & Certificates</h1>
    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '760px' }}>Download persisted performance scorecards, argument audits, presentation metrics, and coaching plans. Completed qualifying sessions can also issue a verifiable LOGOS.AI certificate.</p>
    {error && <div role="alert" style={{ color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', padding: '.8rem 1rem', marginBottom: '1rem' }}>{error}</div>}
    <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', marginBottom: '2rem', flexWrap: 'wrap' }}><label htmlFor="report-session" style={{ fontWeight: 800 }}>Session</label><select id="report-session" disabled={loading || sessions.length === 0} value={selectedId} onChange={e => { setSelectedId(e.target.value); setCertificate(null); }} style={{ minWidth: '280px', padding: '.75rem', border: '1px solid #d4d4d8' }}><option value="">{loading ? 'Loading sessions…' : sessions.length ? 'Select a session' : 'No sessions available'}</option>{sessions.map(item => <option key={item.id} value={item.id}>{item.title} — {item.status}</option>)}</select></div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
      <article style={{ border: '1px solid var(--border-light)', padding: '1.5rem', background: '#fff' }}><div className="font-mono text-red" style={{ fontSize: '.72rem' }}>DEBATE & SPEECH ANALYSIS</div><h2 style={{ fontSize: '1.25rem' }}>Assessment PDF</h2><p style={{ fontSize: '.85rem', color: 'var(--text-secondary)' }}>Argument analysis, fallacies, scores, and presentation metrics.</p><button disabled={!selectedId || busy} onClick={() => downloadSessionReport('pdf', '/reports/export/pdf/:id', 'assessment-:id.pdf')} className="btn btn-red" style={{ width: '100%', cursor: 'pointer' }}>{busy === 'pdf' ? 'PREPARING…' : 'DOWNLOAD PDF'}</button></article>
      <article style={{ border: '1px solid var(--border-light)', padding: '1.5rem', background: '#fff' }}><div className="font-mono text-red" style={{ fontSize: '.72rem' }}>PERFORMANCE MATRIX</div><h2 style={{ fontSize: '1.25rem' }}>Excel workbook</h2><p style={{ fontSize: '.85rem', color: 'var(--text-secondary)' }}>Five weighted performance dimensions in a true `.xlsx` workbook.</p><button disabled={!selectedId || busy} onClick={() => downloadSessionReport('excel', '/reports/export/excel/:id', 'assessment-:id.xlsx')} className="btn btn-dark" style={{ width: '100%', cursor: 'pointer' }}>{busy === 'excel' ? 'PREPARING…' : 'EXPORT XLSX'}</button></article>
      <article style={{ border: '1px solid var(--border-light)', padding: '1.5rem', background: '#fff' }}><div className="font-mono text-red" style={{ fontSize: '.72rem' }}>COACHING & LEARNING</div><h2 style={{ fontSize: '1.25rem' }}>Coaching plan PDF</h2><p style={{ fontSize: '.85rem', color: 'var(--text-secondary)' }}>Personalized exercises and progress recommendations derived from your history.</p><button disabled={!user || busy} onClick={downloadCoachingPlan} className="btn btn-dark" style={{ width: '100%', cursor: 'pointer' }}>{busy === 'coaching' ? 'PREPARING…' : 'EXPORT PLAN'}</button></article>
      <article style={{ border: '1px solid var(--border-light)', padding: '1.5rem', background: '#fff' }}><div className="font-mono text-red" style={{ fontSize: '.72rem' }}>ACHIEVEMENT CREDENTIAL</div><h2 style={{ fontSize: '1.25rem' }}>Issue certificate</h2><p style={{ fontSize: '.85rem', color: 'var(--text-secondary)' }}>Issue a verifiable certificate for a completed session with an overall score of at least 80.</p><button disabled={!selectedId || busy} onClick={issueCertificate} className="btn btn-red" style={{ width: '100%', cursor: 'pointer' }}>{busy === 'certificate' ? 'ISSUING…' : 'ISSUE CERTIFICATE'}</button>{certificate && <div style={{ marginTop: '.8rem', padding: '.7rem', background: '#fef2f2', fontFamily: 'monospace', fontSize: '.78rem' }}>ID: {certificate.certificate_id}<br />Score: {certificate.score}%</div>}</article>
    </div>
    <section style={{ marginTop: '1.5rem', border: '1px solid var(--border-light)', padding: '1.5rem', background: '#fff' }}><div className="font-mono text-red" style={{ fontSize: '.72rem' }}>PUBLIC VERIFICATION</div><h2 style={{ fontSize: '1.25rem' }}>Verify a certificate</h2><form onSubmit={verifyCertificate} style={{ display: 'flex', gap: '.7rem', flexWrap: 'wrap' }}><input value={certificateCode} onChange={e => setCertificateCode(e.target.value)} placeholder="LOGOS-XXXXXXXXXXXX" style={{ flex: '1 1 280px', padding: '.75rem', border: '1px solid #d4d4d8', fontFamily: 'monospace' }} /><button disabled={busy === 'verify'} className="btn btn-dark" style={{ cursor: 'pointer' }}>{busy === 'verify' ? 'CHECKING…' : 'VERIFY'}</button></form>{verification && <p role="status" style={{ marginBottom: 0, color: verification.valid ? '#166534' : '#991b1b', fontWeight: 800 }}>{verification.valid ? `Valid certificate for ${verification.user_name || 'verified learner'} — score ${verification.score}%` : 'Certificate is not valid or has been revoked.'}</p>}</section>
  </main></>;
}
