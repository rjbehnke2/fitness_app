'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Dumbbell,
  Target,
  TrendingUp,
  Calendar,
  ChevronRight,
  Plus,
  Bot,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getWorkoutSessions, getRecentProgressForAllExercises, countWorkoutsInPeriod } from '@/lib/services/workouts';
import { getActiveGoals } from '@/lib/services/goals';
import { WorkoutSession, Goal, ProgressRecord, Exercise } from '@/types/database';

export default function DashboardPage() {
  const { user } = useAuth();
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [weeklyWorkoutCount, setWeeklyWorkoutCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return;

      try {
        const [workouts, goals, progress] = await Promise.all([
          getWorkoutSessions(5),
          getActiveGoals(),
          getRecentProgressForAllExercises(30),
        ]);

        setRecentWorkouts(workouts);
        setActiveGoals(goals);
        setProgressRecords(progress);

        // Get weekly workout count
        const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
        const weekEnd = format(endOfWeek(new Date()), 'yyyy-MM-dd');
        const count = await countWorkoutsInPeriod(weekStart, weekEnd);
        setWeeklyWorkoutCount(count);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  // Prepare chart data for benchmark exercises
  const getChartData = () => {
    const benchmarkProgress = progressRecords.filter(
      (pr) => (pr.exercise as Exercise | undefined)?.is_benchmark
    );

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');
      return { date, display: format(subDays(new Date(), 29 - i), 'MMM d') };
    });

    return last30Days.map((day) => {
      const dayData: Record<string, string | number | null> = { date: day.display };
      const dayRecords = benchmarkProgress.filter((pr) => pr.date === day.date);

      dayRecords.forEach((record) => {
        const exercise = record.exercise as Exercise | undefined;
        if (exercise) {
          dayData[exercise.name] = record.max_weight;
        }
      });

      return dayData;
    });
  };

  const chartData = getChartData();
  const benchmarkExercises = [...new Set(
    progressRecords
      .filter((pr) => (pr.exercise as Exercise | undefined)?.is_benchmark)
      .map((pr) => (pr.exercise as Exercise | undefined)?.name)
      .filter(Boolean)
  )] as string[];

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here&apos;s your fitness overview.
          </p>
        </div>
        <Link href="/workouts/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Log Workout
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="bordered">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">This Week</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {weeklyWorkoutCount} workouts
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Goals</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeGoals.length}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Workouts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {recentWorkouts.length > 0 ? `${recentWorkouts.length}+` : '0'}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Dumbbell className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent className="pt-6">
            <Link href="/coach" className="flex items-center justify-between group">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">AI Coach</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-blue-600">
                  Get Workout
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-800 transition-colors">
                <Bot className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Progress Chart */}
      {benchmarkExercises.length > 0 && (
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Benchmark Progress (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  {benchmarkExercises.map((exercise, index) => (
                    <Line
                      key={exercise}
                      type="monotone"
                      dataKey={exercise}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              {benchmarkExercises.map((exercise, index) => (
                <div key={exercise} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {exercise}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Workouts */}
        <Card variant="bordered">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Workouts</CardTitle>
            <Link href="/workouts" className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentWorkouts.length === 0 ? (
              <div className="text-center py-8">
                <Dumbbell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No workouts yet</p>
                <Link href="/workouts/new">
                  <Button className="mt-4" variant="outline">
                    Log Your First Workout
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentWorkouts.map((workout) => (
                  <Link
                    key={workout.id}
                    href={`/workouts/${workout.id}`}
                    className="block p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {format(new Date(workout.date), 'EEEE, MMM d')}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {workout.duration_minutes} min • {workout.location}
                        </p>
                      </div>
                      <Badge variant={workout.location === 'gym' ? 'info' : 'default'}>
                        {workout.location}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Goals */}
        <Card variant="bordered">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Goals</CardTitle>
            <Link href="/goals" className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {activeGoals.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No active goals</p>
                <Link href="/goals">
                  <Button className="mt-4" variant="outline">
                    Set Your First Goal
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeGoals.slice(0, 4).map((goal) => {
                  const exercise = goal.exercise as Exercise | undefined;
                  const daysLeft = Math.ceil(
                    (new Date(goal.target_date).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  );

                  return (
                    <Link
                      key={goal.id}
                      href={`/goals/${goal.id}`}
                      className="block p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {exercise?.name || 'Unknown Exercise'}
                        </p>
                        <Badge variant={daysLeft <= 7 ? 'warning' : 'default'}>
                          {daysLeft} days left
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>Target: {goal.target_weight} lbs × {goal.target_reps} reps</span>
                        <span>
                          Due: {format(new Date(goal.target_date), 'MMM d')}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
