
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import AppSidebar from '@/components/AppSidebar';
import RoomCard from '@/components/RoomCard';
import { Room, Schedule, User, RoomStatus } from '@/lib/types';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from 'sonner';
import { getRooms, getSchedules } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, TooltipProps, CartesianGrid, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutDashboard, LineChart as LineChartIcon } from "lucide-react";
import { format } from 'date-fns';

// Interface for power time series data
interface PowerTimeData {
  name: string;
  timestamp: string;
  [key: string]: string | number; // Room names as keys with power values
}

const Dashboard: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [powerUsage, setPowerUsage] = useState<{[key: number]: number}>({});
  const [powerTimeData, setPowerTimeData] = useState<PowerTimeData[]>([]);
  const [view, setView] = useState<string>("room");
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const navigate = useNavigate();

  // Effect for auto-refreshing the chart data every 3 seconds
  useEffect(() => {
    if (isLoading || !rooms.length) return;

    // Set up an interval to update the time-series data every 3 seconds
    const intervalId = setInterval(() => {
      // Always add a new data point every 3 seconds to ensure continuous updates
      const now = new Date();

      setPowerTimeData(prevData => {
        // Create a new data point with current values in 12-hour format
        const newPoint: PowerTimeData = {
          name: format(now, 'h:mm:ss a'),
          timestamp: now.toISOString(),
        };

        // Copy current values for all rooms
        rooms.forEach(room => {
          // Use the previous value with a small increment/decrement to make transitions smoother
          const prevValue = prevData.length > 0 ? (prevData[prevData.length - 1][room.name] || 0) : 0;
          const currentValue = room.currentDraw || 0;

          // Smooth the transition by moving slightly toward the current value
          // This creates a more continuous line rather than abrupt changes
          newPoint[room.name] = currentValue;
        });

        // Keep only the last 30 data points (90 seconds of data with 3-second intervals)
        // No need to sort as we're always adding to the end and the data is already in order
        return [...prevData, newPoint].slice(-30);
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(intervalId);
  }, [isLoading, rooms]);

  // Debug effect to monitor powerTimeData changes
  useEffect(() => {
    console.log('powerTimeData updated:', powerTimeData);
  }, [powerTimeData]);

  // Force chart update when view changes to graph
  useEffect(() => {
    if (view === "graph") {
      // Force a small update to powerTimeData to trigger a re-render
      setPowerTimeData(prevData => {
        if (prevData.length === 0) return prevData;

        // Create a shallow copy to trigger a re-render
        return [...prevData];
      });
    }
  }, [view]);

  useEffect(() => {
    // Check for logged in user
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        console.log('Current user from localStorage:', user);
        setCurrentUser(user);

        // If user is not admin, redirect to calendar page
        if (user.role !== 'admin') {
          navigate('/calendar');
          return;
        }
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
        navigate('/');
        return;
      }
    } else {
      // No user found, redirect to login
      console.log('No user found in localStorage, redirecting to login');
      navigate('/');
      return;
    }

    // Initialize power time data with the last 90 seconds (30 points at 3-second intervals)
    const initializePowerTimeData = (roomsData: Room[]) => {
      // Create 30 data points with 3-second intervals
      const initialData: PowerTimeData[] = [];
      const now = new Date();

      for (let i = 29; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 3000); // 3 second intervals
        const entry: PowerTimeData = {
          name: format(timestamp, 'h:mm:ss a'),
          timestamp: timestamp.toISOString(),
        };

        // Add initial values for each room
        roomsData.forEach(room => {
          entry[room.name] = room.currentDraw || 0;
        });

        initialData.push(entry);
      }

      setPowerTimeData(initialData);
    };

    // Fetch initial data
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [roomsData, schedulesData] = await Promise.all([
          getRooms(),
          getSchedules()
        ]);

        if (roomsData && Array.isArray(roomsData)) {
          setRooms(roomsData);
          // Initialize power usage data
          const initialPowerUsage: {[key: number]: number} = {};
          roomsData.forEach(room => {
            initialPowerUsage[room.id] = room.currentDraw || 0;
          });
          setPowerUsage(initialPowerUsage);

          // Initialize time series data for the line chart
          initializePowerTimeData(roomsData);
        } else {
          console.error('Invalid rooms data:', roomsData);
        }

        if (schedulesData && Array.isArray(schedulesData)) {
          setSchedules(schedulesData);
        } else {
          console.error('Invalid schedules data:', schedulesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Function to update power time data for the charts
    const updatePowerTimeData = (roomId: number, roomName: string, currentDraw: number, timestamp: string, allRooms: Room[]) => {
      setPowerTimeData(prevData => {
        if (prevData.length === 0) return prevData;

        // Get the last data point
        const lastDataPoint = prevData[prevData.length - 1];

        // Instead of creating a new point for each update, just update the most recent point
        // This reduces the number of redraws and makes the chart smoother
        const updatedData = [...prevData];
        const lastIndex = updatedData.length - 1;

        // Update the value for the specific room
        updatedData[lastIndex] = {
          ...updatedData[lastIndex],
          [roomName]: currentDraw
        };

        return updatedData;
      });
    };

    // Set up real-time listener for power data updates
    const powerDataChannel = supabase
      .channel('room-power-updates')
      .on('postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'room_power_data'
        },
        (payload) => {
          console.log('Power data update received:', payload);
          const { room_id, current_draw, recorded_at } = payload.new;
          const timestamp = recorded_at || new Date().toISOString();

          // Find the room name
          const room = rooms.find(r => r.id === room_id);
          const roomName = room ? room.name : `Room ${room_id}`;

          // Update the power usage state
          setPowerUsage(prev => ({
            ...prev,
            [room_id]: current_draw
          }));

          // Update the time series data for the chart
          updatePowerTimeData(room_id, roomName, current_draw, timestamp, rooms);

          // Update the rooms state
          setRooms(currentRooms =>
            currentRooms.map(room =>
              room.id === room_id
                ? { ...room, currentDraw: current_draw, lastUpdated: timestamp }
                : room
            )
          );
        }
      )
      .subscribe();

    // Also set up a listener for the latest power data
    const latestPowerDataChannel = supabase
      .channel('latest-power-data')
      .on('postgres_changes',
        {
          event: '*', // Listen for all events
          schema: 'public',
          table: 'rooms',
          filter: 'current_draw=neq.null' // Only listen for changes to current_draw
        },
        (payload) => {
          console.log('Room power update received:', payload);
          const { id, current_draw, last_updated } = payload.new;

          // Update the rooms state directly
          setRooms(currentRooms =>
            currentRooms.map(room =>
              room.id === id
                ? {
                    ...room,
                    currentDraw: current_draw,
                    lastUpdated: last_updated || new Date().toISOString()
                  }
                : room
            )
          );
        }
      )
      .subscribe();

    // Clean up the subscriptions
    return () => {
      supabase.removeChannel(powerDataChannel);
      supabase.removeChannel(latestPowerDataChannel);
    };
  }, [navigate]);

  // Get data for the bar chart (original implementation)
  const getChartData = () => {
    return rooms.map(room => ({
      name: room.name,
      value: Number(room.currentDraw || 0),
    }));
  };

  // Get filtered data for the line chart based on selected room
  const getFilteredChartData = () => {
    // Avoid deep copying the entire dataset which can cause performance issues
    // Instead, use a shallow copy for "all" or map to a new array for filtered data

    if (selectedRoom === "all") {
      // Return a shallow copy when "All Rooms" is selected
      return [...powerTimeData];
    } else {
      // When a specific room is selected, create a filtered dataset
      // that only includes the timestamp and the selected room's data
      const selectedRoomObj = rooms.find(room => room.id.toString() === selectedRoom);
      if (!selectedRoomObj) return [...powerTimeData];

      // Create a new array with only the selected room's data
      return powerTimeData.map((dataPoint: PowerTimeData) => ({
        name: dataPoint.name,
        timestamp: dataPoint.timestamp,
        [selectedRoomObj.name]: dataPoint[selectedRoomObj.name] || 0
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-guardian-yellow"></div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Admin Access Required</h2>
          <p className="mb-4">You need admin privileges to view this page.</p>
          <button
            onClick={() => navigate('/calendar')}
            className="bg-guardian-yellow hover:bg-guardian-yellow/80 text-guardian-purple px-4 py-2 rounded"
          >
            Go to Calendar
          </button>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      // Get the selected room object if a specific room is selected
      const selectedRoomObj = selectedRoom !== "all"
        ? rooms.find(room => room.id.toString() === selectedRoom)
        : null;

      return (
        <div className="bg-background border border-border/50 rounded-md p-2 shadow-lg">
          <p className="font-medium text-sm mb-1">{payload[0].payload.name}</p>
          {payload.map((entry, index) => {
            // Skip entries with no value (happens when filtering)
            if (entry.value === undefined || entry.value === null) return null;

            // For a specific room, highlight the data more prominently
            const isSelectedRoom = selectedRoomObj && entry.name === selectedRoomObj.name;

            return (
              <p
                key={index}
                className={`text-sm ${isSelectedRoom ? 'font-medium' : ''}`}
                style={{ color: entry.color }}
              >
                {entry.name}: {entry.value} A
                {isSelectedRoom && ' (Selected)'}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar userRole={currentUser.role} />
        <SidebarInset className="flex-1 w-full">
          <Navigation userRole={currentUser.role} />

          <main className="w-full px-4 sm:px-6 py-4 sm:py-6">
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">Room Status Dashboard</h1>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Monitor room availability and power status in real-time
                  </p>
                </div>
              </div>

              {/* View switcher */}
              <div className="mt-6 mb-4">
                <Tabs value={view} onValueChange={setView} className="w-full">
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="room">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Room Cards
                    </TabsTrigger>
                    <TabsTrigger value="graph">
                      <LineChartIcon className="mr-2 h-4 w-4" />
                      Power Graph
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="room" className="mt-4">
                    {rooms.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-xl text-muted-foreground">No rooms available.</p>
                        <p className="text-sm mt-2">Please add rooms in the Room Management page.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                        {rooms.slice(0, 6).map((room) => (
                          <RoomCard
                            key={room.id}
                            room={room}
                            schedules={schedules}
                            onAddSchedule={() => navigate('/rooms')}
                            userRole={currentUser.role}
                            dashboardView={true}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="graph" className="mt-4">
                    <div className="border rounded-lg p-4 bg-card">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                        <div>
                          <h3 className="text-lg font-medium mb-1">Room Power Consumption</h3>
                          {selectedRoom !== "all" && (
                            <p className="text-sm text-muted-foreground">
                              Showing data for {rooms.find(room => room.id.toString() === selectedRoom)?.name || 'Selected Room'}
                            </p>
                          )}
                        </div>
                        <div className="w-full sm:w-48 mt-2 sm:mt-0">
                          <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Room" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Rooms</SelectItem>
                              {rooms.map((room) => (
                                <SelectItem key={room.id} value={room.id.toString()}>
                                  {room.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={getFilteredChartData()}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                            animationDuration={300}
                            animationEasing="linear"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis
                              label={{ value: 'Current (A)', angle: -90, position: 'insideLeft' }}
                              domain={selectedRoom !== "all" ? [0, 'dataMax + 0.5'] : [0, 'auto']}
                              tickCount={5}
                              allowDecimals={true}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            {rooms
                              .filter(room => selectedRoom === "all" || room.id.toString() === selectedRoom)
                              .map((room, index) => (
                                <Line
                                  key={room.id}
                                  type="monotone"
                                  dataKey={room.name}
                                  stroke={selectedRoom === "all"
                                    ? `hsl(${index * 60}, 70%, 50%)`
                                    : `hsl(${rooms.findIndex(r => r.id.toString() === selectedRoom) * 60}, 70%, 50%)`
                                  }
                                  activeDot={{ r: 8 }}
                                  strokeWidth={selectedRoom !== "all" ? 2 : 1}
                                  animationDuration={300}
                                  animationEasing="linear"
                                  isAnimationActive={true}
                                  dot={false}
                                />
                              ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
