import { createClient } from '@/lib/supabase/client';
import { UserSettings, UserProfile, InsertUserSettings, UpdateUserSettings } from '@/types/database';

// User Profile
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateUserProfile(
  updates: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<UserProfile> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// User Settings
export async function getUserSettings(): Promise<UserSettings | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateUserSettings(updates: UpdateUserSettings): Promise<UserSettings> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_settings')
    .update(updates)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createUserSettings(settings: Omit<InsertUserSettings, 'user_id'>): Promise<UserSettings> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_settings')
    .insert({ ...settings, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Default equipment options
export const EQUIPMENT_OPTIONS = {
  home: [
    { value: 'sandbag', label: 'Sandbag' },
    { value: 'kettlebell', label: 'Kettlebell' },
    { value: 'rower', label: 'Rowing Machine' },
    { value: 'dumbbells', label: 'Dumbbells' },
    { value: 'resistance_bands', label: 'Resistance Bands' },
    { value: 'pull_up_bar', label: 'Pull-up Bar' },
    { value: 'yoga_mat', label: 'Yoga Mat' },
    { value: 'jump_rope', label: 'Jump Rope' },
  ],
  gym: [
    { value: 'barbell', label: 'Barbell' },
    { value: 'dumbbells', label: 'Dumbbells' },
    { value: 'cable_machine', label: 'Cable Machine' },
    { value: 'bench', label: 'Bench' },
    { value: 'squat_rack', label: 'Squat Rack' },
    { value: 'pull_up_bar', label: 'Pull-up Bar' },
    { value: 'dip_bars', label: 'Dip Bars' },
    { value: 'leg_press', label: 'Leg Press' },
    { value: 'leg_extension', label: 'Leg Extension' },
    { value: 'leg_curl', label: 'Leg Curl' },
    { value: 'calf_raise_machine', label: 'Calf Raise Machine' },
    { value: 'rowing_machine', label: 'Rowing Machine' },
    { value: 'treadmill', label: 'Treadmill' },
    { value: 'elliptical', label: 'Elliptical' },
    { value: 'smith_machine', label: 'Smith Machine' },
  ],
};

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];
