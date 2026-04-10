// lib/storage.js - localStorage data persistence layer

const KEYS = {
  USERS: 'atp_users',
  SESSION: 'atp_session',
  WORKOUTS: 'atp_workouts',
  NUTRITION: 'atp_nutrition',
  WATER: 'atp_water',
  GOALS: 'atp_goals',
  PROFILE: 'atp_profile',
};

// ── AUTH ──────────────────────────────────────────────
export const getUsers = () => {
  try { return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'); }
  catch { return []; }
};

export const saveUser = (user) => {
  const users = getUsers();
  const exists = users.find(u => u.email === user.email);
  if (exists) return { error: 'An agent with this email already exists.' };
  const newUser = { ...user, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  localStorage.setItem(KEYS.USERS, JSON.stringify([...users, newUser]));
  return { user: newUser };
};

export const findUser = (email, password) => {
  const users = getUsers();
  return users.find(u => u.email === email && u.password === password) || null;
};

export const getSession = () => {
  try { return JSON.parse(sessionStorage.getItem(KEYS.SESSION) || 'null'); }
  catch { return null; }
};

export const setSession = (user) => {
  sessionStorage.setItem(KEYS.SESSION, JSON.stringify(user));
};

export const clearSession = () => {
  sessionStorage.removeItem(KEYS.SESSION);
};

export const updateUserProfile = (userId, updates) => {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return;
  users[idx] = { ...users[idx], ...updates };
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  setSession(users[idx]);
  return users[idx];
};

// ── WORKOUTS ──────────────────────────────────────────
export const getWorkouts = (userId) => {
  try {
    const all = JSON.parse(localStorage.getItem(KEYS.WORKOUTS) || '[]');
    return all.filter(w => w.userId === userId).sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch { return []; }
};

export const addWorkout = (userId, workout) => {
  const all = JSON.parse(localStorage.getItem(KEYS.WORKOUTS) || '[]');
  const newWorkout = {
    ...workout,
    id: crypto.randomUUID(),
    userId,
    date: workout.date || new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(KEYS.WORKOUTS, JSON.stringify([...all, newWorkout]));
  return newWorkout;
};

export const deleteWorkout = (workoutId) => {
  const all = JSON.parse(localStorage.getItem(KEYS.WORKOUTS) || '[]');
  localStorage.setItem(KEYS.WORKOUTS, JSON.stringify(all.filter(w => w.id !== workoutId)));
};

// ── NUTRITION ─────────────────────────────────────────
export const getNutrition = (userId) => {
  try {
    const all = JSON.parse(localStorage.getItem(KEYS.NUTRITION) || '[]');
    return all.filter(n => n.userId === userId).sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch { return []; }
};

export const getTodayNutrition = (userId) => {
  const today = new Date().toDateString();
  return getNutrition(userId).filter(n => new Date(n.date).toDateString() === today);
};

export const addNutritionEntry = (userId, entry) => {
  const all = JSON.parse(localStorage.getItem(KEYS.NUTRITION) || '[]');
  const newEntry = {
    ...entry,
    id: crypto.randomUUID(),
    userId,
    date: entry.date || new Date().toISOString(),
  };
  localStorage.setItem(KEYS.NUTRITION, JSON.stringify([...all, newEntry]));
  return newEntry;
};

export const deleteNutritionEntry = (entryId) => {
  const all = JSON.parse(localStorage.getItem(KEYS.NUTRITION) || '[]');
  localStorage.setItem(KEYS.NUTRITION, JSON.stringify(all.filter(n => n.id !== entryId)));
};

// ── WATER ─────────────────────────────────────────────
export const getWaterToday = (userId) => {
  try {
    const all = JSON.parse(localStorage.getItem(KEYS.WATER) || '[]');
    const today = new Date().toDateString();
    const todayEntry = all.find(w => w.userId === userId && w.date === today);
    return todayEntry ? todayEntry.amount : 0;
  } catch { return 0; }
};

export const setWaterToday = (userId, amount) => {
  try {
    const all = JSON.parse(localStorage.getItem(KEYS.WATER) || '[]');
    const today = new Date().toDateString();
    const idx = all.findIndex(w => w.userId === userId && w.date === today);
    if (idx === -1) {
      all.push({ userId, date: today, amount });
    } else {
      all[idx].amount = amount;
    }
    localStorage.setItem(KEYS.WATER, JSON.stringify(all));
  } catch {}
};

// ── GOALS ─────────────────────────────────────────────
export const getGoals = (userId) => {
  try {
    const all = JSON.parse(localStorage.getItem(KEYS.GOALS) || '[]');
    return all.filter(g => g.userId === userId);
  } catch { return []; }
};

export const addGoal = (userId, goal) => {
  const all = JSON.parse(localStorage.getItem(KEYS.GOALS) || '[]');
  const newGoal = {
    ...goal,
    id: crypto.randomUUID(),
    userId,
    createdAt: new Date().toISOString(),
    progress: goal.progress || 0,
    completed: false,
  };
  localStorage.setItem(KEYS.GOALS, JSON.stringify([...all, newGoal]));
  return newGoal;
};

export const updateGoal = (goalId, updates) => {
  const all = JSON.parse(localStorage.getItem(KEYS.GOALS) || '[]');
  const idx = all.findIndex(g => g.id === goalId);
  if (idx === -1) return;
  all[idx] = { ...all[idx], ...updates };
  localStorage.setItem(KEYS.GOALS, JSON.stringify(all));
  return all[idx];
};

export const deleteGoal = (goalId) => {
  const all = JSON.parse(localStorage.getItem(KEYS.GOALS) || '[]');
  localStorage.setItem(KEYS.GOALS, JSON.stringify(all.filter(g => g.id !== goalId)));
};

// ── STATS ─────────────────────────────────────────────
export const getUserStats = (userId) => {
  const workouts = getWorkouts(userId);
  const goals = getGoals(userId);
  const todayNutrition = getTodayNutrition(userId);

  const totalCaloriesBurned = workouts.reduce((s, w) => s + (w.caloriesBurned || 0), 0);
  const totalWorkouts = workouts.length;
  const completedGoals = goals.filter(g => g.completed).length;

  // Calculate streak
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = checkDate.toDateString();
    const hadWorkout = workouts.some(w => new Date(w.date).toDateString() === dateStr);
    if (hadWorkout) { streak++; }
    else if (i > 0) { break; }
  }

  const todayCalories = todayNutrition.reduce((s, n) => s + (n.calories || 0), 0);
  const todayProtein = todayNutrition.reduce((s, n) => s + (n.protein || 0), 0);
  const todayCarbs = todayNutrition.reduce((s, n) => s + (n.carbs || 0), 0);
  const todayFat = todayNutrition.reduce((s, n) => s + (n.fat || 0), 0);

  // Weekly workout data
  const weeklyData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    const dayWorkouts = workouts.filter(w => new Date(w.date).toDateString() === dateStr);
    weeklyData.push({
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      workouts: dayWorkouts.length,
      calories: dayWorkouts.reduce((s, w) => s + (w.caloriesBurned || 0), 0),
    });
  }

  return { totalWorkouts, totalCaloriesBurned, streak, completedGoals, todayCalories, todayProtein, todayCarbs, todayFat, weeklyData };
};
