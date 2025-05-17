
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
import { Card, CardContent } from "@/components/ui/card";

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

  const userSchedules = schedules.filter(schedule => schedule.userId === currentUser.id);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar userRole={currentUser?.role || 'guest'} />
        <SidebarInset className="flex-1 w-full">
          <Navigation userRole={currentUser?.role || 'guest'} />
          
          <main className="w-full px-4 sm:px-6 py-4 sm:py-6">
            <Card className="border-0 shadow-none">
              <CardContent className="p-6">
                <Tabs 
                  defaultValue="booked" 
                  value={activeTab} 
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <div className="mb-6">
                    <TabsList className="grid grid-cols-2 w-full max-w-md">
                      <TabsTrigger value="booked" className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        My Bookings
                      </TabsTrigger>
                      <TabsTrigger value="add" className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Book a Room
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="booked" className="mt-0 pt-0">
                    <div className="mb-4">
                      <h2 className="text-2xl font-semibold">My Bookings</h2>
                      <p className="text-muted-foreground">View and manage your room bookings</p>
                    </div>
                    
                    {userSchedules.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">You don't have any bookings yet.</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setActiveTab("add")}
                        >
                          Book a room
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {userSchedules.map((schedule) => {
                          const room = rooms.find(r => r.id === schedule.roomId);
                          return (
                            <div key={schedule.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-lg">{schedule.title}</h3>
                                  <div className="text-sm text-muted-foreground">
                                    {room?.name || `Room ${schedule.roomId}`}
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-500"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                </Button>
                              </div>
                              
                              <div className="mt-3 flex items-center text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar mr-2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                                {schedule.date}
                              </div>
                              
                              <div className="mt-1 flex items-center text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock mr-2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                {schedule.startTime} - {schedule.endTime}
                              </div>
                              
                              {schedule.description && (
                                <div className="mt-2 text-sm text-muted-foreground">{schedule.description}</div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="add" className="mt-0">
                    <div className="mb-4">
                      <h2 className="text-2xl font-semibold">Room Booking Form</h2>
                      <p className="text-muted-foreground">Fill out the form to book a room</p>
                    </div>
                    
                    {rooms.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-xl text-muted-foreground">No rooms available.</p>
                        <p className="text-sm mt-2">Please contact administrator to add rooms.</p>
                      </div>
                    ) : (
                      <Button 
                        className="bg-guardian-yellow hover:bg-guardian-yellow/80 text-guardian-purple font-medium"
                        onClick={() => setIsAddModalOpen(true)}
                      >
                        Book Room
                      </Button>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
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
