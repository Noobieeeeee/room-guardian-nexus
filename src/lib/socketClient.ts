import socketService from '@/integrations/socket/socketService';

// Initialize socket connection with environment variable
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

// Only connect if we're not in a server-side rendering environment
if (typeof window !== 'undefined') {
  socketService.connect(SOCKET_URL);
}

export default socketService;