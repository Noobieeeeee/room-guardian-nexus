// Simple Socket.io server for development
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Create HTTP server
const httpServer = createServer();

// Create Socket.io server with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:8080", // Your frontend URL
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

// Sample room data
const rooms = [
  { id: 101, name: 'Room 101', status: 'available', currentDraw: 0 },
  { id: 102, name: 'Room 102', status: 'in-use', currentDraw: 1.2 },
  { id: 103, name: 'Room 103', status: 'reserved', currentDraw: 0.8 },
  { id: 104, name: 'Room 104', status: 'available', currentDraw: 0 },
  { id: 105, name: 'Room 105', status: 'in-use', currentDraw: 1.5 },
  { id: 106, name: 'Room 106', status: 'reserved', currentDraw: 0.5 },
];

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial data to the client
  socket.emit('initial_data', rooms);

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Simulate random power updates every few seconds
setInterval(() => {
  const roomIndex = Math.floor(Math.random() * rooms.length);
  const room = rooms[roomIndex];
  
  // Generate a random power value between 0 and 3
  const newPowerValue = Math.random() * 3;
  room.currentDraw = parseFloat(newPowerValue.toFixed(2));
  
  // Emit the power update event
  io.emit('room_power_update', {
    room_id: room.id,
    room_name: room.name,
    current_draw: room.currentDraw,
    timestamp: new Date().toISOString()
  });
  
  console.log(`Power update for ${room.name}: ${room.currentDraw}A`);
}, 3000);

// Simulate random status updates every 10 seconds
setInterval(() => {
  const roomIndex = Math.floor(Math.random() * rooms.length);
  const room = rooms[roomIndex];
  
  // Generate a random status
  const statuses = ['available', 'in-use', 'reserved'];
  const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
  room.status = newStatus;
  
  // Emit the status update event
  io.emit('room_status_update', {
    room_id: room.id,
    room_name: room.name,
    status: room.status,
    timestamp: new Date().toISOString()
  });
  
  console.log(`Status update for ${room.name}: ${room.status}`);
}, 10000);

// Start the server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
