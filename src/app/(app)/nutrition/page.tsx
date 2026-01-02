'use client';

import { useState } from 'react';
import { ChefHat, Clock, Coffee, Utensils, Lightbulb, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Select, Badge } from '@/components/ui';
import { generateNutritionAdvice } from '@/lib/services/ai-coach';
import { NutritionAdvice } from '@/types/database';

export default function NutritionPage() {
  const [workoutType, setWorkoutType] = useState<'strength' | 'cardio' | 'mixed'>('strength');
  const [workoutDuration, setWorkoutDuration] = useState(45);
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('afternoon');
  const [fitnessGoal, setFitnessGoal] = useState<'muscle_gain' | 'fat_loss' | 'maintenance'>('muscle_gain');
  const [advice, setAdvice] = useState<NutritionAdvice | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateAdvice = async () => {
    setLoading(true);
    try {
      const result = await generateNutritionAdvice(
        workoutType,
        workoutDuration,
        timeOfDay,
        fitnessGoal
      );
      setAdvice(result);
    } catch (error) {
      console.error('Error generating advice:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ChefHat className="w-7 h-7 text-green-600" />
          Nutrition Advice
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Get personalized pre and post-workout nutrition recommendations
        </p>
      </div>

      {/* Options */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>Your Workout Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Workout Type"
              value={workoutType}
              onChange={(e) => setWorkoutType(e.target.value as 'strength' | 'cardio' | 'mixed')}
              options={[
                { value: 'strength', label: 'Strength Training' },
                { value: 'cardio', label: 'Cardio' },
                { value: 'mixed', label: 'Mixed' },
              ]}
            />

            <Select
              label="Duration"
              value={String(workoutDuration)}
              onChange={(e) => setWorkoutDuration(Number(e.target.value))}
              options={[
                { value: '15', label: '15 minutes' },
                { value: '30', label: '30 minutes' },
                { value: '45', label: '45 minutes' },
                { value: '60', label: '60 minutes' },
                { value: '90', label: '90 minutes' },
              ]}
            />

            <Select
              label="Time of Day"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value as 'morning' | 'afternoon' | 'evening')}
              options={[
                { value: 'morning', label: 'Morning' },
                { value: 'afternoon', label: 'Afternoon' },
                { value: 'evening', label: 'Evening' },
              ]}
            />

            <Select
              label="Fitness Goal"
              value={fitnessGoal}
              onChange={(e) => setFitnessGoal(e.target.value as 'muscle_gain' | 'fat_loss' | 'maintenance')}
              options={[
                { value: 'muscle_gain', label: 'Build Muscle' },
                { value: 'fat_loss', label: 'Lose Fat' },
                { value: 'maintenance', label: 'Maintain' },
              ]}
            />
          </div>

          <div className="mt-6 flex justify-center">
            <Button onClick={handleGenerateAdvice} loading={loading}>
              <ChefHat className="w-4 h-4 mr-2" />
              Get Nutrition Advice
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advice */}
      {advice && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pre-Workout */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-orange-600" />
                Pre-Workout Nutrition
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{advice.pre_workout.timing}</span>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Recommended Foods</h4>
                <ul className="space-y-2">
                  {advice.pre_workout.foods.map((food, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-gray-600 dark:text-gray-400"
                    >
                      <span className="text-green-600">•</span>
                      {food}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-1">Hydration</h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {advice.pre_workout.hydration}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Post-Workout */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-green-600" />
                Post-Workout Nutrition
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{advice.post_workout.timing}</span>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Recommended Foods</h4>
                <ul className="space-y-2">
                  {advice.post_workout.foods.map((food, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-gray-600 dark:text-gray-400"
                    >
                      <span className="text-green-600">•</span>
                      {food}
                    </li>
                  ))}
                </ul>
              </div>

              {advice.post_workout.supplements && advice.post_workout.supplements.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Supplements (Optional)</h4>
                  <div className="flex flex-wrap gap-2">
                    {advice.post_workout.supplements.map((supp, i) => (
                      <Badge key={i} variant="info">
                        {supp}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-1">Hydration</h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {advice.post_workout.hydration}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* General Tips */}
          <Card variant="bordered" className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                General Tips for Your Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {advice.general_tips.map((tip, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <span className="flex items-center justify-center w-6 h-6 bg-yellow-100 dark:bg-yellow-900 text-yellow-600 rounded-full text-sm font-medium">
                      {i + 1}
                    </span>
                    <p className="text-gray-700 dark:text-gray-300">{tip}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Regenerate */}
      {advice && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleGenerateAdvice} loading={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Get New Recommendations
          </Button>
        </div>
      )}
    </div>
  );
}
