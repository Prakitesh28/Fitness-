import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
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

const colors = ['#38bdf8', '#22c55e', '#f59e0b', '#a855f7', '#ec4899'];

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

const Spinner = ({ label = 'Loading' }) => (
  <div className="flex items-center justify-center gap-3 rounded-3xl bg-slate-900/80 px-6 py-5 text-sm text-slate-300 shadow-lg shadow-slate-950/20">
    <div className="h-5 w-5 animate-spin rounded-full border-4 border-slate-700 border-t-transparent" />
    <span>{label}</span>
  </div>
);

function Protected({ children }) {
  const { token, loading } = useAuthStore();
  if (loading) return <div className="min-h-screen bg-slate-950 p-10"><Spinner label="Restoring session..." /></div>;
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

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-xl sm:flex-row">
        <div className="space-y-5 rounded-[2rem] bg-gradient-to-br from-brand-500/70 to-slate-900/70 p-8 text-white shadow-lg shadow-brand-500/20 sm:w-1/2">
          <h1 className="text-4xl font-semibold">{mode === 'login' ? 'Welcome Back' : 'Create account'}</h1>
          <p className="text-slate-200">{mode === 'login' ? 'Sign in to continue tracking workouts, metrics, and nutrition.' : 'Create a secure account and start logging your progress today.'}</p>
          <div className="space-y-3 text-sm text-slate-200/90">
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
            {Object.values(errors)[0] && <p className="text-sm text-rose-400">{Object.values(errors)[0].message}</p>}
          </form>
          <div className="mt-6 text-sm text-slate-400">
            {mode === 'login' ? (
              <p>New here? <button type="button" className="font-semibold text-white underline" onClick={() => navigate('/register')}>Create an account</button></p>
            ) : (
              <p>Already have an account? <button type="button" className="font-semibold text-white underline" onClick={() => navigate('/login')}>Login here</button></p>
            )}
          </div>
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
        <section className="rounded-[2rem] border border-slate-800/70 bg-slate-950/80 p-8 shadow-2xl shadow-slate-950/30">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Dashboard</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Live training insights</h1>
              <p className="mt-2 max-w-2xl text-slate-400">Review your workout streak, bodyweight trend, and weekly volume all in one place.</p>
            </div>
            <Button onClick={() => navigate('/workouts')} className="max-w-xs">View workouts</Button>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-4">
          <Card className="space-y-3">
            <p className="text-sm text-slate-400">Current streak</p>
            <p className="text-3xl font-semibold text-white">{streak} days</p>
            <p className="text-sm text-slate-500">Keep your fitness habit moving.</p>
          </Card>
          <Card className="space-y-3">
            <p className="text-sm text-slate-400">Sessions tracked</p>
            <p className="text-3xl font-semibold text-white">{workouts.length}</p>
            <p className="text-sm text-slate-500">Most recent sessions loaded.</p>
          </Card>
          <Card className="space-y-3">
            <p className="text-sm text-slate-400">Today’s session</p>
            <p className="text-3xl font-semibold text-white">{todaySession ? format(new Date(todaySession.date), 'MMM d') : 'No active session'}</p>
            <p className="text-sm text-slate-500">{todaySession ? `${todaySession.session_exercises?.length || 0} exercises` : 'Start a workout to see progress.'}</p>
          </Card>
          <Card className="space-y-3">
            <p className="text-sm text-slate-400">Recent volume</p>
            <p className="text-3xl font-semibold text-white">{Math.round(recentSessions.reduce((sum, session) => sum + sessionVolume(session), 0))} kg</p>
            <p className="text-sm text-slate-500">From the last {recentSessions.length} sessions.</p>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <Card className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Progress</p>
                <h2 className="text-2xl font-semibold text-white">Bodyweight trend</h2>
              </div>
              <Button onClick={() => navigate('/metrics')} className="rounded-full px-5 py-2">Track metrics</Button>
            </div>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={trend.map((item) => ({ ...item }))}>
                  <XAxis dataKey="date" tickFormatter={(value) => format(parseISO(value), 'MMM d')} stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155' }} />
                  <Line type="monotone" dataKey="weight_kg" stroke={colors[0]} strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Weekly volume</p>
                <h2 className="text-2xl font-semibold text-white">Muscle group summary</h2>
              </div>
              <Button onClick={() => navigate('/workouts')} className="rounded-full px-5 py-2">Log workout</Button>
            </div>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={weeklyChartData} margin={{ left: -10, right: -10 }}>
                  <XAxis dataKey="week" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155' }} />
                  <Bar dataKey="push" stackId="a" fill={colors[0]} />
                  <Bar dataKey="pull" stackId="a" fill={colors[1]} />
                  <Bar dataKey="legs" stackId="a" fill={colors[2]} />
                  <Bar dataKey="core" stackId="a" fill={colors[3]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Recent workouts</p>
                <h2 className="text-xl font-semibold text-white">Latest sessions</h2>
              </div>
              <Button onClick={() => navigate('/workouts')}>All workouts</Button>
            </div>
            <div className="space-y-3">
              {recentSessions.length ? recentSessions.map((session) => (
                <div key={session.id} className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{format(new Date(session.date), 'PPP')}</p>
                      <p className="text-sm text-slate-400">{session.session_exercises?.length || 0} exercises</p>
                    </div>
                    <div className="text-sm text-slate-400">{Math.round(sessionVolume(session))} kg</div>
                  </div>
                </div>
              )) : <p className="text-slate-400">No recent workouts yet. Start one to populate this view.</p>}
            </div>
          </Card>

          <Card className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Quick action</p>
              <h2 className="text-xl font-semibold text-white">Start a workout</h2>
            </div>
            <p className="text-slate-400">Create a workout session and add exercises to log your training.</p>
            <Button onClick={() => setQuickOpen(true)}>Start today session</Button>
          </Card>
        </section>
      </div>
      <Modal open={quickOpen} onClose={() => setQuickOpen(false)} title="Quick Log">
        <div className="space-y-4">
          <p className="text-slate-300">Create a new session for today and jump straight into logging.</p>
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
            <p className="text-slate-400">Review and continue your saved sessions.</p>
          </div>
          <Button onClick={handleStart} disabled={creating}>{creating ? 'Starting...' : 'Start new session'}</Button>
        </div>

        {activeSession && (
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-brand-300">Today</p>
                <h2 className="text-2xl font-semibold text-white">Active session</h2>
              </div>
              <Button onClick={() => navigate(`/workouts/${activeSession.id}`)}>Continue session</Button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-slate-950/80 p-4">
                <p className="text-sm text-slate-400">Exercises</p>
                <p className="mt-2 text-xl font-semibold text-white">{activeSession.session_exercises?.length || 0}</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 p-4">
                <p className="text-sm text-slate-400">Volume</p>
                <p className="mt-2 text-xl font-semibold text-white">{Math.round(sessionVolume(activeSession) || 0)} kg</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 p-4">
                <p className="text-sm text-slate-400">Date</p>
                <p className="mt-2 text-xl font-semibold text-white">{format(new Date(activeSession.date), 'PPP')}</p>
              </div>
            </div>
          </Card>
        )}

        {data.length === 0 ? (
          <Card>
            <div className="space-y-4">
              <p className="text-lg font-semibold text-white">No sessions yet</p>
              <p className="text-slate-400">Create your first workout session to start building progress.</p>
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
                    <p className="text-sm text-slate-400">{session.session_exercises?.length || 0} exercises · {Math.round(sessionVolume(session))} kg</p>
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
      setExercises(exerciseList);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSession(); }, [id]);

  const addExercise = async (exercise) => {
    setSaving(true);
    try {
      await addExerciseToWorkout(session.id, { exercise_id: exercise.id, order_index: session.session_exercises.length });
      setSession(await getWorkoutById(session.id));
      toast.success('Exercise added');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const addSet = async (exercise) => {
    setSaving(true);
    try {
      await addSetToExercise(session.id, exercise.exercise.id, {
        set_number: (exercise.sets?.length || 0) + 1,
        reps: 10,
        weight_kg: 20,
      });
      setSession(await getWorkoutById(session.id));
      toast.success('Set added');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
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
  if (!session) return <PageWrapper><Card><p className="text-slate-300">Session not found.</p></Card></PageWrapper>;

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Workout session</p>
            <h1 className="text-3xl font-semibold text-white">{format(new Date(session.date), 'PPP')}</h1>
            <p className="mt-2 text-slate-400">Add exercises, log sets, and save notes for this session.</p>
          </div>
          <Button onClick={() => navigate('/workouts')} className="w-full max-w-xs">Back to workouts</Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">Notes</p>
                  <p className="text-lg font-semibold text-white">Save session details</p>
                </div>
                <Button disabled={saving} onClick={() => document.getElementById('session-notes')?.focus()}>Edit notes</Button>
              </div>
              <textarea
                id="session-notes"
                className="h-40 w-full rounded-3xl border border-slate-800/80 bg-slate-950/80 p-4 text-slate-100 outline-none transition focus:border-brand-400"
                defaultValue={session.notes || ''}
                onBlur={saveNotes}
                placeholder="Write notes, cues, and progress from this workout."
              />
            </Card>

            {session.session_exercises?.length ? session.session_exercises.map((exercise) => (
              <Card key={exercise.id} className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">{exercise.exercise.name}</p>
                    <p className="text-sm text-slate-400">{exercise.exercise.muscle_group}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button disabled={saving} onClick={() => addSet(exercise)}>Add set</Button>
                    <Button disabled={saving} className="bg-rose-500 hover:bg-rose-400" onClick={() => removeExercise(exercise)}>Remove</Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {exercise.sets?.length ? exercise.sets.map((set) => (
                    <div key={set.id} className="grid grid-cols-[1fr_auto_auto] gap-3 rounded-3xl border border-slate-800/80 bg-slate-950/80 p-4 text-sm text-slate-200">
                      <div>{set.set_number}. {set.reps} reps</div>
                      <div>{set.weight_kg} kg</div>
                      <div>{set.rpe ? `RPE ${set.rpe}` : 'RPE —'}</div>
                    </div>
                  )) : <p className="text-slate-400">No sets logged yet.</p>}
                </div>
              </Card>
            )) : (
              <Card>
                <div className="space-y-4">
                  <p className="text-lg font-semibold text-white">No exercises yet</p>
                  <p className="text-slate-400">Search the library and add movements to build your session.</p>
                </div>
              </Card>
            )}
          </div>

          <Card className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Add exercise</p>
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
                  className="w-full rounded-3xl border border-slate-800/80 bg-slate-950/80 px-4 py-3 text-left text-slate-100 transition hover:border-brand-400"
                  onClick={() => addExercise(exercise)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{exercise.name}</p>
                      <p className="text-sm text-slate-500">{exercise.muscle_group}</p>
                    </div>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">Add</span>
                  </div>
                </button>
              )) : (
                <p className="text-slate-500">Search exercises to add them to this session.</p>
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
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Metrics</p>
            <h1 className="text-3xl font-semibold text-white">Bodyweight progress</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            {['30', '60', '90', 'all'].map((option) => (
              <button
                key={option}
                type="button"
                className={`rounded-full px-4 py-2 text-sm transition ${range === option ? 'bg-brand-500 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
                onClick={() => setRange(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Current</p>
            <p className="mt-3 text-3xl font-semibold text-white">{stats.current ?? '-'} kg</p>
            <p className="mt-2 text-sm text-slate-500">Latest recorded weight</p>
          </Card>
          <Card>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Change</p>
            <p className="mt-3 text-3xl font-semibold text-white">{stats.change != null ? `${stats.change.toFixed(1)} kg` : '-'}</p>
            <p className="mt-2 text-sm text-slate-500">Over selected range</p>
          </Card>
          <Card>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Body fat</p>
            <p className="mt-3 text-3xl font-semibold text-white">{stats.bodyFat != null ? `${stats.bodyFat}%` : '-'}</p>
            <p className="mt-2 text-sm text-slate-500">Most recent value</p>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Trend</p>
                <h2 className="text-2xl font-semibold text-white">Weight over time</h2>
              </div>
              <Button onClick={loadMetrics} className="rounded-full px-5 py-2">Refresh</Button>
            </div>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={filtered.map((row) => ({ ...row }))}>
                  <defs>
                    <linearGradient id="metric-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={colors[0]} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" tickFormatter={(value) => format(new Date(value), 'MMM d')} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155' }} />
                  <Area type="monotone" dataKey="weight_kg" stroke={colors[0]} strokeWidth={3} fill="url(#metric-gradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Log weight</p>
              <h2 className="text-2xl font-semibold text-white">Add today's metric</h2>
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
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Nutrition</p>
            <h1 className="text-3xl font-semibold text-white">Daily nutrition</h1>
          </div>
          <p className="max-w-xl text-sm text-slate-400">Persist goals and log meals so your dashboard always reflects your progress.</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Today</p>
              <h2 className="text-2xl font-semibold text-white">Macro summary</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {['calories', 'protein', 'carbs', 'fat'].map((metric) => {
                const key = metric === 'calories' ? 'calories' : `${metric}_g`;
                const value = todayTotals[key] ?? 0;
                const pct = progress[metric] ?? 0;
                const goalLabel = metric === 'calories' ? (user?.calories_goal ?? 2200) : (user?.[`${metric}_goal`] ?? 0);
                return (
                  <div key={metric} className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{metric}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{value}{metric !== 'calories' ? 'g' : ''}</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900">
                      <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{pct}% of {goalLabel}{metric === 'calories' ? '' : 'g'}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Goals</p>
              <h2 className="text-2xl font-semibold text-white">Edit targets</h2>
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
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Log intake</p>
              <h2 className="text-2xl font-semibold text-white">Add today's meal</h2>
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
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Calories</p>
              <h2 className="text-2xl font-semibold text-white">Last 7 days</h2>
            </div>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={caloriesSeries} margin={{ left: -10, right: -10 }}>
                  <XAxis dataKey="date" stroke="#94a3b8" tickFormatter={(value) => format(new Date(value), 'MMM d')} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155' }} />
                  <Bar dataKey="calories" fill={colors[1]} />
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
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Profile</p>
            <h1 className="text-3xl font-semibold text-white">Account settings</h1>
          </div>
          <Button onClick={() => navigate('/dashboard')}>Back to dashboard</Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-5">
            <h2 className="text-2xl font-semibold text-white">Personal details</h2>
            <form className="space-y-4" onSubmit={handleSubmit(onUpdateProfile)}>
              <Input placeholder="Name" {...rf('name')} />
              <Input placeholder="Email" type="email" {...rf('email')} />
              <Button>Save profile</Button>
            </form>
          </Card>

          <Card className="space-y-5">
            <h2 className="text-2xl font-semibold text-white">Security</h2>
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
              <p className="text-sm uppercase tracking-[0.2em] text-rose-400">Danger zone</p>
              <h2 className="text-2xl font-semibold text-white">Delete account</h2>
            </div>
            <Button className="bg-rose-500 hover:bg-rose-400" onClick={onDeleteAccount}>Delete account</Button>
          </div>
          <p className="text-sm text-slate-400">Deleting your account removes all workouts, metrics, and nutrition data.</p>
        </Card>
      </div>
    </PageWrapper>
  );
}

export default function App() {
  const { hydrate, isDark, setTheme } = useAuthStore();

  useEffect(() => {
    hydrate();
    setTheme(isDark);
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
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
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
