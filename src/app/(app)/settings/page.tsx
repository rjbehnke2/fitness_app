'use client';

import { useEffect, useState } from 'react';
import { Settings, Home, Building, Save, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getUserSettings, updateUserSettings, getUserProfile, updateUserProfile, EQUIPMENT_OPTIONS, DAYS_OF_WEEK } from '@/lib/services/settings';
import { UserSettings } from '@/types/database';

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [homeEquipment, setHomeEquipment] = useState<string[]>([]);
  const [gymEquipment, setGymEquipment] = useState<string[]>([]);
  const [homeWorkoutDuration, setHomeWorkoutDuration] = useState(15);
  const [gymWorkoutDuration, setGymWorkoutDuration] = useState(45);
  const [preferredDays, setPreferredDays] = useState<number[]>([1, 3, 5]);
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs');

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        const [settingsData, profileData] = await Promise.all([
          getUserSettings(),
          getUserProfile(),
        ]);

        if (settingsData) {
          setHomeEquipment(settingsData.home_equipment);
          setGymEquipment(settingsData.gym_equipment);
          setHomeWorkoutDuration(settingsData.home_workout_duration);
          setGymWorkoutDuration(settingsData.gym_workout_duration);
          setPreferredDays(settingsData.preferred_workout_days);
          setWeightUnit((settingsData as UserSettings & { weight_unit?: 'lbs' | 'kg' }).weight_unit || 'lbs');
        }

        if (profileData) {
          setDisplayName(profileData.display_name || '');
          setFitnessLevel(profileData.fitness_level);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setSaved(false);
    try {
      await Promise.all([
        updateUserSettings({
          home_equipment: homeEquipment,
          gym_equipment: gymEquipment,
          home_workout_duration: homeWorkoutDuration,
          gym_workout_duration: gymWorkoutDuration,
          preferred_workout_days: preferredDays,
        }),
        updateUserProfile({
          display_name: displayName || null,
          fitness_level: fitnessLevel,
        }),
      ]);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleEquipment = (type: 'home' | 'gym', equipment: string) => {
    if (type === 'home') {
      setHomeEquipment((prev) =>
        prev.includes(equipment)
          ? prev.filter((e) => e !== equipment)
          : [...prev, equipment]
      );
    } else {
      setGymEquipment((prev) =>
        prev.includes(equipment)
          ? prev.filter((e) => e !== equipment)
          : [...prev, equipment]
      );
    }
  };

  const toggleDay = (day: number) => {
    setPreferredDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-gray-600" />
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your fitness tracking experience
          </p>
        </div>
        <Button onClick={handleSave} loading={saving}>
          {saved ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Profile */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your name"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>

          <Select
            label="Fitness Level"
            value={fitnessLevel}
            onChange={(e) => setFitnessLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
            options={[
              { value: 'beginner', label: 'Beginner (0-1 years)' },
              { value: 'intermediate', label: 'Intermediate (1-3 years)' },
              { value: 'advanced', label: 'Advanced (3+ years)' },
            ]}
          />

          <Select
            label="Weight Unit"
            value={weightUnit}
            onChange={(e) => setWeightUnit(e.target.value as 'lbs' | 'kg')}
            options={[
              { value: 'lbs', label: 'Pounds (lbs)' },
              { value: 'kg', label: 'Kilograms (kg)' },
            ]}
          />
        </CardContent>
      </Card>

      {/* Workout Preferences */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>Workout Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Home Workout Duration (minutes)"
              type="number"
              min={5}
              max={120}
              value={homeWorkoutDuration}
              onChange={(e) => setHomeWorkoutDuration(Number(e.target.value))}
            />
            <Input
              label="Gym Workout Duration (minutes)"
              type="number"
              min={15}
              max={180}
              value={gymWorkoutDuration}
              onChange={(e) => setGymWorkoutDuration(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preferred Workout Days
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    preferredDays.includes(day.value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {day.label.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Home Equipment */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5 text-green-600" />
            Home Equipment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Select the equipment you have available at home
          </p>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.home.map((eq) => (
              <button
                key={eq.value}
                type="button"
                onClick={() => toggleEquipment('home', eq.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  homeEquipment.includes(eq.value)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {eq.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gym Equipment */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            Gym Equipment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Select the equipment available at your gym
          </p>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.gym.map((eq) => (
              <button
                key={eq.value}
                type="button"
                onClick={() => toggleEquipment('gym', eq.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  gymEquipment.includes(eq.value)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {eq.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button (Bottom) */}
      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving}>
          {saved ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
