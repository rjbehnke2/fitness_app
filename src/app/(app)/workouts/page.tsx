'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getWorkoutSessions } from '@/lib/services/workouts';
import { WorkoutSession } from '@/types/database';

export default function WorkoutsPage() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'home' | 'gym'>('all');

  useEffect(() => {
    async function loadWorkouts() {
      if (!user) return;

      try {
        const data = await getWorkoutSessions(50);
        setWorkouts(data);
      } catch (error) {
        console.error('Error loading workouts:', error);
      } finally {
        setLoading(false);
      }
    }

    loadWorkouts();
  }, [user]);

  const filteredWorkouts = filter === 'all'
    ? workouts
    : workouts.filter((w) => w.location === filter);

  // Group workouts by month
  const groupedWorkouts = filteredWorkouts.reduce((acc, workout) => {
    const month = format(new Date(workout.date), 'MMMM yyyy');
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(workout);
    return acc;
  }, {} as Record<string, WorkoutSession[]>);

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
            Workouts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and log your workout sessions
          </p>
        </div>
        <Link href="/workouts/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Log Workout
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setFilter('all')}>
            All ({workouts.length})
          </TabsTrigger>
          <TabsTrigger value="gym" onClick={() => setFilter('gym')}>
            Gym ({workouts.filter((w) => w.location === 'gym').length})
          </TabsTrigger>
          <TabsTrigger value="home" onClick={() => setFilter('home')}>
            Home ({workouts.filter((w) => w.location === 'home').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <WorkoutsList groupedWorkouts={groupedWorkouts} />
        </TabsContent>
        <TabsContent value="gym">
          <WorkoutsList groupedWorkouts={groupedWorkouts} />
        </TabsContent>
        <TabsContent value="home">
          <WorkoutsList groupedWorkouts={groupedWorkouts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WorkoutsList({ groupedWorkouts }: { groupedWorkouts: Record<string, WorkoutSession[]> }) {
  if (Object.keys(groupedWorkouts).length === 0) {
    return (
      <Card variant="bordered" className="mt-4">
        <CardContent className="py-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">No workouts found</p>
          <Link href="/workouts/new">
            <Button>Log Your First Workout</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      {Object.entries(groupedWorkouts).map(([month, monthWorkouts]) => (
        <div key={month}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            {month}
          </h2>
          <div className="space-y-3">
            {monthWorkouts.map((workout) => (
              <Link key={workout.id} href={`/workouts/${workout.id}`}>
                <Card variant="bordered" className="hover:border-blue-500/50 transition-colors cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${
                          workout.location === 'gym'
                            ? 'bg-blue-100 dark:bg-blue-900'
                            : 'bg-green-100 dark:bg-green-900'
                        }`}>
                          <MapPin className={`w-5 h-5 ${
                            workout.location === 'gym'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-green-600 dark:text-green-400'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {format(new Date(workout.date), 'EEEE, MMMM d')}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {workout.duration_minutes} min
                            </span>
                            <Badge variant={workout.location === 'gym' ? 'info' : 'success'}>
                              {workout.location}
                            </Badge>
                            {workout.ai_generated && (
                              <Badge variant="warning">AI Suggested</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    {workout.notes && (
                      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {workout.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
