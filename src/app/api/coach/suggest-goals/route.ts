import { NextResponse } from 'next/server';
import { Exercise, Goal } from '@/types/database';

interface SuggestGoalsRequest {
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  benchmarkExercises: Exercise[];
  currentMaxes: Record<string, { weight: number; reps: number }>;
}

// Standard progression rates based on fitness level (per month)
const PROGRESSION_RATES = {
  beginner: {
    upper: 10, // lbs per month
    lower: 15, // lbs per month
  },
  intermediate: {
    upper: 5,
    lower: 7.5,
  },
  advanced: {
    upper: 2.5,
    lower: 5,
  },
};

// Time frames for goals (in months)
const GOAL_TIMEFRAMES = {
  beginner: 3, // 3 months for beginners
  intermediate: 4, // 4 months for intermediate
  advanced: 6, // 6 months for advanced
};

export async function POST(request: Request) {
  try {
    const { fitnessLevel, benchmarkExercises, currentMaxes } = await request.json() as SuggestGoalsRequest;

    const suggestedGoals: Partial<Goal>[] = [];
    const timeframeMonths = GOAL_TIMEFRAMES[fitnessLevel];
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + timeframeMonths);

    for (const exercise of benchmarkExercises) {
      const current = currentMaxes[exercise.id];

      // Determine if it's an upper or lower body exercise
      const isLowerBody = exercise.muscle_groups.some((mg) =>
        ['quads', 'hamstrings', 'glutes'].includes(mg)
      );

      const monthlyProgress = isLowerBody
        ? PROGRESSION_RATES[fitnessLevel].lower
        : PROGRESSION_RATES[fitnessLevel].upper;

      // Calculate target weight
      const startingWeight = current?.weight || getDefaultStartingWeight(exercise.name, fitnessLevel);
      const targetWeight = startingWeight + (monthlyProgress * timeframeMonths);

      // Calculate target reps (usually aim for 5 reps on main lifts)
      const startingReps = current?.reps || 5;
      const targetReps = exercise.name.includes('Curl') ? 10 : 5;

      suggestedGoals.push({
        exercise_id: exercise.id,
        target_weight: Math.round(targetWeight / 2.5) * 2.5, // Round to nearest 2.5
        target_reps: targetReps,
        target_date: targetDate.toISOString().split('T')[0],
        starting_weight: startingWeight,
        starting_reps: startingReps,
        status: 'active',
        ai_suggested: true,
      });
    }

    return NextResponse.json(suggestedGoals);
  } catch (error) {
    console.error('Error suggesting goals:', error);
    return NextResponse.json(
      { error: 'Failed to suggest goals' },
      { status: 500 }
    );
  }
}

function getDefaultStartingWeight(exerciseName: string, fitnessLevel: string): number {
  // Default starting weights based on exercise and fitness level
  const defaults: Record<string, Record<string, number>> = {
    'Bench Press': { beginner: 95, intermediate: 155, advanced: 225 },
    'Squat': { beginner: 95, intermediate: 185, advanced: 275 },
    'Deadlift': { beginner: 135, intermediate: 225, advanced: 315 },
    'Overhead Press': { beginner: 65, intermediate: 95, advanced: 135 },
    'Barbell Row': { beginner: 95, intermediate: 135, advanced: 185 },
    'Barbell Curl': { beginner: 45, intermediate: 65, advanced: 95 },
  };

  return defaults[exerciseName]?.[fitnessLevel] || 45;
}
