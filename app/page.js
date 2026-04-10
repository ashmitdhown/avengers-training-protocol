'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { saveUser, findUser, setSession, getSession } from '@/lib/storage';

const ParticleCanvas = dynamic(() => import('@/components/ParticleCanvas'), { ssr: false });

const HERO_CLASSES = [
  'Soldier', 'Strategist', 'Engineer', 'Sorcerer', 'Assassin',
  'Berserker', 'Guardian', 'Speedster', 'Marksman', 'Recruit'
];

const ShieldLogo = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
    <circle cx="30" cy="30" r="28" fill="rgba(201,8,42,0.12)" stroke="rgba(201,8,42,0.5)" strokeWidth="1.5"/>
    <circle cx="30" cy="30" r="21" fill="rgba(201,8,42,0.08)" stroke="rgba(201,8,42,0.35)" strokeWidth="1"/>
    <circle cx="30" cy="30" r="14" fill="rgba(201,8,42,0.15)" stroke="rgba(201,8,42,0.5)" strokeWidth="1.5"/>
    <circle cx="30" cy="30" r="7" fill="var(--color-red)" opacity="0.9"/>
    <path d="M30 8 L52 20 L52 38 L30 52 L8 38 L8 20 Z" fill="none" stroke="rgba(201,8,42,0.2)" strokeWidth="1"/>
  </svg>
);

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', heroClass: 'Recruit' });

  useEffect(() => {
    if (getSession()) router.push('/dashboard');
  }, []);

  const validate = () => {
    const e = {};
    if (mode === 'register' && !form.name.trim()) e.name = 'Codename is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (mode === 'register' && form.password !== form.confirm) e.confirm = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});
    await new Promise(r => setTimeout(r, 800)); // Simulate auth delay

    if (mode === 'login') {
      const user = findUser(form.email, form.password);
      if (!user) {
        setErrors({ general: 'Invalid credentials. Check your email and password.' });
        setLoading(false); return;
      }
      setSession(user);
      router.push('/dashboard');
    } else {
      const result = saveUser({ name: form.name, email: form.email, password: form.password, heroClass: form.heroClass });
      if (result.error) {
        setErrors({ general: result.error });
        setLoading(false); return;
      }
      setSession(result.user);
      router.push('/dashboard');
    }
  };

  const setField = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }));
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <ParticleCanvas />

      {/* HUD overlay elements */}
      <div style={{ position: 'fixed', top: '1.5rem', left: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'rgba(201,8,42,0.4)', letterSpacing: '0.15em', lineHeight: 1.8 }}>
        <div>ATP-SYSTEM v2.4.1</div>
        <div style={{ color: 'rgba(0,212,255,0.3)' }}>STATUS: SECURE</div>
        <div style={{ color: 'rgba(232,184,0,0.3)' }}>● AUTH REQUIRED</div>
      </div>

      <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em', textAlign: 'right', lineHeight: 1.8 }}>
        <div>{new Date().toLocaleDateString('en', {weekday:'short', month:'short', day: 'numeric', year: 'numeric'})}</div>
        <div style={{ color: 'rgba(0,212,255,0.4)' }}>S.H.I.E.L.D. CLASSIFIED</div>
      </div>

      <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {['STRENGTH','CONDITIONING','ENDURANCE','STRATEGY'].map((t, i) => (
          <div key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.2em' }}>{t}</div>
        ))}
      </div>

      {/* Main Auth Card */}
      <div className="animate-slide-up" style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '440px', padding: '0 1.5rem' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="animate-float" style={{ display: 'inline-block', marginBottom: '1rem' }}>
            <ShieldLogo size={60} />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.2em', color: 'white', lineHeight: 1.1 }}>
            AVENGERS
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-red)', letterSpacing: '0.35em', marginTop: '0.25rem' }}>
            TRAINING PROTOCOL
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'rgba(8, 12, 28, 0.92)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '2rem',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(201,8,42,0.08)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top accent line */}
          <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(201,8,42,0.7), transparent)' }} />
          
          {/* Mode Tabs */}
          <div className="tabs" style={{ marginBottom: '1.75rem' }}>
            <button className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setErrors({}); }}>
              Login
            </button>
            <button className={`tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setErrors({}); }}>
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Global error */}
            {errors.general && (
              <div className="toast toast-error" style={{ animation: 'none', position: 'static', maxWidth: '100%' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {errors.general}
              </div>
            )}

            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label">Agent Codename</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. James Rogers"
                    value={form.name}
                    onChange={e => setField('name', e.target.value)}
                  />
                  {errors.name && <span className="form-error"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Hero Classification</label>
                  <select className="form-input" value={form.heroClass} onChange={e => setField('heroClass', e.target.value)}>
                    {HERO_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="agent@shield.gov"
                value={form.email}
                onChange={e => setField('email', e.target.value)}
                autoComplete="email"
              />
              {errors.email && <span className="form-error"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Passphrase</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setField('password', e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              {errors.password && <span className="form-error"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{errors.password}</span>}
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Confirm Passphrase</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={e => setField('confirm', e.target.value)}
                  autoComplete="new-password"
                />
                {errors.confirm && <span className="form-error"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{errors.confirm}</span>}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ marginTop: '0.5rem', width: '100%', position: 'relative' }}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 16, height: 16 }}/> Authenticating...</>
              ) : mode === 'login' ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z"/></svg>
                  Access ATP System
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                  Enlist as Agent
                </>
              )}
            </button>
          </form>

          {/* Bottom accent */}
          <div style={{ position: 'absolute', bottom: 0, left: '30%', right: '30%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '1.25rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
          CLASSIFIED — S.H.I.E.L.D. AUTHORIZED PERSONNEL ONLY
        </p>
      </div>
    </div>
  );
}
