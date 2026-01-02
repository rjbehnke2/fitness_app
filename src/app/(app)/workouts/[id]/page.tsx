'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, MapPin, Trash2, Dumbbell } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal } from '@/components/ui';
import { getFullWorkoutDetails, deleteWorkoutSession } from '@/lib/services/workouts';
import { WorkoutSession, WorkoutExercise, ExerciseSet, Exercise } from '@/types/database';

interface FullWorkoutDetails {
  session: WorkoutSession;
  exercises: (WorkoutExercise & { exercise: Exercise; sets: ExerciseSet[] })[];
}

export default function WorkoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [workout, setWorkout] = useState<FullWorkoutDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadWorkout() {
      if (!params.id) return;

      try {
        const data = await getFullWorkoutDetails(params.id as string);
        setWorkout(data as FullWorkoutDetails);
      } catch (error) {
        console.error('Error loading workout:', error);
      } finally {
        setLoading(false);
      }
    }

    loadWorkout();
  }, [params.id]);

  const handleDelete = async () => {
    if (!workout) return;

    setDeleting(true);
    try {
      await deleteWorkoutSession(workout.session.id);
      router.push('/workouts');
    } catch (error) {
      console.error('Error deleting workout:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Workout not found</p>
        <Link href="/workouts">
          <Button className="mt-4">Back to Workouts</Button>
        </Link>
      </div>
    );
  }

  const { session, exercises } = workout;

  // Calculate total volume
  const totalVolume = exercises.reduce((total, ex) => {
    return total + ex.sets.reduce((setTotal, set) => {
      return setTotal + (set.weight || 0) * (set.reps || 0);
    }, 0);
  }, 0);

  const totalSets = exercises.reduce((total, ex) => total + ex.sets.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/workouts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {format(new Date(session.date), 'EEEE, MMMM d, yyyy')}
            </h1>
            <div className="flex items-center gap-4 mt-1 text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {session.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {session.duration_minutes} min
              </span>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => setDeleteModalOpen(true)}>
          <Trash2 className="w-4 h-4 mr-2 text-red-500" />
          Delete
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="bordered">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {exercises.length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Exercises</p>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalSets}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Sets</p>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalVolume.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Volume (lbs)</p>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {session.duration_minutes}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Duration (min)</p>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {session.notes && (
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">{session.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Exercises */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            Exercises
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {exercises.map((ex, index) => {
              const exerciseVolume = ex.sets.reduce(
                (total, set) => total + (set.weight || 0) * (set.reps || 0),
                0
              );
              const maxWeight = Math.max(...ex.sets.map((s) => s.weight || 0));

              return (
                <div
                  key={ex.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {ex.exercise.name}
                        </h3>
                        <div className="flex gap-2 mt-1">
                          {ex.exercise.muscle_groups.slice(0, 3).map((mg) => (
                            <Badge key={mg} variant="default" size="sm">
                              {mg}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                      <p>Max: {maxWeight} lbs</p>
                      <p>Volume: {exerciseVolume.toLocaleString()} lbs</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 dark:text-gray-400">
                          <th className="pb-2 pr-4">Set</th>
                          <th className="pb-2 pr-4">Weight</th>
                          <th className="pb-2 pr-4">Reps</th>
                          <th className="pb-2">Volume</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ex.sets.map((set) => (
                          <tr
                            key={set.id}
                            className="border-t border-gray-200 dark:border-gray-700"
                          >
                            <td className="py-2 pr-4 text-gray-900 dark:text-white">
                              {set.set_number}
                            </td>
                            <td className="py-2 pr-4 text-gray-900 dark:text-white">
                              {set.weight} lbs
                            </td>
                            <td className="py-2 pr-4 text-gray-900 dark:text-white">
                              {set.reps}
                            </td>
                            <td className="py-2 text-gray-900 dark:text-white">
                              {((set.weight || 0) * (set.reps || 0)).toLocaleString()} lbs
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Workout"
        size="sm"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete this workout? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Delete Workout
          </Button>
        </div>
      </Modal>
    </div>
  );
}
