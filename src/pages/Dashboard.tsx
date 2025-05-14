import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import AppSidebar from '@/components/AppSidebar';
import RoomCard from '@/components/RoomCard';
import AddScheduleModal from '@/components/AddScheduleModal';
import { Room, Schedule, User } from '@/lib/types';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from 'sonner';
import { getRooms, getSchedules, createSchedule } from '@/lib/api';
import { Button } from '@/components/ui/button';

const Dashboard: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for logged in user
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else {
      // No user found, redirect to login
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
        
        setRooms(roomsData);
        setSchedules(schedulesData);
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
        setRooms(updatedRooms);
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, [navigate]);

  const handleAddSchedule = (roomId: number) => {
    setSelectedRoomId(roomId);
    setIsAddModalOpen(true);
  };

  const handleSaveSchedule = async (newSchedule: Omit<Schedule, 'id'>) => {
    try {
      const createdSchedule = await createSchedule(newSchedule);
      
      if (createdSchedule) {
        // Update local state
        setSchedules(prev => [...prev, createdSchedule]);
        
        // Update room status
        setRooms(prevRooms => {
          return prevRooms.map(room => {
            if (room.id === newSchedule.roomId) {
              return { ...room, status: 'reserved' };
            }
            return room;
          });
        });
        
        toast.success('Schedule created successfully');
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Failed to create schedule');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-guardian-yellow"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
          <p className="mb-4">Please sign in to access the dashboard.</p>
          <Button 
            onClick={() => navigate('/')}
            className="bg-guardian-yellow hover:bg-guardian-yellow/80 text-guardian-purple"
          >
            Go to Login
          </Button>
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
              <h1 className="text-xl sm:text-2xl font-bold">Room Dashboard</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Monitor and manage room availability in real-time
              </p>
            </div>
            
            {rooms.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xl text-muted-foreground">No rooms available.</p>
                <p className="text-sm mt-2">Please add rooms in the Supabase dashboard.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {rooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    schedules={schedules.filter(s => s.roomId === room.id)}
                    onAddSchedule={handleAddSchedule}
                    userRole={currentUser.role}
                  />
                ))}
              </div>
            )}
          </main>
          
          <AddScheduleModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSave={handleSaveSchedule}
            user={currentUser}
            existingSchedules={schedules}
            initialRoomId={selectedRoomId}
            rooms={rooms}
          />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
