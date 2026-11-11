"use client";

import Link from 'next/link';
import { API_BASE } from '../lib/api';

export default function Footer() {
  const docsUrl = `${API_BASE.replace(/\/api\/v1\/?$/, '')}/docs`;

  return (
    <footer className="footer">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
        <img 
          src="/logo.png" 
          alt="LOGOS.AI" 
          style={{ width: '22px', height: '22px', borderRadius: '6px', objectFit: 'cover' }} 
        />
        <span>LOGOS.AI</span>
      </div>
      <div>© 2026 RHETORICAL INTELLIGENCE SYSTEMS. ALL RIGHTS RESERVED.</div>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link href="/about">ABOUT</Link>
        <Link href="/arena">ARENA</Link>
        <Link href="/drills">DRILLS</Link>
        <a href={docsUrl} target="_blank" rel="noreferrer">API_DOCS</a>
        <span>SYSTEM_STATUS: 100% OPERATIONAL</span>
      </div>
    </footer>
  );
}
