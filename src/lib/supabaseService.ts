import { supabase } from './supabaseClient';
import { Room, Schedule, ActivityLog, User } from './types';

// User operations
export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data || [];
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  if (error && error.code !== 'PGSQL_ERROR_NO_DATA') throw error;
  return data;
};

// Room operations
export const getRooms = async (): Promise<Room[]> => {
  const { data, error } = await supabase.from('rooms').select('*');
  if (error) throw error;
  return data || [];
};

// Schedule operations
export const getSchedules = async (): Promise<Schedule[]> => {
  const { data, error } = await supabase.from('schedules').select('*');
  if (error) throw error;
  return data || [];
};

// Activity log operations
export const getLogs = async (): Promise<ActivityLog[]> => {
  const { data, error } = await supabase.from('activity_logs').select('*');
  if (error) throw error;
  return data || [];
};

// Add a new schedule
export const addSchedule = async (schedule: Omit<Schedule, 'id'>): Promise<Schedule> => {
  const { data, error } = await supabase
    .from('schedules')
    .insert(schedule)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Update user profile
export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
};