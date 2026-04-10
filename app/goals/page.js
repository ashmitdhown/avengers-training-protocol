'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { getSession, getGoals, addGoal, updateGoal, deleteGoal } from '@/lib/storage';
import { useToast } from '@/components/Toast';

const GOAL_CATEGORIES = [
  { id: 'strength', label: 'Strength', icon: '🏋️', color: 'var(--color-red-bright)', bg: 'rgba(201,8,42,0.1)', border: 'rgba(201,8,42,0.25)' },
  { id: 'cardio', label: 'Endurance', icon: '🏃', color: 'var(--color-cyan)', bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.2)' },
  { id: 'weight', label: 'Body', icon: '⚖️', color: 'var(--color-gold)', bg: 'rgba(232,184,0,0.08)', border: 'rgba(232,184,0,0.2)' },
  { id: 'nutrition', label: 'Nutrition', icon: '🥗', color: 'var(--color-green)', bg: 'rgba(0,230,118,0.08)', border: 'rgba(0,230,118,0.2)' },
  { id: 'sessions', label: 'Sessions', icon: '📋', color: '#a29bfe', bg: 'rgba(162,155,254,0.08)', border: 'rgba(162,155,254,0.2)' },
  { id: 'habit', label: 'Habit', icon: '🎯', color: '#fd79a8', bg: 'rgba(253,121,168,0.08)', border: 'rgba(253,121,168,0.2)' },
];

const UNITS_BY_CATEGORY = {
  strength: ['kg', 'lbs', 'reps'],
  cardio: ['km', 'miles', 'min', 'hours'],
  weight: ['kg', 'lbs', 'kg lost', 'kg gained'],
  nutrition: ['g protein', 'calories', 'meals/week'],
  sessions: ['sessions', 'days/week', 'sessions/month'],
  habit: ['days', 'streak-days', 'times'],
};

const ACHIEVEMENTS = [
  { id: 'first_goal', name: 'First Mission', desc: 'Set your first goal', icon: '🎯', condition: (goals) => goals.length >= 1 },
  { id: 'first_complete', name: 'Mission Accomplished', desc: 'Complete your first goal', icon: '✅', condition: (goals) => goals.some(g => g.completed) },
  { id: 'five_goals', name: 'Strategic Thinker', desc: 'Create 5 goals', icon: '🧠', condition: (goals) => goals.length >= 5 },
  { id: 'three_complete', name: 'Mission Veteran', desc: 'Complete 3 goals', icon: '🏆', condition: (goals) => goals.filter(g => g.completed).length >= 3 },
  { id: 'all_categories', name: 'Full Spectrum', desc: 'Create goals in 4 categories', icon: '🌈', condition: (goals) => new Set(goals.map(g => g.category)).size >= 4 },
  { id: 'habit_master', name: 'Habit Forge', desc: 'Create a habit goal', icon: '🔥', condition: (goals) => goals.some(g => g.category === 'habit') },
];

function GoalModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', category: 'strength', target: '', unit: 'kg', deadline: '', notes: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Goal name is required.';
    if (!form.target || isNaN(form.target) || Number(form.target) <= 0) e.target = 'Set a valid target value.';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ ...form, target: Number(form.target) });
  };

  const catMeta = GOAL_CATEGORIES.find(c => c.id === form.category);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-container" style={{ maxWidth: 500 }}>
        <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: `linear-gradient(90deg, transparent, ${catMeta?.color || 'var(--color-gold)'}, transparent)` }}/>
        <div className="modal-header">
          <h2 className="modal-title"><span style={{ color: 'var(--color-gold)' }}>◎</span> Set Mission Objective</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div className="form-group">
            <label className="form-label">Goal Name</label>
            <input className="form-input" placeholder="e.g. Bench 100kg" value={form.name} onChange={e => { setForm(f => ({...f, name: e.target.value})); setErrors(er => ({...er, name: null})); }}/>
            {errors.name && <span className="form-error">⚠ {errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {GOAL_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: cat.id, unit: UNITS_BY_CATEGORY[cat.id][0] }))}
                  style={{
                    padding: '0.6rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                    background: form.category === cat.id ? cat.bg : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${form.category === cat.id ? cat.border : 'rgba(255,255,255,0.05)'}`,
                    color: form.category === cat.id ? cat.color : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
                  <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Target Value</label>
              <input className="form-input" type="number" min="1" placeholder="100" value={form.target} onChange={e => { setForm(f => ({...f, target: e.target.value})); setErrors(er => ({...er, target: null})); }}/>
              {errors.target && <span className="form-error">⚠ {errors.target}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-input" value={form.unit} onChange={e => setForm(f => ({...f, unit: e.target.value}))}>
                {(UNITS_BY_CATEGORY[form.category] || ['units']).map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Target Date (optional)</label>
            <input className="form-input" type="date" value={form.deadline} onChange={e => setForm(f => ({...f, deadline: e.target.value}))} min={new Date().toISOString().split('T')[0]}/>
          </div>

          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea className="form-input" placeholder="Why is this goal important? What's your plan?" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} style={{ minHeight: 70 }}/>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-gold" style={{ flex: 2 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg>
              Set Objective
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProgressModal({ goal, onClose, onUpdate }) {
  const [progress, setProgress] = useState(goal.progress);
  const catMeta = GOAL_CATEGORIES.find(c => c.id === goal.category);
  const pct = Math.min((progress / goal.target) * 100, 100);
  const r = 50;
  const circ = 2 * Math.PI * r;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-container" style={{ maxWidth: 420 }}>
        <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: `linear-gradient(90deg, transparent, ${catMeta?.color || 'var(--color-gold)'}, transparent)` }}/>
        <div className="modal-header">
          <h2 className="modal-title">Update Progress</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: catMeta?.color }}>{catMeta?.icon} {goal.name}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Target: {goal.target} {goal.unit}</div>
          </div>

          <div style={{ position: 'relative' }}>
            <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10"/>
              <circle cx="65" cy="65" r={r} fill="none" stroke={catMeta?.color || 'var(--color-gold)'} strokeWidth="10"
                strokeDasharray={`${(pct/100)*circ} ${circ}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.4s ease', filter: `drop-shadow(0 0 6px ${catMeta?.color || 'var(--color-gold)'})` }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 800, color: catMeta?.color, lineHeight: 1 }}>{Math.round(pct)}%</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{progress} / {goal.target}</div>
            </div>
          </div>

          <div style={{ width: '100%' }}>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Current Progress ({goal.unit})</label>
            <input
              className="form-input"
              type="number"
              min="0"
              max={goal.target * 2}
              value={progress}
              onChange={e => setProgress(Number(e.target.value))}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary"
              style={{ flex: 2, background: pct >= 100 ? 'linear-gradient(135deg, #00a854, #00e676)' : undefined }}
              onClick={() => onUpdate(progress)}
            >
              {pct >= 100 ? '🏆 Mark Complete!' : 'Update Progress'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const router = useRouter();
  const showToast = useToast();
  const [user, setUser] = useState(null);
  const [goals, setGoals] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const session = getSession();
    if (!session) { router.push('/'); return; }
    setUser(session);
    setGoals(getGoals(session.id));
  }, []);

  const handleAdd = (data) => {
    const g = addGoal(user.id, data);
    setGoals(prev => [...prev, g]);
    setShowAddModal(false);
    showToast('Mission objective set!', 'success');
  };

  const handleUpdateProgress = (progress) => {
    const completed = progress >= editGoal.target;
    const updated = updateGoal(editGoal.id, { progress, completed });
    setGoals(prev => prev.map(g => g.id === editGoal.id ? { ...g, progress, completed } : g));
    setEditGoal(null);
    if (completed) showToast('🏆 Mission Accomplished! Goal completed!', 'success');
    else showToast('Progress updated!', 'success');
  };

  const handleDelete = (id) => {
    deleteGoal(id);
    setGoals(prev => prev.filter(g => g.id !== id));
    showToast('Goal removed.', 'info');
  };

  const filtered = filter === 'all' ? goals :
    filter === 'active' ? goals.filter(g => !g.completed) :
    goals.filter(g => g.completed);

  const completedCount = goals.filter(g => g.completed).length;
  const totalProgress = goals.length > 0 ? goals.reduce((s, g) => s + Math.min(g.progress / g.target, 1), 0) / goals.length * 100 : 0;

  const unlockedAchievements = ACHIEVEMENTS.filter(a => a.condition(goals));

  return (
    <div className="app-layout">
      <Navigation />
      <main className="page-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div className="animate-slide-up">
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-gold)', fontFamily: 'var(--font-mono)', marginBottom: '0.3rem' }}>Mission Control</div>
            <h1 className="page-title">Objective Tracker</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {completedCount} of {goals.length} missions complete · {Math.round(totalProgress)}% overall progress
            </p>
          </div>
          <button className="btn btn-gold animate-slide-up" onClick={() => setShowAddModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Objective
          </button>
        </div>

        {/* Stats */}
        <div className="grid-4 animate-slide-up delay-1" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Goals', val: goals.length, color: 'var(--color-gold)', icon: '◎' },
            { label: 'Completed', val: completedCount, color: 'var(--color-green)', icon: '✓' },
            { label: 'In Progress', val: goals.filter(g => !g.completed && g.progress > 0).length, color: 'var(--color-cyan)', icon: '▶' },
            { label: 'Not Started', val: goals.filter(g => g.progress === 0).length, color: 'var(--text-muted)', icon: '○' },
          ].map(({ label, val, color, icon }) => (
            <div key={label} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', marginBottom: '0.35rem', lineHeight: 1 }}>{icon}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>
                {val === 0 ? <span style={{ opacity: 0.25, fontSize: '1.4rem' }}>—</span> : val}
              </div>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginTop: '0.35rem' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {[{k:'all',label:'All'},{k:'active',label:'Active'},{k:'done',label:'Completed'}].map(opt => (
            <button key={opt.k} onClick={() => setFilter(opt.k)} className={`btn ${filter === opt.k ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Goals Grid */}
        {filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg>
              <h3>No objectives set</h3>
              <p>Define your mission objectives to track progress and stay on target.</p>
              <button className="btn btn-gold" onClick={() => setShowAddModal(true)}>Set First Objective</button>
            </div>
          </div>
        ) : (
          <div className="grid-3 animate-slide-up delay-2">
            {filtered.map((goal, i) => {
              const catMeta = GOAL_CATEGORIES.find(c => c.id === goal.category) || GOAL_CATEGORIES[0];
              const pct = Math.min((goal.progress / goal.target) * 100, 100);
              const r = 40;
              const circ = 2 * Math.PI * r;
              const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000*60*60*24)) : null;

              return (
                <div key={goal.id} className={`card card-hover animate-slide-up`} style={{ animationDelay: `${i * 0.08}s`, borderColor: goal.completed ? 'rgba(0,230,118,0.25)' : catMeta.border, background: goal.completed ? 'rgba(0,230,118,0.04)' : undefined }}>
                  {goal.completed && (
                    <div style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: '50%', background: 'var(--color-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', boxShadow: '0 0 12px rgba(0,230,118,0.4)' }}>✓</div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '12px', background: catMeta.bg, border: `1px solid ${catMeta.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                      {catMeta.icon}
                    </div>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.02em', marginBottom: '0.2rem' }}>{goal.name}</h3>
                      <span className="badge" style={{ background: catMeta.bg, color: catMeta.color, border: `1px solid ${catMeta.border}`, fontSize: '0.6rem' }}>{catMeta.label}</span>
                    </div>
                  </div>

                  {/* Progress Ring */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7"/>
                        <circle cx="45" cy="45" r={r} fill="none" stroke={goal.completed ? 'var(--color-green)' : catMeta.color} strokeWidth="7"
                          strokeDasharray={`${(pct/100)*circ} ${circ}`}
                          strokeLinecap="round"
                          style={{ filter: `drop-shadow(0 0 4px ${goal.completed ? 'rgba(0,230,118,0.4)' : catMeta.bg})` }}
                        />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: goal.completed ? 'var(--color-green)' : catMeta.color, lineHeight: 1 }}>{Math.round(pct)}%</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: catMeta.color }}>{goal.progress}</span>
                        <span style={{ color: 'var(--text-muted)' }}> / {goal.target} {goal.unit}</span>
                      </div>
                      {goal.notes && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.4 }}>"{goal.notes}"</p>}
                      {daysLeft !== null && (
                        <div style={{ fontSize: '0.7rem', marginTop: '0.35rem', color: daysLeft < 7 ? 'var(--color-red-bright)' : daysLeft < 30 ? 'var(--color-gold)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today!' : 'Overdue'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {!goal.completed && (
                    <button className="btn btn-secondary w-full" style={{ fontSize: '0.78rem', marginBottom: '0.5rem', borderColor: catMeta.border, color: catMeta.color }} onClick={() => setEditGoal(goal)}>
                      Update Progress
                    </button>
                  )}
                  <button onClick={() => handleDelete(goal.id)} className="btn btn-ghost w-full" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Achievements */}
        <div className="card animate-slide-up delay-4" style={{ marginTop: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', letterSpacing: '0.04em' }}>Agent Commendations</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.2rem' }}>Unlock achievements by hitting milestones</p>
          </div>
          <div className="grid-3" style={{ gap: '0.75rem' }}>
            {ACHIEVEMENTS.map(ach => {
              const unlocked = unlockedAchievements.includes(ach);
              return (
                <div key={ach.id} className={`achievement-card ${unlocked ? 'unlocked' : ''}`} style={{ opacity: unlocked ? 1 : 0.45 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: unlocked ? 'rgba(232,184,0,0.15)' : 'rgba(255,255,255,0.04)', border: `2px solid ${unlocked ? 'rgba(232,184,0,0.4)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                    {unlocked ? ach.icon : '🔒'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: unlocked ? 'var(--color-gold)' : 'var(--text-muted)' }}>{ach.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ach.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {showAddModal && <GoalModal onClose={() => setShowAddModal(false)} onSave={handleAdd} />}
      {editGoal && <ProgressModal goal={editGoal} onClose={() => setEditGoal(null)} onUpdate={handleUpdateProgress} />}
    </div>
  );
}
