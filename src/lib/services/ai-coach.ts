import { Exercise, MuscleGroup, SuggestedWorkout, NutritionAdvice, WeeklySummary, CoachSummary, Goal } from '@/types/database';

interface WorkoutContext {
  location: 'home' | 'gym';
  availableEquipment: string[];
  duration: number;
  recentMuscleGroups: Record<MuscleGroup, { lastWorked: string; count: number }>;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goals: Goal[];
  weekNumber: number;
}

interface ProgressData {
  workoutsCompleted: number;
  totalDuration: number;
  muscleGroupsWorked: Record<string, number>;
  benchmarkProgress: {
    exercise: string;
    startWeight: number;
    currentWeight: number;
    targetWeight: number;
    onTrack: boolean;
  }[];
}

// Generate a workout suggestion using AI
export async function generateWorkoutSuggestion(
  context: WorkoutContext,
  availableExercises: Exercise[]
): Promise<SuggestedWorkout> {
  const response = await fetch('/api/coach/workout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context, availableExercises }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate workout suggestion');
  }

  return response.json();
}

// Generate nutrition advice
export async function generateNutritionAdvice(
  workoutType: 'strength' | 'cardio' | 'mixed',
  workoutDuration: number,
  timeOfDay: 'morning' | 'afternoon' | 'evening',
  fitnessGoal: 'muscle_gain' | 'fat_loss' | 'maintenance'
): Promise<NutritionAdvice> {
  const response = await fetch('/api/coach/nutrition', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workoutType, workoutDuration, timeOfDay, fitnessGoal }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate nutrition advice');
  }

  return response.json();
}

// Generate weekly summary
export async function generateWeeklySummary(
  weekStart: string,
  weekEnd: string,
  progressData: ProgressData,
  goals: Goal[]
): Promise<WeeklySummary> {
  const response = await fetch('/api/coach/weekly-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weekStart, weekEnd, progressData, goals }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate weekly summary');
  }

  return response.json();
}

// Generate coach summary (overall assessment)
export async function generateCoachSummary(
  progressData: ProgressData,
  goals: Goal[],
  weeksOfData: number
): Promise<CoachSummary> {
  const response = await fetch('/api/coach/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ progressData, goals, weeksOfData }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate coach summary');
  }

  return response.json();
}

// Suggest initial goals based on fitness level
export async function suggestInitialGoals(
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced',
  benchmarkExercises: Exercise[],
  currentMaxes: Record<string, { weight: number; reps: number }>
): Promise<Partial<Goal>[]> {
  const response = await fetch('/api/coach/suggest-goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fitnessLevel, benchmarkExercises, currentMaxes }),
  });

  if (!response.ok) {
    throw new Error('Failed to suggest goals');
  }

  return response.json();
}

// Helper to determine which muscle groups need rest
export function getMuscleGroupRecoveryStatus(
  recentWorkouts: { date: string; muscleGroups: MuscleGroup[] }[]
): Record<MuscleGroup, { daysRested: number; recovered: boolean }> {
  const today = new Date();
  const recoveryTime: Record<MuscleGroup, number> = {
    chest: 2,
    back: 2,
    shoulders: 2,
    biceps: 1,
    triceps: 1,
    forearms: 1,
    core: 1,
    quads: 2,
    hamstrings: 2,
    glutes: 2,
    calves: 1,
    full_body: 2,
  };

  const result: Record<MuscleGroup, { daysRested: number; recovered: boolean }> = {} as Record<MuscleGroup, { daysRested: number; recovered: boolean }>;

  const allMuscleGroups: MuscleGroup[] = [
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
    'core', 'quads', 'hamstrings', 'glutes', 'calves', 'full_body'
  ];

  // Initialize with "fully recovered"
  allMuscleGroups.forEach((mg) => {
    result[mg] = { daysRested: 7, recovered: true };
  });

  // Check recent workouts
  recentWorkouts.forEach((workout) => {
    const workoutDate = new Date(workout.date);
    const daysDiff = Math.floor((today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));

    workout.muscleGroups.forEach((mg) => {
      if (daysDiff < result[mg].daysRested) {
        result[mg] = {
          daysRested: daysDiff,
          recovered: daysDiff >= recoveryTime[mg],
        };
      }
    });
  });

  return result;
}

// Calculate progressive overload suggestions
export function calculateProgressiveOverload(
  exerciseName: string,
  lastWeight: number,
  lastReps: number,
  targetReps: number,
  weekNumber: number,
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced'
): { weight: number; reps: number } {
  // Progressive overload logic based on fitness level
  const weeklyIncreaseRate = {
    beginner: 0.05, // 5% weekly increase
    intermediate: 0.025, // 2.5% weekly increase
    advanced: 0.01, // 1% weekly increase
  };

  // If they hit target reps, suggest weight increase
  if (lastReps >= targetReps) {
    const increaseRate = weeklyIncreaseRate[fitnessLevel];
    const newWeight = Math.round(lastWeight * (1 + increaseRate) / 2.5) * 2.5; // Round to nearest 2.5
    return { weight: newWeight, reps: targetReps - 2 }; // Start with lower reps at new weight
  }

  // Otherwise, keep weight and aim for more reps
  return { weight: lastWeight, reps: Math.min(lastReps + 1, targetReps) };
}
