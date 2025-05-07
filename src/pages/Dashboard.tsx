
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import AppSidebar from '@/components/AppSidebar';
import RoomCard from '@/components/RoomCard';
import AddScheduleModal from '@/components/AddScheduleModal';
import { mockRooms, mockSchedules, mockCurrentUser } from '@/lib/mockData';
import { Room, Schedule, User } from '@/lib/types';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

const Dashboard: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [schedules, setSchedules] = useState<Schedule[]>(mockSchedules);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    // In a real app, fetch data from API
    // For demo, we'll check local storage for user
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else {
      // No user found, redirect to login
      navigate('/');
      return;
    }
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      // Randomly update some room statuses
      setRooms(prevRooms => {
        return prevRooms.map(room => {
          // Randomly update some rooms (20% chance)
          if (Math.random() > 0.8) {
            const currentDraw = room.status === 'available' 
              ? 0 
              : parseFloat((Math.random() * 2).toFixed(1));
            
            return {
              ...room,
              currentDraw,
              lastUpdated: new Date().toISOString()
            };
          }
          return room;
        });
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, [navigate]);

  const handleAddSchedule = (roomId: number) => {
    setSelectedRoomId(roomId);
    setIsAddModalOpen(true);
  };

  const handleSaveSchedule = (newSchedule: Omit<Schedule, 'id'>) => {
    // Generate a simple ID (in a real app, this would come from the backend)
    const id = `s${schedules.length + 1}`;
    setSchedules([...schedules, { ...newSchedule, id }]);
    
    // Update room status
    setRooms(prevRooms => {
      return prevRooms.map(room => {
        if (room.id === newSchedule.roomId) {
          return { ...room, status: 'reserved' };
        }
        return room;
      });
    });
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <AppSidebar userRole={currentUser.role} />
        <SidebarInset>
          <Navigation userRole={currentUser.role} />
          
          <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
            <div className="mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl font-bold">Room Dashboard</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Monitor and manage room availability in real-time
              </p>
            </div>
            
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
          </main>
          
          <AddScheduleModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSave={handleSaveSchedule}
            user={currentUser}
            existingSchedules={schedules}
            initialRoomId={selectedRoomId}
          />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
