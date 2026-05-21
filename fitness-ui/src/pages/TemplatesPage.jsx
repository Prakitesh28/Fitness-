import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { getTemplates, startWorkoutFromTemplate, createTemplate } from '../api/templates';
import { getExercises } from '../api/exercises';
import Modal from '../components/ui/Modal';
import { Toaster, toast } from 'react-hot-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [templates, setTemplates] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, ppl, strength, beginner, my
  const [createOpen, setCreateOpen] = useState(false);
  const [templateTypes] = useState([
    { value: 'ppl', label: 'PPL' },
    { value: 'strength', label: 'Strength' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'custom', label: 'Custom' }
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [templateList, exerciseList] = await Promise.all([
        getTemplates(),
        getExercises()
      ]);
      setTemplates(templateList);
      setExercises(exerciseList);
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTemplates = useMemo(() => {
    if (filter === 'all') return templates;
    if (filter === 'my') return templates.filter(t => !t.is_global && t.user_id === user?.id);
    return templates.filter(t => t.type === filter && t.is_global);
  }, [templates, filter, user?.id]);

  const handleStartWorkout = async (templateId) => {
    try {
      const workout = await startWorkoutFromTemplate(templateId);
      toast.success('Workout started from template');
      navigate(`/workouts/${workout.id}`);
    } catch (error) {
      toast.error('Failed to start workout');
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  // Create template form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1),
        type: z.enum(['ppl', 'strength', 'beginner', 'custom']),
        description: z.string().optional(),
        exercises: z.array(z.number()).min(1, 'Select at least one exercise'),
      })
    ),
    defaultValues: {
      name: '',
      type: 'custom',
      description: '',
      exercises: [],
    },
  });

  const onCreateTemplate = async (values) => {
    try {
      await createTemplate(values);
      toast.success('Template created');
      setCreateOpen(false);
      reset();
      loadData(); // Refresh templates
    } catch (error) {
      toast.error('Failed to create template');
    } finally {
      setSubmitting(false);
    }
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
            <p className="section-label">Templates</p>
            <h1 className="text-3xl font-semibold text-[var(--accent)]">Workout Templates</h1>
            <p className="text-[var(--text-secondary)] max-w-xl">
              Choose from expert-designed workout programs or create your own custom templates.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="max-w-xs">
            Create Template
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-2 rounded-full text-sm transition-all ${
              filter === 'all'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
            }`}
          >
            All
          </Button>
          <Button
            onClick={() => handleFilterChange('ppl')}
            className={`px-4 py-2 rounded-full text-sm transition-all ${
              filter === 'ppl'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
            }`}
          >
            PPL
          </Button>
          <Button
            onClick={() => handleFilterChange('strength')}
            className={`px-4 py-2 rounded-full text-sm transition-all ${
              filter === 'strength'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
            }`}
          >
            Strength
          </Button>
          <Button
            onClick={() => handleFilterChange('beginner')}
            className={`px-4 py-2 rounded-full text-sm transition-all ${
              filter === 'beginner'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
            }`}
          >
            Beginner
          </Button>
          {user && (
            <Button
              onClick={() => handleFilterChange('my')}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                filter === 'my'
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
              }`}
            >
              My Templates
            </Button>
          )}
        </div>

        {/* Templates grid */}
        <div className="grid gap-6 xl:grid-cols-[repeat(3,minmax(0,1fr))]">
          {filteredTemplates.length === 0 ? (
            <Card className="col-span-3">
              <div className="text-center py-12">
                <p className="text-[var(--text-secondary)]">
                  No templates found. Try a different filter or create your first template.
                </p>
              </div>
            </Card>
          ) : (
            filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="group hover:shadow-[0_0_20px_rgba(220,20,60,0.15)] hover:border-[var(--border-strong)] cursor-pointer"
                onClick={() => {
                  // Navigate to template detail view or start workout?
                  // For now, let's start workout directly
                  handleStartWorkout(template.id);
                }}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white text-lg">{template.name}</p>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        template.type === 'ppl'
                          ? 'bg-green-600/20 text-green-400'
                          : template.type === 'strength'
                            ? 'bg-blue-600/20 text-blue-400'
                            : template.type === 'beginner'
                              ? 'bg-purple-600/20 text-purple-400'
                              : 'bg-gray-600/20 text-gray-400'
                      }`}>
                        {template.type.toUpperCase()}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartWorkout(template.id);
                      }}
                    >
                      Start
                    </Button>
                  </div>

                  {template.description && (
                    <p className="text-[var(--text-secondary)] text-sm line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-2">
                    {template.exercises?.map((exerciseId) => {
                      const exercise = exercises.find((ex) => ex.id === exerciseId);
                      if (!exercise) return null;
                      return (
                        <span
                          key={exerciseId}
                          className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]"
                        >
                          {exercise.name}
                        </span>
                      );
                    })}
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mt-2">
                    {template.exercises?.length} exercises
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create Template Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Template">
        <form className="space-y-6" onSubmit={handleSubmit(onCreateTemplate)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              placeholder="Template name"
              {...register('name')}
            />
            <Input
              placeholder="Description (optional)"
              {...register('description')}
            />
          </div>

          <div className="space-y-4">
            <p className="font-semibold text-white mb-2">Template Type</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {templateTypes.map((type) => (
                <label key={type.value} className="flex items-center gap-3">
                  <input
                    type="radio"
                    value={type.value}
                    checked={register('type').value === type.value}
                    onChange={(e) => {
                      // Let react-hook-form handle the change
                    }}
                    className="h-4 w-4 text-[var(--accent)] rounded-border"
                  />
                  <span className="text-[var(--text-primary)]">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="font-semibold text-white mb-2">Select Exercises</p>
            <div className="grid gap-3">
              {exercises.map((exercise) => (
                <label key={exercise.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    value={exercise.id}
                    checked={register('exercises').value?.includes(exercise.id) || false}
                    onChange={(e) => {
                      // Let react-hook-form handle the change via onChange
                    }}
                    className="h-4 w-4 text-[var(--accent)] rounded-border"
                  />
                  <span className="text-[var(--text-primary)]">{exercise.name}</span>
                </label>
              ))}
            </div>
            <p className="text-[var(--text-secondary)] text-sm mt-2">
              Hold Ctrl/Cmd to select multiple exercises
            </p>
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
            {isSubmitting ? 'Creating...' : 'Create Template'}
          </Button>
        </form>
      </Modal>

      <Toaster position="top-right" />
    </PageWrapper>
  );
}