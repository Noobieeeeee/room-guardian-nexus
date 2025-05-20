import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import AppSidebar from '@/components/AppSidebar';
import { Room } from '@/lib/types';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from 'sonner';
import { getRooms } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PowerData {
  name: string;
  timestamp: string;
  [key: string]: string | number;
}

const PowerAnalytics: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [powerData, setPowerData] = useState<PowerData[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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

    // Fetch initial data
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const roomsData = await getRooms();

        if (roomsData && Array.isArray(roomsData)) {
          setRooms(roomsData);
          // Create initial empty power data array
          initializePowerData(roomsData);
        } else {
          console.error('Invalid rooms data:', roomsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load power analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up real-time listener for power data updates
    const powerDataChannel = supabase
      .channel('room-power-updates')
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_power_data'
        },
        (payload) => {
          console.log('New power data received:', payload);
          const { room_id, current_draw, recorded_at } = payload.new;
          
          // Find the room name
          const room = rooms.find(r => r.id === room_id);
          const roomName = room ? room.name : `Room ${room_id}`;
          
          // Update power data for charts
          updatePowerDataChart(room_id, roomName, current_draw, recorded_at);
          
          // Update the rooms state
          setRooms(currentRooms => 
            currentRooms.map(room => 
              room.id === room_id 
                ? { ...room, currentDraw: current_draw, lastUpdated: recorded_at }
                : room
            )
          );
        }
      )
      .subscribe();

    // Clean up the subscription
    return () => {
      supabase.removeChannel(powerDataChannel);
    };
  }, [navigate, rooms]);

  // Initialize power data with the last 10 timestamps
  const initializePowerData = (roomsData: Room[]) => {
    // Create 10 data points (could be fetched from history in a real app)
    const initialData: PowerData[] = [];
    const now = new Date();
    
    for (let i = 9; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60000); // 1 minute intervals
      const entry: PowerData = {
        name: format(timestamp, 'HH:mm'),
        timestamp: timestamp.toISOString(),
      };

      // Add initial values for each room (could be 0 or fetched from history)
      roomsData.forEach(room => {
        entry[room.name] = room.currentDraw || 0;
      });

      initialData.push(entry);
    }
    
    setPowerData(initialData);
  };

  // Update power data for the charts
  const updatePowerDataChart = (roomId: number, roomName: string, currentDraw: number, timestamp: string) => {
    setPowerData(prevData => {
      // Get the last timestamp
      const lastTimestamp = new Date(prevData[prevData.length - 1]?.timestamp || new Date());
      const newTimestamp = new Date(timestamp);
      
      // If the new timestamp is within the last minute of the most recent data point,
      // update that point, otherwise create a new one
      if (newTimestamp.getTime() - lastTimestamp.getTime() < 60000) {
        // Update the last data point
        const updatedData = [...prevData];
        const lastIndex = updatedData.length - 1;
        updatedData[lastIndex] = {
          ...updatedData[lastIndex],
          [roomName]: currentDraw
        };
        return updatedData;
      } else {
        // Create a new data point
        const newDataPoint: PowerData = {
          name: format(newTimestamp, 'HH:mm'),
          timestamp: timestamp,
        };
        
        // Copy the last values for all rooms
        const lastDataPoint = prevData[prevData.length - 1] || {};
        rooms.forEach(room => {
          newDataPoint[room.name] = room.id === roomId ? currentDraw : (lastDataPoint[room.name] || 0);
        });
        
        // Keep only the last 10 data points
        const newData = [...prevData, newDataPoint].slice(-10);
        return newData;
      }
    });
  };

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border/50 rounded-md p-2 shadow-lg">
          <p className="text-sm font-bold mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value} A
            </p>
          ))}
        </div>
      );
    }
    return null;
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

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar userRole={currentUser.role} />
        <SidebarInset className="flex-1 w-full">
          <Navigation userRole={currentUser.role} />

          <main className="w-full px-4 sm:px:6 py-4 sm:py-6">
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">Power Analytics</h1>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Monitor room power consumption trends over time
                  </p>
                </div>
              </div>

              <Tabs defaultValue="realtime" className="mt-6">
                <TabsList className="mb-4">
                  <TabsTrigger value="realtime">Real-time Usage</TabsTrigger>
                  <TabsTrigger value="hourly">Hourly Average</TabsTrigger>
                </TabsList>
                
                <TabsContent value="realtime">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Real-time Power Consumption</CardTitle>
                      <CardDescription>
                        Live power usage data from all rooms (updated in real-time)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={powerData}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis label={{ value: 'Current (A)', angle: -90, position: 'insideLeft' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            {rooms.map((room, index) => (
                              <Line
                                key={room.id}
                                type="monotone"
                                dataKey={room.name}
                                stroke={`hsl(${index * 60}, 70%, 50%)`}
                                activeDot={{ r: 8 }}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="hourly">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Hourly Power Average</CardTitle>
                      <CardDescription>
                        Average power consumption per hour
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center h-[300px] border rounded-md border-dashed">
                        <p className="text-muted-foreground">Historical data will be available soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default PowerAnalytics;
