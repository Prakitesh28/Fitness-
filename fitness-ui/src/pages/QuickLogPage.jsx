import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { createWorkout, getExercises, addExerciseToWorkout, addSetToExercise, getWorkoutById } from '../api/workouts';
import { Toaster, toast } from 'react-hot-toast';
import { Clock, RotateCw, Zap, Dumbbell, Activity } from 'lucide-react';

export default function QuickLogPage() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [recentExercises, setRecentExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickSession, setQuickSession] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerInterval, setTimerInterval] = useState(null);
  const [restTimer, setRestTimer] = useState(0);
  const [restTimerRunning, setRestTimerRunning] = useState(false);
  const [restTimerInterval, setRestTimerInterval] = useState(null);
  const [lastSetTime, setLastSetTime] = useState(0);

  // Load exercises
  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const exerciseList = await getExercises();
      setExercises(exerciseList);

      // Get recent exercises from localStorage or use most common ones
      const recent = JSON.parse(localStorage.getItem('recentExercises') || '[]');
      if (recent.length > 0) {
        const recentExerciseObjs = exercises.filter(ex => recent.includes(ex.id));
        setRecentExercises(recentExerciseObjs.slice(0, 6));
      } else {
        // Default to some common exercises if no recent
        const commonNames = ['Barbell Bench Press', 'Barbell Row', 'Barbell Back Squat',
                           'Pull-Up', 'Dumbbell Overhead Press', 'Barbell Deadlift'];
        const commonExercises = exercises.filter(ex => commonNames.includes(ex.name));
        setRecentExercises(commonExercises.slice(0, 6));
      }
    } catch (error) {
      toast.error('Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  // Update recent exercises in localStorage
  const updateRecentExercises = (exerciseId) => {
    const recent = JSON.parse(localStorage.getItem('recentExercises') || '[]');
    const updated = [exerciseId, ...recent.filter(id => id !== exerciseId)].slice(0, 10);
    localStorage.setItem('recentExercises', JSON.stringify(updated));
  };

  // Create quick session
  const createQuickSession = async () => {
    try {
      const session = await createWorkout({
        date: new Date().toISOString().split('T')[0],
        notes: 'Quick log session'
      });
      setQuickSession(session);

      // Navigate to the workout session page
      navigate(`/workouts/${session.id}`);
    } catch (error) {
      toast.error('Failed to create session');
    }
  };

  // Add exercise to quick session
  const addExerciseToQuickSession = async (exercise) => {
    if (!quickSession) return;

    try {
      await addExerciseToWorkout(quickSession.id, {
        exercise_id: exercise.id,
        order_index: 0
      });

      // Update recent exercises
      updateRecentExercises(exercise.id);

      // Refresh session
      const updatedSession = await getWorkoutById(quickSession.id);
      setQuickSession(updatedSession);

      setSelectedExercise(exercise);
      toast.success(`Added ${exercise.name}`);
    } catch (error) {
      toast.error('Failed to add exercise');
    }
  };

  // Add set to selected exercise
  const addSetToSelectedExercise = async () => {
    if (!selectedExercise || !quickSession) return;

    try {
      // Get default set values (last used or defaults)
      const defaultSet = { reps: 10, weight_kg: 20 };

      await addSetToExercise(quickSession.id, selectedExercise.id, {
        set_number: 1, // Simplified for quick logging
        reps: defaultSet.reps,
        weight_kg: defaultSet.weight_kg,
        rpe: null
      });

      // Start rest timer
      startRestTimer(90); // 90 seconds default rest

      toast.success('Set logged!');
    } catch (error) {
      toast.error('Failed to add set');
    }
  };

  // Timer functions
  const startTimer = () => {
    if (!timerRunning) {
      setTimerRunning(true);
      setTimerInterval(setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000));
    }
  };

  const stopTimer = () => {
    if (timerRunning) {
      setTimerRunning(false);
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  const resetTimer = () => {
    stopTimer();
    setTimer(0);
  };

  const startRestTimer = (seconds) => {
    setRestTimer(seconds);
    setRestTimerRunning(true);
    setRestTimerInterval(setInterval(() => {
      setRestTimer(prev => {
        if (prev <= 1) {
          setRestTimerRunning(false);
          clearInterval(restTimerInterval);
          setRestTimerInterval(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000));
  };

  const stopRestTimer = () => {
    if (restTimerRunning) {
      setRestTimerRunning(false);
      clearInterval(restTimerInterval);
      setRestTimerInterval(null);
    }
  };

  // Handle exercise selection from recent list
  const handleRecentExerciseClick = (exercise) => {
    setSelectedExercise(exercise);
    // Auto-add set for quick logging
    addSetToSelectedExercise();
  };

  // Handle exercise selection from search
  const handleExerciseSelect = (exercise) => {
    setSelectedExercise(exercise);
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-48 bg-[var(--surface)] rounded-3xl" />
          <div className="h-48 bg-[var(--surface)] rounded-3xl" />
          <div className="h-48 bg-[var(--surface)] rounded-3xl" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-label">Quick Log</p>
            <h1 className="text-3xl font-semibold text-[var(--accent)]">Fast Gym Logging</h1>
            <p className="text-[var(--text-secondary)] max-w-xl">
              Log your workouts with minimal taps. Designed for speed and efficiency.
            </p>
          </div>
          <Button onClick={createQuickSession} className="max-w-xs">
            Start Quick Session
          </Button>
        </div>

        {/* Quick Stats */}
        {quickSession && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="text-center">
              <p className="text-[var(--text-secondary)] text-sm">Session Time</p>
              <p className="text-2xl font-semibold text-[var(--accent)]">
                {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
              </p>
            </Card>

            <Card className="text-center">
              <p className="text-[var(--text-secondary)] text-sm">Rest Timer</p>
              {restTimerRunning ? (
                <p className="text-2xl font-semibold text-[var(--accent)]">
                  {String(restTimer).padStart(2, '0')}
                </p>
              ) : (
                <p className="text-2xl font-semibold text-[var(--text-secondary)]">00</p>
              )}
            </Card>

            <Card className="text-center">
              <p className="text-[var(--text-secondary)] text-sm">Last Set</p>
              <p className="text-2xl font-semibold text-[var(--accent)]">
                {lastSetTime > 0 ?
                  `${Math.floor((Date.now() - lastSetTime) / 1000)}s ago` :
                  'None'}
              </p>
            </Card>
          </div>
        )}

        {/* Quick Exercise Grid */}
        {!quickSession ? (
          <Card>
            <div className="space-y-4">
              <p className="text-[var(--text-secondary)]">Tap to start a quick session</p>
              <p className="text-[var(--text-secondary)] text-sm">
                Once started, you'll get instant access to your most used exercises
              </p>
            </div>
          </Card>
        ) : (
          <>
            {/* Recent Exercises for Quick Access */}
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">Quick Access</p>
                  <p className="text-[var(--text-secondary)] text-sm">
                    Your most recent exercises
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {recentExercises.map((exercise) => (
                    <Button
                      key={exercise.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleRecentExerciseClick(exercise)}
                      className="w-full flex flex-col items-center gap-2 text-[var(--text-secondary)] hover:text-white"
                    >
                      <Activity className="h-5 w-5" />
                      <span className="text-sm font-medium">{exercise.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Selected Exercise for Quick Logging */}
            {selectedExercise && (
              <Card className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[var(--text-secondary)]">Selected Exercise</p>
                    <p className="text-xl font-semibold text-white">{selectedExercise.name}</p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setSelectedExercise(null)}
                    className="h-10 w-10"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[var(--text-secondary)] text-sm">Muscle Group</p>
                      <p className="text-[var(--text-primary)]">{selectedExercise.muscle_group}</p>
                    </div>
                    <div>
                      <p className="text-[var(--text-secondary)] text-sm">Equipment</p>
                      <p className="text-[var(--text-primary)]">{selectedExercise.equipment_type || 'Bodyweight'}</p>
                    </div>
                  </div>

                  {/* Quick Set Logging */}
                  <div className="space-y-4">
                    <Button
                      onClick={addSetToSelectedExercise}
                      className="w-full h-12 text-lg font-semibold"
                      disabled={!quickSession}
                    >
                      ⚡ Log Set
                      {timerRunning && (
                        <span className="ml-2">
                          {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                        </span>
                      )}
                    </Button>
                  </div>

                  {/* Rest Timer Display */}
                  {restTimerRunning && (
                    <div className="text-center">
                      <p className="text-[var(--text-secondary)] text-sm">Rest Time</p>
                      <p className="text-4xl font-semibold text-[var(--accent)]">
                        {String(restTimer).padStart(2, '0')}
                      </p>
                      <p className="text-[var(--text-secondary)] text-sm">seconds</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Exercise Search */}
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">Exercise Library</p>
                  <Button variant="outline" size="sm">
                    <Zap className="h-4 w-4" /> Quick Add
                  </Button>
                </div>
                <Input
                  placeholder="Search exercises..."
                  className="mb-4"
                />
                <div className="grid gap-2 md:grid-cols-3">
                  {/* Show some common exercises for quick access */}
                  {exercises.slice(0, 9).map((exercise) => (
                    <Button
                      key={exercise.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleExerciseSelect(exercise)}
                      className="flex flex-col items-center gap-2 text-[var(--text-secondary)] hover:text-white"
                    >
                      <Dumbbell className="h-4 w-4" />
                      <span className="text-xs text-[var(--text-secondary)]">{exercise.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Controls */}
        {quickSession && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Button
                  onClick={timerRunning ? stopTimer : startTimer}
                  className="h-10 w-10"
                >
                  {timerRunning ? <RotateCw className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={resetTimer}
                  className="h-10 w-10 text-[var(--text-secondary)] hover:text-[var(--accent)]"
                >
                  <span className="text-xs">Reset</span>
                </Button>
              </div>
              <Button
                onClick={async () => {
                  stopTimer();
                  stopRestTimer();
                  navigate('/workouts');
                }}
                className="w-full sm:w-auto"
              >
                Finish Session
              </Button>
            </div>
          </div>
        )}
      </div>

      <Toaster position="top-right" />
    </PageWrapper>
  );
}