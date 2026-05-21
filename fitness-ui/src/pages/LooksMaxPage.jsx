import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';
import {
  getTodayChecklist,
  updateTodayChecklist,
  getLooksStats,
  getSkinLogs,
  createSkinLog,
  getHairLogs,
  createHairLog,
  getJawlineLogs,
  createJawlineLog,
  getLooksGoals,
  createLooksGoal,
  updateLooksGoal,
} from '../api/looks';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'skin', label: 'Skin' },
  { id: 'hair', label: 'Hair' },
  { id: 'jawline', label: 'Jawline' },
  { id: 'grooming', label: 'Grooming' },
  { id: 'style', label: 'Style' },
  { id: 'goals', label: 'Goals' },
];

const DEFAULT_CHECKLIST = {
  morning: {
    face_wash: false,
    moisturiser: false,
    sunscreen: false,
    mewing: false,
    cold_shower: false,
    hair_styling: false,
  },
  throughout_day: {
    water_intake: false,
    posture_check: false,
    chewing_gum: false,
    no_junk_food: false,
  },
  evening: {
    face_wash_pm: false,
    moisturiser_pm: false,
    gua_sha: false,
    sleep_target: false,
    hair_oil: false,
  },
};

function parseChecklistItems(raw) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return {
      morning: { ...DEFAULT_CHECKLIST.morning, ...parsed?.morning },
      throughout_day: { ...DEFAULT_CHECKLIST.throughout_day, ...parsed?.throughout_day },
      evening: { ...DEFAULT_CHECKLIST.evening, ...parsed?.evening },
    };
  } catch {
    return DEFAULT_CHECKLIST;
  }
}

function countCompleted(items) {
  return (
    Object.values(items.morning).filter(Boolean).length +
    Object.values(items.throughout_day).filter(Boolean).length +
    Object.values(items.evening).filter(Boolean).length
  );
}

const TOTAL_CHECKLIST = 15;

function ProgressBar({ value, max, label }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-[var(--text-secondary)]">
        <span>{label}</span>
        <span className="text-[var(--accent)]">{Math.round(pct)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#8b0000] to-[var(--accent)]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <Card className="py-12 text-center">
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{description}</p>
    </Card>
  );
}

function LooksSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Skeleton key={t.id} className="h-10 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-3xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-3xl" />
    </div>
  );
}

export default function LooksMaxPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState(null);
  const [stats, setStats] = useState(null);
  const [skinData, setSkinData] = useState([]);
  const [hairData, setHairData] = useState([]);
  const [jawlineData, setJawlineData] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loadError, setLoadError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [checklistRes, statsRes, skinRes, hairRes, jawRes, goalsRes] = await Promise.allSettled([
        getTodayChecklist(),
        getLooksStats(),
        getSkinLogs(30),
        getHairLogs(30),
        getJawlineLogs(30),
        getLooksGoals(),
      ]);

      if (checklistRes.status === 'fulfilled') setChecklist(checklistRes.value);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (skinRes.status === 'fulfilled') setSkinData(skinRes.value || []);
      if (hairRes.status === 'fulfilled') setHairData(hairRes.value || []);
      if (jawRes.status === 'fulfilled') setJawlineData(jawRes.value || []);
      if (goalsRes.status === 'fulfilled') setGoals(goalsRes.value || []);

      const failed = [checklistRes, statsRes].filter((r) => r.status === 'rejected');
      if (failed.length) {
        setLoadError('Some looks data could not be loaded. Showing available modules.');
      }
    } catch (error) {
      console.error(error);
      setLoadError('Failed to load looks dashboard.');
      toast.error('Failed to load looks data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const checklistItems = useMemo(
    () => (checklist ? parseChecklistItems(checklist.items) : DEFAULT_CHECKLIST),
    [checklist]
  );

  const completedCount = useMemo(() => countCompleted(checklistItems), [checklistItems]);

  const handleToggleCheckbox = async (section, item, value) => {
    const next = {
      ...checklistItems,
      [section]: { ...checklistItems[section], [item]: value },
    };
    setChecklist((prev) => (prev ? { ...prev, items: JSON.stringify(next) } : prev));
    try {
      await updateTodayChecklist(next);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save checklist');
      fetchData();
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <header className="space-y-2">
          <p className="section-label">Tactical aesthetics</p>
          <h1 className="text-3xl font-semibold text-white">Looks Command</h1>
        </header>
        <LooksSkeleton />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <header className="space-y-2">
        <p className="section-label">Tactical aesthetics</p>
        <h1 className="text-3xl font-semibold text-white">Looks Command</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Optimize appearance systems — skin, structure, grooming, and style.
        </p>
      </header>

      {loadError && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          {loadError}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[var(--accent)] text-white shadow-[0_0_16px_rgba(220,20,60,0.35)]'
                : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === 'overview' && (
            <OverviewTab
              checklistItems={checklistItems}
              stats={stats}
              completedCount={completedCount}
              onToggleCheckbox={handleToggleCheckbox}
            />
          )}
          {activeTab === 'skin' && (
            <SkinTab skinData={skinData} onRefresh={fetchData} />
          )}
          {activeTab === 'hair' && (
            <HairTab hairData={hairData} onRefresh={fetchData} />
          )}
          {activeTab === 'jawline' && (
            <JawlineTab jawlineData={jawlineData} onRefresh={fetchData} />
          )}
          {activeTab === 'grooming' && <GroomingTab />}
          {activeTab === 'style' && <StyleTab />}
          {activeTab === 'goals' && (
            <GoalsTab goals={goals} onRefresh={fetchData} />
          )}
        </motion.div>
      </AnimatePresence>
    </PageWrapper>
  );
}

function OverviewTab({ checklistItems, stats, completedCount, onToggleCheckbox }) {
  const safeStats = stats || {
    skin_streak: 0,
    jawline_streak: 0,
    avg_sleep_hours: 0,
    avg_water_intake: 0,
  };

  return (
    <div className="space-y-6">
      <Card className="border-[var(--border-strong)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] p-6">
        <p className="text-center italic text-[var(--text-secondary)]">
          &ldquo;Discipline separates Bruce Wayne from everyone else.&rdquo;
        </p>
        <div className="mt-6">
          <ProgressBar value={completedCount} max={TOTAL_CHECKLIST} label="Daily protocol completion" />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Skin streak', value: `${safeStats.skin_streak}d` },
          { label: 'Jawline streak', value: `${safeStats.jawline_streak}d` },
          { label: 'Avg sleep', value: `${safeStats.avg_sleep_hours}h` },
          { label: 'Avg water', value: `${safeStats.avg_water_intake}ml` },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs uppercase tracking-widest text-[var(--text-secondary)]">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--accent)]">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">Daily Checklist</h2>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--accent)] text-sm font-bold text-[var(--accent)]">
            {completedCount}/{TOTAL_CHECKLIST}
          </div>
        </div>

        <div className="space-y-6">
          {[
            { key: 'morning', title: 'MORNING', items: [
              { id: 'face_wash', label: 'Face wash' },
              { id: 'moisturiser', label: 'Moisturiser' },
              { id: 'sunscreen', label: 'Sunscreen (SPF 50+)' },
              { id: 'mewing', label: 'Mewing' },
              { id: 'cold_shower', label: 'Cold shower' },
              { id: 'hair_styling', label: 'Hair styling' },
            ]},
            { key: 'throughout_day', title: 'THROUGHOUT DAY', items: [
              { id: 'water_intake', label: '3L+ water intake' },
              { id: 'posture_check', label: 'Posture check' },
              { id: 'chewing_gum', label: 'Chewing gum (jawline)' },
              { id: 'no_junk_food', label: 'No junk food' },
            ]},
            { key: 'evening', title: 'EVENING', items: [
              { id: 'face_wash_pm', label: 'Face wash PM' },
              { id: 'moisturiser_pm', label: 'Moisturiser PM' },
              { id: 'gua_sha', label: 'Gua sha (5 min)' },
              { id: 'sleep_target', label: '7–9 hours sleep' },
              { id: 'hair_oil', label: 'Hair oil (wash day)' },
            ]},
          ].map((group) => (
            <div key={group.key}>
              <h3 className="mb-3 text-sm font-semibold tracking-widest text-[var(--accent)]">{group.title}</h3>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-[var(--surface-2)]">
                    <input
                      type="checkbox"
                      checked={!!checklistItems[group.key]?.[item.id]}
                      onChange={(e) => onToggleCheckbox(group.key, item.id, e.target.checked)}
                      className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <span className="text-[var(--text-secondary)]">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SkinTab({ skinData, onRefresh }) {
  const [form, setForm] = useState({ water_intake_ml: '', sleep_hours: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const chartData = useMemo(
    () =>
      [...skinData]
        .slice(0, 14)
        .reverse()
        .map((log) => ({
          date: format(parseISO(log.date), 'MMM d'),
          water: log.water_intake_ml || 0,
          sleep: log.sleep_hours || 0,
        })),
    [skinData]
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createSkinLog({
        water_intake_ml: form.water_intake_ml ? Number(form.water_intake_ml) : null,
        sleep_hours: form.sleep_hours ? Number(form.sleep_hours) : null,
        notes: form.notes || null,
      });
      toast.success('Skin log saved');
      setForm({ water_intake_ml: '', sleep_hours: '', notes: '' });
      onRefresh();
    } catch {
      toast.error('Failed to save skin log');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-white">Log skin protocol</h2>
        <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-3">
          <Input placeholder="Water (ml)" type="number" value={form.water_intake_ml} onChange={(e) => setForm((f) => ({ ...f, water_intake_ml: e.target.value }))} />
          <Input placeholder="Sleep (hours)" type="number" step="0.5" value={form.sleep_hours} onChange={(e) => setForm((f) => ({ ...f, sleep_hours: e.target.value }))} />
          <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          <Button type="submit" disabled={saving} className="sm:col-span-3">
            {saving ? 'Saving...' : 'Save log'}
          </Button>
        </form>
      </Card>

      {chartData.length > 0 ? (
        <Card className="p-6">
          <p className="section-label mb-4">Hydration & recovery</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <XAxis dataKey="date" stroke="#7a7a9a" fontSize={11} />
                <YAxis stroke="#7a7a9a" fontSize={11} />
                <Tooltip contentStyle={{ background: '#141420', border: '1px solid rgba(220,20,60,0.3)' }} />
                <Area type="monotone" dataKey="water" stroke="#DC143C" fill="rgba(220,20,60,0.2)" name="Water (ml)" />
                <Area type="monotone" dataKey="sleep" stroke="#7a7a9a" fill="rgba(122,122,154,0.15)" name="Sleep (h)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : (
        <EmptyState title="No skin logs yet" description="Log water and sleep to unlock trend charts." />
      )}

      {skinData.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[var(--accent)]">Recent logs</h3>
          {skinData.slice(0, 8).map((log) => (
            <Card key={log.id} className="p-3 text-sm text-[var(--text-secondary)]">
              {format(parseISO(log.date), 'PP')} — Water: {log.water_intake_ml || 0}ml | Sleep: {log.sleep_hours || 0}h
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function HairTab({ hairData, onRefresh }) {
  const [washed, setWashed] = useState(false);
  const [oiled, setOiled] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createHairLog({ washed, oiled, notes: notes || null });
      toast.success('Hair log saved');
      setNotes('');
      onRefresh();
    } catch {
      toast.error('Failed to save hair log');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-white">Hair routine log</h2>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={washed} onChange={(e) => setWashed(e.target.checked)} className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-[var(--text-secondary)]">Washed today</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={oiled} onChange={(e) => setOiled(e.target.checked)} className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-[var(--text-secondary)]">Oiled / treated</span>
          </label>
          <Input placeholder="Products / notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save log'}</Button>
        </form>
      </Card>

      {hairData.length === 0 ? (
        <EmptyState title="No hair logs" description="Track wash days and oil treatments to build consistency." />
      ) : (
        <div className="space-y-2">
          {hairData.slice(0, 8).map((log) => (
            <Card key={log.id} className="p-3 text-sm text-[var(--text-secondary)]">
              {format(parseISO(log.date), 'PP')} — Washed: {log.washed ? 'Yes' : 'No'} | Oiled: {log.oiled ? 'Yes' : 'No'}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function JawlineTab({ jawlineData, onRefresh }) {
  const [form, setForm] = useState({ mewing_minutes: '', gua_sha: false, chewing_gum_minutes: '' });
  const [saving, setSaving] = useState(false);

  const chartData = useMemo(
    () =>
      [...jawlineData]
        .slice(0, 10)
        .reverse()
        .map((log) => ({
          date: format(parseISO(log.date), 'MMM d'),
          mewing: log.mewing_minutes || 0,
          chewing: log.chewing_gum_minutes || 0,
        })),
    [jawlineData]
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createJawlineLog({
        mewing_minutes: form.mewing_minutes ? Number(form.mewing_minutes) : 0,
        gua_sha: form.gua_sha,
        chewing_gum_minutes: form.chewing_gum_minutes ? Number(form.chewing_gum_minutes) : 0,
      });
      toast.success('Jawline log saved');
      setForm({ mewing_minutes: '', gua_sha: false, chewing_gum_minutes: '' });
      onRefresh();
    } catch {
      toast.error('Failed to save jawline log');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-white">Jawline protocol</h2>
        <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input placeholder="Mewing (minutes)" type="number" value={form.mewing_minutes} onChange={(e) => setForm((f) => ({ ...f, mewing_minutes: e.target.value }))} />
          <Input placeholder="Chewing gum (minutes)" type="number" value={form.chewing_gum_minutes} onChange={(e) => setForm((f) => ({ ...f, chewing_gum_minutes: e.target.value }))} />
          <label className="flex items-center gap-3 sm:col-span-2">
            <input type="checkbox" checked={form.gua_sha} onChange={(e) => setForm((f) => ({ ...f, gua_sha: e.target.checked }))} className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-[var(--text-secondary)]">Gua sha completed</span>
          </label>
          <Button type="submit" disabled={saving} className="sm:col-span-2">{saving ? 'Saving...' : 'Save log'}</Button>
        </form>
      </Card>

      {chartData.length > 0 ? (
        <Card className="p-6">
          <p className="section-label mb-4">Jaw training volume</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="date" stroke="#7a7a9a" fontSize={11} />
                <YAxis stroke="#7a7a9a" fontSize={11} />
                <Tooltip contentStyle={{ background: '#141420', border: '1px solid rgba(220,20,60,0.3)' }} />
                <Bar dataKey="mewing" fill="#DC143C" name="Mewing (min)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="chewing" fill="rgba(122,122,154,0.8)" name="Chewing (min)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : (
        <EmptyState title="No jawline logs" description="Log mewing and chewing sessions to track structural work." />
      )}
    </div>
  );
}

function GroomingTab() {
  const sections = [
    { title: 'Eyebrows', tip: 'Trim to natural shape; remove strays between brows.' },
    { title: 'Beard & facial hair', tip: 'Define neckline; oil daily; wash 2–3× weekly.' },
    { title: 'Nose & ear hair', tip: 'Weekly trim with dedicated tool — never pluck deep.' },
    { title: 'Teeth & smile', tip: 'Brush 2× daily, floss, scrape tongue, dentist every 6 months.' },
    { title: 'Fragrance', tip: '1–2 sprays on pulse points; moisturize skin first.' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sections.map((s) => (
        <Card key={s.title} className="p-5">
          <h3 className="text-lg font-semibold text-[var(--accent)]">{s.title}</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{s.tip}</p>
        </Card>
      ))}
    </div>
  );
}

function StyleTab() {
  const sections = [
    { title: 'Fit is everything', tip: 'Shoulder seams at bone edge; tapered waist; proper sleeve break.' },
    { title: 'Color coordination', tip: 'Build on neutrals; one accent per outfit.' },
    { title: 'Wardrobe essentials', tip: 'Quality white/blue shirts, dark denim, chinos, white sneakers, blazer.' },
    { title: 'Dress your physique', tip: 'Highlight shoulders and chest; balance fitted top with relaxed bottom.' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sections.map((s) => (
        <Card key={s.title} className="p-5">
          <h3 className="text-lg font-semibold text-[var(--accent)]">{s.title}</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{s.tip}</p>
        </Card>
      ))}
    </div>
  );
}

function GoalsTab({ goals, onRefresh }) {
  const [form, setForm] = useState({
    goal_text: '',
    category: 'skin',
    target_date: '',
    priority: 'medium',
  });
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.goal_text.trim()) {
      toast.error('Enter a goal');
      return;
    }
    setSaving(true);
    try {
      await createLooksGoal({
        goal_text: form.goal_text,
        category: form.category,
        target_date: form.target_date || null,
        completed: false,
      });
      toast.success('Goal added');
      setForm({ goal_text: '', category: 'skin', target_date: '', priority: 'medium' });
      onRefresh();
    } catch {
      toast.error('Failed to add goal');
    } finally {
      setSaving(false);
    }
  };

  const toggleGoal = async (goal) => {
    try {
      await updateLooksGoal(goal.id, { completed: !goal.completed });
      onRefresh();
    } catch {
      toast.error('Failed to update goal');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-white">Add goal</h2>
        <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input placeholder="Goal" value={form.goal_text} onChange={(e) => setForm((f) => ({ ...f, goal_text: e.target.value }))} className="sm:col-span-2" />
          <select
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[var(--text-primary)]"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {['skin', 'hair', 'jawline', 'posture', 'style', 'grooming'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Input type="date" value={form.target_date} onChange={(e) => setForm((f) => ({ ...f, target_date: e.target.value }))} />
          <Button type="submit" disabled={saving} className="sm:col-span-2">{saving ? 'Saving...' : 'Add goal'}</Button>
        </form>
      </Card>

      {goals.length === 0 ? (
        <EmptyState title="No goals yet" description="Set appearance targets to track progress over time." />
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <Card key={goal.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={!!goal.completed}
                    onChange={() => toggleGoal(goal)}
                    className="mt-1 h-4 w-4 text-[var(--accent)]"
                  />
                  <div>
                    <p className={`font-semibold ${goal.completed ? 'text-[var(--text-secondary)] line-through' : 'text-white'}`}>
                      {goal.goal_text}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {goal.category}
                      {goal.target_date ? ` · ${format(new Date(goal.target_date), 'PP')}` : ''}
                    </p>
                  </div>
                </label>
                <span className={`rounded-full px-2 py-1 text-xs ${goal.completed ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'}`}>
                  {goal.completed ? 'Done' : 'Active'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
