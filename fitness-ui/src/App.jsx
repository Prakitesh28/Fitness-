import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO, subDays } from 'date-fns';
import { Toaster, toast } from 'react-hot-toast';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import PageWrapper from './components/layout/PageWrapper';
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import Skeleton from './components/ui/Skeleton';
import Modal from './components/ui/Modal';
import { useAuthStore } from './store/authStore';
import { createWorkout, getExercises, getWorkoutById, getWorkouts, updateWorkout, addExerciseToWorkout, addSetToExercise, removeExerciseFromWorkout } from './api/workouts';
import { createBodyMetric, getBodyMetrics } from './api/metrics';
import { createNutritionLog, getNutritionLogs } from './api/nutrition';
import { getBodyweightTrend, getStreak, getWeeklyVolumeHistory } from './api/stats';
import { changePassword, deleteMe, updateMe } from './api/users';

const accent = '#DC143C';
const accentFill = 'rgba(220,20,60,0.2)';

// Safely compute total session volume (kg) from a workout/session object.
// Returns 0 for null/undefined sessions or when sets are missing.
const sessionVolume = (session) => {
  if (!session) return 0;
  try {
    const sets = session.session_exercises?.flatMap((ex) => ex.sets || []) || [];
    return sets.reduce((sum, set) => sum + (Number(set?.reps) || 0) * (Number(set?.weight_kg) || 0), 0);
  } catch (e) {
    return 0;
  }
};

const getErrorMessage = (error) => {
  if (!error) return 'Request failed';
  if (typeof error === 'string') return error;
  if (error.response?.data) {
    const { data } = error.response;
    if (typeof data === 'string') return data;
    if (data.detail) return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    if (data.message) return typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
    return JSON.stringify(data);
  }
  if (error.message) return error.message;
  return String(error);
};

const Spinner = ({ label }) => {
  const loadingMsgs = [
    'Initialising Batcomputer...',
    "Accessing Gotham's training logs...",
    "The Dark Knight is watching your gains...",
    'Loading',
  ];
  const text = label || loadingMsgs[Math.floor(Math.random() * loadingMsgs.length)];
  return (
    <div className="flex items-center justify-center gap-3 rounded-3xl bg-[var(--surface)] px-6 py-5 text-sm text-[var(--text-secondary)] shadow-lg shadow-[0_0_24px_rgba(220,20,60,0.12)]">
      <div className="h-5 w-5 animate-spin rounded-full border-4 border-[var(--border)] border-t-transparent" />
      <span>{text}</span>
    </div>
  );
};

const ColdStartOverlay = () => {
  return (
    <div className="fixed inset-0 bg-[var(--bg)] flex items-center justify-center z-50">
      <div className="text-center space-y-6">
        <div className="relative w-20 h-20">
          <svg className="absolute inset-0" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth={2} fill="none" className="animate-pulse">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[var(--accent)] font-bold text-2xl">
            <svg className="h-8 w-8 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C9.8 6 4 7 4 10c0 2 4 3 8 3s8-1 8-3c0-3-5.8-4-8-8z"/>
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-semibold text-[var(--accent)]">Waking up the Batcomputer...</h1>
        <p className="text-[var(--text-secondary)] max-w-xl">First load may take up to 15 seconds on free tier</p>
        <div className="w-64 h-2 bg-[var(--surface)] rounded-full overflow-hidden">
          <div className="h-full w-[0%] bg-[var(--accent)] transition-[width] duration-15000 ease-linear" id="coldStartProgress"></div>
        </div>
      </div>
    </div>
  );
};

function Protected({ children }) {
  const { token, loading } = useAuthStore();
  if (loading) return <div className="min-h-screen bg-[var(--bg)] p-10"><Spinner label="Restoring session..." /></div>;
  return token ? children : <Navigate to="/login" replace />;
}

export function AuthPage({ mode }) {
  const navigate = useNavigate();
  const { login, register } = useAuthStore();

  const schema = mode === 'login'
    ? z.object({ email: z.string().email(), password: z.string().min(1) })
    : z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8), confirm: z.string() })
      .refine((data) => data.password === data.confirm, { path: ['confirm'], message: 'Passwords do not match' });

  const { register: rf, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: mode === 'login' ? { email: '', password: '' } : { name: '', email: '', password: '', confirm: '' },
  });

  const onSubmit = async (values) => {
    try {
      if (mode === 'login') {
        await login(values);
        toast.success('Welcome back');
        navigate('/dashboard');
      } else {
        await register({ name: values.name, email: values.email, password: values.password });
        toast.success('Account created, please login');
        navigate('/login');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const quotes = [
    "It's not who I am underneath, but what I do that defines me.",
    'Why do we fall? So we can learn to pick ourselves up.',
    'I am vengeance. I am the night.',
    "The night is darkest just before the dawn.",
    "Everything's impossible until somebody does it.",
    'You either die a hero or you live long enough to see yourself become the villain.',
    'I wear a mask. And that mask is not to hide who I am, but to create what I am.',
  ];
  const quote = useMemo(() => quotes[Math.floor(Math.random() * quotes.length)], []);

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6 text-[var(--text-primary)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:flex-row">
        <div className="space-y-5 rounded-[2rem] border border-[var(--border)] bg-[var(--surface-2)] p-8 text-[var(--text-primary)] shadow-[0_0_40px_rgba(220,20,60,0.1)] sm:w-1/2">
          <p className="sidebar-label">APEX</p>
          <h1 className="text-4xl font-semibold text-[var(--accent)]">{mode === 'login' ? 'Welcome Back' : 'Create account'}</h1>
          <p className="text-[var(--text-secondary)]">{mode === 'login' ? 'Sign in to continue tracking workouts, metrics, and nutrition.' : 'Create a secure account and start logging your progress today.'}</p>
          <div className="space-y-3 text-sm text-[var(--text-secondary)]/90">
            <p>• JWT auth with FastAPI backend</p>
            <p>• Live workout persistence</p>
            <p>• Nutrition goals and analytics</p>
          </div>
        </div>

        <Card className="flex-1 py-8 px-6 sm:px-8">
          <h2 className="mb-4 text-2xl font-semibold text-white">{mode === 'login' ? 'Login' : 'Register'}</h2>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {mode !== 'login' && <Input placeholder="Name" {...rf('name')} />}
            <Input placeholder="Email" type="email" {...rf('email')} />
            <Input placeholder="Password" type="password" {...rf('password')} />
            {mode !== 'login' && <Input placeholder="Confirm password" type="password" {...rf('confirm')} />}
            <Button disabled={isSubmitting} className="w-full">{mode === 'login' ? 'Login' : 'Create account'}</Button>
            {Object.values(errors)[0] && <p className="text-sm text-[var(--accent)]">{Object.values(errors)[0].message}</p>}
          </form>
          <div className="mt-6 text-sm text-[var(--text-secondary)]">
            {mode === 'login' ? (
              <p>New here? <button type="button" className="font-semibold text-white underline" onClick={() => navigate('/register')}>Create an account</button></p>
            ) : (
              <p>Already have an account? <button type="button" className="font-semibold text-white underline" onClick={() => navigate('/login')}>Login here</button></p>
            )}
          </div>
          <div className="mt-4 text-sm text-[var(--text-secondary)] italic">"{quote}"</div>
        </Card>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState([]);
  const [trend, setTrend] = useState([]);
  const [streak, setStreak] = useState(0);
  const [volumeHistory, setVolumeHistory] = useState([]);
  const [quickOpen, setQuickOpen] = useState(false);
  const navigate = useNavigate();

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [sessions, bodyTrend, streakData, weeklyVolume] = await Promise.all([
        getWorkouts({ limit: 6 }),
        getBodyweightTrend(30),
        getStreak(),
        getWeeklyVolumeHistory(8),
      ]);
      setWorkouts(sessions);
      setTrend(bodyTrend);
      setStreak(streakData.streak || 0);
      setVolumeHistory(weeklyVolume);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const recentSessions = useMemo(() => workouts.slice(0, 4), [workouts]);
  const todaySession = useMemo(() => workouts.find((session) => session.date === format(new Date(), 'yyyy-MM-dd')), [workouts]);

  const weeklyChartData = useMemo(() => {
    const map = {};
    volumeHistory.forEach((item) => {
      if (!map[item.week]) {
        map[item.week] = { week: item.week, push: 0, pull: 0, legs: 0, core: 0, other: 0 };
      }
      map[item.week][item.muscle_group] = Number(item.total_volume_kg || 0);
    });
    return Object.values(map).sort((a, b) => a.week.localeCompare(b.week));
  }, [volumeHistory]);

  

  if (loading) {
    return (
      <PageWrapper>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="section-label">Dashboard</p>
              <h1 className="mt-3 text-4xl font-semibold text-[var(--accent)]">Live training insights</h1>
              <p className="mt-2 max-w-2xl text-[var(--text-secondary)]">Review your workout streak, bodyweight trend, and weekly volume all in one place.</p>
            </div>
            <Button onClick={() => navigate('/workouts')} className="max-w-xs">View workouts</Button>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-4">
          <Card className="space-y-3 hover:shadow-[0_0_20px_rgba(220,20,60,0.15)] hover:border-[var(--border-strong)]">
            <p className="metric-label">Current streak</p>
            <p className="metric-value">{streak} days</p>
            <p className="metric-subtext">Keep your fitness habit moving.</p>
          </Card>
          <Card className="space-y-3 hover:shadow-[0_0_20px_rgba(220,20,60,0.15)] hover:border-[var(--border-strong)]">
            <p className="metric-label">Sessions tracked</p>
            <p className="metric-value">{workouts.length}</p>
            <p className="metric-subtext">Most recent sessions loaded.</p>
          </Card>
          <Card className="space-y-3 card-highlight">
            <p className="metric-label">Today’s session</p>
            <p className="metric-value">{todaySession ? format(new Date(todaySession.date), 'MMM d') : 'No active session'}</p>
            <p className="metric-subtext">{todaySession ? `${todaySession.session_exercises?.length || 0} exercises` : 'Start a workout to see progress.'}</p>
          </Card>
          <Card className="space-y-3 hover:shadow-[0_0_20px_rgba(220,20,60,0.15)] hover:border-[var(--border-strong)]">
            <p className="metric-label">Recent volume</p>
            <p className="metric-value">{Math.round(recentSessions.reduce((sum, session) => sum + sessionVolume(session), 0))} kg</p>
            <p className="metric-subtext">From the last {recentSessions.length} sessions.</p>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <Card className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-label">Progress</p>
                <h2 className="chart-title text-2xl font-semibold">Bodyweight trend</h2>
              </div>
              <Button onClick={() => navigate('/metrics')} className="rounded-full px-5 py-2">Track metrics</Button>
            </div>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={trend.map((item) => ({ ...item }))}>
                  <XAxis dataKey="date" tickFormatter={(value) => format(parseISO(value), 'MMM d')} stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip contentStyle={{ background: 'var(--surface)', borderColor: 'var(--border)' }} labelStyle={{ color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                  <Line type="monotone" dataKey="weight_kg" stroke={accent} strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-label">Weekly volume</p>
                <h2 className="chart-title text-2xl font-semibold">Muscle group summary</h2>
              </div>
              <Button onClick={() => navigate('/workouts')} className="rounded-full px-5 py-2">Log workout</Button>
            </div>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={weeklyChartData} margin={{ left: -10, right: -10 }}>
                  <XAxis dataKey="week" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip contentStyle={{ background: 'var(--surface)', borderColor: 'var(--border)' }} labelStyle={{ color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                  <Bar dataKey="push" stackId="a" fill={accent} />
                  <Bar dataKey="pull" stackId="a" fill={accent} />
                  <Bar dataKey="legs" stackId="a" fill={accent} />
                  <Bar dataKey="core" stackId="a" fill={accent} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-label">Recent workouts</p>
                <h2 className="text-xl font-semibold text-white">Latest sessions</h2>
              </div>
              <Button onClick={() => navigate('/workouts')}>All workouts</Button>
            </div>
            <div className="space-y-3">
              {recentSessions.length ? recentSessions.map((session) => (
                <div key={session.id} className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{format(new Date(session.date), 'PPP')}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{session.session_exercises?.length || 0} exercises</p>
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">{Math.round(sessionVolume(session))} kg</div>
                  </div>
                </div>
              )) : <p className="text-[var(--text-secondary)]">No recent workouts yet. Start one to populate this view.</p>}
            </div>
          </Card>

          <Card className="space-y-5">
            <div>
              <p className="section-label">Quick action</p>
              <h2 className="text-xl font-semibold text-white">Start a workout</h2>
            </div>
            <p className="text-[var(--text-secondary)]">Create a workout session and add exercises to log your training.</p>
            <Button onClick={() => setQuickOpen(true)}>Start today session</Button>
          </Card>
        </section>
      </div>
      <Modal open={quickOpen} onClose={() => setQuickOpen(false)} title="Quick Log">
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">Create a new session for today and jump straight into logging.</p>
          <Button onClick={async () => {
            try {
              const session = await createWorkout({ date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
              toast.success('Session created');
              setQuickOpen(false);
              navigate(`/workouts/${session.id}`);
            } catch (error) {
              toast.error(getErrorMessage(error));
            }
          }}>Start session</Button>
        </div>
      </Modal>
    </PageWrapper>
  );
}

export function Workouts() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const loadWorkouts = async () => {
    setLoading(true);
    try {
      setData(await getWorkouts());
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWorkouts(); }, []);

  const handleStart = async () => {
    setCreating(true);
    try {
      const session = await createWorkout({ date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
      toast.success('Workout created');
      navigate(`/workouts/${session.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  const activeSession = data.find((session) => session.date === format(new Date(), 'yyyy-MM-dd'));

  if (loading) return <PageWrapper><Skeleton className="h-32" /></PageWrapper>;

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Workouts</h1>
            <p className="text-[var(--text-secondary)]">Review and continue your saved sessions.</p>
          </div>
          <Button onClick={handleStart} disabled={creating}>{creating ? 'Starting...' : 'Start new session'}</Button>
        </div>

        {activeSession && (
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent)]">Today</p>
                <h2 className="text-2xl font-semibold text-white">Active session</h2>
              </div>
              <Button onClick={() => navigate(`/workouts/${activeSession.id}`)}>Continue session</Button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-[var(--surface)] p-4">
                <p className="text-sm text-[var(--text-secondary)]">Exercises</p>
                <p className="mt-2 text-xl font-semibold text-white">{activeSession.session_exercises?.length || 0}</p>
              </div>
              <div className="rounded-3xl bg-[var(--surface)] p-4">
                <p className="text-sm text-[var(--text-secondary)]">Volume</p>
                <p className="mt-2 text-xl font-semibold text-white">{Math.round(sessionVolume(activeSession) || 0)} kg</p>
              </div>
              <div className="rounded-3xl bg-[var(--surface)] p-4">
                <p className="text-sm text-[var(--text-secondary)]">Date</p>
                <p className="mt-2 text-xl font-semibold text-white">{format(new Date(activeSession.date), 'PPP')}</p>
              </div>
            </div>
          </Card>
        )}

        {data.length === 0 ? (
          <Card>
            <div className="space-y-4">
              <p className="text-lg font-semibold text-white">No sessions yet</p>
              <p className="text-[var(--text-secondary)]">Training is not optional. The city needs its protector.</p>
              <Button onClick={handleStart}>Create first session</Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {data.map((session) => (
              <Card key={session.id} className="overflow-hidden">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xl font-semibold text-white">{format(new Date(session.date), 'PPP')}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{session.session_exercises?.length || 0} exercises · {Math.round(sessionVolume(session))} kg</p>
                  </div>
                  <Button onClick={() => navigate(`/workouts/${session.id}`)}>Open session</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

export function WorkoutSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [sessionType, setSessionType] = useState('Custom');
  const [elapsed, setElapsed] = useState(0);
  const [timers, setTimers] = useState({});
  const autosaveRef = useRef(null);

  const loadSession = async () => {
    setLoading(true);
    try {
      if (id === 'new') {
        const created = await createWorkout({ date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
        navigate(`/workouts/${created.id}`, { replace: true });
        return;
      }
      const [workout, exerciseList] = await Promise.all([getWorkoutById(id), getExercises()]);
      setSession(workout);
      setSessionName(workout.name || `Session ${format(new Date(workout.date), 'PPP')}`);
      setSessionType(workout.type || 'Custom');
      setExercises(exerciseList);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSession(); }, [id]);

  // elapsed timer
  useEffect(() => {
    let interval;
    if (session) {
      const start = Date.now();
      setElapsed(0);
      interval = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    }
    return () => clearInterval(interval);
  }, [session]);

  // autosave notes every 30s
  useEffect(() => {
    if (!session) return undefined;
    autosaveRef.current = setInterval(() => {
      if (session?.notes != null) {
        updateWorkout(session.id, { notes: session.notes }).catch(() => {});
      }
    }, 30000);
    return () => clearInterval(autosaveRef.current);
  }, [session]);

  const addExercise = async (exercise) => {
    // optimistic add
    if (session.session_exercises?.some((e) => e.exercise.id === exercise.id)) {
      toast.error('Exercise already in session');
      return;
    }
    const temp = { id: `tmp-${Date.now()}`, exercise: { ...exercise }, sets: [] };
    setSession((s) => ({ ...s, session_exercises: [...(s.session_exercises || []), temp] }));
    try {
      setSaving(true);
      await addExerciseToWorkout(session.id, { exercise_id: exercise.id, order_index: session.session_exercises?.length || 0 });
      setSession(await getWorkoutById(session.id));
      toast.success('Exercise added');
    } catch (error) {
      toast.error(getErrorMessage(error));
      // rollback
      setSession((s) => ({ ...s, session_exercises: (s.session_exercises || []).filter((e) => e.id !== temp.id) }));
    } finally { setSaving(false); }
  };

  const addSet = async (exercise) => {
    setSaving(true);
    try {
      const defaultSet = (exercise.sets?.at(-1)) || { reps: 10, weight_kg: 20, rpe: null };
      await addSetToExercise(session.id, exercise.exercise.id, {
        set_number: (exercise.sets?.length || 0) + 1,
        reps: defaultSet.reps,
        weight_kg: defaultSet.weight_kg,
        rpe: defaultSet.rpe,
      });
      setSession(await getWorkoutById(session.id));
      toast.success('Set added');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally { setSaving(false); }
  };

  const removeExercise = async (exercise) => {
    if (!confirm('Delete exercise from session?')) return;
    setSaving(true);
    try {
      await removeExerciseFromWorkout(session.id, exercise.exercise.id);
      setSession(await getWorkoutById(session.id));
      toast.success('Exercise removed');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async (event) => {
    try {
      const updated = await updateWorkout(session.id, { notes: event.target.value });
      setSession(updated);
      toast.success('Notes saved');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const filtered = exercises.filter((exercise) => exercise.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8);

  if (loading) return <PageWrapper><Spinner label="Loading session..." /></PageWrapper>;
  if (!session) return <PageWrapper><Card><p className="text-[var(--text-secondary)]">Session not found.</p></Card></PageWrapper>;

  const types = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Custom'];

  const handleSetComplete = (exerciseId, setId, currentSet) => {
    // validate
    if (!currentSet.reps || !currentSet.weight_kg) { toast.error('Fill reps and weight before completing'); return; }
    // mark locally
    setSession((s) => ({
      ...s,
      session_exercises: (s.session_exercises || []).map((ex) => ex.id === exerciseId ? ({
        ...ex,
        sets: (ex.sets || []).map((st) => st.id === setId ? ({ ...st, completed: !st.completed }) : st),
      }) : ex),
    }));
    // start rest timer
    setTimers((t) => ({ ...t, [exerciseId]: { remaining: 90, running: true } }));
  };

  // timers tick
  useEffect(() => {
    const ids = Object.keys(timers);
    if (!ids.length) return undefined;
    const iv = setInterval(() => {
      setTimers((prev) => {
        const next = { ...prev };
        ids.forEach((id) => {
          if (next[id] && next[id].running) {
            next[id].remaining = Math.max(0, next[id].remaining - 1);
            if (next[id].remaining === 0) next[id].running = false;
          }
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [timers]);

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="section-label">Workout session</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <input value={sessionName} onChange={(e) => setSessionName(e.target.value)} onBlur={async () => { try { await updateWorkout(session.id, { name: sessionName }); } catch (e) {} }} className="text-2xl font-semibold bg-transparent text-white outline-none" />
              <div className="flex gap-2 flex-wrap">
                {types.map((t) => (
                  <button key={t} type="button" onClick={() => { setSessionType(t); updateWorkout(session.id, { type: t }).catch(() => {}); }} className={`px-3 py-1 rounded-full text-sm ${sessionType === t ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface)] text-[var(--text-secondary)]'}`}>{t}</button>
                ))}
              </div>
            </div>
            <p className="mt-2 text-[var(--text-secondary)]">{format(new Date(session.date), 'PPP')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-[var(--text-secondary)]">Elapsed</div>
            <div className="rounded-full bg-[var(--surface)] px-4 py-2 text-sm font-mono">{Math.floor(elapsed/60).toString().padStart(2,'0')}:{(elapsed%60).toString().padStart(2,'0')}</div>
            <Button onClick={() => navigate('/workouts')} className="w-full max-w-xs">Back to workouts</Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Notes</p>
                  <p className="text-lg font-semibold text-white">Save session details</p>
                </div>
                <Button disabled={saving} onClick={() => document.getElementById('session-notes')?.focus()}>Edit notes</Button>
              </div>
              <textarea
                id="session-notes"
                className="input-surface h-40 w-full rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
                value={session.notes || ''}
                onChange={(e) => setSession((s) => ({ ...s, notes: e.target.value }))}
                onBlur={saveNotes}
                placeholder="How are you feeling today?"
              />
            </Card>

            {session.session_exercises?.length ? session.session_exercises.map((exercise) => (
              <Card key={exercise.id} className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">{exercise.exercise.name} <span className="text-sm text-[var(--text-secondary)]">· {exercise.exercise.muscle_group}</span></p>
                    <div className="flex gap-2 mt-1">
                      <span className="px-2 py-1 rounded-full bg-[var(--surface-2)] text-xs text-[var(--text-secondary)]">{exercise.exercise.equipment || 'Bodyweight'}</span>
                      <span className="text-sm text-[var(--text-secondary)]">{exercise.last_session ? `Last: ${exercise.last_session}` : ''}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button disabled={saving} onClick={() => addSet(exercise)}>Add set</Button>
                    <Button disabled={saving} className="bg-[var(--accent)] hover:bg-[var(--accent)]" onClick={() => removeExercise(exercise)}>Remove</Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {exercise.sets?.length ? (
                    <div className="grid gap-2">
                      <div className="grid grid-cols-12 gap-2 text-xs text-[var(--text-secondary)] px-2">
                        <div className="col-span-1">#</div>
                        <div className="col-span-3">Reps</div>
                        <div className="col-span-3">Weight</div>
                        <div className="col-span-3">RPE</div>
                        <div className="col-span-2">Done</div>
                      </div>
                      {exercise.sets.map((set) => (
                        <div key={set.id} className={`grid grid-cols-12 gap-2 items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 ${set.completed ? 'bg-green-600/20' : ''}`}>
                          <div className="col-span-1">{set.set_number}</div>
                          <div className="col-span-3"><input type="number" defaultValue={set.reps || ''} onChange={(e) => { const v = Number(e.target.value); setSession((s) => ({ ...s, session_exercises: s.session_exercises.map((ex) => ex.id === exercise.id ? ({ ...ex, sets: ex.sets.map((st) => st.id === set.id ? ({ ...st, reps: v }) : st) }) : ex) })); }} className="w-full rounded-md bg-[var(--surface)] p-2 text-sm" min="1" max="100" /></div>
                          <div className="col-span-3"><input type="number" defaultValue={set.weight_kg || ''} onChange={(e) => { const v = Number(e.target.value); setSession((s) => ({ ...s, session_exercises: s.session_exercises.map((ex) => ex.id === exercise.id ? ({ ...ex, sets: ex.sets.map((st) => st.id === set.id ? ({ ...st, weight_kg: v }) : st) }) : ex) })); }} className="w-full rounded-md bg-[var(--surface)] p-2 text-sm" min="0" max="500" step="0.5" /></div>
                          <div className="col-span-3"><input type="number" defaultValue={set.rpe || ''} onChange={(e) => { const v = Number(e.target.value); setSession((s) => ({ ...s, session_exercises: s.session_exercises.map((ex) => ex.id === exercise.id ? ({ ...ex, sets: ex.sets.map((st) => st.id === set.id ? ({ ...st, rpe: v }) : st) }) : ex) })); }} className="w-full rounded-md bg-[var(--surface)] p-2 text-sm" min="1" max="10" /></div>
                          <div className="col-span-2 flex items-center gap-2"><input type="checkbox" defaultChecked={!!set.completed} onChange={() => handleSetComplete(exercise.id, set.id, set)} />{timers[exercise.id] && timers[exercise.id].running ? <div className="text-xs text-[var(--text-secondary)]">{timers[exercise.id].remaining}s</div> : null}</div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-[var(--text-secondary)]">No sets logged yet.</p>}
                </div>
              </Card>
            )) : (
              <Card>
                <div className="space-y-4">
                      <p className="text-lg font-semibold text-white">No exercises yet</p>
                      <p className="text-[var(--text-secondary)]">Even Batman had his first training session. Start yours.</p>
                </div>
              </Card>
            )}
          </div>

          <Card className="space-y-6">
            <div>
              <p className="section-label">Add exercise</p>
              <h2 className="text-2xl font-semibold text-white">Search the exercise library</h2>
            </div>
            <Input
              placeholder="Search exercises"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="space-y-3">
              {filtered.length ? filtered.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  disabled={saving}
                  className="w-full rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left text-[var(--text-primary)] transition hover:border-[var(--accent)]"
                  onClick={() => addExercise(exercise)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{exercise.name}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{exercise.muscle_group} · {exercise.equipment || 'Bodyweight'}</p>
                    </div>
                    <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Add</span>
                  </div>
                </button>
              )) : (
                <p className="text-[var(--text-secondary)]">Search exercises to add them to this session.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}

export function Metrics() {
  const [range, setRange] = useState('30');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset } = useForm();

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const metrics = await getBodyMetrics({ limit: 1000 });
      setData(metrics);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMetrics(); }, []);

  const sortedData = useMemo(() => [...data].sort((a, b) => new Date(a.date) - new Date(b.date)), [data]);
  const filtered = useMemo(() => (
    range === 'all' ? sortedData : sortedData.filter((item) => new Date(item.date) >= subDays(new Date(), Number(range)))
  ), [sortedData, range]);

  const stats = useMemo(() => {
    const first = filtered[0];
    const last = filtered.at(-1);
    return {
      start: first?.weight_kg,
      current: last?.weight_kg,
      change: first && last ? last.weight_kg - first.weight_kg : null,
      bodyFat: last?.body_fat_pct,
    };
  }, [filtered]);

  const onSubmitMetric = async (values) => {
    try {
      await createBodyMetric({ date: format(new Date(), 'yyyy-MM-dd'), weight_kg: Number(values.weight_kg), body_fat_pct: values.body_fat_pct ? Number(values.body_fat_pct) : null });
      toast.success('Metric logged');
      reset();
      await loadMetrics();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-label">Metrics</p>
            <h1 className="text-3xl font-semibold text-[var(--accent)]">Bodyweight progress</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            {['30', '60', '90', 'all'].map((option) => (
              <button
                key={option}
                type="button"
                className={`rounded-full px-4 py-2 text-sm transition ${range === option ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'}`}
                onClick={() => setRange(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card>
            <p className="metric-label">Current</p>
            <p className="mt-3 text-3xl font-semibold text-white">{stats.current ?? '-'} kg</p>
            <p className="metric-subtext">Latest recorded weight</p>
          </Card>
          <Card>
            <p className="metric-label">Change</p>
            <p className="mt-3 text-3xl font-semibold text-white">{stats.change != null ? `${stats.change.toFixed(1)} kg` : '-'}</p>
            <p className="metric-subtext">Over selected range</p>
          </Card>
          <Card>
            <p className="metric-label">Body fat</p>
            <p className="mt-3 text-3xl font-semibold text-white">{stats.bodyFat != null ? `${stats.bodyFat}%` : '-'}</p>
            <p className="metric-subtext">Most recent value</p>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-label">Trend</p>
                <h2 className="chart-title text-2xl font-semibold">Weight over time</h2>
              </div>
              <Button onClick={loadMetrics} className="rounded-full px-5 py-2">Refresh</Button>
            </div>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={filtered.map((row) => ({ ...row }))}>
                  <defs>
                    <linearGradient id="metric-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={accent} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={accent} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="var(--text-secondary)" tickFormatter={(value) => format(new Date(value), 'MMM d')} />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip contentStyle={{ background: 'var(--surface)', borderColor: 'var(--border)' }} />
                  <Area type="monotone" dataKey="weight_kg" stroke={accent} strokeWidth={3} fill="url(#metric-gradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="space-y-5">
            <div>
              <p className="section-label">Log weight</p>
              <h2 className="chart-title text-2xl font-semibold">Add today's metric</h2>
            </div>
            <form className="grid gap-4" onSubmit={handleSubmit(onSubmitMetric)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input type="number" step="0.1" placeholder="Weight kg" {...register('weight_kg')} />
                <Input type="number" step="0.1" placeholder="Body fat %" {...register('body_fat_pct')} />
              </div>
              <Button>Save metric</Button>
            </form>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}

export function Nutrition() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset } = useForm();
  const { register: goalRegister, handleSubmit: goalSubmit, reset: resetGoals } = useForm({
    defaultValues: {
      calories_goal: user?.calories_goal ?? 2200,
      protein_goal: user?.protein_goal ?? 150,
      carbs_goal: user?.carbs_goal ?? 250,
      fat_goal: user?.fat_goal ?? 70,
    },
  });

  useEffect(() => {
    resetGoals({
      calories_goal: user?.calories_goal ?? 2200,
      protein_goal: user?.protein_goal ?? 150,
      carbs_goal: user?.carbs_goal ?? 250,
      fat_goal: user?.fat_goal ?? 70,
    });
  }, [user]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getNutritionLogs({ limit: 1000 });
      setLogs(data.sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, []);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todaysLogs = logs.filter((item) => item.date === today);
  const todayTotals = todaysLogs.reduce((acc, item) => ({
    calories: acc.calories + item.calories,
    protein_g: acc.protein_g + item.protein_g,
    carbs_g: acc.carbs_g + item.carbs_g,
    fat_g: acc.fat_g + item.fat_g,
  }), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });

  const caloriesSeries = logs.slice(-7).map((item) => ({ date: item.date, calories: item.calories }));

  const onSubmitFood = async (values) => {
    try {
      await createNutritionLog({ date: today, calories: Number(values.calories), protein_g: Number(values.protein_g), carbs_g: Number(values.carbs_g), fat_g: Number(values.fat_g) });
      toast.success('Nutrition logged');
      reset();
      await loadLogs();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const onSaveGoals = async (values) => {
    try {
      const updated = await updateMe({
        calories_goal: Number(values.calories_goal),
        protein_goal: Number(values.protein_goal),
        carbs_goal: Number(values.carbs_goal),
        fat_goal: Number(values.fat_goal),
      });
      useAuthStore.setState({ user: updated });
      toast.success('Nutrition goals updated');
      await loadLogs();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const progress = {
    calories: Math.min(100, Math.round((todayTotals.calories / (user?.calories_goal ?? 2200)) * 100)),
    protein: Math.min(100, Math.round((todayTotals.protein_g / (user?.protein_goal ?? 150)) * 100)),
    carbs: Math.min(100, Math.round((todayTotals.carbs_g / (user?.carbs_goal ?? 250)) * 100)),
    fat: Math.min(100, Math.round((todayTotals.fat_g / (user?.fat_goal ?? 70)) * 100)),
  };

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-label">Nutrition</p>
            <h1 className="text-3xl font-semibold text-[var(--accent)]">Daily nutrition</h1>
          </div>
          <p className="max-w-xl text-sm text-[var(--text-secondary)]">Persist goals and log meals so your dashboard always reflects your progress.</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="space-y-6">
            <div>
              <p className="section-label">Today</p>
              <h2 className="chart-title text-2xl font-semibold">Macro summary</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {['calories', 'protein', 'carbs', 'fat'].map((metric) => {
                const key = metric === 'calories' ? 'calories' : `${metric}_g`;
                const value = todayTotals[key] ?? 0;
                const pct = progress[metric] ?? 0;
                const goalLabel = metric === 'calories' ? (user?.calories_goal ?? 2200) : (user?.[`${metric}_goal`] ?? 0);
                return (
                  <div key={metric} className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-secondary)]">{metric}</p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{value}{metric !== 'calories' ? 'g' : ''}</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
                      <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{pct}% of {goalLabel}{metric === 'calories' ? '' : 'g'}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="space-y-5">
            <div>
              <p className="section-label">Goals</p>
              <h2 className="chart-title text-2xl font-semibold">Edit targets</h2>
            </div>
            <form className="grid gap-4" onSubmit={goalSubmit(onSaveGoals)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input type="number" placeholder="Calories goal" {...goalRegister('calories_goal')} />
                <Input type="number" placeholder="Protein goal" {...goalRegister('protein_goal')} />
                <Input type="number" placeholder="Carbs goal" {...goalRegister('carbs_goal')} />
                <Input type="number" placeholder="Fat goal" {...goalRegister('fat_goal')} />
              </div>
              <Button>Save goals</Button>
            </form>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="space-y-5">
            <div>
              <p className="section-label">Log intake</p>
              <h2 className="chart-title text-2xl font-semibold">Add today's meal</h2>
            </div>
            <form className="grid gap-4" onSubmit={handleSubmit(onSubmitFood)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input type="number" placeholder="Calories" {...register('calories')} />
                <Input type="number" placeholder="Protein (g)" {...register('protein_g')} />
                <Input type="number" placeholder="Carbs (g)" {...register('carbs_g')} />
                <Input type="number" placeholder="Fat (g)" {...register('fat_g')} />
              </div>
              <Button>Save entry</Button>
            </form>
          </Card>

          <Card className="space-y-5">
            <div>
              <p className="section-label">Calories</p>
              <h2 className="text-2xl font-semibold text-white">Last 7 days</h2>
            </div>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={caloriesSeries} margin={{ left: -10, right: -10 }}>
                  <XAxis dataKey="date" stroke="var(--text-secondary)" tickFormatter={(value) => format(new Date(value), 'MMM d')} />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip contentStyle={{ background: 'var(--surface)', borderColor: 'var(--border)' }} />
                  <Bar dataKey="calories" fill={accent} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}

export function Profile() {
  const { user, logout } = useAuthStore();
  const { register: rf, handleSubmit, reset } = useForm({ defaultValues: { name: user?.name, email: user?.email } });
  const { register: pf, handleSubmit: ph } = useForm();
  const navigate = useNavigate();

  useEffect(() => {
    reset({ name: user?.name, email: user?.email });
  }, [user]);

  const onUpdateProfile = async (values) => {
    try {
      const updated = await updateMe(values);
      useAuthStore.setState({ user: updated });
      toast.success('Profile updated');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const onChangePassword = async (values) => {
    try {
      await changePassword({ old_password: values.old_password, new_password: values.new_password });
      toast.success('Password changed');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const onDeleteAccount = async () => {
    const text = prompt('Type DELETE to confirm');
    if (text !== 'DELETE') return;
    try {
      await deleteMe();
      await logout();
      toast.success('Account deleted');
      navigate('/login');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-label">Profile</p>
            <h1 className="text-3xl font-semibold text-[var(--accent)]">Account settings</h1>
          </div>
          <Button onClick={() => navigate('/dashboard')}>Back to dashboard</Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-5">
            <h2 className="chart-title text-2xl font-semibold">Personal details</h2>
            <form className="space-y-4" onSubmit={handleSubmit(onUpdateProfile)}>
              <Input placeholder="Name" {...rf('name')} />
              <Input placeholder="Email" type="email" {...rf('email')} />
              <Button>Save profile</Button>
            </form>
          </Card>

          <Card className="space-y-5">
            <h2 className="chart-title text-2xl font-semibold">Security</h2>
            <form className="space-y-4" onSubmit={ph(onChangePassword)}>
              <Input type="password" placeholder="Old password" {...pf('old_password')} />
              <Input type="password" placeholder="New password" {...pf('new_password')} />
              <Button>Change password</Button>
            </form>
          </Card>
        </div>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-label">Danger zone</p>
              <h2 className="chart-title text-2xl font-semibold">Delete account</h2>
            </div>
            <Button className="bg-[var(--accent)] hover:bg-[var(--accent)]" onClick={onDeleteAccount}>Delete account</Button>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">Deleting your account removes all workouts, metrics, and nutrition data.</p>
        </Card>
      </div>
    </PageWrapper>
  );
}

export default function App() {
  const { hydrate, isDark, setTheme } = useAuthStore();
  const [showColdStart, setShowColdStart] = useState(false);

  useEffect(() => {
    hydrate();
    setTheme(isDark);
  }, []);

  // Update the axios interceptor to show cold start overlay
  useEffect(() => {
    // Store the original response interceptor
    const { interceptors } = require('axios');
    const originalUse = interceptors.response.use;

    // Add request tracking for cold start detection
    let requestTimer = null;

    // Request interceptor to start timer
    interceptors.request.use((config) => {
      requestTimer = setTimeout(() => {
        setShowColdStart(true);
      }, 3000); // Show overlay after 3 seconds
      return config;
    }, (error) => {
      if (requestTimer) {
        clearTimeout(requestTimer);
        requestTimer = null;
      }
      return Promise.reject(error);
    });

    // Response interceptor to hide overlay
    interceptors.response.use(
      (response) => {
        if (requestTimer) {
          clearTimeout(requestTimer);
          requestTimer = null;
        }
        setShowColdStart(false);
        return response;
      },
      (error) => {
        if (requestTimer) {
          clearTimeout(requestTimer);
          requestTimer = null;
        }
        setShowColdStart(false);
        return Promise.reject(error);
      }
    );

    // Keepalive ping is started in main.jsx
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      {showColdStart && <ColdStartOverlay />}
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/workouts" element={<Protected><Workouts /></Protected>} />
        <Route path="/workouts/new" element={<Protected><WorkoutSession /></Protected>} />
        <Route path="/workouts/:id" element={<Protected><WorkoutSession /></Protected>} />
        <Route path="/metrics" element={<Protected><Metrics /></Protected>} />
        <Route path="/nutrition" element={<Protected><Nutrition /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="/looks" element={<Protected><LooksMaxPage /></Protected>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
