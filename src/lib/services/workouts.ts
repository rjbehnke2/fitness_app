import { createClient } from '@/lib/supabase/client';
import {
  WorkoutSession,
  WorkoutExercise,
  ExerciseSet,
  InsertWorkoutSession,
  InsertWorkoutExercise,
  InsertExerciseSet,
  ProgressRecord,
} from '@/types/database';

// Workout Sessions
export async function getWorkoutSessions(limit = 10): Promise<WorkoutSession[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getWorkoutSessionById(id: string): Promise<WorkoutSession | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getWorkoutSessionsInRange(startDate: string, endDate: string): Promise<WorkoutSession[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert(session)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWorkoutSession(
  id: string,
  updates: Partial<InsertWorkoutSession>
): Promise<WorkoutSession> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workout_sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWorkoutSession(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('workout_sessions').delete().eq('id', id);

  if (error) throw error;
}

// Workout Exercises
export async function getWorkoutExercises(sessionId: string): Promise<(WorkoutExercise & { exercise: unknown })[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workout_exercises')
    .select('*, exercise:exercises(*)')
    .eq('workout_session_id', sessionId)
    .order('order_index');

  if (error) throw error;
  return data || [];
}

export async function addWorkoutExercise(exercise: InsertWorkoutExercise): Promise<WorkoutExercise> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workout_exercises')
    .insert(exercise)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWorkoutExercise(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('workout_exercises').delete().eq('id', id);

  if (error) throw error;
}

// Exercise Sets
export async function getExerciseSets(workoutExerciseId: string): Promise<ExerciseSet[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('exercise_sets')
    .select('*')
    .eq('workout_exercise_id', workoutExerciseId)
    .order('set_number');

  if (error) throw error;
  return data || [];
}

export async function addExerciseSet(set: InsertExerciseSet): Promise<ExerciseSet> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('exercise_sets')
    .insert(set)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateExerciseSet(
  id: string,
  updates: Partial<InsertExerciseSet>
): Promise<ExerciseSet> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('exercise_sets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteExerciseSet(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('exercise_sets').delete().eq('id', id);

  if (error) throw error;
}

// Progress Records
export async function getProgressRecords(
  exerciseId: string,
  limit = 30
): Promise<ProgressRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('progress_records')
    .select('*, exercise:exercises(*)')
    .eq('exercise_id', exerciseId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getRecentProgressForAllExercises(
  days = 30
): Promise<ProgressRecord[]> {
  const supabase = createClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('progress_records')
    .select('*, exercise:exercises(*)')
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function upsertProgressRecord(
  userId: string,
  exerciseId: string,
  date: string,
  maxWeight: number | null,
  maxReps: number | null,
  totalVolume: number | null
): Promise<ProgressRecord> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('progress_records')
    .upsert(
      {
        user_id: userId,
        exercise_id: exerciseId,
        date,
        max_weight: maxWeight,
        max_reps: maxReps,
        total_volume: totalVolume,
      },
      { onConflict: 'user_id,exercise_id,date' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get workout with full details
export async function getFullWorkoutDetails(sessionId: string) {
  const supabase = createClient();

  const { data: session, error: sessionError } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError) throw sessionError;

  const { data: exercises, error: exercisesError } = await supabase
    .from('workout_exercises')
    .select('*, exercise:exercises(*)')
    .eq('workout_session_id', sessionId)
    .order('order_index');

  if (exercisesError) throw exercisesError;

  // Get sets for all exercises
  const exerciseIds = exercises?.map((e) => e.id) || [];
  const { data: sets, error: setsError } = await supabase
    .from('exercise_sets')
    .select('*')
    .in('workout_exercise_id', exerciseIds)
    .order('set_number');

  if (setsError) throw setsError;

  // Group sets by workout exercise
  const setsMap = (sets || []).reduce((acc, set) => {
    if (!acc[set.workout_exercise_id]) {
      acc[set.workout_exercise_id] = [];
    }
    acc[set.workout_exercise_id].push(set);
    return acc;
  }, {} as Record<string, ExerciseSet[]>);

  return {
    session,
    exercises: (exercises || []).map((ex) => ({
      ...ex,
      sets: setsMap[ex.id] || [],
    })),
  };
}

// Count workouts in a given period
export async function countWorkoutsInPeriod(startDate: string, endDate: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('workout_sessions')
    .select('*', { count: 'exact', head: true })
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) throw error;
  return count || 0;
}

// Get muscle groups worked in a period
export async function getMuscleGroupsWorked(
  startDate: string,
  endDate: string
): Promise<Record<string, number>> {
  const supabase = createClient();

  const { data: sessions, error: sessionsError } = await supabase
    .from('workout_sessions')
    .select('id')
    .gte('date', startDate)
    .lte('date', endDate);

  if (sessionsError) throw sessionsError;

  if (!sessions || sessions.length === 0) return {};

  const sessionIds = sessions.map((s) => s.id);

  const { data: exercises, error: exercisesError } = await supabase
    .from('workout_exercises')
    .select('exercise:exercises(muscle_groups)')
    .in('workout_session_id', sessionIds);

  if (exercisesError) throw exercisesError;

  const muscleGroups: Record<string, number> = {};
  (exercises || []).forEach((ex) => {
    const exercise = ex.exercise as unknown as { muscle_groups: string[] } | null;
    if (exercise?.muscle_groups) {
      exercise.muscle_groups.forEach((mg: string) => {
        muscleGroups[mg] = (muscleGroups[mg] || 0) + 1;
      });
    }
  });

  return muscleGroups;
}
