import { io, Socket } from 'socket.io-client';

// Define the events we'll be using
export enum SocketEvents {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ROOM_POWER_UPDATE = 'room_power_update',
  ROOM_STATUS_UPDATE = 'room_status_update',
}

// Define the structure of power update data
export interface PowerUpdateData {
  room_id: number;
  room_name: string;
  current_draw: number;
  timestamp: string;
}

// Define the structure of status update data
export interface StatusUpdateData {
  room_id: number;
  room_name: string;
  status: string;
  timestamp: string;
}

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  // Initialize the socket connection
  connect(url: string = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'): void {
    if (this.socket) {
      console.warn('Socket connection already exists');
      return;
    }

    this.socket = io(url, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on(SocketEvents.CONNECT, () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on(SocketEvents.DISCONNECT, (reason) => {
      console.log('Socket disconnected:', reason);
    });

    // Set up listeners for our custom events
    this.setupEventListeners();
  }

  // Disconnect the socket
  disconnect(): void {
    if (!this.socket) {
      console.warn('No socket connection to disconnect');
      return;
    }

    this.socket.disconnect();
    this.socket = null;
    this.listeners.clear();
  }

  // Set up listeners for our custom events
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Listen for room power updates
    this.socket.on(SocketEvents.ROOM_POWER_UPDATE, (data: PowerUpdateData) => {
      this.notifyListeners(SocketEvents.ROOM_POWER_UPDATE, data);
    });

    // Listen for room status updates
    this.socket.on(SocketEvents.ROOM_STATUS_UPDATE, (data: StatusUpdateData) => {
      this.notifyListeners(SocketEvents.ROOM_STATUS_UPDATE, data);
    });
  }

  // Add a listener for a specific event
  on(event: SocketEvents, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  // Remove a listener for a specific event
  off(event: SocketEvents, callback: Function): void {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event)?.delete(callback);
  }

  // Notify all listeners for a specific event
  private notifyListeners(event: string, data: any): void {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in socket listener for event ${event}:`, error);
      }
    });
  }

  // Check if the socket is connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Emit an event to the server
  emit(event: string, data: any): void {
    if (!this.socket) {
      console.warn('No socket connection to emit event');
      return;
    }
    this.socket.emit(event, data);
  }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService;
