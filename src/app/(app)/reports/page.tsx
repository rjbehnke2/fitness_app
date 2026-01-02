'use client';

import { useEffect, useState } from 'react';
import { FileText, TrendingUp, TrendingDown, AlertCircle, Trophy, Bot, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getWorkoutSessionsInRange, getMuscleGroupsWorked, countWorkoutsInPeriod } from '@/lib/services/workouts';
import { getActiveGoals } from '@/lib/services/goals';
import { getRecentProgressForAllExercises } from '@/lib/services/workouts';
import { generateWeeklySummary, generateCoachSummary } from '@/lib/services/ai-coach';
import { Goal, WeeklySummary, CoachSummary, Exercise } from '@/types/database';

export default function ReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generatingWeekly, setGeneratingWeekly] = useState(false);
  const [generatingCoach, setGeneratingCoach] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [coachSummary, setCoachSummary] = useState<CoachSummary | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        const goalsData = await getActiveGoals();
        setGoals(goalsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const handleGenerateWeeklySummary = async () => {
    if (!user) return;

    setGeneratingWeekly(true);
    try {
      const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(new Date()), 'yyyy-MM-dd');

      const [workoutsCount, muscleGroups, progressRecords] = await Promise.all([
        countWorkoutsInPeriod(weekStart, weekEnd),
        getMuscleGroupsWorked(weekStart, weekEnd),
        getRecentProgressForAllExercises(7),
      ]);

      // Calculate total duration from workouts
      const workouts = await getWorkoutSessionsInRange(weekStart, weekEnd);
      const totalDuration = workouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);

      // Prepare benchmark progress data
      const benchmarkProgress = progressRecords
        .filter((pr) => (pr.exercise as Exercise | undefined)?.is_benchmark)
        .reduce((acc, pr) => {
          const exercise = pr.exercise as Exercise | undefined;
          if (!exercise) return acc;

          const existing = acc.find((e) => e.exercise === exercise.name);
          if (!existing) {
            const goal = goals.find((g) => g.exercise_id === exercise.id);
            acc.push({
              exercise: exercise.name,
              startWeight: goal?.starting_weight || pr.max_weight || 0,
              currentWeight: pr.max_weight || 0,
              targetWeight: goal?.target_weight || pr.max_weight || 0,
              onTrack: true,
            });
          }
          return acc;
        }, [] as { exercise: string; startWeight: number; currentWeight: number; targetWeight: number; onTrack: boolean }[]);

      const summary = await generateWeeklySummary(weekStart, weekEnd, {
        workoutsCompleted: workoutsCount,
        totalDuration,
        muscleGroupsWorked: muscleGroups,
        benchmarkProgress,
      }, goals);

      setWeeklySummary(summary);
    } catch (error) {
      console.error('Error generating weekly summary:', error);
    } finally {
      setGeneratingWeekly(false);
    }
  };

  const handleGenerateCoachSummary = async () => {
    if (!user) return;

    setGeneratingCoach(true);
    try {
      // Get data for the last 4 weeks
      const fourWeeksAgo = format(subWeeks(new Date(), 4), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');

      const [workoutsCount, muscleGroups, progressRecords] = await Promise.all([
        countWorkoutsInPeriod(fourWeeksAgo, today),
        getMuscleGroupsWorked(fourWeeksAgo, today),
        getRecentProgressForAllExercises(30),
      ]);

      const workouts = await getWorkoutSessionsInRange(fourWeeksAgo, today);
      const totalDuration = workouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);

      // Prepare benchmark progress data
      const benchmarkProgress = progressRecords
        .filter((pr) => (pr.exercise as Exercise | undefined)?.is_benchmark)
        .reduce((acc, pr) => {
          const exercise = pr.exercise as Exercise | undefined;
          if (!exercise) return acc;

          const existing = acc.find((e) => e.exercise === exercise.name);
          if (!existing) {
            const goal = goals.find((g) => g.exercise_id === exercise.id);
            acc.push({
              exercise: exercise.name,
              startWeight: goal?.starting_weight || 0,
              currentWeight: pr.max_weight || 0,
              targetWeight: goal?.target_weight || pr.max_weight || 0,
              onTrack: (pr.max_weight || 0) >= (goal?.starting_weight || 0),
            });
          }
          return acc;
        }, [] as { exercise: string; startWeight: number; currentWeight: number; targetWeight: number; onTrack: boolean }[]);

      const summary = await generateCoachSummary({
        workoutsCompleted: workoutsCount,
        totalDuration,
        muscleGroupsWorked: muscleGroups,
        benchmarkProgress,
      }, goals, 4);

      setCoachSummary(summary);
    } catch (error) {
      console.error('Error generating coach summary:', error);
    } finally {
      setGeneratingCoach(false);
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
          <FileText className="w-7 h-7 text-purple-600" />
          Reports
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Weekly summaries and coach assessments
        </p>
      </div>

      {/* Report Tabs */}
      <Tabs defaultValue="weekly">
        <TabsList>
          <TabsTrigger value="weekly">Weekly Summary</TabsTrigger>
          <TabsTrigger value="coach">Coach&apos;s Summary</TabsTrigger>
        </TabsList>

        {/* Weekly Summary */}
        <TabsContent value="weekly">
          <div className="space-y-6">
            {!weeklySummary ? (
              <Card variant="bordered">
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Generate a summary of your training this week
                  </p>
                  <Button onClick={handleGenerateWeeklySummary} loading={generatingWeekly}>
                    Generate Weekly Summary
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card variant="bordered">
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {weeklySummary.workouts_completed}
                      </p>
                      <p className="text-sm text-gray-500">Workouts</p>
                    </CardContent>
                  </Card>
                  <Card variant="bordered">
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {weeklySummary.total_duration_minutes}
                      </p>
                      <p className="text-sm text-gray-500">Minutes</p>
                    </CardContent>
                  </Card>
                  <Card variant="bordered">
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {Object.keys(weeklySummary.muscle_groups_worked).length}
                      </p>
                      <p className="text-sm text-gray-500">Muscle Groups</p>
                    </CardContent>
                  </Card>
                  <Card variant="bordered">
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {weeklySummary.goals_status.filter((g) => g.on_track).length}/{weeklySummary.goals_status.length}
                      </p>
                      <p className="text-sm text-gray-500">Goals On Track</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Highlights */}
                <Card variant="bordered">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Progress Highlights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {weeklySummary.progress_highlights.length > 0 ? (
                      <ul className="space-y-2">
                        {weeklySummary.progress_highlights.map((highlight, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300">{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">No highlights this week</p>
                    )}
                  </CardContent>
                </Card>

                {/* Areas for Improvement */}
                {weeklySummary.areas_for_improvement.length > 0 && (
                  <Card variant="bordered">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-orange-600" />
                        Areas for Improvement
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {weeklySummary.areas_for_improvement.map((area, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300">{area}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Goal Status */}
                {weeklySummary.goals_status.length > 0 && (
                  <Card variant="bordered">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-600" />
                        Goals Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {weeklySummary.goals_status.map((goalStatus, i) => {
                          const exercise = goalStatus.goal.exercise as Exercise | undefined;
                          return (
                            <div
                              key={i}
                              className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                              <div className="flex items-start gap-3">
                                {goalStatus.on_track ? (
                                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                )}
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {exercise?.name}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {goalStatus.message}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={goalStatus.on_track ? 'success' : 'warning'}>
                                {goalStatus.on_track ? 'On Track' : 'Behind'}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-center">
                  <Button variant="outline" onClick={handleGenerateWeeklySummary} loading={generatingWeekly}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate Summary
                  </Button>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Coach Summary */}
        <TabsContent value="coach">
          <div className="space-y-6">
            {!coachSummary ? (
              <Card variant="bordered">
                <CardContent className="py-12 text-center">
                  <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Get a comprehensive assessment from your AI coach
                  </p>
                  <Button onClick={handleGenerateCoachSummary} loading={generatingCoach}>
                    Generate Coach Summary
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Overall Assessment */}
                <Card variant="bordered">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-blue-600" />
                      Overall Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 text-lg">
                      {coachSummary.overall_assessment}
                    </p>
                  </CardContent>
                </Card>

                {/* Strengths */}
                {coachSummary.strengths.length > 0 && (
                  <Card variant="bordered">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Your Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {coachSummary.strengths.map((strength, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Weaknesses */}
                {coachSummary.weaknesses.length > 0 && (
                  <Card variant="bordered">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-orange-600" />
                        Areas to Focus On
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {coachSummary.weaknesses.map((weakness, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300">{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                {coachSummary.recommendations.length > 0 && (
                  <Card variant="bordered">
                    <CardHeader>
                      <CardTitle>Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {coachSummary.recommendations.map((rec, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                          >
                            <span className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 rounded-full text-sm font-medium">
                              {i + 1}
                            </span>
                            <p className="text-gray-700 dark:text-gray-300">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Motivation */}
                <Card variant="bordered" className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                  <CardContent className="pt-6">
                    <p className="text-lg text-center italic text-gray-700 dark:text-gray-300">
                      &ldquo;{coachSummary.motivation}&rdquo;
                    </p>
                  </CardContent>
                </Card>

                <div className="flex justify-center">
                  <Button variant="outline" onClick={handleGenerateCoachSummary} loading={generatingCoach}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Get New Assessment
                  </Button>
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
