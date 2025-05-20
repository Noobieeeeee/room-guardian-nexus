
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import AppSidebar from '@/components/AppSidebar';
import RoomCard from '@/components/RoomCard';
import { Room, Schedule, User, RoomStatus } from '@/lib/types';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from 'sonner';
import { getRooms, getSchedules } from '@/lib/api';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { ChartContainer } from '@/components/ui/chart';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, TooltipProps, CartesianGrid } from 'recharts';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, LineChart } from "lucide-react";
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [powerUsage, setPowerUsage] = useState<{[key: number]: number}>({});
  const [view, setView] = useState<string>("room");
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
          const { room_id, current_draw } = payload.new;
          
          // Update the power usage state
          setPowerUsage(prev => ({
            ...prev,
            [room_id]: current_draw
          }));
          
          // Update the rooms state
          setRooms(currentRooms => 
            currentRooms.map(room => 
              room.id === room_id 
                ? { ...room, currentDraw: current_draw, lastUpdated: new Date().toISOString() }
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
  }, [navigate]);

  const getTotalPowerUsage = () => {
    return Object.values(powerUsage).reduce((sum, curr) => sum + Number(curr), 0);
  };

  const getChartData = () => {
    return rooms.map(room => ({
      name: room.name,
      value: Number(room.currentDraw || 0),
    }));
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
      return (
        <div className="bg-background border border-border/50 rounded-md p-2 shadow-lg">
          <p className="font-medium">{payload[0].name}: {payload[0].value} A</p>
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
                <Link to="/power-analytics">
                  <Button variant="outline" size="sm" className="gap-1">
                    <LineChart className="h-4 w-4" />
                    <span>Detailed Analytics</span>
                  </Button>
                </Link>
              </div>

              {/* Power usage overview */}
              <div className="mt-6 p-4 border rounded-lg bg-card shadow-sm">
                <h2 className="text-lg font-semibold mb-2">Total Power Usage</h2>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl font-bold">{getTotalPowerUsage().toFixed(2)} A</span>
                  <span className="text-muted-foreground">current draw</span>
                </div>
                
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={getChartData()}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
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
                      <LineChart className="mr-2 h-4 w-4" />
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
                      <h3 className="text-lg font-medium mb-4">Room Power Consumption</h3>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={getChartData()}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis label={{ value: 'Current (A)', angle: -90, position: 'insideLeft' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" fill="#7E69AB" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 text-center">
                        <Link to="/power-analytics">
                          <Button>
                            <LineChart className="mr-2 h-4 w-4" />
                            View Detailed Analytics
                          </Button>
                        </Link>
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
