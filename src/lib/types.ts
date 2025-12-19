
export type UserRole = 'admin' | 'faculty' | 'guest' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
}

export type RoomStatus = 'available' | 'in-use' | 'reserved';

export interface Room {
  id: number;
  name: string;
  status: RoomStatus;
  currentDraw: number | null;
  lastUpdated: string;
}

export interface Schedule {
  id: string;
  roomId: number;
  title: string;
  description?: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface ActivityLog {
  id: string;
  roomId: number;
  roomName: string;
  userId: string;
  userName: string;
  date: string;
  time: string;
  status: RoomStatus;
  details?: string;
}
