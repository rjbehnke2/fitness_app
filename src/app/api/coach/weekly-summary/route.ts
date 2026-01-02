import { NextResponse } from 'next/server';
import { Goal, WeeklySummary, MuscleGroup } from '@/types/database';

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

interface WeeklySummaryRequest {
  weekStart: string;
  weekEnd: string;
  progressData: ProgressData;
  goals: Goal[];
}

export async function POST(request: Request) {
  try {
    const { weekStart, weekEnd, progressData, goals } = await request.json() as WeeklySummaryRequest;

    // Analyze workouts
    const progressHighlights: string[] = [];
    const areasForImprovement: string[] = [];

    // Workout frequency analysis
    if (progressData.workoutsCompleted >= 4) {
      progressHighlights.push(`Excellent consistency! You completed ${progressData.workoutsCompleted} workouts this week.`);
    } else if (progressData.workoutsCompleted >= 3) {
      progressHighlights.push(`Good work! You completed ${progressData.workoutsCompleted} workouts this week.`);
    } else if (progressData.workoutsCompleted >= 1) {
      areasForImprovement.push(`You completed ${progressData.workoutsCompleted} workout(s). Try to aim for at least 3 sessions next week.`);
    } else {
      areasForImprovement.push('No workouts logged this week. Let\'s get back on track next week!');
    }

    // Muscle group balance analysis
    const muscleGroups = progressData.muscleGroupsWorked;
    const upperBody = ['chest', 'back', 'shoulders', 'biceps', 'triceps'];
    const lowerBody = ['quads', 'hamstrings', 'glutes', 'calves'];

    const upperCount = upperBody.reduce((sum, mg) => sum + (muscleGroups[mg] || 0), 0);
    const lowerCount = lowerBody.reduce((sum, mg) => sum + (muscleGroups[mg] || 0), 0);

    if (upperCount > 0 && lowerCount > 0) {
      if (Math.abs(upperCount - lowerCount) <= 2) {
        progressHighlights.push('Great balance between upper and lower body training!');
      } else if (upperCount > lowerCount + 2) {
        areasForImprovement.push('Consider adding more lower body work for better balance.');
      } else {
        areasForImprovement.push('Consider adding more upper body work for better balance.');
      }
    }

    // Core training check
    if ((muscleGroups['core'] || 0) >= 2) {
      progressHighlights.push('Good core training frequency this week!');
    } else if (progressData.workoutsCompleted >= 2) {
      areasForImprovement.push('Try to include more core exercises in your routine.');
    }

    // Benchmark progress analysis
    progressData.benchmarkProgress.forEach((bp) => {
      if (bp.currentWeight > bp.startWeight) {
        progressHighlights.push(`${bp.exercise}: Increased from ${bp.startWeight}lbs to ${bp.currentWeight}lbs!`);
      }
    });

    // Goals status
    const goalsStatus = goals.map((goal) => {
      const benchmark = progressData.benchmarkProgress.find(
        (bp) => bp.exercise.toLowerCase() === (goal.exercise?.name || '').toLowerCase()
      );

      if (!benchmark) {
        return {
          goal,
          on_track: false,
          message: 'No recent data for this exercise. Keep training!',
        };
      }

      const daysToTarget = Math.ceil(
        (new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      const remainingWeight = (goal.target_weight || 0) - benchmark.currentWeight;
      const weeklyProgressNeeded = remainingWeight / (daysToTarget / 7);

      if (benchmark.onTrack) {
        return {
          goal,
          on_track: true,
          message: `On track! ${daysToTarget} days left to reach your goal of ${goal.target_weight}lbs.`,
        };
      } else {
        return {
          goal,
          on_track: false,
          message: `Need to increase by ${weeklyProgressNeeded.toFixed(1)}lbs/week to reach ${goal.target_weight}lbs in ${daysToTarget} days.`,
        };
      }
    });

    const summary: WeeklySummary = {
      week_start: weekStart,
      week_end: weekEnd,
      workouts_completed: progressData.workoutsCompleted,
      total_duration_minutes: progressData.totalDuration,
      muscle_groups_worked: muscleGroups as Record<MuscleGroup, number>,
      progress_highlights: progressHighlights,
      areas_for_improvement: areasForImprovement,
      goals_status: goalsStatus,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate weekly summary' },
      { status: 500 }
    );
  }
}
