-- Fitness Tracking App Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name TEXT,
  fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings for workout preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  home_equipment TEXT[] DEFAULT ARRAY['sandbag', 'kettlebell', 'rower']::TEXT[],
  gym_equipment TEXT[] DEFAULT ARRAY['barbell', 'dumbbells', 'cable_machine', 'bench', 'squat_rack', 'pull_up_bar', 'leg_press', 'rowing_machine', 'treadmill']::TEXT[],
  home_workout_duration INTEGER DEFAULT 15, -- in minutes
  gym_workout_duration INTEGER DEFAULT 45, -- in minutes
  preferred_workout_days INTEGER[] DEFAULT ARRAY[1, 3, 5]::INTEGER[], -- Monday, Wednesday, Friday
  weight_unit TEXT CHECK (weight_unit IN ('lbs', 'kg')) DEFAULT 'lbs',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises library
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT CHECK (category IN ('strength', 'cardio', 'flexibility', 'compound')) NOT NULL,
  muscle_groups TEXT[] NOT NULL,
  equipment_required TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_benchmark BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout sessions
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  location TEXT CHECK (location IN ('home', 'gym')) NOT NULL,
  duration_minutes INTEGER,
  notes TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises within a workout session
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual sets within an exercise
CREATE TABLE IF NOT EXISTS exercise_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE NOT NULL,
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight DECIMAL(10, 2), -- in lbs or kg based on user preference
  duration_seconds INTEGER, -- for timed exercises
  distance_meters DECIMAL(10, 2), -- for cardio exercises
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals for benchmark exercises
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  target_weight DECIMAL(10, 2),
  target_reps INTEGER,
  target_date DATE NOT NULL,
  starting_weight DECIMAL(10, 2),
  starting_reps INTEGER,
  status TEXT CHECK (status IN ('active', 'achieved', 'missed', 'cancelled')) DEFAULT 'active',
  ai_suggested BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress records (aggregated per exercise per day)
CREATE TABLE IF NOT EXISTS progress_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  max_weight DECIMAL(10, 2),
  max_reps INTEGER,
  total_volume DECIMAL(10, 2), -- weight * reps for all sets
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exercise_id, date)
);

-- AI Coach advice history
CREATE TABLE IF NOT EXISTS coach_advice (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('workout', 'nutrition', 'weekly_summary', 'coach_summary', 'goal_suggestion')) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON workout_sessions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_session ON workout_exercises(workout_session_id);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_workout_exercise ON exercise_sets(workout_exercise_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_progress_records_user_exercise ON progress_records(user_id, exercise_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_coach_advice_user_type ON coach_advice(user_id, type, created_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_advice ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Exercises are public read
CREATE POLICY "Anyone can view exercises" ON exercises
  FOR SELECT USING (true);

-- Workout sessions policies
CREATE POLICY "Users can view their own workouts" ON workout_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own workouts" ON workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own workouts" ON workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workouts" ON workout_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Workout exercises policies
CREATE POLICY "Users can view their own workout exercises" ON workout_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_sessions
      WHERE workout_sessions.id = workout_exercises.workout_session_id
      AND workout_sessions.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert their own workout exercises" ON workout_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_sessions
      WHERE workout_sessions.id = workout_exercises.workout_session_id
      AND workout_sessions.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update their own workout exercises" ON workout_exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workout_sessions
      WHERE workout_sessions.id = workout_exercises.workout_session_id
      AND workout_sessions.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete their own workout exercises" ON workout_exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workout_sessions
      WHERE workout_sessions.id = workout_exercises.workout_session_id
      AND workout_sessions.user_id = auth.uid()
    )
  );

-- Exercise sets policies
CREATE POLICY "Users can view their own exercise sets" ON exercise_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_exercises
      JOIN workout_sessions ON workout_sessions.id = workout_exercises.workout_session_id
      WHERE workout_exercises.id = exercise_sets.workout_exercise_id
      AND workout_sessions.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert their own exercise sets" ON exercise_sets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_exercises
      JOIN workout_sessions ON workout_sessions.id = workout_exercises.workout_session_id
      WHERE workout_exercises.id = exercise_sets.workout_exercise_id
      AND workout_sessions.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update their own exercise sets" ON exercise_sets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workout_exercises
      JOIN workout_sessions ON workout_sessions.id = workout_exercises.workout_session_id
      WHERE workout_exercises.id = exercise_sets.workout_exercise_id
      AND workout_sessions.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete their own exercise sets" ON exercise_sets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workout_exercises
      JOIN workout_sessions ON workout_sessions.id = workout_exercises.workout_session_id
      WHERE workout_exercises.id = exercise_sets.workout_exercise_id
      AND workout_sessions.user_id = auth.uid()
    )
  );

-- Goals policies
CREATE POLICY "Users can view their own goals" ON goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own goals" ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON goals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON goals
  FOR DELETE USING (auth.uid() = user_id);

-- Progress records policies
CREATE POLICY "Users can view their own progress" ON progress_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON progress_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON progress_records
  FOR UPDATE USING (auth.uid() = user_id);

-- Coach advice policies
CREATE POLICY "Users can view their own coach advice" ON coach_advice
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own coach advice" ON coach_advice
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to automatically create user profile and settings on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id);

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_sessions_updated_at
  BEFORE UPDATE ON workout_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
