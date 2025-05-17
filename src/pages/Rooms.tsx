
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import AppSidebar from '@/components/AppSidebar';
import { User, Room, Schedule } from '@/lib/types';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from 'sonner';
import { getRooms, getSchedules } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Plus } from 'lucide-react';
import RoomSchedulesView from '@/components/RoomSchedulesView';
import AddScheduleModal from '@/components/AddScheduleModal';

const Rooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for logged in user
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        // Only admin and faculty can access this page
        if (user.role !== 'admin' && user.role !== 'faculty') {
          toast.error('You do not have permission to access this page');
          navigate('/dashboard');
          return;
        }
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
        navigate('/');
        return;
      }
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
        
        if (roomsData && Array.isArray(roomsData)) {
          setRooms(roomsData);
        }
        
        if (schedulesData && Array.isArray(schedulesData)) {
          setSchedules(schedulesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load room management data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Refresh data periodically
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleAddSchedule = (roomId?: number) => {
    setSelectedRoomId(roomId);
    setIsAddModalOpen(true);
  };

  const handleSaveSchedule = async (newSchedule: Omit<Schedule, 'id'>) => {
    try {
      // Implementation would connect to the API
      toast.success('Schedule created successfully');
      // Mock update of local state
      const mockSchedule: Schedule = {
        ...newSchedule,
        id: `tmp-${Date.now()}`,
      };
      setSchedules([...schedules, mockSchedule]);
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Failed to create schedule');
    }
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    // Implementation would connect to the API
    setSchedules(schedules.filter(s => s.id !== scheduleId));
    toast.success('Schedule deleted successfully');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-guardian-yellow"></div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar userRole={currentUser?.role || 'guest'} />
        <SidebarInset className="flex-1 w-full">
          <Navigation userRole={currentUser?.role || 'guest'} />
          
          <main className="w-full px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">Room Management</h1>
                <p className="text-muted-foreground">Manage room schedules and bookings</p>
              </div>
              
              <Button onClick={() => handleAddSchedule()} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add Schedule
              </Button>
            </div>
            
            <Tabs defaultValue="schedules" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="schedules">Booked Schedules</TabsTrigger>
                <TabsTrigger value="new">Add Schedule</TabsTrigger>
              </TabsList>
              
              <TabsContent value="schedules" className="mt-4">
                <RoomSchedulesView 
                  rooms={rooms} 
                  schedules={schedules}
                  onDelete={handleDeleteSchedule}
                  userRole={currentUser?.role || 'guest'}
                  userId={currentUser?.id || ''}
                />
              </TabsContent>
              
              <TabsContent value="new" className="mt-4">
                <div className="bg-white p-6 rounded-lg border">
                  <h2 className="text-lg font-medium mb-4">Create New Room Schedule</h2>
                  <p className="text-muted-foreground mb-4">
                    Use the form below to create a new room booking.
                  </p>
                  
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    Open Scheduling Form
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
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

export default Rooms;
