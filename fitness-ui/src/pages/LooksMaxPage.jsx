import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

export default function LooksMaxPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // State for tabs
  const [activeTab, setActiveTab] = useState('overview');

  // State for overview tab
  const [checklist, setChecklist] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // State for other tabs (placeholder)
  const [skinData, setSkinData] = useState([]);
  const [hairData, setHairData] = useState([]);
  const [jawlineData, setJawlineData] = useState([]);
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch today's checklist
      const checklistRes = await fetch('/looks/checklist/today', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (checklistRes.ok) {
        const checklistData = await checklistRes.json();
        setChecklist(checklistData);
      }

      // Fetch stats
      const statsRes = await fetch('/looks/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch skin logs (last 30 days)
      const skinRes = await fetch('/looks/skin?days=30', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (skinRes.ok) {
        const skinData = await skinRes.json();
        setSkinData(skinData);
      }

      // Fetch hair logs (last 30 days)
      const hairRes = await fetch('/looks/hair?days=30', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (hairRes.ok) {
        const hairData = await hairRes.json();
        setHairData(hairData);
      }

      // Fetch jawline logs (last 30 days)
      const jawlineRes = await fetch('/looks/jawline?days=30', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (jawlineRes.ok) {
        const jawlineData = await jawlineRes.json();
        setJawlineData(jawlineData);
      }

      // Fetch goals
      const goalsRes = await fetch('/looks/goals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        setGoals(goalsData);
      }
    } catch (error) {
      console.error('Error fetching looksmax data:', error);
      toast.error('Failed to load looksmax data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCheckbox = async (section, item, value) => {
    if (!checklist) return;

    // Create a copy of the items
    const items = JSON.parse(checklist.items);
    items[section][item] = value;

    try {
      const res = await fetch('/looks/checklist/today', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ items: JSON.stringify(items) })
      });

      if (res.ok) {
        // Update local state
        setChecklist(prev => ({
          ...prev,
          items: JSON.stringify(items)
        }));
      } else {
        throw new Error('Failed to update checklist');
      }
    } catch (error) {
      console.error('Error updating checklist:', error);
      toast.error('Failed to save checklist item');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'skin', label: 'Skin' },
          { id: 'hair', label: 'Hair' },
          { id: 'jawline', label: 'Jawline' },
          { id: 'grooming', label: 'Grooming' },
          { id: 'style', label: 'Style' },
          { id: 'goals', label: 'Goals' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all
              ${activeTab === tab.id
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          checklist={checklist}
          stats={stats}
          onToggleCheckbox={handleToggleCheckbox}
        />
      )}
      {activeTab === 'skin' && (
        <SkinTab
          skinData={skinData}
        />
      )}
      {activeTab === 'hair' && (
        <HairTab
          hairData={hairData}
        />
      )}
      {activeTab === 'jawline' && (
        <JawlineTab
          jawlineData={jawlineData}
        />
      )}
      {activeTab === 'grooming' && (
        <GroomingTab />
      )}
      {activeTab === 'style' && (
        <StyleTab />
      )}
      {activeTab === 'goals' && (
        <GoalsTab
          goals={goals}
        />
      )}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ checklist, stats, onToggleCheckbox }) {
  if (!checklist || !stats) {
    return <div>Loading...</div>;
  }

  const items = JSON.parse(checklist.items);
  const completedCount =
    Object.values(items.morning).filter(v => v).length +
    Object.values(items.throughout_day).filter(v => v).length +
    Object.values(items.evening).filter(v => v).length;
  const totalItems = 15; // 6 morning + 4 throughout + 5 evening

  return (
    <div className="space-y-6">
      {/* Batman Quote */}
      <div className="text-center py-8">
        <p className="text-[var(--text-secondary)] italic">
          "Discipline separates Bruce Wayne from everyone else."
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-[var(--text-secondary)] text-sm">Skin Routine Streak</p>
          <p className="text-2xl font-semibold text-[var(--accent)]">{stats.skin_streak} days</p>
        </Card>
        <Card className="p-4">
          <p className="text-[var(--text-secondary)] text-sm">Jawline Routine Streak</p>
          <p className="text-2xl font-semibold text-[var(--accent)]">{stats.jawline_streak} days</p>
        </Card>
        <Card className="p-4">
          <p className="text-[var(--text-secondary)] text-sm">Avg Sleep This Week</p>
          <p className="text-2xl font-semibold text-[var(--accent)]">{stats.avg_sleep_hours} hrs</p>
        </Card>
        <Card className="p-4">
          <p className="text-[var(--text-secondary)] text-sm">Avg Water This Week</p>
          <p className="text-2xl font-semibold text-[var(--accent)]">{stats.avg_water_intake}ml</p>
        </Card>
      </div>

      {/* Daily Checklist Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-white">Daily Checklist</h2>
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <svg className="absolute inset-0" viewBox="0 0 24 24" stroke="var(--text-secondary)" strokeWidth={2} fill="none">
                <circle cx="12" cy="12" r="10" />
                <path
                  strokeDasharray={`${(completedCount / totalItems) * 2 * Math.PI * 10} 62.8`}
                  stroke="var(--accent)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  transform="rotate(-90 12 12)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[var(--accent)] font-bold text-2xl">
                {completedCount}/{totalItems}
              </div>
            </div>
          </div>
        </div>

        {/* Checklist Groups */}
        <div className="space-y-4">
          {/* Morning */}
          <div>
            <h3 className="font-semibold text-[var(--accent)] mb-2">MORNING</h3>
            <div className="space-y-2">
              {[
                { id: 'face_wash', label: 'Face wash' },
                { id: 'moisturiser', label: 'Moisturiser' },
                { id: 'sunscreen', label: 'Sunscreen (SPF 50+)' },
                { id: 'mewing', label: 'Mewing (tongue on roof of mouth all morning)' },
                { id: 'cold_shower', label: 'Cold shower' },
                { id: 'hair_styling', label: 'Hair styling' }
              ].map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={items.morning[item.id] || false}
                    onChange={(e) => onToggleCheckbox('morning', item.id, e.target.checked)}
                    className="h-4 w-4 text-[var(--accent)] focus:ring-[var(--accent)] border-[var(--border)] rounded"
                  />
                  <span className="text-[var(--text-secondary)]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Throughout Day */}
          <div>
            <h3 className="font-semibold text-[var(--accent)] mb-2">THROUGHOUT DAY</h3>
            <div className="space-y-2">
              {[
                { id: 'water_intake', label: '3L+ water intake' },
                { id: 'posture_check', label: 'Posture check (sitting/standing tall)' },
                { id: 'chewing_gum', label: 'Chewing gum (jawline)' },
                { id: 'no_junk_food', label: 'No junk food' }
              ].map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={items.throughout_day[item.id] || false}
                    onChange={(e) => onToggleCheckbox('throughout_day', item.id, e.target.checked)}
                    className="h-4 w-4 text-[var(--accent)] focus:ring-[var(--accent)] border-[var(--border)] rounded"
                  />
                  <span className="text-[var(--text-secondary)]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Evening */}
          <div>
            <h3 className="font-semibold text-[var(--accent)] mb-2">EVENING</h3>
            <div className="space-y-2">
              {[
                { id: 'face_wash_pm', label: 'Face wash PM' },
                { id: 'moisturiser_pm', label: 'Moisturiser PM' },
                { id: 'gua_sha', label: 'Gua sha (5 min jawline massage)' },
                { id: 'sleep_target', label: '7-9 hours sleep target' },
                { id: 'hair_oil', label: 'Hair oil (if wash day)' }
              ].map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={items.evening[item.id] || false}
                    onChange={(e) => onToggleCheckbox('evening', item.id, e.target.checked)}
                    className="h-4 w-4 text-[var(--accent)] focus:ring-[var(--accent)] border-[var(--border)] rounded"
                  />
                  <span className="text-[var(--text-secondary)]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Placeholder components for other tabs
function SkinTab({ skinData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-[var(--accent)]">Skin Routine</h2>
      <p className="text-[var(--text-secondary)]">Skin tab content coming soon...</p>
      {skinData.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold text-[var(--accent)]">Recent Skin Logs</h3>
          <div className="space-y-2">
            {skinData.slice(0, 5).map(log => (
              <div key={log.id} className="p-3 bg-[var(--surface)] rounded-md">
                <p className="text-[var(--text-secondary)] text-sm">
                  {new Date(log.date).toLocaleDateString()} -
                  Water: {log.water_intake_ml || 0}ml |
                  Sleep: {log.sleep_hours || 0}hrs
                </p>
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HairTab({ hairData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-[var(--accent)]">Hair Routine</h2>
      <p className="text-[var(--text-secondary)]">Hair tab content coming soon...</p>
      {hairData.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold text-[var(--accent)]">Recent Hair Logs</h3>
          <div className="space-y-2">
            {hairData.slice(0, 5).map(log => (
              <div key={log.id} className="p-3 bg-[var(--surface)] rounded-md">
                <p className="text-[var(--text-secondary)] text-sm">
                  {new Date(log.date).toLocaleDateString()} -
                  Washed: {log.washed ? 'Yes' : 'No'} |
                  Oiled: {log.oiled ? 'Yes' : 'No'}
                </p>
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function JawlineTab({ jawlineData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-[var(--accent)]">Jawline Routine</h2>
      <p className="text-[var(--text-secondary)]">Jawline tab content coming soon...</p>
      {jawlineData.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold text-[var(--accent)]">Recent Jawline Logs</h3>
          <div className="space-y-2">
            {jawlineData.slice(0, 5).map(log => (
              <div key={log.id} className="p-3 bg-[var(--surface)] rounded-md">
                <p className="text-[var(--text-secondary)] text-sm">
                  {new Date(log.date).toLocaleDateString()} -
                  Mewing: {log.mewing_minutes} min |
                  Gua Sha: {log.gua_sha ? 'Yes' : 'No'} |
                  Chewing: {log.chewing_gum_minutes} min
                </p>
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GroomingTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-[var(--accent)]">Grooming Guide</h2>
      <p className="text-[var(--text-secondary)]">Grooming tab content coming soon...</p>
      <div className="mt-4">
        <h3 className="font-semibold text-[var(--accent)]">Coming Soon</h3>
        <p className="text-[var(--text-secondary)]">Detailed grooming guide for eyebrows, beard, nose/ear hair, teeth, and fragrance.</p>
      </div>
    </div>
  );
}

function StyleTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-[var(--accent)]">Style Guide</h2>
      <p className="text-[var(--text-secondary)]">Style tab content coming soon...</p>
      <div className="mt-4">
        <h3 className="font-semibold text-[var(--accent)]">Coming Soon</h3>
        <p className="text-[var(--text-secondary)]">Information on fit, color coordination, wardrobe essentials, and style for body types.</p>
      </div>
    </div>
  );
}

function GoalsTab({ goals }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-[var(--accent)]">Looks Goals</h2>
      <p className="text-[var(--text-secondary)]">Manage your appearance-related goals here.</p>

      {/* Add Goal Form (simplified) */}
      <div className="mt-6">
        <h3 className="font-semibold text-[var(--accent)] mb-4">Add New Goal</h3>
        <form className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Goal text"
            />
            <select
              className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[var(--text-primary)]"
            >
              <option value="skin">Skin</option>
              <option value="hair">Hair</option>
              <option value="jawline">Jawline</option>
              <option value="posture">Posture</option>
              <option value="style">Style</option>
              <option value="grooming">Grooming</option>
            </select>
            <Input
              type="date"
              placeholder="Target date"
            />
            <select
              className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[var(--text-primary)]"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <Button className="w-full">Add Goal</Button>
        </form>
      </div>

      {/* Goals List */}
      <div className="mt-6">
        <h3 className="font-semibold text-[var(--accent)] mb-4">Your Goals</h3>
        {goals.length === 0 ? (
          <p className="text-[var(--text-secondary)]">No goals yet. Add your first goal above.</p>
        ) : (
          <div className="space-y-3">
            {goals.map(goal => (
              <div key={goal.id} className="p-4 bg-[var(--surface)] rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={goal.completed || false}
                      className="h-4 w-4 text-[var(--accent)] focus:ring-[var(--accent)] border-[var(--border)] rounded"
                    />
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{goal.goal_text}</p>
                      <p className="text-[var(--text-secondary)] text-sm">
                        {goal.category} • Target: {goal.target_date ? new Date(goal.target_date).toLocaleDateString() : 'No date'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm px-2 py-1 rounded-full
                    ${goal.completed
                      ? 'bg-[var(--accent)]/20 text-[var(--accent)]'
                      : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'}`}>
                    {goal.completed ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}