'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navigation from '@/components/Navigation';
import { getSession, updateUserProfile, getUserStats, getWorkouts, clearSession } from '@/lib/storage';
import { useToast } from '@/components/Toast';

const HERO_CLASSES = ['Soldier', 'Strategist', 'Engineer', 'Sorcerer', 'Assassin', 'Berserker', 'Guardian', 'Speedster', 'Marksman', 'Recruit'];
const HERO_CLASS_META = {
  Soldier: { desc: 'Peak physical conditioning. Close combat specialist.', color: 'var(--color-red-bright)', icon: '🛡️' },
  Strategist: { desc: 'Tactical genius. Plans before power.', color: 'var(--color-cyan)', icon: '🧠' },
  Engineer: { desc: 'Tech-augmented. Builds solutions.', color: 'var(--color-gold)', icon: '⚙️' },
  Sorcerer: { desc: 'Reality manipulation. Arcane mastery.', color: '#a29bfe', icon: '✨' },
  Assassin: { desc: 'Silent. Precise. Lethal.', color: '#fd79a8', icon: '🗡️' },
  Berserker: { desc: 'Unbridled strength. Raw power.', color: '#ff6b6b', icon: '💪' },
  Guardian: { desc: 'Protects allies. Absorbs damage.', color: 'var(--color-green)', icon: '🏰' },
  Speedster: { desc: 'Lightning reflexes. Extreme agility.', color: '#fdcb6e', icon: '⚡' },
  Marksman: { desc: 'Pinpoint accuracy. Long-range specialist.', color: 'var(--color-cyan)', icon: '🎯' },
  Recruit: { desc: 'New to the program. High potential.', color: 'var(--text-secondary)', icon: '⭐' },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(8,12,28,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color: p.fill, fontWeight: 600 }}>{p.name}: {p.value}</div>)}
    </div>
  );
};

export default function ProfilePage() {
  const router = useRouter();
  const showToast = useToast();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const session = getSession();
    if (!session) { router.push('/'); return; }
    setUser(session);
    setForm({ name: session.name || '', heroClass: session.heroClass || 'Recruit', bio: session.bio || '', weight: session.weight || '', height: session.height || '', age: session.age || '' });
    setStats(getUserStats(session.id));
    setWorkouts(getWorkouts(session.id));
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const updated = updateUserProfile(user.id, form);
    setUser(updated);
    setEditing(false);
    showToast('Profile updated!', 'success');
  };

  const handleLogout = () => {
    clearSession();
    router.push('/');
  };

  if (!user || !stats) {
    return <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" style={{ width: 40, height: 40 }}/></div>;
  }

  const classMeta = HERO_CLASS_META[user.heroClass] || HERO_CLASS_META.Recruit;
  const catData = ['Strength', 'Cardio', 'HIIT', 'Combat', 'Flexibility'].map(cat => ({
    name: cat,
    count: workouts.filter(w => w.category === cat).length,
    calories: workouts.filter(w => w.category === cat).reduce((s, w) => s + (w.caloriesBurned || 0), 0),
  }));

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const monthStr = d.toLocaleDateString('en', { month: 'short' });
    const count = workouts.filter(w => {
      const wd = new Date(w.date);
      return wd.getMonth() === d.getMonth() && wd.getFullYear() === d.getFullYear();
    }).length;
    return { month: monthStr, sessions: count };
  });

  return (
    <div className="app-layout">
      <Navigation />
      <main className="page-content">
        {/* Hero Banner */}
        <div className="card animate-slide-up" style={{
          marginBottom: '1.5rem',
          padding: '2rem',
          background: 'linear-gradient(135deg, rgba(201,8,42,0.12) 0%, rgba(8,12,28,0.9) 50%, rgba(232,184,0,0.08) 100%)',
          border: `1px solid ${classMeta.color}30`,
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Background pattern */}
          <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: `${classMeta.color}08`, border: `1px solid ${classMeta.color}15` }}/>
          <div style={{ position: 'absolute', right: -10, top: -10, width: 140, height: 140, borderRadius: '50%', background: `${classMeta.color}05`, border: `1px solid ${classMeta.color}10` }}/>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', position: 'relative' }}>
            {/* Avatar */}
            <div style={{ flexShrink: 0 }}>
              <div style={{
                width: 90, height: 90, borderRadius: '50%',
                background: `linear-gradient(135deg, var(--color-red) 0%, var(--color-gold) 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.2rem', fontWeight: 800, color: 'white',
                boxShadow: `0 0 30px ${classMeta.color}40, 0 8px 24px rgba(0,0,0,0.4)`,
                border: `3px solid ${classMeta.color}50`,
                fontFamily: 'var(--font-display)',
              }}>
                {user.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '1.4rem' }}>{classMeta.icon}</div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.25em', color: classMeta.color, fontFamily: 'var(--font-mono)', marginBottom: '0.25rem' }}>
                Agent Profile
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, letterSpacing: '0.03em', lineHeight: 1.1 }}>{user.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
                <span className="badge" style={{ background: `${classMeta.color}15`, color: classMeta.color, border: `1px solid ${classMeta.color}35`, fontSize: '0.7rem' }}>
                  {user.heroClass || 'Recruit'}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{classMeta.desc}</span>
              </div>
              {user.bio && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.6rem', lineHeight: 1.5 }}>{user.bio}</p>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
              <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => setEditing(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit Profile
              </button>
              <button className="btn btn-ghost" style={{ fontSize: '0.8rem', color: 'var(--color-red)', borderColor: 'rgba(201,8,42,0.2)' }} onClick={handleLogout}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid-4 animate-slide-up delay-1" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Sessions', val: stats.totalWorkouts, color: 'var(--color-red-bright)', icon: '🏋️' },
            { label: 'Calories Burned', val: stats.totalCaloriesBurned.toLocaleString(), color: 'var(--color-gold)', icon: '⚡' },
            { label: 'Best Streak', val: `${stats.streak}d`, color: 'var(--color-cyan)', icon: '🔥' },
            { label: 'Goals Done', val: stats.completedGoals, color: 'var(--color-green)', icon: '✅' },
          ].map(({ label, val, color, icon }) => (
            <div key={label} className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 800, color, lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginTop: '0.35rem' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid-2 animate-slide-up delay-2" style={{ marginBottom: '1.5rem' }}>
          <div className="card">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '0.04em', marginBottom: '1.25rem' }}>Monthly Sessions</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, bottom: 0, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip content={<CustomTooltip />}/>
                <Bar dataKey="sessions" name="Sessions" fill="var(--color-red)" radius={[4,4,0,0]} opacity={0.85}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '0.04em', marginBottom: '1.25rem' }}>Training by Category</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={catData} margin={{ top: 0, right: 0, bottom: 0, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip content={<CustomTooltip />}/>
                <Bar dataKey="count" name="Sessions" fill="var(--color-gold)" radius={[4,4,0,0]} opacity={0.85}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Personal Info Card */}
        <div className="card animate-slide-up delay-3">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '0.04em', marginBottom: '1.25rem' }}>Physical Data</h2>
          <div className="grid-3" style={{ gap: '1rem' }}>
            {[
              { label: 'Age', val: user.age ? `${user.age} yrs` : '—' },
              { label: 'Height', val: user.height ? `${user.height} cm` : '—' },
              { label: 'Weight', val: user.weight ? `${user.weight} kg` : '—' },
              { label: 'Email', val: user.email },
              { label: 'Class', val: user.heroClass || 'Recruit' },
              { label: 'Member Since', val: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en', { month: 'long', year: 'numeric' }) : '—' },
            ].map(({ label, val }) => (
              <div key={label} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginBottom: '0.35rem' }}>{label}</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editing && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditing(false)}>
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">Edit Agent Profile</h2>
              <button className="modal-close" onClick={() => setEditing(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Agent Name</label>
                <input className="form-input" value={form.name} onChange={e => { setForm(f => ({...f, name: e.target.value})); setErrors(er => ({...er, name: null})); }}/>
                {errors.name && <span className="form-error">⚠ {errors.name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Hero Classification</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
                  {HERO_CLASSES.map(c => {
                    const cm = HERO_CLASS_META[c];
                    return (
                      <button key={c} type="button" onClick={() => setForm(f => ({...f, heroClass: c}))} style={{ padding: '0.5rem', borderRadius: '8px', fontSize: '0.7rem', background: form.heroClass === c ? `${cm.color}18` : 'rgba(255,255,255,0.03)', border: `1px solid ${form.heroClass === c ? cm.color + '40' : 'rgba(255,255,255,0.06)'}`, color: form.heroClass === c ? cm.color : 'var(--text-muted)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.04em', transition: 'all 0.15s', lineHeight: 1.3, textAlign: 'center' }}>
                        {cm.icon}<br/>{c}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea className="form-input" placeholder="Tell your story..." value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))} style={{ minHeight: 70 }}/>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {[['age','Age (yrs)','number'],['height','Height (cm)','number'],['weight','Weight (kg)','number']].map(([key, label, type]) => (
                  <div className="form-group" key={key}>
                    <label className="form-label">{label}</label>
                    <input className="form-input" type={type} min="0" value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))} placeholder="—"/>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditing(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
