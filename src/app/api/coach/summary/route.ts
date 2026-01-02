import { NextResponse } from 'next/server';
import { Goal, CoachSummary } from '@/types/database';

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

interface CoachSummaryRequest {
  progressData: ProgressData;
  goals: Goal[];
  weeksOfData: number;
}

export async function POST(request: Request) {
  try {
    const { progressData, goals, weeksOfData } = await request.json() as CoachSummaryRequest;

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    // Analyze workout consistency
    const avgWorkoutsPerWeek = progressData.workoutsCompleted / Math.max(weeksOfData, 1);

    if (avgWorkoutsPerWeek >= 4) {
      strengths.push('Excellent workout consistency');
    } else if (avgWorkoutsPerWeek >= 3) {
      strengths.push('Good workout frequency');
    } else if (avgWorkoutsPerWeek >= 2) {
      weaknesses.push('Workout frequency could be improved');
      recommendations.push('Try to add one more workout per week to accelerate your progress');
    } else {
      weaknesses.push('Low workout frequency is limiting your progress');
      recommendations.push('Consistency is key! Start with 3 workouts per week and build from there');
    }

    // Analyze muscle group balance
    const muscleGroups = progressData.muscleGroupsWorked;
    const pushMuscles = (muscleGroups['chest'] || 0) + (muscleGroups['shoulders'] || 0) + (muscleGroups['triceps'] || 0);
    const pullMuscles = (muscleGroups['back'] || 0) + (muscleGroups['biceps'] || 0);
    const legMuscles = (muscleGroups['quads'] || 0) + (muscleGroups['hamstrings'] || 0) + (muscleGroups['glutes'] || 0);

    if (pushMuscles > 0 && pullMuscles > 0 && legMuscles > 0) {
      if (Math.abs(pushMuscles - pullMuscles) <= 3 && legMuscles >= pushMuscles * 0.5) {
        strengths.push('Well-balanced training program');
      } else {
        if (pushMuscles > pullMuscles + 3) {
          weaknesses.push('Imbalance: Too much pushing, not enough pulling');
          recommendations.push('Add more back exercises like rows and pull-ups');
        } else if (pullMuscles > pushMuscles + 3) {
          weaknesses.push('Imbalance: More pushing exercises needed');
          recommendations.push('Include more chest and shoulder pressing movements');
        }
        if (legMuscles < pushMuscles * 0.5 && legMuscles < pullMuscles * 0.5) {
          weaknesses.push('Lower body training is underrepresented');
          recommendations.push('Don\'t skip leg day! Strong legs support all other lifts');
        }
      }
    }

    // Analyze benchmark progress
    const progressingBenchmarks = progressData.benchmarkProgress.filter(
      (bp) => bp.currentWeight > bp.startWeight
    );
    const stagnantBenchmarks = progressData.benchmarkProgress.filter(
      (bp) => bp.currentWeight <= bp.startWeight
    );
    const onTrackGoals = progressData.benchmarkProgress.filter((bp) => bp.onTrack);

    if (progressingBenchmarks.length === progressData.benchmarkProgress.length) {
      strengths.push('Making progress on all benchmark lifts');
    } else if (progressingBenchmarks.length >= progressData.benchmarkProgress.length * 0.5) {
      strengths.push(`Progressing on ${progressingBenchmarks.length} of ${progressData.benchmarkProgress.length} benchmark lifts`);
    }

    if (stagnantBenchmarks.length > 0) {
      const stagnantNames = stagnantBenchmarks.map((b) => b.exercise).join(', ');
      weaknesses.push(`Plateau on: ${stagnantNames}`);
      recommendations.push('Consider deloading or changing rep schemes for stagnant lifts');
      recommendations.push('Ensure adequate protein intake and sleep for recovery');
    }

    // Goals assessment
    const activeGoals = goals.filter((g) => g.status === 'active');
    const achievedGoals = goals.filter((g) => g.status === 'achieved');

    if (achievedGoals.length > 0) {
      strengths.push(`${achievedGoals.length} goal(s) achieved`);
    }

    if (onTrackGoals.length < activeGoals.length && activeGoals.length > 0) {
      const offTrackCount = activeGoals.length - onTrackGoals.length;
      recommendations.push(`${offTrackCount} goal(s) need more attention to stay on track`);
    }

    // Generate overall assessment
    let overallAssessment: string;
    const strengthCount = strengths.length;
    const weaknessCount = weaknesses.length;

    if (progressData.workoutsCompleted === 0) {
      overallAssessment = 'I don\'t have enough data yet to assess your progress. Start logging your workouts and I\'ll provide detailed feedback!';
    } else if (strengthCount >= 3 && weaknessCount <= 1) {
      overallAssessment = 'You\'re doing an excellent job! Your training is consistent, balanced, and producing results. Keep up the great work and stay focused on your goals.';
    } else if (strengthCount >= 2 && weaknessCount <= 2) {
      overallAssessment = 'You\'re making solid progress! There are a few areas to refine, but overall you\'re on the right track. Focus on the recommendations below to optimize your training.';
    } else if (strengthCount >= 1) {
      overallAssessment = 'You have some good habits in place, but there\'s room for improvement. Don\'t get discouraged - small consistent changes will lead to big results over time.';
    } else {
      overallAssessment = 'Let\'s work on building a solid foundation. Focus on consistency first - just showing up is half the battle. The recommendations below will help guide your journey.';
    }

    // Generate motivation
    const motivations = [
      'Remember: Progress isn\'t always linear. Trust the process and keep pushing!',
      'Every rep counts. You\'re building the strongest version of yourself.',
      'Consistency beats intensity. Show up every day and the results will follow.',
      'The only bad workout is the one that didn\'t happen. Keep moving forward!',
      'You\'re not just building muscle - you\'re building discipline, confidence, and resilience.',
      'Small progress is still progress. Celebrate your wins, no matter how small.',
      'Your future self will thank you for the work you put in today.',
    ];
    const motivation = motivations[Math.floor(Math.random() * motivations.length)];

    const summary: CoachSummary = {
      overall_assessment: overallAssessment,
      strengths,
      weaknesses,
      recommendations,
      motivation,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error generating coach summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate coach summary' },
      { status: 500 }
    );
  }
}
