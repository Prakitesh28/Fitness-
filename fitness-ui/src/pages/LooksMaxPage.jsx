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
      <p className="text-[var(--text-secondary)]">Master the essentials of male grooming for a polished, attractive appearance.</p>

      {/* Grooming Sections */}
      <div className="mt-6 space-y-8">
        {/* Eyebrows */}
        <div className="space-y-4">
          <h3 className="font-semibold text-[var(--accent)] text-lg">Eyebrows</h3>
          <p className="text-[var(--text-secondary)] mb-2">Well-groomed eyebrows frame your eyes and enhance facial structure.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-3 bg-[var(--surface)] rounded-md">
              <p className="text-[var(--text-secondary)] text-sm">Do:</p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm mt-1">
                <li>Trim to follow natural shape</li>
                <li>Remove stray hairs between brows</li>
                <li>Keep tails pointing slightly downward</li>
                <li>Use brow gel to keep hairs in place</li>
              </ul>
            </div>
            <div className="p-3 bg-[var(--surface)] rounded-md">
              <p className="text-[var(--text-secondary)] text-sm">Don't:</p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm mt-1">
                <li>Over-tweeze or create unnatural shapes</li>
                <li>Make them too thin</li>
                <li>Ignore the natural arch</li>
                <li>Use dark products that look artificial</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Beard */}
        <div className="space-y-4">
          <h3 className="font-semibold text-[var(--accent)] text-lg">Beard & Facial Hair</h3>
          <p className="text-[var(--text-secondary)] mb-2">A well-maintained beard enhances masculinity and jawline definition.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-3 bg-[var(--surface)] rounded-md">
              <p className="text-[var(--text-secondary)] text-sm">Do:</p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm mt-1">
                <li>Wash beard 2-3x per week with beard soap</li>
                <li>Apply beard oil daily to moisturize skin and hair</li>
                <li>Trim neckline and cheek lines for clean edges</li>
                <li>Brush or comb daily to distribute oils</li>
                <li>Define your cheek line and neckline</li>
              </ul>
            </div>
            <div className="p-3 bg-[var(--surface)] rounded-md">
              <p className="text-[var(--text-secondary)] text-sm">Don't:</p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm mt-1">
                <li>Let it grow wild without maintenance</li>
                <li>Use regular shampoo (dries out facial hair)</li>
                <li>Neglect the neckline (creates "neckbeard")</li>
                <li>Apply products to dirty beard</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Nose/Ear Hair */}
        <div className="space-y-4">
          <h3 className="font-semibold text-[var(--accent)] text-lg">Nose & Ear Hair</h3>
          <p className="text-[var(--text-secondary)] mb-2">Visible nose and ear hair significantly detracts from an otherwise well-groomed appearance.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-3 bg-[var(--surface)] rounded-md">
              <p className="text-[var(--text-secondary)] text-sm">Do:</p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm mt-1">
                <li>Check weekly in good lighting</li>
                <li>Use specialized nose/ear hair trimmer</li>
                <li>Trim after shower when hairs are soft</li>
                <li>Only trim visible hairs, don't go deep</li>
                <li>Clean trimmer after each use</li>
              </ul>
            </div>
            <div className="p-3 bg-[var(--surface)] rounded-md">
              <p className="text-[var(--text-secondary)] text-sm">Don't:</p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm mt-1">
                <li>Pluck hairs (can cause infection)</li>
                <li>Use regular scissors (unsafe)</li>
                <li>Trim too frequently (can cause irritation)</li>
                <li>Ignore until it's visibly obvious</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Teeth */}
        <div className="space-y-4">
          <h3 className="font-semibold text-[var(--accent)] text-lg">Teeth & Smile</h3>
          <p className="text-[var(--text-secondary)] mb-2">A healthy, clean smile is one of your most attractive features.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-3 bg-[var(--surface)] rounded-md">
              <p className="text-[var(--text-secondary)] text-sm">Do:</p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm mt-1">
                <li>Brush 2x daily for 2 minutes</li>
                <li>Floss daily to remove plaque between teeth</li>
                <li>Use tongue scraper to remove bacteria</li>
                <li>Visit dentist every 6 months</li>
                <li>Consider whitening for stained teeth</li>
                <li>Fix any visible chips or cracks</li>
              </ul>
            </div>
            <div className="p-3 bg-[var(--surface)] rounded-md">
              <p className="text-[var(--text-secondary)] text-sm">Don't:</p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm mt-1">
                <li>Brush immediately after acidic foods</li>
                <li>Use tobacco products (stains and damages)</li>
                <li>Ignore tooth pain or sensitivity</li>
                <li>Use teeth as tools (opens bottles, etc.)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Fragrance */}
        <div className="space-y-4">
          <h3 className="font-semibold text-[var(--accent)] text-lg">Fragrance</h3>
          <p className="text-[var(--text-secondary)] mb-2">The right scent leaves a lasting impression; the wrong one can be overwhelming.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-3 bg-[var(--surface)] rounded-md">
              <p className="text-[var(--text-secondary)] text-sm">Do:</p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm mt-1">
                <li>Apply to pulse points (wrists, neck, chest)</li>
                <li>Start with 1-2 sprays, you can always add more</li>
                <li>Choose scents appropriate for occasion (day/night)</li>
                <li>Moisturize skin first (helps scent last longer)</li>
                <li>Store in cool, dark place to preserve quality</li>
              </ul>
            </div>
            <div className="p-3 bg-[var(--surface)] rounded-md">
              <p className="text-[var(--text-secondary)] text-sm">Don't:</p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm mt-1">
                <li>Rub wrists together (breaks down scent molecules)</li>
                <li>Apply to clothing (can stain and alter scent)</li>
                <li>Overapply (more than 3-4 sprays is usually too much)</li>
                <li>Apply to sweaty skin (can create unpleasant mix)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StyleTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-[var(--accent)]">Style Guide</h2>
      <p className="text-[var(--text-secondary)]">Elevate your personal style to match your improved physique and appearance.</p>

      {/* Style Sections */}
      <div className="mt-6 space-y-8">
        {/* Fit */}
        <div className="space-y-4">
          <h3 className="font-semibold text-[var(--accent)] text-lg">Fit is Everything</h3>
          <p className="text-[var(--text-secondary)] mb-2">Proper fit is the most important aspect of style - it can make inexpensive clothes look expensive and expensive clothes look cheap.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-3 bg-[var(--surface)] rounded-md">
              <p className="text-[var(--text-secondary)] text-sm">Do:</p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm mt-1">
                <li>Shoulder seams should end at the edge of your shoulder</li>
                <li>Sleeves should show about 1/2 inch of shirt cuff</li>
                <li>Pants should break slightly at the shoe (or no break for modern look)</li>
                <li>Shirts should be tapered to your waist (no billowing)</li>
                <li>Jackets should button comfortably without pulling</li>
              </ul>
            </div>
            <div className="p-3 bg-[var(--surface)] rounded-md">
              <p className="text-[var(--text-secondary)] text-sm">Don't:</p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm mt-1">
                <li>Wear clothes that are too tight (uncomfortable and unflattering)</li>
                <li>Wear clothes that are too baggy (hides your physique)</li>
                <li>Ignore proper sleeve and pant lengths</li>
                <li>Buy off-the-rack without considering alterations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Color Coordination */}
        <div className="space-y-4">
          <h3 className="font-semibold text-[var(--accent)] text-lg">Color Coordination</h3>
          <p className="text-[var(--text-secondary)] mb-2">Understanding color theory helps you create cohesive, intentional outfits.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-3 bg-[var(--surface)] rounded-md">
              <p className="text-[var(--text-secondary)] text-sm">Neutrals (Build Your Foundation):</p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm mt-1">
                <li>Black, white, gray, navy, beige, olive</li>
                <li>Easy to mix and match</li>
                <li>Timeless and versatile</li>
                <li>Invest in quality neutral pieces</li>
              </ul>
            </div>
            <div className="p-3 bg-[var(--surface)] rounded-md">
              <p className="text-[var(--text-secondary)] text-sm">Accent Colors:</p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm mt-1">
                <li>Burgundy, forest green, mustard, cobalt blue</li>
                <li>Use for pieces like sweaters, shirts, accessories</li>
                <li>Complement your skin tone and hair color</li>
                <li>Start with one accent color per outfit</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 p-3 bg-[var(--surface)] rounded-md">
            <p className="text-[var(--text-secondary)] text-sm">Color Combinations That Work:</p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm mt-1">
              <li>Navy + White + Tan (classic nautical)</li>
              <li>Gray + Black + Red (monochrome with pop)</li>
              <li>Olive + Beige + Brown (earth tones)</li>
              <li>Black + White + Gold (luxury minimalist)</li>
              <li>White + Light Blue + Brown (spring/summer)</li>
            </ul>
          </div>
        </div>

        {/* Wardrobe Essentials */}
        <div className="space-y-4">
          <h3 className="font-semibold text-[var(--accent)] text-lg">Wardrobe Essentials</h3>
          <p className="text-[var(--text-secondary)] mb-2">Build a versatile foundation with these key pieces.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-3 bg-[var(--surface)] rounded-md">
              <p className="text-[var(--text-secondary)] text-sm">Tops:</p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm mt-1">
                <li>White and light blue dress shirts</li>
                <li>Crew neck t-shirts (white, gray, black)</li>
                <li>V-neck t-shirts (for layering)</li>
                <li>Polo shirts (cotton or merino wool)</li>
                <li>Sweaters (crew neck, V-neck, cardigan)</li>
                <li>Henley shirts (casual alternative to t-shirts)</li>
              </ul>
            </div>
            <div className="p-3 bg-[var(--surface)] rounded-md">
              <p className="text-[var(--text-secondary)] text-sm">Bottoms:</p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm mt-1">
                <li>Dark wash jeans (straight or slim fit)</li>
                <li>Chinos (navy, olive, khaki)</li>
                <li>Wool trousers (gray, navy, charcoal)</li>
                <li>Shorts (tailored, not athletic)</li>
                <li>Sweatpants (premium, tapered for athleisure)</li>
              </ul>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 mt-3">
            <div className="p-3 bg-[var(--surface)] rounded-md">
              <p className="text-[var(--text-secondary)] text-sm">Outerwear:</p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm mt-1">
                <li>Blazer (navy or charcoal)</li>
                <li>Denim jacket (medium wash)</li>
                <li>Bomber jacket (navy or black)</li>
                <li>Wool overcoat (for winter)</li>
                <li>Trench coat (beige, classic)</li>
              </ul>
            </div>
            <div className="p-3 bg-[var(--surface)] rounded-md">
              <p className="text-[var(--text-secondary)] text-sm">Shoes:</p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm mt-1">
                <li>White leather sneakers (common projects, stan smith)</li>
                <li>Brown leather brogues or derby shoes</li>
                <li>Black leather dress shoes (oxfords)</li>
                <li>Desert boots or chukka boots</li>
                <li>Loafers (penny or tassel)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Style for Body Types */}
        <div className="space-y-4">
          <h3 className="font-semibold text-[var(--accent)] text-lg">Dress for Your Physique</h3>
          <p className="text-[var(--text-secondary)] mb-2">As your body changes with training, adjust your style to highlight your progress.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-3 bg-[var(--surface)] rounded-md">
              <p className="text-[var(--text-secondary)] text-sm">For V-Taper (Wide Shoulders, Narrow Waist):</p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm mt-1">
                <li>Fitted shirts to show off your taper</li>
                <li>Structured jackets with shoulder definition</li>
                <li>Straight or slim jeans to balance proportions</li>
                <li>V-necks to draw eye upward to chest</li>
                <li>Avoid overly baggy clothes that hide your shape</li>
              </ul>
            </div>
            <div className="p-3 bg-[var(--surface)] rounded-md">
              <p className="text-[var(--text-secondary)] text-sm">For Strong Legs (Developed Quads/Hams):</p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm mt-1">
                <li>Straight or tapered pants (not skinny)</li>
                <li>Shorts that hit above the knee</li>
                <li>Consider cuffing pants to show off footwear</li>
                <li>Avoid tapered ankles that look constricted</li>
                <li>Dark wash jeans to createLengthening effect</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 p-3 bg-[var(--surface)] rounded-md">
            <p className="text-[var(--text-secondary)] text-sm">General Principles:</p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm mt-1">
              <li>Clothes should follow your natural lines, not fight them</li>
              <li>Highlight your best features (shoulders, chest, arms)</li>
              <li>Create balance - if top is fitted, bottom can be slightly relaxed</li>
              <li>Invest in tailoring as your physique changes</li>
              <li>Quality over quantity - build a versatile wardrobe slowly</li>
            </ul>
          </div>
        </div>
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