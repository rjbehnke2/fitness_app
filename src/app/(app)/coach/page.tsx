'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Dumbbell, Home, Building, RefreshCw, Play, Clock, Target } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Tabs, TabsList, TabsTrigger } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getUserSettings } from '@/lib/services/settings';
import { getExercisesByEquipment } from '@/lib/services/exercises';
import { getWorkoutSessionsInRange, getMuscleGroupsWorked, createWorkoutSession, addWorkoutExercise, addExerciseSet } from '@/lib/services/workouts';
import { getActiveGoals } from '@/lib/services/goals';
import { generateWorkoutSuggestion, getMuscleGroupRecoveryStatus } from '@/lib/services/ai-coach';
import { UserSettings, SuggestedWorkout, Goal, MuscleGroup } from '@/types/database';
import { format, subDays } from 'date-fns';

export default function CoachPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [starting, setStarting] = useState(false);
  const [location, setLocation] = useState<'home' | 'gym'>('gym');
  const [suggestedWorkout, setSuggestedWorkout] = useState<SuggestedWorkout | null>(null);
  const [recoveryStatus, setRecoveryStatus] = useState<Record<MuscleGroup, { daysRested: number; recovered: boolean }> | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        const [settingsData, goalsData] = await Promise.all([
          getUserSettings(),
          getActiveGoals(),
        ]);

        setSettings(settingsData);
        setGoals(goalsData);

        // Get recent workouts to calculate recovery status
        const startDate = format(subDays(new Date(), 7), 'yyyy-MM-dd');
        const endDate = format(new Date(), 'yyyy-MM-dd');
        const recentWorkouts = await getWorkoutSessionsInRange(startDate, endDate);

        // Get muscle groups from recent workouts
        const muscleGroupsWorked = await getMuscleGroupsWorked(startDate, endDate);

        // Calculate recovery status
        const recentWorkoutsWithMuscles = recentWorkouts.map((w) => ({
          date: w.date,
          muscleGroups: Object.keys(muscleGroupsWorked).filter(
            (mg) => muscleGroupsWorked[mg] > 0
          ) as MuscleGroup[],
        }));

        const status = getMuscleGroupRecoveryStatus(recentWorkoutsWithMuscles);
        setRecoveryStatus(status);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const handleGenerateWorkout = async () => {
    if (!settings || !recoveryStatus) return;

    setGenerating(true);
    try {
      const equipment = location === 'home'
        ? settings.home_equipment
        : settings.gym_equipment;

      const duration = location === 'home'
        ? settings.home_workout_duration
        : settings.gym_workout_duration;

      const availableExercises = await getExercisesByEquipment(equipment);

      // Prepare muscle group recovery data
      const recentMuscleGroups: Record<MuscleGroup, { lastWorked: string; count: number }> = {} as Record<MuscleGroup, { lastWorked: string; count: number }>;
      const today = new Date();

      Object.entries(recoveryStatus).forEach(([mg, status]) => {
        const lastWorkedDate = new Date();
        lastWorkedDate.setDate(today.getDate() - status.daysRested);

        recentMuscleGroups[mg as MuscleGroup] = {
          lastWorked: format(lastWorkedDate, 'yyyy-MM-dd'),
          count: status.daysRested < 7 ? 1 : 0,
        };
      });

      const workout = await generateWorkoutSuggestion(
        {
          location,
          availableEquipment: equipment,
          duration,
          recentMuscleGroups,
          fitnessLevel: 'intermediate', // Could get from user profile
          goals,
          weekNumber: Math.ceil(new Date().getDate() / 7),
        },
        availableExercises
      );

      setSuggestedWorkout(workout);
    } catch (error) {
      console.error('Error generating workout:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleStartWorkout = async () => {
    if (!user || !suggestedWorkout || !settings) return;

    setStarting(true);
    try {
      const duration = location === 'home'
        ? settings.home_workout_duration
        : settings.gym_workout_duration;

      // Create workout session
      const session = await createWorkoutSession({
        user_id: user.id,
        date: format(new Date(), 'yyyy-MM-dd'),
        location,
        duration_minutes: duration,
        notes: `AI Coach suggested workout focusing on: ${suggestedWorkout.focus_areas.join(', ')}`,
        ai_generated: true,
      });

      // Add exercises
      for (let i = 0; i < suggestedWorkout.exercises.length; i++) {
        const ex = suggestedWorkout.exercises[i];

        const workoutExercise = await addWorkoutExercise({
          workout_session_id: session.id,
          exercise_id: ex.exercise.id,
          order_index: i,
        });

        // Add sets
        for (let j = 0; j < ex.sets; j++) {
          await addExerciseSet({
            workout_exercise_id: workoutExercise.id,
            set_number: j + 1,
            reps: ex.target_reps,
            weight: ex.target_weight || null,
            duration_seconds: null,
            distance_meters: null,
            completed: false,
          });
        }
      }

      router.push(`/workouts/${session.id}`);
    } catch (error) {
      console.error('Error starting workout:', error);
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Bot className="w-7 h-7 text-blue-600" />
          AI Coach
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Get personalized workout suggestions based on your goals and recovery
        </p>
      </div>

      {/* Location Selection */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>Where are you working out?</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="gym">
            <TabsList className="w-full">
              <TabsTrigger
                value="gym"
                onClick={() => {
                  setLocation('gym');
                  setSuggestedWorkout(null);
                }}
                className="flex-1"
              >
                <Building className="w-4 h-4 mr-2" />
                Gym ({settings?.gym_workout_duration} min)
              </TabsTrigger>
              <TabsTrigger
                value="home"
                onClick={() => {
                  setLocation('home');
                  setSuggestedWorkout(null);
                }}
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Home ({settings?.home_workout_duration} min)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Available Equipment:
            </p>
            <div className="flex flex-wrap gap-2">
              {(location === 'home' ? settings?.home_equipment : settings?.gym_equipment)?.map((eq) => (
                <Badge key={eq} variant="default">
                  {eq.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recovery Status */}
      {recoveryStatus && (
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Muscle Recovery Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Object.entries(recoveryStatus)
                .filter(([mg]) => mg !== 'full_body')
                .map(([muscleGroup, status]) => (
                  <div
                    key={muscleGroup}
                    className={`p-3 rounded-lg ${
                      status.recovered
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : 'bg-yellow-50 dark:bg-yellow-900/20'
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-900 dark:text-white capitalize">
                      {muscleGroup}
                    </p>
                    <p className={`text-xs ${
                      status.recovered
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {status.recovered ? 'Ready' : `Rest ${status.daysRested < 2 ? 'needed' : 'more'}`}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      {!suggestedWorkout && (
        <div className="flex justify-center">
          <Button size="lg" onClick={handleGenerateWorkout} loading={generating}>
            <Bot className="w-5 h-5 mr-2" />
            Generate Workout
          </Button>
        </div>
      )}

      {/* Suggested Workout */}
      {suggestedWorkout && (
        <Card variant="bordered">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5" />
              Today&apos;s Workout
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleGenerateWorkout}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Focus Areas */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Focus Areas
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedWorkout.focus_areas.map((area) => (
                  <Badge key={area} variant="info">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              Estimated duration: {suggestedWorkout.estimated_duration} minutes
            </div>

            {/* Reasoning */}
            <p className="text-gray-600 dark:text-gray-400 italic">
              {suggestedWorkout.reasoning}
            </p>

            {/* Warmup */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Warmup</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                {suggestedWorkout.warmup.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Exercises */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Exercises</h4>
              <div className="space-y-3">
                {suggestedWorkout.exercises.map((ex, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {ex.exercise.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {ex.sets} sets × {ex.target_reps} reps
                          {ex.target_weight && ` @ ${ex.target_weight} lbs`}
                        </p>
                        {ex.notes && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            {ex.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {ex.exercise.muscle_groups.slice(0, 2).map((mg) => (
                        <Badge key={mg} variant="default" size="sm">
                          {mg}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cooldown */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Cooldown</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                {suggestedWorkout.cooldown.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Start Button */}
            <div className="flex justify-center pt-4">
              <Button size="lg" onClick={handleStartWorkout} loading={starting}>
                <Play className="w-5 h-5 mr-2" />
                Start This Workout
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
