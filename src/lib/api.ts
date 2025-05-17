
import { Room, Schedule, User, ActivityLog } from './types';
import { toast } from 'sonner';

const API_URL = '/api';

// Error handling wrapper for fetch requests
const fetchWithErrorHandling = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Room API
export const getRooms = async (): Promise<Room[]> => {
  return fetchWithErrorHandling(`${API_URL}/rooms`);
};

export const updateRoomStatus = async (id: number, status: string): Promise<Room> => {
  return fetchWithErrorHandling(`${API_URL}/rooms/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
};

// User API
export const getUsers = async (): Promise<User[]> => {
  return fetchWithErrorHandling(`${API_URL}/users`);
};

export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
  return fetchWithErrorHandling(`${API_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });
};

export const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  return fetchWithErrorHandling(`${API_URL}/users/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
};

export const deleteUser = async (id: string): Promise<void> => {
  return fetchWithErrorHandling(`${API_URL}/users/${id}`, {
    method: 'DELETE',
  });
};

// Schedule API
export const getSchedules = async (): Promise<Schedule[]> => {
  return fetchWithErrorHandling(`${API_URL}/schedules`);
};

export const createSchedule = async (schedule: Omit<Schedule, 'id'>): Promise<Schedule> => {
  const currentUser = localStorage.getItem('currentUser');
  let userId = null;
  let userName = '';
  
  if (currentUser) {
    try {
      const user = JSON.parse(currentUser);
      userId = user.id;
      userName = user.name;
    } catch (e) {
      console.error('Failed to parse user from localStorage:', e);
      toast.error('Authentication error. Please log in again.');
      throw new Error('Authentication error');
    }
  }
  
  if (!userId) {
    toast.error('User ID is required to create a schedule');
    throw new Error('Missing user ID');
  }
  
  const scheduleWithUser = {
    ...schedule,
    userId,
    userName
  };
  
  console.log('Creating schedule with data:', scheduleWithUser);
  
  return fetchWithErrorHandling(`${API_URL}/schedules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(scheduleWithUser),
  });
};

export const updateSchedule = async (id: number, scheduleData: Partial<Schedule>): Promise<Schedule> => {
  return fetchWithErrorHandling(`${API_URL}/schedules/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(scheduleData),
  });
};

export const deleteSchedule = async (id: number): Promise<void> => {
  return fetchWithErrorHandling(`${API_URL}/schedules/${id}`, {
    method: 'DELETE',
  });
};

// Activity logs API
export const getActivityLogs = async (): Promise<ActivityLog[]> => {
  return fetchWithErrorHandling(`${API_URL}/logs`);
};
