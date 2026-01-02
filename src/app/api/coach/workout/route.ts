import { NextResponse } from 'next/server';
import { Exercise, MuscleGroup, SuggestedWorkout, Goal } from '@/types/database';

interface WorkoutContext {
  location: 'home' | 'gym';
  availableEquipment: string[];
  duration: number;
  recentMuscleGroups: Record<MuscleGroup, { lastWorked: string; count: number }>;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goals: Goal[];
  weekNumber: number;
}

export async function POST(request: Request) {
  try {
    const { context, availableExercises } = await request.json() as {
      context: WorkoutContext;
      availableExercises: Exercise[];
    };

    // Determine which muscle groups need work (recovered ones)
    const today = new Date();
    const recoveredMuscleGroups: MuscleGroup[] = [];
    const priorityMuscleGroups: MuscleGroup[] = [];

    const allMuscleGroups: MuscleGroup[] = [
      'chest', 'back', 'shoulders', 'biceps', 'triceps',
      'core', 'quads', 'hamstrings', 'glutes', 'calves'
    ];

    // Find recovered muscle groups (at least 48 hours for major, 24 for minor)
    allMuscleGroups.forEach((mg) => {
      const info = context.recentMuscleGroups[mg];
      if (!info || !info.lastWorked) {
        recoveredMuscleGroups.push(mg);
        priorityMuscleGroups.push(mg);
      } else {
        const lastWorked = new Date(info.lastWorked);
        const daysSince = Math.floor((today.getTime() - lastWorked.getTime()) / (1000 * 60 * 60 * 24));
        const recoveryDays = ['quads', 'hamstrings', 'glutes', 'back', 'chest'].includes(mg) ? 2 : 1;

        if (daysSince >= recoveryDays) {
          recoveredMuscleGroups.push(mg);
          // Prioritize muscle groups that haven't been worked recently
          if (daysSince >= 4) {
            priorityMuscleGroups.push(mg);
          }
        }
      }
    });

    // Filter exercises based on available equipment
    const filteredExercises = availableExercises.filter((ex) => {
      if (ex.equipment_required.length === 0) return true;
      return ex.equipment_required.every((eq) => context.availableEquipment.includes(eq));
    });

    // Select exercises targeting recovered muscle groups
    const selectedExercises: {
      exercise: Exercise;
      sets: number;
      target_reps: number;
      target_weight?: number;
      notes?: string;
    }[] = [];

    const targetExerciseCount = context.duration <= 15 ? 4 : context.duration <= 30 ? 6 : 8;
    const focusAreas: MuscleGroup[] = [];

    // Prioritize compound movements first
    const compoundExercises = filteredExercises.filter(
      (ex) => ex.category === 'compound' &&
      ex.muscle_groups.some((mg) => recoveredMuscleGroups.includes(mg as MuscleGroup))
    );

    // Add 2-3 compound exercises
    const shuffledCompounds = compoundExercises.sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(3, shuffledCompounds.length) && selectedExercises.length < targetExerciseCount; i++) {
      const ex = shuffledCompounds[i];
      const sets = context.fitnessLevel === 'beginner' ? 3 : context.fitnessLevel === 'intermediate' ? 4 : 5;
      const reps = ex.is_benchmark ? 5 : 8;

      selectedExercises.push({
        exercise: ex,
        sets,
        target_reps: reps,
        notes: ex.is_benchmark ? 'Benchmark exercise - track your progress!' : undefined,
      });

      ex.muscle_groups.forEach((mg) => {
        if (!focusAreas.includes(mg as MuscleGroup)) {
          focusAreas.push(mg as MuscleGroup);
        }
      });
    }

    // Fill with isolation exercises for the same muscle groups
    const isolationExercises = filteredExercises.filter(
      (ex) => ex.category === 'strength' &&
      ex.muscle_groups.some((mg) => focusAreas.includes(mg as MuscleGroup)) &&
      !selectedExercises.some((sel) => sel.exercise.id === ex.id)
    );

    const shuffledIsolations = isolationExercises.sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffledIsolations.length && selectedExercises.length < targetExerciseCount; i++) {
      const ex = shuffledIsolations[i];
      selectedExercises.push({
        exercise: ex,
        sets: 3,
        target_reps: 12,
      });
    }

    // Add bodyweight/core work if time permits
    if (selectedExercises.length < targetExerciseCount) {
      const coreExercises = filteredExercises.filter(
        (ex) => ex.muscle_groups.includes('core') &&
        !selectedExercises.some((sel) => sel.exercise.id === ex.id)
      );
      if (coreExercises.length > 0) {
        const coreEx = coreExercises[Math.floor(Math.random() * coreExercises.length)];
        selectedExercises.push({
          exercise: coreEx,
          sets: 3,
          target_reps: 15,
        });
      }
    }

    // Generate warmup based on focus areas
    const warmup: string[] = ['5 minutes light cardio (jumping jacks, high knees, or walking)'];
    if (focusAreas.some((mg) => ['chest', 'shoulders', 'triceps'].includes(mg))) {
      warmup.push('Arm circles and shoulder rotations');
      warmup.push('10 push-ups (or wall push-ups)');
    }
    if (focusAreas.some((mg) => ['quads', 'hamstrings', 'glutes'].includes(mg))) {
      warmup.push('Leg swings and hip circles');
      warmup.push('10 bodyweight squats');
    }
    if (focusAreas.some((mg) => ['back', 'biceps'].includes(mg))) {
      warmup.push('Arm swings and thoracic rotations');
    }

    // Generate cooldown
    const cooldown: string[] = [
      '5 minutes of stretching for worked muscle groups',
      'Deep breathing exercises',
      'Drink water and have a protein-rich snack within 30 minutes',
    ];

    // Calculate estimated duration
    const avgTimePerExercise = context.fitnessLevel === 'beginner' ? 6 : 8; // minutes including rest
    const estimatedDuration = selectedExercises.length * avgTimePerExercise + 10; // +10 for warmup/cooldown

    // Generate reasoning
    const reasoning = `Today's workout focuses on ${focusAreas.slice(0, 3).join(', ')} based on your recovery status. ` +
      `These muscle groups are well-rested and ready for training. ` +
      `The workout includes ${selectedExercises.filter((e) => e.exercise.category === 'compound').length} compound movements ` +
      `and ${selectedExercises.filter((e) => e.exercise.category === 'strength').length} isolation exercises ` +
      `to maximize your ${context.duration}-minute ${context.location} session.`;

    const workout: SuggestedWorkout = {
      exercises: selectedExercises,
      warmup,
      cooldown,
      estimated_duration: estimatedDuration,
      focus_areas: focusAreas,
      reasoning,
    };

    return NextResponse.json(workout);
  } catch (error) {
    console.error('Error generating workout:', error);
    return NextResponse.json(
      { error: 'Failed to generate workout suggestion' },
      { status: 500 }
    );
  }
}
