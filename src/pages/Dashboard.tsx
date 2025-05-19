import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import AppSidebar from '@/components/AppSidebar';
import RoomCard from '@/components/RoomCard';
import { Room, Schedule, User, RoomStatus, UserRole } from '@/lib/types';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from 'sonner';
import { getRooms, getSchedules } from '@/lib/api';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Function to get schedules for today only
  const getTodaySchedules = (allSchedules: Schedule[]): Schedule[] => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return allSchedules.filter(schedule => schedule.date === today);
  };

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

    // Simulate real-time updates by polling
    const interval = setInterval(() => {
      getRooms().then(updatedRooms => {
        if (updatedRooms && Array.isArray(updatedRooms)) {
          setRooms(updatedRooms);
        }
      });

      getSchedules().then(updatedSchedules => {
        if (updatedSchedules && Array.isArray(updatedSchedules)) {
          setSchedules(updatedSchedules);
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [navigate]);

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

          <main className="w-full px-4 sm:px-6 py-4 sm:py-6">
            <div className="mb-4 sm:mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">Room Status Dashboard</h1>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Monitor room availability and power status in real-time
                  </p>
                </div>
              </div>
            </div>

            {rooms.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xl text-muted-foreground">No rooms available.</p>
                <p className="text-sm mt-2">Please add rooms in the Room Management page.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {/* Get schedules for today only */}
                {(() => {
                  const todaySchedules = getTodaySchedules(schedules);

                  return rooms.slice(0, 6).map((room) => {
                    // Filter today's schedules for this specific room
                    const roomTodaySchedules = todaySchedules.filter(s => s.roomId === room.id);

                    return (
                      <RoomCard
                        key={room.id}
                        room={room}
                        schedules={roomTodaySchedules}
                        onAddSchedule={() => navigate('/rooms')}
                        userRole={currentUser.role}
                        dashboardView={true}
                      />
                    );
                  });
                })()}
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
