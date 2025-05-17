
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import AppSidebar from '@/components/AppSidebar';
import RoomCard from '@/components/RoomCard';
import { Room, Schedule, User, RoomStatus, UserRole } from '@/lib/types';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { getRooms, getSchedules, createSchedule } from '@/lib/api';
import AddScheduleModal from '@/components/AddScheduleModal';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, List } from 'lucide-react';
import CalendarView from '@/components/CalendarView';

const Rooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("booked");
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
        
        // If user is guest, redirect to calendar page
        if (user.role === 'guest') {
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
      navigate('/');
      return;
    }
    
    // Fetch data
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
        toast.error('Failed to load room management data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Set up polling for updates
    const interval = setInterval(() => {
      Promise.all([
        getRooms(),
        getSchedules()
      ]).then(([roomsData, schedulesData]) => {
        if (roomsData && Array.isArray(roomsData)) {
          setRooms(roomsData);
        }
        
        if (schedulesData && Array.isArray(schedulesData)) {
          setSchedules(schedulesData);
        }
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
      // Import is already fixed at the top of the file
      const createdSchedule = await createSchedule(newSchedule);
      
      if (createdSchedule) {
        // Update local state
        setSchedules(prev => [...prev, createdSchedule]);
        
        // Update room status
        setRooms(prevRooms => {
          return prevRooms.map(room => {
            if (room.id === newSchedule.roomId) {
              return { ...room, status: 'reserved' as RoomStatus };
            }
            return room;
          });
        });
        
        toast.success('Schedule created successfully');
        setActiveTab("booked"); // Switch to booked tab to show the new schedule
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

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'faculty')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
          <p className="mb-4">Only faculty and administrators can access room management.</p>
          <Button 
            onClick={() => navigate('/calendar')}
            variant="default"
          >
            Go to Calendar
          </Button>
        </div>
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
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Room Management</h1>
                <p className="text-muted-foreground">
                  Manage room bookings and schedules
                </p>
              </div>
              
              <Tabs 
                defaultValue="booked" 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full sm:w-auto"
              >
                <TabsList className="grid grid-cols-2 w-full sm:w-[300px]">
                  <TabsTrigger value="booked" className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    Booked Schedule
                  </TabsTrigger>
                  <TabsTrigger value="add" className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Add Schedule
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="booked" className="pt-4 mt-0">
                  {currentUser && <CalendarView schedules={schedules} currentUser={currentUser} />}
                </TabsContent>
                
                <TabsContent value="add" className="pt-4 mt-0">
                  {rooms.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-xl text-muted-foreground">No rooms available.</p>
                      <p className="text-sm mt-2">Please contact administrator to add rooms.</p>
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
                </TabsContent>
              </Tabs>
            </div>
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
