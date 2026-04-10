'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { getSession, getWorkouts, addWorkout, deleteWorkout } from '@/lib/storage';
import { useToast } from '@/components/Toast';

const CATEGORIES = ['Strength', 'Cardio', 'HIIT', 'Combat', 'Flexibility'];
const CATEGORY_META = {
  Strength: { emoji: '🏋️', color: 'var(--color-red-bright)', bg: 'rgba(201,8,42,0.1)', border: 'rgba(201,8,42,0.25)' },
  Cardio:   { emoji: '🏃', color: 'var(--color-cyan)',       bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.2)' },
  HIIT:     { emoji: '⚡', color: 'var(--color-gold)',       bg: 'rgba(232,184,0,0.08)',  border: 'rgba(232,184,0,0.2)' },
  Combat:   { emoji: '🥊', color: '#ff6b6b',                  bg: 'rgba(255,107,107,0.08)', border: 'rgba(255,107,107,0.2)' },
  Flexibility: { emoji: '🧘', color: 'var(--color-green)',  bg: 'rgba(0,230,118,0.08)', border: 'rgba(0,230,118,0.2)' },
};

const PRESET_EXERCISES = {
  Strength: ['Bench Press', 'Deadlift', 'Squat', 'Overhead Press', 'Pull-ups', 'Barbell Row', 'Dips', 'Lunges', 'Hip Thrust'],
  Cardio: ['Running', 'Cycling', 'Swimming', 'Jump Rope', 'Elliptical', 'Rowing Machine', 'Stair Climbing'],
  HIIT: ['Burpees', 'Mountain Climbers', 'Box Jumps', 'Battle Ropes', 'Kettlebell Swings', 'Sprint Intervals'],
  Combat: ['Boxing Rounds', 'Sparring', 'Bag Work', 'Shadow Boxing', 'Grappling', 'Kickboxing', 'MMA Drills'],
  Flexibility: ['Yoga Flow', 'Stretching', 'Foam Rolling', 'Mobility Drills', 'Pilates', 'Balance Work'],
};

function WorkoutModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    category: 'Strength',
    exercises: [{ name: '', sets: '', reps: '', weight: '' }],
    duration: '',
    caloriesBurned: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Workout name is required.';
    if (!form.duration || isNaN(form.duration) || form.duration <= 0) e.duration = 'Enter a valid duration (minutes).';
    if (!form.caloriesBurned || isNaN(form.caloriesBurned) || form.caloriesBurned <= 0) e.caloriesBurned = 'Enter estimated calories burned.';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ ...form, duration: Number(form.duration), caloriesBurned: Number(form.caloriesBurned), date: new Date(form.date).toISOString() });
  };

  const addExercise = () => setForm(f => ({ ...f, exercises: [...f.exercises, { name: '', sets: '', reps: '', weight: '' }] }));
  const removeExercise = (i) => setForm(f => ({ ...f, exercises: f.exercises.filter((_, idx) => idx !== i) }));
  const updateExercise = (i, k, v) => setForm(f => ({ ...f, exercises: f.exercises.map((ex, idx) => idx === i ? { ...ex, [k]: v } : ex) }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-container" style={{ maxWidth: 580 }}>
        <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--color-red), transparent)' }}/>
        <div className="modal-header">
          <h2 className="modal-title">
            <span style={{ color: 'var(--color-red)' }}>+</span> Log Training Session
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Session Name</label>
              <input className="form-input" placeholder="Morning Power Session" value={form.name} onChange={e => { setForm(f => ({...f, name: e.target.value})); setErrors(er => ({...er, name: null})); }}/>
              {errors.name && <span className="form-error">⚠ {errors.name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))}/>
            </div>
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">Category</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => {
                const m = CATEGORY_META[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm(f => ({...f, category: cat}))}
                    style={{
                      padding: '0.4rem 0.9rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
                      fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em',
                      background: form.category === cat ? m.bg : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${form.category === cat ? m.border : 'rgba(255,255,255,0.06)'}`,
                      color: form.category === cat ? m.color : 'var(--text-muted)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {m.emoji} {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exercises */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label">Exercises</label>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addExercise}>+ Add Exercise</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {form.exercises.map((ex, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 80px 32px', gap: '0.4rem', alignItems: 'center' }}>
                  <select
                    className="form-input"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                    value={ex.name}
                    onChange={e => updateExercise(i, 'name', e.target.value)}
                  >
                    <option value="">Select exercise</option>
                    {PRESET_EXERCISES[form.category].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input className="form-input" style={{ fontSize: '0.8rem', padding: '0.5rem 0.5rem', textAlign: 'center' }} placeholder="Sets" type="number" min="1" value={ex.sets} onChange={e => updateExercise(i, 'sets', e.target.value)}/>
                  <input className="form-input" style={{ fontSize: '0.8rem', padding: '0.5rem 0.5rem', textAlign: 'center' }} placeholder="Reps" type="number" min="1" value={ex.reps} onChange={e => updateExercise(i, 'reps', e.target.value)}/>
                  <input className="form-input" style={{ fontSize: '0.8rem', padding: '0.5rem 0.5rem', textAlign: 'center' }} placeholder="kg/min" value={ex.weight} onChange={e => updateExercise(i, 'weight', e.target.value)}/>
                  {form.exercises.length > 1 && (
                    <button type="button" onClick={() => removeExercise(i)} style={{ width: 28, height: 28, borderRadius: '6px', background: 'rgba(201,8,42,0.1)', border: '1px solid rgba(201,8,42,0.2)', color: 'var(--color-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Duration (minutes)</label>
              <input className="form-input" type="number" placeholder="45" min="1" value={form.duration} onChange={e => { setForm(f => ({...f, duration: e.target.value})); setErrors(er => ({...er, duration: null})); }}/>
              {errors.duration && <span className="form-error">⚠ {errors.duration}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Calories Burned</label>
              <input className="form-input" type="number" placeholder="350" min="1" value={form.caloriesBurned} onChange={e => { setForm(f => ({...f, caloriesBurned: e.target.value})); setErrors(er => ({...er, caloriesBurned: null})); }}/>
              {errors.caloriesBurned && <span className="form-error">⚠ {errors.caloriesBurned}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mission Notes (optional)</label>
            <textarea className="form-input" placeholder="How did the session feel? PRs, struggles, adjustments..." value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} style={{ minHeight: 70 }}/>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Save Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function WorkoutsPage() {
  const router = useRouter();
  const showToast = useToast();
  const [user, setUser] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const session = getSession();
    if (!session) { router.push('/'); return; }
    setUser(session);
    setWorkouts(getWorkouts(session.id));
  }, []);

  const handleSave = (data) => {
    const w = addWorkout(user.id, data);
    setWorkouts(prev => [w, ...prev]);
    setShowModal(false);
    showToast('Training session logged successfully!', 'success');
  };

  const handleDelete = (id) => {
    deleteWorkout(id);
    setWorkouts(prev => prev.filter(w => w.id !== id));
    showToast('Session removed.', 'info');
  };

  const filtered = workouts.filter(w =>
    (filter === 'All' || w.category === filter) &&
    (!search || w.name.toLowerCase().includes(search.toLowerCase()))
  );

  const totalCalories = workouts.reduce((s, w) => s + (w.caloriesBurned || 0), 0);
  const totalDuration = workouts.reduce((s, w) => s + (w.duration || 0), 0);

  return (
    <div className="app-layout">
      <Navigation />
      <main className="page-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div className="animate-slide-up">
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-red)', fontFamily: 'var(--font-mono)', marginBottom: '0.3rem' }}>
              Training Log
            </div>
            <h1 className="page-title">Mission Records</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {workouts.length} sessions · {totalCalories.toLocaleString()} kcal total · {Math.round(totalDuration / 60)}h training time
            </p>
          </div>
          <button className="btn btn-primary animate-slide-up" onClick={() => setShowModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Log Session
          </button>
        </div>

        {/* Category Stats */}
        <div className="grid-5 animate-slide-up delay-1" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => {
            const m = CATEGORY_META[cat];
            const count = workouts.filter(w => w.category === cat).length;
            return (
              <div key={cat} className="card card-hover" style={{ flex: '1 1 140px', padding: '1rem', background: count > 0 ? m.bg : 'rgba(255,255,255,0.02)', border: `1px solid ${count > 0 ? m.border : 'rgba(255,255,255,0.05)'}`, cursor: 'pointer' }} onClick={() => setFilter(filter === cat ? 'All' : cat)}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{m.emoji}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 800, color: count > 0 ? m.color : 'rgba(255,255,255,0.15)', lineHeight: 1 }}>
                  {count > 0 ? count : '—'}
                </div>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginTop: '0.25rem' }}>{cat}</div>
              </div>
            );
          })}
        </div>

        {/* Filters & Search */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input className="form-input" style={{ paddingLeft: '2.4rem' }} placeholder="Search sessions..." value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <div className="tabs" style={{ width: 'auto' }}>
            {['All', ...CATEGORIES].map(cat => (
              <button key={cat} className={`tab ${filter === cat ? 'active' : ''}`} onClick={() => setFilter(cat)} style={{ padding: '0.45rem 0.85rem', fontSize: '0.72rem' }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Workouts List */}
        {filtered.length === 0 ? (
          <div className="card" style={{ marginTop: '1rem' }}>
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M6.5 6.5h11M6.5 12h11M6.5 17.5h11M2 6.5h1M2 12h1M2 17.5h1"/></svg>
              <h3>No sessions found</h3>
              <p>{search ? `No results for "${search}"` : 'Log your first training session to get started.'}</p>
              <button className="btn btn-primary" onClick={() => { setShowModal(true); setSearch(''); setFilter('All'); }}>Log Session</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map((w, i) => {
              const m = CATEGORY_META[w.category] || CATEGORY_META.Strength;
              return (
                <div key={w.id} className="card card-hover animate-slide-up" style={{ animationDelay: `${i * 0.05}s`, padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '12px', background: m.bg, border: `1px solid ${m.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                      {m.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.02em' }}>{w.name}</h3>
                        <span className="badge" style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}`, fontSize: '0.62rem' }}>{w.category}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.78rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {w.duration} min
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                          {w.caloriesBurned} kcal
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          {new Date(w.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        {w.exercises?.filter(e => e.name).length > 0 && (
                          <span style={{ color: 'var(--text-muted)' }}>{w.exercises.filter(e => e.name).length} exercises</span>
                        )}
                      </div>
                      {w.notes && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          "{w.notes}"
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(w.id)}
                      className="btn-icon"
                      style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                      title="Delete session"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>

                  {/* Exercises breakdown */}
                  {w.exercises?.filter(e => e.name).length > 0 && (
                    <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {w.exercises.filter(e => e.name).map((ex, ei) => (
                        <span key={ei} style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                          {ex.name}{ex.sets && ex.reps ? ` · ${ex.sets}×${ex.reps}` : ''}{ex.weight ? ` @ ${ex.weight}` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showModal && <WorkoutModal onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  );
}
