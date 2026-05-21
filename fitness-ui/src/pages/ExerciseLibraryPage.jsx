import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { getExercises, createExercise, updateExercise, deleteExercise } from '../api/exercises';
import { Toaster, toast } from 'react-hot-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2, Plus, Edit2 } from 'lucide-react';

export function ExerciseLibraryPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, push, pull, legs, core
  const [editOpen, setEditOpen] = useState(false);
  const [editExerciseId, setEditExerciseId] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const exerciseList = await getExercises();
      setExercises(exerciseList);
    } catch (error) {
      toast.error('Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredExercises = useMemo(() => {
    if (filter === 'all') return exercises;
    return exercises.filter(ex => ex.muscle_group === filter);
  }, [exercises, filter]);

  const handleDeleteExercise = async (exerciseId) => {
    if (!confirm('Are you sure you want to delete this exercise? This cannot be undone.')) return;

    try {
      await deleteExercise(exerciseId);
      toast.success('Exercise deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete exercise');
    }
  };

  // Create/Edit exercise form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1),
        muscle_group: z.enum(['push', 'pull', 'legs', 'core', 'other']),
        equipment_type: z.enum(['barbell', 'dumbbell', 'machine', 'bodyweight', 'kettlebell', 'other'])
      })
    ),
    defaultValues: {
      name: '',
      muscle_group: 'other',
      equipment_type: 'other'
    },
  });

  const onSubmitExercise = async (values) => {
    try {
      if (editExerciseId) {
        await updateExercise(editExerciseId, values);
        toast.success('Exercise updated');
      } else {
        await createExercise(values);
        toast.success('Exercise created');
      }
      setEditOpen(false);
      reset();
      loadData(); // Refresh exercises
    } catch (error) {
      toast.error('Failed to save exercise');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditExercise = (exercise) => {
    setEditExerciseId(exercise.id);
    setEditOpen(true);
    reset({
      name: exercise.name,
      muscle_group: exercise.muscle_group,
      equipment_type: exercise.equipment_type
    });
  };

  const handleSelectExercise = (exercise) => {
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
            <p className="section-label">Exercise Library</p>
            <h1 className="text-3xl font-semibold text-[var(--accent)]">Complete Exercise Database</h1>
            <p className="text-[var(--text-secondary)] max-w-xl">
              Browse, search, and manage your exercise library. Filter by muscle group or equipment type.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setEditOpen(true)} className="h-10 w-10">
              <Plus className="h-4 w-4" />
            </Button>
            {user?.email && user.email.includes('@admin') && (
              <Button variant="outline" size="sm">
                Import/Export
              </Button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm transition-all ${
              filter === 'all'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
            }`}
          >
            All
          </Button>
          <Button
            onClick={() => setFilter('push')}
            className={`px-4 py-2 rounded-full text-sm transition-all ${
              filter === 'push'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
            }`}
          >
            Push
          </Button>
          <Button
            onClick={() => setFilter('pull')}
            className={`px-4 py-2 rounded-full text-sm transition-all ${
              filter === 'pull'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
            }`}
          >
            Pull
          </Button>
          <Button
            onClick={() => setFilter('legs')}
            className={`px-4 py-2 rounded-full text-sm transition-all ${
              filter === 'legs'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
            }`}
          >
            Legs
          </Button>
          <Button
            onClick={() => setFilter('core')}
            className={`px-4 py-2 rounded-full text-sm transition-all ${
              filter === 'core'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
            }`}
          >
            Core
          </Button>
        </div>

        {/* Search bar */}
        <div className="space-y-4">
          <Input
            placeholder="Search exercises..."
            className="mb-4"
          />
          <p className="text-[var(--text-secondary)] text-sm">
            {filteredExercises.length} exercises found
          </p>
        </div>

        {/* Exercises grid */}
        <div className="grid gap-4 xl:grid-cols-[repeat(3,minmax(0,1fr))]">
          {filteredExercises.length === 0 ? (
            <Card className="col-span-3">
              <div className="text-center py-12">
                <p className="text-[var(--text-secondary)]">
                  No exercises found. Try a different filter or add some exercises.
                </p>
              </div>
            </Card>
          ) : (
            filteredExercises.map((exercise) => (
              <Card
                key={exercise.id}
                className="group hover:shadow-[0_0_20px_rgba(220,20,60,0.15)] hover:border-[var(--border-strong)] cursor-pointer"
                onClick={() => handleSelectExercise(exercise)}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white text-lg">{exercise.name}</p>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        exercise.muscle_group === 'push'
                          ? 'bg-green-600/20 text-green-400'
                          : exercise.muscle_group === 'pull'
                            ? 'bg-blue-600/20 text-blue-400'
                            : exercise.muscle_group === 'legs'
                              ? 'bg-purple-600/20 text-purple-400'
                              : exercise.muscle_group === 'core'
                                ? 'bg-red-600/20 text-red-400'
                                : 'bg-gray-600/20 text-gray-400'
                      }`}>
                        {exercise.muscle_group.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {user?.email && user.email.includes('@admin') && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditExercise(exercise);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteExercise(exercise.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                      {exercise.equipment_type}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mt-2">
                    Added to {exercise.session_exercises?.length || 0} workouts
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Selected Exercise Details */}
        {selectedExercise && (
          <Card className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text-secondary)]">Exercise Details</p>
                <p className="text-xl font-semibold text-white">{selectedExercise.name}</p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setSelectedExercise(null)}
                className="h-10 w-10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="space-y-4">
                <p className="font-semibold text-white">Basic Info</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <p className="text-[var(--text-secondary)]">Name</p>
                    <p className="text-[var(--text-primary)]">{selectedExercise.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-[var(--text-secondary)]">Muscle Group</p>
                    <p className="text-[var(--text-primary)]">{selectedExercise.muscle_group}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-[var(--text-secondary)]">Equipment Type</p>
                    <p className="text-[var(--text-primary)]">{selectedExercise.equipment_type}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="font-semibold text-white">Usage Stats</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <p className="text-[var(--text-secondary)]">Workouts Used In</p>
                    <p className="text-[var(--text-primary)]">{selectedExercise.session_exercises?.length || 0}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-[var(--text-secondary)]">Total Sets Logged</p>
                    <p className="text-[var(--text-primary)]">
                      {selectedExercise.session_exercises?.reduce((total, se) => total + (se.sets?.length || 0), 0) || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {user?.email && user.email.includes('@admin') && (
              <div className="mt-6">
                <Button
                  onClick={() => {
                    handleEditExercise(selectedExercise);
                    setSelectedExercise(null);
                  }}
                  className="w-full"
                >
                  Edit Exercise
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Create/Edit Exercise Modal */}
      <Modal open={editOpen} onClose={() => {
        setEditOpen(false);
        setEditExerciseId(null);
        reset();
      }} title={editExerciseId ? 'Edit Exercise' : 'Add New Exercise'}>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmitExercise)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              placeholder="Exercise name"
              {...register('name')}
            />

            <div className="space-y-4">
              <p className="font-semibold text-white mb-2">Muscle Group</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  {value: 'push', label: 'Push'},
                  {value: 'pull', label: 'Pull'},
                  {value: 'legs', label: 'Legs'},
                  {value: 'core', label: 'Core'},
                  {value: 'other', label: 'Other'}
                ].map((group) => (
                  <label key={group.value} className="flex items-center gap-3">
                    <input
                      type="radio"
                      value={group.value}
                      checked={register('muscle_group').value === group.value}
                      onChange={() => {}}
                      className="h-4 w-4 text-[var(--accent)] rounded-border"
                    />
                    <span className="text-[var(--text-primary)]">{group.label}</span>
                  </label>
                ))
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="font-semibold text-white mb-2">Equipment Type</p>
            <div className="grid gap-2 sm:grid-cols-2">
              [
                {value: 'barbell', label: 'Barbell'},
                {value: 'dumbbell', label: 'Dumbbell'},
                {value: 'machine', label: 'Machine'},
                {value: 'bodyweight', label: 'Bodyweight'},
                {value: 'kettlebell', label: 'Kettlebell'},
                {value: 'other', label: 'Other'}
              ].map((equip) => (
                <label key={equip.value} className="flex items-center gap-3">
                  <input
                    type="radio"
                    value={equip.value}
                    checked={register('equipment_type').value === equip.value}
                    onChange={() => {}}
                    className="h-4 w-4 text-[var(--accent)] rounded-border"
                  />
                  <span className="text-[var(--text-primary)]">{equip.label}</span>
                </label>
              ))
            </div>
          </div>

          {Object.values(errors)[0] && (
            <p className="text-sm text-[var(--accent)]">
              {Object.values(errors)[0].message}
            </p>
          )}

          <Button
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Saving...' : 'Save Exercise'}
          </Button>
        </form>
      </Modal>

      <Toaster position="top-right" />
    </PageWrapper>
  );
}