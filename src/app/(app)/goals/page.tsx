'use client';

import { useEffect, useState } from 'react';
import { Plus, Target, Trophy, AlertCircle, XCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Card, CardContent, Button, Badge, Modal, Input, Select } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getGoals, createGoal, calculateGoalProgress, markGoalAchieved, cancelGoal } from '@/lib/services/goals';
import { getBenchmarkExercises } from '@/lib/services/exercises';
import { Goal, Exercise } from '@/types/database';

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGoalModalOpen, setNewGoalModalOpen] = useState(false);
  const [goalProgress, setGoalProgress] = useState<Record<string, { weightProgress: number; currentWeight: number | null }>>({});

  // New goal form state
  const [newGoal, setNewGoal] = useState({
    exercise_id: '',
    target_weight: 0,
    target_reps: 5,
    target_date: '',
    starting_weight: 0,
    starting_reps: 5,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        const [goalsData, exercisesData] = await Promise.all([
          getGoals(),
          getBenchmarkExercises(),
        ]);
        setGoals(goalsData);
        setExercises(exercisesData);

        if (exercisesData.length > 0) {
          setNewGoal((prev) => ({ ...prev, exercise_id: exercisesData[0].id }));
        }

        // Calculate progress for each active goal
        const progressMap: Record<string, { weightProgress: number; currentWeight: number | null }> = {};
        for (const goal of goalsData.filter((g) => g.status === 'active')) {
          const progress = await calculateGoalProgress(goal);
          progressMap[goal.id] = {
            weightProgress: progress.weightProgress,
            currentWeight: progress.currentWeight,
          };
        }
        setGoalProgress(progressMap);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const handleCreateGoal = async () => {
    if (!user || !newGoal.exercise_id || !newGoal.target_date) return;

    setSaving(true);
    try {
      const created = await createGoal({
        user_id: user.id,
        exercise_id: newGoal.exercise_id,
        target_weight: newGoal.target_weight,
        target_reps: newGoal.target_reps,
        target_date: newGoal.target_date,
        starting_weight: newGoal.starting_weight,
        starting_reps: newGoal.starting_reps,
        status: 'active',
        ai_suggested: false,
      });

      setGoals([...goals, created]);
      setNewGoalModalOpen(false);
      setNewGoal({
        exercise_id: exercises[0]?.id || '',
        target_weight: 0,
        target_reps: 5,
        target_date: '',
        starting_weight: 0,
        starting_reps: 5,
      });
    } catch (error) {
      console.error('Error creating goal:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAchieved = async (goalId: string) => {
    try {
      const updated = await markGoalAchieved(goalId);
      setGoals(goals.map((g) => (g.id === goalId ? updated : g)));
    } catch (error) {
      console.error('Error marking goal achieved:', error);
    }
  };

  const handleCancelGoal = async (goalId: string) => {
    try {
      const updated = await cancelGoal(goalId);
      setGoals(goals.map((g) => (g.id === goalId ? updated : g)));
    } catch (error) {
      console.error('Error cancelling goal:', error);
    }
  };

  const activeGoals = goals.filter((g) => g.status === 'active');
  const achievedGoals = goals.filter((g) => g.status === 'achieved');
  const otherGoals = goals.filter((g) => g.status === 'missed' || g.status === 'cancelled');

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
            Goals
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Set and track your fitness goals
          </p>
        </div>
        <Button onClick={() => setNewGoalModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Active Goals */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          Active Goals ({activeGoals.length})
        </h2>

        {activeGoals.length === 0 ? (
          <Card variant="bordered">
            <CardContent className="py-12 text-center">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No active goals</p>
              <Button onClick={() => setNewGoalModalOpen(true)}>
                Set Your First Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map((goal) => {
              const exercise = goal.exercise as Exercise | undefined;
              const daysLeft = differenceInDays(new Date(goal.target_date), new Date());
              const progress = goalProgress[goal.id];

              return (
                <Card key={goal.id} variant="bordered">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {exercise?.name || 'Unknown Exercise'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Due: {format(new Date(goal.target_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge variant={daysLeft <= 7 ? 'warning' : daysLeft <= 30 ? 'info' : 'success'}>
                        {daysLeft > 0 ? `${daysLeft} days left` : 'Due today'}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Target</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {goal.target_weight} lbs × {goal.target_reps} reps
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Starting</span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {goal.starting_weight} lbs × {goal.starting_reps} reps
                        </span>
                      </div>
                      {progress && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Current</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {progress.currentWeight} lbs
                          </span>
                        </div>
                      )}

                      {/* Progress bar */}
                      {progress && (
                        <div>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{Math.round(progress.weightProgress)}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all"
                              style={{ width: `${Math.min(100, progress.weightProgress)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleMarkAchieved(goal.id)}
                      >
                        <Trophy className="w-4 h-4 mr-1 text-green-600" />
                        Mark Achieved
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelGoal(goal.id)}
                      >
                        <XCircle className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Achieved Goals */}
      {achievedGoals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-green-600" />
            Achieved ({achievedGoals.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievedGoals.map((goal) => {
              const exercise = goal.exercise as Exercise | undefined;
              return (
                <Card key={goal.id} variant="bordered" className="bg-green-50 dark:bg-green-900/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-8 h-8 text-green-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {exercise?.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {goal.target_weight} lbs × {goal.target_reps} reps
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Missed/Cancelled Goals */}
      {otherGoals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-gray-500" />
            Missed/Cancelled ({otherGoals.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherGoals.map((goal) => {
              const exercise = goal.exercise as Exercise | undefined;
              return (
                <Card key={goal.id} variant="bordered" className="opacity-60">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {exercise?.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {goal.target_weight} lbs
                        </p>
                      </div>
                      <Badge variant={goal.status === 'missed' ? 'danger' : 'default'}>
                        {goal.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* New Goal Modal */}
      <Modal
        isOpen={newGoalModalOpen}
        onClose={() => setNewGoalModalOpen(false)}
        title="Set New Goal"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Exercise"
            value={newGoal.exercise_id}
            onChange={(e) => setNewGoal({ ...newGoal, exercise_id: e.target.value })}
            options={exercises.map((ex) => ({ value: ex.id, label: ex.name }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Starting Weight (lbs)"
              type="number"
              value={newGoal.starting_weight}
              onChange={(e) => setNewGoal({ ...newGoal, starting_weight: Number(e.target.value) })}
            />
            <Input
              label="Starting Reps"
              type="number"
              value={newGoal.starting_reps}
              onChange={(e) => setNewGoal({ ...newGoal, starting_reps: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Target Weight (lbs)"
              type="number"
              value={newGoal.target_weight}
              onChange={(e) => setNewGoal({ ...newGoal, target_weight: Number(e.target.value) })}
            />
            <Input
              label="Target Reps"
              type="number"
              value={newGoal.target_reps}
              onChange={(e) => setNewGoal({ ...newGoal, target_reps: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Target Date"
            type="date"
            value={newGoal.target_date}
            onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
          />

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setNewGoalModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGoal} loading={saving}>
              Create Goal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
