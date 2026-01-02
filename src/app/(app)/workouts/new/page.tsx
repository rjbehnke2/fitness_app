'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, Trash2, Save, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { createWorkoutSession, addWorkoutExercise, addExerciseSet, upsertProgressRecord } from '@/lib/services/workouts';
import { getExercises } from '@/lib/services/exercises';
import { getUserSettings } from '@/lib/services/settings';
import { Exercise, UserSettings } from '@/types/database';

const workoutSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  location: z.enum(['home', 'gym']),
  duration_minutes: z.number().min(1, 'Duration must be at least 1 minute'),
  notes: z.string().optional(),
});

type WorkoutFormData = z.infer<typeof workoutSchema>;

interface ExerciseEntry {
  id: string;
  exercise_id: string;
  sets: { reps: number; weight: number; completed: boolean }[];
}

export default function NewWorkoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [exerciseEntries, setExerciseEntries] = useState<ExerciseEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<WorkoutFormData>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      location: 'gym',
      duration_minutes: 45,
    },
  });

  const location = watch('location');

  useEffect(() => {
    async function loadData() {
      try {
        const [exerciseData, settingsData] = await Promise.all([
          getExercises(),
          getUserSettings(),
        ]);
        setExercises(exerciseData);
        setSettings(settingsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter exercises based on location and available equipment
  const availableExercises = exercises.filter((ex) => {
    if (ex.equipment_required.length === 0) return true;

    const equipment = location === 'home'
      ? settings?.home_equipment || []
      : settings?.gym_equipment || [];

    return ex.equipment_required.every((eq) => equipment.includes(eq));
  });

  const addExercise = () => {
    if (availableExercises.length === 0) return;

    setExerciseEntries([
      ...exerciseEntries,
      {
        id: crypto.randomUUID(),
        exercise_id: availableExercises[0].id,
        sets: [{ reps: 10, weight: 0, completed: true }],
      },
    ]);
  };

  const removeExercise = (id: string) => {
    setExerciseEntries(exerciseEntries.filter((e) => e.id !== id));
  };

  const updateExercise = (id: string, exerciseId: string) => {
    setExerciseEntries(
      exerciseEntries.map((e) =>
        e.id === id ? { ...e, exercise_id: exerciseId } : e
      )
    );
  };

  const addSet = (exerciseId: string) => {
    setExerciseEntries(
      exerciseEntries.map((e) => {
        if (e.id === exerciseId) {
          const lastSet = e.sets[e.sets.length - 1];
          return {
            ...e,
            sets: [...e.sets, { reps: lastSet?.reps || 10, weight: lastSet?.weight || 0, completed: true }],
          };
        }
        return e;
      })
    );
  };

  const removeSet = (exerciseId: string, setIndex: number) => {
    setExerciseEntries(
      exerciseEntries.map((e) => {
        if (e.id === exerciseId && e.sets.length > 1) {
          return {
            ...e,
            sets: e.sets.filter((_, i) => i !== setIndex),
          };
        }
        return e;
      })
    );
  };

  const updateSet = (
    exerciseId: string,
    setIndex: number,
    field: 'reps' | 'weight' | 'completed',
    value: number | boolean
  ) => {
    setExerciseEntries(
      exerciseEntries.map((e) => {
        if (e.id === exerciseId) {
          return {
            ...e,
            sets: e.sets.map((s, i) =>
              i === setIndex ? { ...s, [field]: value } : s
            ),
          };
        }
        return e;
      })
    );
  };

  const onSubmit = async (data: WorkoutFormData) => {
    if (!user || exerciseEntries.length === 0) return;

    setSaving(true);
    try {
      // Create workout session
      const session = await createWorkoutSession({
        user_id: user.id,
        date: data.date,
        location: data.location,
        duration_minutes: data.duration_minutes,
        notes: data.notes || null,
        ai_generated: false,
      });

      // Add exercises and sets
      for (let i = 0; i < exerciseEntries.length; i++) {
        const entry = exerciseEntries[i];

        const workoutExercise = await addWorkoutExercise({
          workout_session_id: session.id,
          exercise_id: entry.exercise_id,
          order_index: i,
        });

        // Calculate max weight and total volume for progress tracking
        let maxWeight = 0;
        let maxReps = 0;
        let totalVolume = 0;

        for (let j = 0; j < entry.sets.length; j++) {
          const set = entry.sets[j];

          await addExerciseSet({
            workout_exercise_id: workoutExercise.id,
            set_number: j + 1,
            reps: set.reps,
            weight: set.weight,
            duration_seconds: null,
            distance_meters: null,
            completed: set.completed,
          });

          if (set.completed) {
            maxWeight = Math.max(maxWeight, set.weight);
            maxReps = Math.max(maxReps, set.reps);
            totalVolume += set.weight * set.reps;
          }
        }

        // Update progress record for this exercise
        await upsertProgressRecord(
          user.id,
          entry.exercise_id,
          data.date,
          maxWeight,
          maxReps,
          totalVolume
        );
      }

      router.push(`/workouts/${session.id}`);
    } catch (error) {
      console.error('Error saving workout:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/workouts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Log Workout
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Workout Details */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Workout Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Date"
                type="date"
                error={errors.date?.message}
                {...register('date')}
              />

              <Select
                label="Location"
                options={[
                  { value: 'gym', label: 'Gym' },
                  { value: 'home', label: 'Home' },
                ]}
                {...register('location')}
              />

              <Input
                label="Duration (minutes)"
                type="number"
                min={1}
                error={errors.duration_minutes?.message}
                {...register('duration_minutes', { valueAsNumber: true })}
              />
            </div>

            <Input
              label="Notes (optional)"
              placeholder="How was your workout?"
              {...register('notes')}
            />
          </CardContent>
        </Card>

        {/* Exercises */}
        <Card variant="bordered">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Exercises</CardTitle>
            <Button type="button" variant="outline" onClick={addExercise}>
              <Plus className="w-4 h-4 mr-2" />
              Add Exercise
            </Button>
          </CardHeader>
          <CardContent>
            {exerciseEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No exercises added yet.</p>
                <Button type="button" className="mt-4" onClick={addExercise}>
                  Add Your First Exercise
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {exerciseEntries.map((entry, entryIndex) => {
                  const exercise = exercises.find((e) => e.id === entry.exercise_id);

                  return (
                    <div
                      key={entry.id}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            #{entryIndex + 1}
                          </span>
                          <select
                            value={entry.exercise_id}
                            onChange={(e) => updateExercise(entry.id, e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            {availableExercises.map((ex) => (
                              <option key={ex.id} value={ex.id}>
                                {ex.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExercise(entry.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>

                      {exercise?.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          {exercise.description}
                        </p>
                      )}

                      <div className="space-y-2">
                        <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                          <div className="col-span-2">Set</div>
                          <div className="col-span-4">Weight (lbs)</div>
                          <div className="col-span-4">Reps</div>
                          <div className="col-span-2"></div>
                        </div>

                        {entry.sets.map((set, setIndex) => (
                          <div
                            key={setIndex}
                            className="grid grid-cols-12 gap-2 items-center"
                          >
                            <div className="col-span-2 text-gray-700 dark:text-gray-300">
                              {setIndex + 1}
                            </div>
                            <div className="col-span-4">
                              <input
                                type="number"
                                min={0}
                                value={set.weight}
                                onChange={(e) =>
                                  updateSet(entry.id, setIndex, 'weight', Number(e.target.value))
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div className="col-span-4">
                              <input
                                type="number"
                                min={1}
                                value={set.reps}
                                onChange={(e) =>
                                  updateSet(entry.id, setIndex, 'reps', Number(e.target.value))
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div className="col-span-2 flex justify-end">
                              {entry.sets.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSet(entry.id, setIndex)}
                                  className="p-1 text-gray-400 hover:text-red-500"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addSet(entry.id)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Set
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link href="/workouts">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" loading={saving} disabled={exerciseEntries.length === 0}>
            <Save className="w-4 h-4 mr-2" />
            Save Workout
          </Button>
        </div>
      </form>
    </div>
  );
}
