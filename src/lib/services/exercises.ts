import { createClient } from '@/lib/supabase/client';
import { Exercise } from '@/types/database';

export async function getExercises(): Promise<Exercise[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getBenchmarkExercises(): Promise<Exercise[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('is_benchmark', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getExercisesByEquipment(equipment: string[]): Promise<Exercise[]> {
  const supabase = createClient();

  // Get exercises that require any of the available equipment or no equipment
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name');

  if (error) throw error;

  // Filter to exercises where all required equipment is available
  return (data || []).filter((exercise) => {
    if (exercise.equipment_required.length === 0) return true;
    return exercise.equipment_required.every((eq: string) => equipment.includes(eq));
  });
}

export async function getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .contains('muscle_groups', [muscleGroup])
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}
