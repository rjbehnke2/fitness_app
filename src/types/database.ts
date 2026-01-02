// Database types for the fitness tracking app

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  fitness_level: 'beginner' | 'intermediate' | 'advanced';
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  home_equipment: string[];
  gym_equipment: string[];
  home_workout_duration: number; // in minutes
  gym_workout_duration: number; // in minutes
  preferred_workout_days: number[]; // 0-6 for Sunday-Saturday
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'compound';
  muscle_groups: MuscleGroup[];
  equipment_required: string[];
  is_benchmark: boolean;
  description: string | null;
  created_at: string;
}

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'full_body';

export interface WorkoutSession {
  id: string;
  user_id: string;
  date: string;
  location: 'home' | 'gym';
  duration_minutes: number;
  notes: string | null;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_session_id: string;
  exercise_id: string;
  exercise?: Exercise;
  order_index: number;
  created_at: string;
}

export interface ExerciseSet {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  reps: number | null;
  weight: number | null; // in lbs or kg based on user preference
  duration_seconds: number | null; // for timed exercises
  distance_meters: number | null; // for cardio exercises
  completed: boolean;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  exercise_id: string;
  exercise?: Exercise;
  target_weight: number | null;
  target_reps: number | null;
  target_date: string;
  starting_weight: number | null;
  starting_reps: number | null;
  status: 'active' | 'achieved' | 'missed' | 'cancelled';
  ai_suggested: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProgressRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  exercise?: Exercise;
  date: string;
  max_weight: number | null;
  max_reps: number | null;
  total_volume: number | null; // weight * reps for all sets
  created_at: string;
}

export interface CoachAdvice {
  id: string;
  user_id: string;
  type: 'workout' | 'nutrition' | 'weekly_summary' | 'coach_summary' | 'goal_suggestion';
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// Types for API responses and requests

export interface SuggestedWorkout {
  exercises: {
    exercise: Exercise;
    sets: number;
    target_reps: number;
    target_weight?: number;
    notes?: string;
  }[];
  warmup: string[];
  cooldown: string[];
  estimated_duration: number;
  focus_areas: MuscleGroup[];
  reasoning: string;
}

export interface NutritionAdvice {
  pre_workout: {
    timing: string;
    foods: string[];
    hydration: string;
  };
  post_workout: {
    timing: string;
    foods: string[];
    hydration: string;
    supplements?: string[];
  };
  general_tips: string[];
}

export interface WeeklySummary {
  week_start: string;
  week_end: string;
  workouts_completed: number;
  total_duration_minutes: number;
  muscle_groups_worked: Record<MuscleGroup, number>;
  progress_highlights: string[];
  areas_for_improvement: string[];
  goals_status: {
    goal: Goal;
    on_track: boolean;
    message: string;
  }[];
}

export interface CoachSummary {
  overall_assessment: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  motivation: string;
}

// Database insert/update types
export type InsertUserSettings = Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>;
export type UpdateUserSettings = Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type InsertWorkoutSession = Omit<WorkoutSession, 'id' | 'created_at' | 'updated_at'>;
export type UpdateWorkoutSession = Partial<Omit<WorkoutSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type InsertWorkoutExercise = Omit<WorkoutExercise, 'id' | 'created_at' | 'exercise'>;
export type InsertExerciseSet = Omit<ExerciseSet, 'id' | 'created_at'>;

export type InsertGoal = Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'exercise'>;
export type UpdateGoal = Partial<Omit<Goal, 'id' | 'user_id' | 'exercise_id' | 'created_at' | 'updated_at' | 'exercise'>>;
