'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import Navigation from '@/components/Navigation';
import { getSession, getUserStats, getWorkouts, getGoals, getTodayNutrition, getWaterToday } from '@/lib/storage';
import { getRandomMotivationalQuote } from '@/lib/visionEngine';

const StatCard = ({ label, value, sub, icon, color = 'red', delay = 0, trend }) => {
  const [displayVal, setDisplayVal] = useState(0);
  const target = typeof value === 'number' ? value : (parseFloat(value) || 0);

  useEffect(() => {
    if (target === 0) { setDisplayVal(0); return; }
    let start = 0;
    const duration = 900;
    const steps = 40;
    const increment = target / steps;
    let count = 0;
    const timer = setInterval(() => {
      count++;
      start = Math.min(start + increment, target);
      setDisplayVal(Math.round(start));
      if (count >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  const colors = {
    red: { bg: 'rgba(201,8,42,0.1)', border: 'rgba(201,8,42,0.2)', text: 'var(--color-red-bright)', glow: 'rgba(201,8,42,0.15)' },
    gold: { bg: 'rgba(232,184,0,0.1)', border: 'rgba(232,184,0,0.2)', text: 'var(--color-gold)', glow: 'rgba(232,184,0,0.12)' },
    cyan: { bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.2)', text: 'var(--color-cyan)', glow: 'rgba(0,212,255,0.1)' },
    green: { bg: 'rgba(0,230,118,0.08)', border: 'rgba(0,230,118,0.2)', text: 'var(--color-green)', glow: 'rgba(0,230,118,0.1)' },
  };
  const c = colors[color];

  return (
    <div
      className={`card card-hover animate-slide-up delay-${delay}`}
      style={{ background: `linear-gradient(135deg, ${c.bg} 0%, rgba(8,12,28,0.8) 100%)`, border: `1px solid ${c.border}`, boxShadow: `0 8px 32px ${c.glow}` }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: 42, height: 42, borderRadius: '10px', background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.text }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span style={{ fontSize: '0.72rem', color: trend > 0 ? 'var(--color-green)' : trend === 0 ? 'var(--text-muted)' : 'var(--color-red-bright)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
            {trend > 0 ? '↑' : trend === 0 ? '→' : '↓'} {trend !== 0 ? `${Math.abs(trend)}%` : 'flat'}
          </span>
        )}
      </div>
      <div style={{ marginTop: '1.1rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.4rem', fontWeight: 800, color: c.text, lineHeight: 1, letterSpacing: '-0.02em' }}>
          {target === 0
            ? <span style={{ opacity: 0.3, fontSize: '1.6rem' }}>—</span>
            : <>{displayVal.toLocaleString()}{sub && <span style={{ fontSize: '1.2rem', opacity: 0.8 }}>{sub}</span>}</>}
        </div>
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 700, marginTop: '0.5rem' }}>
          {label}
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: '1px', background: `linear-gradient(90deg, transparent, ${c.border}, transparent)` }}/>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(8,12,28,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: '0.3rem', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

const MacroRing = ({ label, value, max, color, unit = 'g' }) => {
  const pct = Math.min((value / max) * 100, 100);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
      <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5"/>
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>{value}{unit}</div>
      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>{label}</div>
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [water, setWater] = useState(0);
  const [quote, setQuote] = useState(null);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const session = getSession();
    if (!session) { router.push('/'); return; }
    setUser(session);

    const s = getUserStats(session.id);
    setStats(s);
    setRecentWorkouts(getWorkouts(session.id).slice(0, 5));
    setGoals(getGoals(session.id).slice(0, 3));
    setWater(getWaterToday(session.id));
    setQuote(getRandomMotivationalQuote());

    const tick = () => setCurrentTime(new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  if (!user || !stats) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.15em' }}>LOADING ATP...</div>
        </div>
      </div>
    );
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const waterGoal = 3000;
  const waterPct = Math.min((water / waterGoal) * 100, 100);

  const workoutCategories = ['Strength', 'Cardio', 'HIIT', 'Combat', 'Flexibility'];
  const categoryColors = { Strength: 'var(--color-red-bright)', Cardio: 'var(--color-cyan)', HIIT: 'var(--color-gold)', Combat: '#ff6b6b', Flexibility: 'var(--color-green)' };

  return (
    <div className="app-layout">
      <Navigation />
      <main className="page-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div className="animate-slide-up">
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-red)', fontFamily: 'var(--font-mono)', marginBottom: '0.3rem' }}>
              {greeting()}, Agent
            </div>
            <h1 className="page-title" style={{ fontSize: '2rem' }}>
              {user.name || 'Unknown Agent'}
              <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 300, marginLeft: '0.5rem', fontSize: '1.2rem' }}>
                / {user.heroClass}
              </span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Mission day {stats.totalWorkouts > 0 ? stats.totalWorkouts : '—'} · {stats.streak} day streak active
            </p>
          </div>
          <div className="animate-fade-in" style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: 'var(--color-cyan)', letterSpacing: '0.1em' }}>{currentTime}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.15em', fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginTop: '0.2rem' }}>
              {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          <StatCard label="Total Sessions" value={stats.totalWorkouts} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6.5 6.5h11M6.5 12h11M6.5 17.5h11M2 6.5h1M2 12h1M2 17.5h1"/></svg>} color="red" delay={1} trend={12} />
          <StatCard label="Calories Burned" value={stats.totalCaloriesBurned} sub="" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>} color="gold" delay={2} trend={8} />
          <StatCard label="Day Streak" value={stats.streak} sub="d" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>} color="cyan" delay={3} trend={0} />
          <StatCard label="Goals Achieved" value={stats.completedGoals} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>} color="green" delay={4} />
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', marginBottom: '1.25rem' }}>
          {/* Weekly Activity */}
          <div className="card animate-slide-up delay-2">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '0.04em' }}>Weekly Performance</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>Training sessions & calories burned</p>
              </div>
              <span className="badge badge-cyan">Last 7 Days</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={stats.weeklyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-red)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-red)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-gold)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--color-gold)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip />}/>
                <Area type="monotone" dataKey="calories" name="Calories" stroke="var(--color-gold)" strokeWidth={2} fill="url(#goldGrad)" dot={false}/>
                <Area type="monotone" dataKey="workouts" name="Sessions" stroke="var(--color-red)" strokeWidth={2} fill="url(#redGrad)" dot={{ fill: 'var(--color-red)', r: 3 }}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Today's Nutrition Summary */}
          <div className="card animate-slide-up delay-3">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', letterSpacing: '0.04em' }}>Today's Fuel</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => router.push('/nutrition')}>Log →</button>
            </div>

            {/* Calorie Ring */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <svg width="110" height="110" viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="55" cy="55" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"/>
                  <circle cx="55" cy="55" r="45" fill="none" stroke="var(--color-red)" strokeWidth="8"
                    strokeDasharray={`${(Math.min(stats.todayCalories / 2200, 1)) * 2 * Math.PI * 45} 999`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1.2s ease', filter: 'drop-shadow(0 0 6px rgba(201,8,42,0.5))' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-red-bright)', lineHeight: 1 }}>{stats.todayCalories}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>/ 2200 kcal</div>
                </div>
              </div>
            </div>

            {/* Macros */}
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <MacroRing label="Protein" value={stats.todayProtein} max={150} color="var(--color-cyan)"/>
              <MacroRing label="Carbs" value={stats.todayCarbs} max={250} color="var(--color-gold)"/>
              <MacroRing label="Fat" value={stats.todayFat} max={70} color="var(--color-red-bright)"/>
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 280px', gap: '1.25rem' }}>
          {/* Recent Workouts */}
          <div className="card animate-slide-up delay-3">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', letterSpacing: '0.04em' }}>Recent Missions</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => router.push('/workouts')}>View all →</button>
            </div>
            {recentWorkouts.length === 0 ? (
              <div className="empty-state">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6.5 6.5h11M6.5 12h11M6.5 17.5h11M2 6.5h1M2 12h1M2 17.5h1"/></svg>
                <h3>No missions logged</h3>
                <p>Start your first training session to build momentum.</p>
                <button className="btn btn-primary btn-sm" onClick={() => router.push('/workouts')}>Log Workout</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {recentWorkouts.map((w, i) => (
                  <div key={w.id} className="achievement-card" style={{ animationDelay: `${i * 0.07}s` }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '8px', flexShrink: 0,
                      background: `${categoryColors[w.category] || 'var(--color-red)'}20`,
                      border: `1px solid ${categoryColors[w.category] || 'var(--color-red)'}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.9rem',
                    }}>
                      {w.category === 'Strength' ? '🏋️' : w.category === 'Cardio' ? '🏃' : w.category === 'HIIT' ? '⚡' : w.category === 'Combat' ? '🥊' : '🧘'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(w.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })} · {w.duration}min · {w.caloriesBurned} kcal
                      </div>
                    </div>
                    <span className="badge" style={{ borderRadius: '6px', background: `${categoryColors[w.category] || 'var(--color-red)'}15`, color: categoryColors[w.category] || 'var(--color-red)', border: `1px solid ${categoryColors[w.category] || 'var(--color-red)'}30`, fontSize: '0.65rem' }}>
                      {w.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Goals */}
          <div className="card animate-slide-up delay-4">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', letterSpacing: '0.04em' }}>Active Missions</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => router.push('/goals')}>Manage →</button>
            </div>
            {goals.length === 0 ? (
              <div className="empty-state">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <h3>No mission objectives</h3>
                <p>Set targets to stay on mission and track progress.</p>
                <button className="btn btn-primary btn-sm" onClick={() => router.push('/goals')}>Set Goal</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {goals.map((g, i) => {
                  const pct = Math.min((g.progress / g.target) * 100, 100);
                  return (
                    <div key={g.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{g.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{g.progress} / {g.target} {g.unit}</div>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: pct >= 100 ? 'var(--color-green)' : 'var(--color-gold)', fontWeight: 700 }}>
                          {Math.round(pct)}%
                        </span>
                      </div>
                      <div className={`progress-bar ${pct >= 100 ? 'progress-green' : 'progress-gold'}`}>
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Water & Quote */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Water */}
            <div className="card animate-slide-up delay-5" style={{ border: '1px solid rgba(0,212,255,0.15)', background: 'linear-gradient(135deg, rgba(0,212,255,0.05) 0%, rgba(8,12,28,0.8) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '0.04em' }}>Hydration</h2>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--color-cyan)', fontWeight: 700 }}>{water}ml</div>
              </div>
              <div className="progress-bar progress-cyan">
                <div className="progress-fill" style={{ width: `${waterPct}%` }}/>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>0ml</span>
                <span style={{ color: 'var(--color-cyan)', opacity: 0.7 }}>{Math.round(waterPct)}%</span>
                <span>{(waterGoal/1000).toFixed(1)}L goal</span>
              </div>
              <button className="btn btn-ghost btn-sm w-full" style={{ marginTop: '0.75rem', borderColor: 'rgba(0,212,255,0.2)', color: 'var(--color-cyan)' }} onClick={() => router.push('/nutrition')}>
                + Add Water
              </button>
            </div>

            {/* Quote */}
            {quote && (
              <div className="card animate-slide-up delay-6" style={{ background: 'linear-gradient(135deg, rgba(232,184,0,0.05) 0%, rgba(8,12,28,0.9) 100%)', border: '1px solid rgba(232,184,0,0.12)', flex: 1 }}>
                <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-gold)', fontFamily: 'var(--font-mono)', marginBottom: '0.75rem' }}>
                  ● Mission Briefing
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{quote.text}"
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-gold)', marginTop: '0.75rem', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
                  — {quote.author}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
