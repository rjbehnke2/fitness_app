import { createClient } from '@/lib/supabase/client';
import { Goal, InsertGoal, UpdateGoal } from '@/types/database';

export async function getGoals(status?: string): Promise<Goal[]> {
  const supabase = createClient();
  let query = supabase
    .from('goals')
    .select('*, exercise:exercises(*)')
    .order('target_date');

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getActiveGoals(): Promise<Goal[]> {
  return getGoals('active');
}

export async function getGoalById(id: string): Promise<Goal | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('goals')
    .select('*, exercise:exercises(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getGoalsByExercise(exerciseId: string): Promise<Goal[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('goals')
    .select('*, exercise:exercises(*)')
    .eq('exercise_id', exerciseId)
    .order('target_date');

  if (error) throw error;
  return data || [];
}

export async function createGoal(goal: InsertGoal): Promise<Goal> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('goals')
    .insert(goal)
    .select('*, exercise:exercises(*)')
    .single();

  if (error) throw error;
  return data;
}

export async function updateGoal(id: string, updates: UpdateGoal): Promise<Goal> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', id)
    .select('*, exercise:exercises(*)')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGoal(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('goals').delete().eq('id', id);

  if (error) throw error;
}

export async function markGoalAchieved(id: string): Promise<Goal> {
  return updateGoal(id, { status: 'achieved' });
}

export async function markGoalMissed(id: string): Promise<Goal> {
  return updateGoal(id, { status: 'missed' });
}

export async function cancelGoal(id: string): Promise<Goal> {
  return updateGoal(id, { status: 'cancelled' });
}

// Calculate progress towards a goal
export async function calculateGoalProgress(goal: Goal): Promise<{
  currentWeight: number | null;
  currentReps: number | null;
  weightProgress: number;
  repsProgress: number;
}> {
  const supabase = createClient();

  // Get the most recent progress record for this exercise
  const { data, error } = await supabase
    .from('progress_records')
    .select('max_weight, max_reps')
    .eq('exercise_id', goal.exercise_id)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

  const currentWeight = data?.max_weight ?? goal.starting_weight;
  const currentReps = data?.max_reps ?? goal.starting_reps;

  let weightProgress = 0;
  if (goal.target_weight && goal.starting_weight && currentWeight) {
    const totalDiff = goal.target_weight - goal.starting_weight;
    const currentDiff = currentWeight - goal.starting_weight;
    weightProgress = totalDiff > 0 ? Math.min(100, (currentDiff / totalDiff) * 100) : 0;
  }

  let repsProgress = 0;
  if (goal.target_reps && goal.starting_reps && currentReps) {
    const totalDiff = goal.target_reps - goal.starting_reps;
    const currentDiff = currentReps - goal.starting_reps;
    repsProgress = totalDiff > 0 ? Math.min(100, (currentDiff / totalDiff) * 100) : 0;
  }

  return {
    currentWeight,
    currentReps,
    weightProgress,
    repsProgress,
  };
}

// Check if any goals should be marked as missed (past target date)
export async function checkAndUpdateMissedGoals(): Promise<number> {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('goals')
    .update({ status: 'missed' })
    .eq('status', 'active')
    .lt('target_date', today)
    .select();

  if (error) throw error;
  return data?.length || 0;
}
