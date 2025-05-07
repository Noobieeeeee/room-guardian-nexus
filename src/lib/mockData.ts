
import { Room, Schedule, ActivityLog, User } from './types';

export const mockCurrentUser: User = {
  id: 'u1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  role: 'admin',
};

export const mockUsers: User[] = [
  mockCurrentUser,
  {
    id: 'u2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'faculty',
  },
  {
    id: 'u3',
    name: 'Guest User',
    email: 'guest@example.com',
    role: 'guest',
  },
];

export const mockRooms: Room[] = [
  {
    id: 101,
    name: 'Room 101',
    status: 'available',
    currentDraw: 0,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 102,
    name: 'Room 102',
    status: 'in-use',
    currentDraw: 1.2,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 103,
    name: 'Room 103',
    status: 'reserved',
    currentDraw: 0.8,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 104,
    name: 'Room 104',
    status: 'available',
    currentDraw: 0,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 105,
    name: 'Room 105',
    status: 'in-use',
    currentDraw: 1.5,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 106,
    name: 'Room 106',
    status: 'reserved',
    currentDraw: 0.5,
    lastUpdated: new Date().toISOString(),
  },
];

export const mockSchedules: Schedule[] = [
  {
    id: 's1',
    roomId: 103,
    title: 'Mathematics 101',
    description: 'Introduction to Calculus',
    userId: 'u1',
    userName: 'John Doe',
    date: '2025-05-07',
    startTime: '09:00',
    endTime: '10:30',
  },
  {
    id: 's2',
    roomId: 106,
    title: 'Physics Lab',
    description: 'Electricity and Magnetism',
    userId: 'u2',
    userName: 'Jane Smith',
    date: '2025-05-07',
    startTime: '11:00',
    endTime: '13:00',
  },
  {
    id: 's3',
    roomId: 102,
    title: 'Computer Science',
    description: 'Data Structures',
    userId: 'u1',
    userName: 'John Doe',
    date: '2025-05-08',
    startTime: '14:00',
    endTime: '15:30',
  },
];

export const mockLogs: ActivityLog[] = [
  {
    id: 'l1',
    roomId: 103,
    roomName: 'Room 103',
    userId: 'u1',
    userName: 'John Doe',
    date: '2025-05-06',
    time: '09:05',
    status: 'reserved',
    details: 'Scheduled session started',
  },
  {
    id: 'l2',
    roomId: 102,
    roomName: 'Room 102',
    userId: 'u2',
    userName: 'Jane Smith',
    date: '2025-05-06',
    time: '11:02',
    status: 'in-use',
    details: 'Unscheduled usage detected',
  },
  {
    id: 'l3',
    roomId: 105,
    roomName: 'Room 105',
    userId: 'u1',
    userName: 'John Doe',
    date: '2025-05-06',
    time: '13:15',
    status: 'available',
    details: 'Room freed up',
  },
  {
    id: 'l4',
    roomId: 106,
    roomName: 'Room 106',
    userId: 'u2',
    userName: 'Jane Smith',
    date: '2025-05-07',
    time: '10:00',
    status: 'reserved',
    details: 'Scheduled session started',
  },
];
