'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { getSession, getTodayNutrition, addNutritionEntry, deleteNutritionEntry, getWaterToday, setWaterToday, getNutrition } from '@/lib/storage';
import { analyzeImageCalories, searchFood } from '@/lib/visionEngine';
import { useToast } from '@/components/Toast';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout'];

function AddFoodModal({ onClose, onSave }) {
  const [tab, setTab] = useState('manual');
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', mealType: 'Breakfast', serving: '' });
  const [errors, setErrors] = useState({});
  const [searchQ, setSearchQ] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [scanState, setScanState] = useState('idle'); // idle, loading, done, error
  const [scanResult, setScanResult] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Food name required.';
    if (!form.calories || isNaN(form.calories) || Number(form.calories) <= 0) e.calories = 'Valid calories required.';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ ...form, calories: Number(form.calories), protein: Number(form.protein) || 0, carbs: Number(form.carbs) || 0, fat: Number(form.fat) || 0 });
  };

  const handleSearch = (q) => {
    setSearchQ(q);
    if (q.length >= 2) {
      setSuggestions(searchFood(q));
    } else {
      setSuggestions([]);
    }
  };

  const fillFromSuggestion = (item) => {
    setForm({ ...form, name: item.name, calories: String(item.calories), protein: String(item.protein), carbs: String(item.carbs), fat: String(item.fat), serving: item.serving });
    setSuggestions([]);
    setSearchQ('');
  };

  const fillFromScan = () => {
    if (!scanResult) return;
    setForm({ ...form, name: scanResult.name, calories: String(scanResult.calories), protein: String(scanResult.protein), carbs: String(scanResult.carbs), fat: String(scanResult.fat), serving: scanResult.serving });
    setTab('manual');
    setScanResult(null);
  };

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setScanState('error'); return;
    }
    setScanState('loading');
    try {
      const result = await analyzeImageCalories(file);
      setScanResult(result.result);
      setScanState('done');
    } catch {
      setScanState('error');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-container" style={{ maxWidth: 520 }}>
        <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--color-cyan), transparent)' }}/>
        <div className="modal-header">
          <h2 className="modal-title"><span style={{ color: 'var(--color-cyan)' }}>+</span> Log Nutrition</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Scanner / Manual tabs */}
        <div className="tabs" style={{ marginBottom: '1.5rem' }}>
          <button className={`tab ${tab === 'manual' ? 'active' : ''}`} onClick={() => setTab('manual')}>Manual Entry</button>
          <button className={`tab ${tab === 'search' ? 'active' : ''}`} onClick={() => setTab('search')}>Quick Search</button>
          <button className={`tab ${tab === 'scan' ? 'active' : ''}`} onClick={() => setTab('scan')}>Smart Scanner</button>
        </div>

        {tab === 'search' && (
          <div style={{ marginBottom: '1rem', position: 'relative' }}>
            <input className="form-input" placeholder="Search food database..." value={searchQ} onChange={e => handleSearch(e.target.value)} autoFocus/>
            {suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', zIndex: 10, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', marginTop: '0.25rem' }}>
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => fillFromSuggestion(s)} style={{ width: '100%', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '0.875rem', textAlign: 'left' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.serving}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-gold)' }}>
                      {s.calories} kcal
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>P:{s.protein}g C:{s.carbs}g F:{s.fat}g</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searchQ.length >= 2 && suggestions.length === 0 && (
              <div style={{ marginTop: '0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No matches. Try manual entry.</div>
            )}
          </div>
        )}

        {tab === 'scan' && (
          <div style={{ marginBottom: '1rem' }}>
            {scanState === 'idle' && (
              <div
                className={`scanner-upload ${dragging ? 'dragging' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔬</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--color-cyan)', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>SMART CALORIE SCANNER</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Drop a food image or click to upload</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Supports JPG, PNG, WEBP</div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])}/>
              </div>
            )}

            {scanState === 'loading' && (
              <div style={{ padding: '2.5rem', textAlign: 'center', border: '1px dashed rgba(0,212,255,0.3)', borderRadius: '12px', background: 'rgba(0,212,255,0.04)' }}>
                <div style={{ position: 'relative', width: 60, height: 60, margin: '0 auto 1rem' }}>
                  <div className="spinner" style={{ width: 60, height: 60, borderWidth: 3, borderTopColor: 'var(--color-cyan)' }}/>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🔬</div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', color: 'var(--color-cyan)', letterSpacing: '0.08em', fontSize: '0.875rem', marginBottom: '0.4rem' }}>ANALYZING IMAGE</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Identifying nutrients and macros...</div>
              </div>
            )}

            {scanState === 'done' && scanResult && (
              <div style={{ border: '1px solid rgba(0,230,118,0.25)', borderRadius: '12px', background: 'rgba(0,230,118,0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(0,230,118,0.08)', borderBottom: '1px solid rgba(0,230,118,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-green)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
                    ✓ Analysis Complete — {scanResult.confidence}% confidence
                  </span>
                  <span className="badge badge-cyan">{scanResult.tag}</span>
                </div>
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.3rem' }}>{scanResult.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{scanResult.serving} · {scanResult.comment}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '1rem' }}>
                    {[
                      { label: 'Calories', val: scanResult.calories, unit: 'kcal', color: 'var(--color-red-bright)' },
                      { label: 'Protein', val: scanResult.protein, unit: 'g', color: 'var(--color-cyan)' },
                      { label: 'Carbs', val: scanResult.carbs, unit: 'g', color: 'var(--color-gold)' },
                      { label: 'Fat', val: scanResult.fat, unit: 'g', color: '#ff9f43' },
                    ].map(m => (
                      <div key={m.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.5rem' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: m.color }}>{m.val}</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{m.label}<br/>{m.unit}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setScanState('idle'); setScanResult(null); }}>Re-scan</button>
                    <button className="btn btn-primary" style={{ flex: 2 }} onClick={fillFromScan}>Use This Data →</button>
                  </div>
                </div>
              </div>
            )}

            {scanState === 'error' && (
              <div style={{ padding: '1.5rem', border: '1px solid rgba(201,8,42,0.25)', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚠️</div>
                <div style={{ color: 'var(--color-red-bright)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>Could not process the image. Please try a clearer photo.</div>
                <button className="btn btn-secondary" onClick={() => setScanState('idle')}>Try Again</button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Food Item</label>
              <input className="form-input" placeholder="e.g. Grilled Chicken Breast" value={form.name} onChange={e => { setForm(f => ({...f, name: e.target.value})); setErrors(er => ({...er, name: null})); }}/>
              {errors.name && <span className="form-error">⚠ {errors.name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Meal Type</label>
              <select className="form-input" value={form.mealType} onChange={e => setForm(f => ({...f, mealType: e.target.value}))}>
                {MEAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Serving Size</label>
              <input className="form-input" placeholder="e.g. 200g or 1 cup" value={form.serving} onChange={e => setForm(f => ({...f, serving: e.target.value}))}/>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {[
              { key: 'calories', label: 'Calories', unit: 'kcal', color: 'var(--color-red-bright)' },
              { key: 'protein', label: 'Protein', unit: 'g', color: 'var(--color-cyan)' },
              { key: 'carbs', label: 'Carbs', unit: 'g', color: 'var(--color-gold)' },
              { key: 'fat', label: 'Fat', unit: 'g', color: '#ff9f43' },
            ].map(({ key, label, unit, color }) => (
              <div className="form-group" key={key}>
                <label className="form-label" style={{ color }}>{label} ({unit})</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form[key]}
                  onChange={e => { setForm(f => ({...f, [key]: e.target.value})); if (key === 'calories') setErrors(er => ({...er, calories: null})); }}
                  style={{ borderColor: errors[key] ? 'var(--color-red)' : undefined }}
                />
              </div>
            ))}
          </div>
          {errors.calories && <span className="form-error">⚠ {errors.calories}</span>}

          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, background: 'linear-gradient(135deg, #007a9a 0%, #005a75 100%)', boxShadow: '0 4px 20px rgba(0,212,255,0.2)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Log Food
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NutritionPage() {
  const router = useRouter();
  const showToast = useToast();
  const [user, setUser] = useState(null);
  const [todayEntries, setTodayEntries] = useState([]);
  const [water, setWater] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const WATER_GOAL = 3000;
  const CALORIE_GOAL = 2200;

  useEffect(() => {
    const session = getSession();
    if (!session) { router.push('/'); return; }
    setUser(session);
    setTodayEntries(getTodayNutrition(session.id));
    setWater(getWaterToday(session.id));
  }, []);

  const totalCalories = todayEntries.reduce((s, e) => s + (e.calories || 0), 0);
  const totalProtein = todayEntries.reduce((s, e) => s + (e.protein || 0), 0);
  const totalCarbs = todayEntries.reduce((s, e) => s + (e.carbs || 0), 0);
  const totalFat = todayEntries.reduce((s, e) => s + (e.fat || 0), 0);

  const handleSaveFood = (data) => {
    const entry = addNutritionEntry(user.id, data);
    setTodayEntries(prev => [...prev, entry]);
    setShowModal(false);
    showToast('Nutrition logged!', 'success');
  };

  const handleDeleteFood = (id) => {
    deleteNutritionEntry(id);
    setTodayEntries(prev => prev.filter(e => e.id !== id));
    showToast('Entry removed.', 'info');
  };

  const addWater = (amount) => {
    const newAmount = Math.min(water + amount, WATER_GOAL + 500);
    setWater(newAmount);
    setWaterToday(user?.id, newAmount);
    showToast(`+${amount}ml water logged`, 'success');
  };

  const waterPct = Math.min((water / WATER_GOAL) * 100, 100);
  const caloriePct = Math.min((totalCalories / CALORIE_GOAL) * 100, 100);

  const mealGroups = MEAL_TYPES.reduce((acc, t) => {
    acc[t] = todayEntries.filter(e => e.mealType === t);
    return acc;
  }, {});

  const MacroBar = ({ label, value, max, color, unit = 'g' }) => {
    const pct = Math.min((value / max) * 100, 100);
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
          <span style={{ color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{value}{unit} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/ {max}{unit}</span></span>
        </div>
        <div className="progress-bar" style={{ height: 8 }}>
          <div style={{ height: '100%', borderRadius: '100px', width: `${pct}%`, background: color, transition: 'width 1s ease', boxShadow: `0 0 8px ${color}60` }}/>
        </div>
      </div>
    );
  };

  return (
    <div className="app-layout">
      <Navigation />
      <main className="page-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div className="animate-slide-up">
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)', marginBottom: '0.3rem' }}>Fuel Log</div>
            <h1 className="page-title">Nutrition Center</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button className="btn btn-primary animate-slide-up" style={{ background: 'linear-gradient(135deg, #007a9a 0%, #005a75 100%)', boxShadow: '0 4px 20px rgba(0,212,255,0.2)' }} onClick={() => setShowModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Log Food
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem', marginBottom: '1.25rem' }}>
          {/* Macros Overview */}
          <div className="card animate-slide-up delay-1">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', marginBottom: '1.25rem', letterSpacing: '0.04em' }}>Today's Macros</h2>

            {/* Calorie Arc */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="65" cy="65" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10"/>
                  <circle cx="65" cy="65" r="54" fill="none" stroke={caloriePct > 100 ? 'var(--color-red-bright)' : 'var(--color-gold)'} strokeWidth="10"
                    strokeDasharray={`${(caloriePct/100)*2*Math.PI*54} 999`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 8px ${caloriePct > 100 ? 'rgba(201,8,42,0.4)' : 'rgba(232,184,0,0.4)'})` }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-gold)', lineHeight: 1 }}>{totalCalories}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>kcal</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>of {CALORIE_GOAL}</div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <MacroBar label="Protein" value={totalProtein} max={150} color="var(--color-cyan)"/>
                <MacroBar label="Carbohydrates" value={totalCarbs} max={250} color="var(--color-gold)"/>
                <MacroBar label="Fat" value={totalFat} max={70} color="#ff9f43"/>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              {[
                { label: 'Calories', val: totalCalories, unit: 'kcal', color: 'var(--color-gold)' },
                { label: 'Protein', val: totalProtein, unit: 'g', color: 'var(--color-cyan)' },
                { label: 'Carbs', val: totalCarbs, unit: 'g', color: '#a29bfe' },
                { label: 'Fat', val: totalFat, unit: 'g', color: '#ff9f43' },
              ].map(m => (
                <div key={m.label} style={{ textAlign: 'center', padding: '0.75rem 0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 800, color: m.color }}>{m.val}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.15rem' }}>{m.label}<br/>{m.unit}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Water Tracker */}
          <div className="card animate-slide-up delay-2" style={{ border: '1px solid rgba(0,212,255,0.15)', background: 'linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(8,12,28,0.9) 100%)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', marginBottom: '1.25rem', letterSpacing: '0.04em', color: 'var(--color-cyan)' }}>Hydration Station</h2>

            {/* Visual Cup */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{ position: 'relative', width: 80, height: 110 }}>
                <div style={{ width: '100%', height: '100%', border: '2px solid rgba(0,212,255,0.5)', borderTop: 'none', borderRadius: '0 0 20px 20px', overflow: 'hidden', background: 'rgba(0,212,255,0.05)', position: 'relative' }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${waterPct}%`, background: 'linear-gradient(180deg, rgba(0,212,255,0.5) 0%, rgba(0,150,200,0.7) 100%)', transition: 'height 0.6s ease', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '4px' }}>
                    {waterPct > 20 && <div style={{ width: '60%', height: 4, background: 'rgba(255,255,255,0.3)', borderRadius: 2, animation: 'water-wave 2s linear infinite' }}/>}
                  </div>
                </div>
                <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-cyan)', whiteSpace: 'nowrap' }}>
                  {Math.round(waterPct)}%
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-cyan)' }}>{water}ml</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>of {WATER_GOAL}ml daily goal</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {[150, 250, 350, 500].map(ml => (
                <button key={ml} onClick={() => addWater(ml)} className="btn btn-secondary" style={{ borderColor: 'rgba(0,212,255,0.2)', color: 'var(--color-cyan)', fontSize: '0.8rem', padding: '0.55rem' }}>
                  +{ml}ml
                </button>
              ))}
            </div>

            <button className="btn btn-ghost btn-sm w-full" style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }} onClick={() => { setWater(0); setWaterToday(user?.id, 0); }}>
              Reset intake
            </button>
          </div>
        </div>

        {/* Today's Food Log */}
        <div className="card animate-slide-up delay-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', letterSpacing: '0.04em' }}>Today's Food Log</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(true)}>+ Add Entry</button>
          </div>

          {todayEntries.length === 0 ? (
            <div className="empty-state">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
              <h3>No nutrition logged today</h3>
              <p>Track your meals to maintain peak performance as an Avenger.</p>
              <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #007a9a 0%, #005a75 100%)' }} onClick={() => setShowModal(true)}>Log First Meal</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {MEAL_TYPES.filter(t => mealGroups[t]?.length > 0).map(mealType => (
                <div key={mealType}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {mealType}
                    <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }}/>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--color-gold)', opacity: 0.8 }}>
                      {mealGroups[mealType].reduce((s, e) => s + (e.calories || 0), 0)} kcal
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {mealGroups[mealType].map(entry => (
                      <div key={entry.id} className="achievement-card">
                        <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                          🍽️
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {entry.serving && `${entry.serving} · `}P:{entry.protein}g · C:{entry.carbs}g · F:{entry.fat}g
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: 'var(--color-gold)' }}>{entry.calories}</div>
                          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>kcal</div>
                        </div>
                        <button onClick={() => handleDeleteFood(entry.id)} className="btn-icon" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showModal && <AddFoodModal onClose={() => setShowModal(false)} onSave={handleSaveFood} />}
    </div>
  );
}
