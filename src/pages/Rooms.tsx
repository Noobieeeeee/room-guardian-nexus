
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import AppSidebar from '@/components/AppSidebar';
import RoomCard from '@/components/RoomCard';
import { Room, Schedule, User, RoomStatus, UserRole } from '@/lib/types';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { getRooms, getSchedules, createSchedule, deleteSchedule, updateSchedule, createRoom } from '@/lib/api';
import AddScheduleModal from '@/components/AddScheduleModal';
import EditScheduleModal from '@/components/EditScheduleModal';
import ViewScheduleModal from '@/components/ViewScheduleModal';
import BookingForm from '@/components/BookingForm';
import RoomFormModal from '@/components/RoomFormModal';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, List, Trash2, Edit, ArrowUpDown, ArrowUp, ArrowDown, Eye } from 'lucide-react';
import CalendarView from '@/components/CalendarView';
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatTime } from '@/lib/dateUtils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Define the type for sortable columns
type SortColumn = 'title' | 'roomName' | 'date' | 'time';
type SortDirection = 'asc' | 'desc';

const Rooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("booked");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<Schedule | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [scheduleToView, setScheduleToView] = useState<Schedule | null>(null);
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

  const handleAddRoom = () => {
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async (roomData: Omit<Room, 'id' | 'lastUpdated'>) => {
    try {
      const newRoom = await createRoom(roomData);
      setRooms([...rooms, newRoom]);
      toast.success('Room created successfully');
      setIsRoomModalOpen(false);
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room');
    }
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

  // Handle opening the delete confirmation dialog
  const handleDeleteClick = (scheduleId: string) => {
    setScheduleToDelete(scheduleId);
    setIsDeleteDialogOpen(true);
  };

  // Handle confirming the deletion
  const handleConfirmDelete = async () => {
    if (!scheduleToDelete) return;

    try {
      await deleteSchedule(Number(scheduleToDelete));

      // Update local state by removing the deleted schedule
      setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleToDelete));

      toast.success('Schedule deleted successfully');
      setIsDeleteDialogOpen(false);
      setScheduleToDelete(null);
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  // Handle opening the edit modal
  const handleEditClick = (schedule: Schedule) => {
    setScheduleToEdit(schedule);
    setIsEditModalOpen(true);
  };

  // Handle opening the view modal
  const handleViewClick = (schedule: Schedule) => {
    setScheduleToView(schedule);
    setIsViewModalOpen(true);
  };

  // Handle saving the edited schedule
  const handleUpdateSchedule = async (id: string, scheduleData: Partial<Schedule>) => {
    try {
      const updatedSchedule = await updateSchedule(Number(id), scheduleData);

      // Update local state by replacing the updated schedule
      setSchedules(prev => prev.map(schedule =>
        schedule.id === id ? updatedSchedule : schedule
      ));

      toast.success('Schedule updated successfully');
      setIsEditModalOpen(false);
      setScheduleToEdit(null);
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update schedule');
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

  // Function to handle sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Get room name by ID
  const getRoomName = (roomId: number): string => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : `Room ${roomId}`;
  };

  // Filter user's schedules
  const userSchedules = schedules.filter(schedule => schedule.userId === currentUser.id);

  // Sort user schedules based on current sort settings
  const sortedUserSchedules = [...userSchedules].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;

    switch (sortColumn) {
      case 'title':
        return (a.title || '').localeCompare(b.title || '') * direction;

      case 'roomName':
        return getRoomName(a.roomId).localeCompare(getRoomName(b.roomId)) * direction;

      case 'date':
        return a.date.localeCompare(b.date) * direction;

      case 'time':
        return a.startTime.localeCompare(b.startTime) * direction;

      default:
        return 0;
    }
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar userRole={currentUser?.role || 'guest'} />
        <SidebarInset className="flex-1 w-full">
          <Navigation userRole={currentUser?.role || 'guest'} />

          <main className="w-full px-4 sm:px-6 py-4 sm:py-6">
            <Card className="border-0 shadow-none">
              <CardContent className="p-6">
                <Tabs
                  defaultValue="add"
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <div className="mb-6 flex justify-between items-center">
                    <TabsList className="grid grid-cols-2 w-full max-w-md">
                      <TabsTrigger value="add" className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        Book a Room
                      </TabsTrigger>
                      <TabsTrigger value="booked" className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        My Bookings
                      </TabsTrigger>
                    </TabsList>
                    {/*currentUser?.role === 'admin' && (
                      <Button onClick={handleAddRoom} className="ml-4">
                        Add Room
                      </Button>
                    )*/}
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
                      <div className="rounded-md border overflow-hidden">
                        <div className="max-h-[500px] overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead
                                  className="cursor-pointer"
                                  onClick={() => handleSort('title')}
                                >
                                  <div className="flex items-center">
                                    Title
                                    {sortColumn === 'title' ? (
                                      sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                                    ) : (
                                      <ArrowUpDown className="ml-1 h-4 w-4" />
                                    )}
                                  </div>
                                </TableHead>
                                <TableHead
                                  className="cursor-pointer"
                                  onClick={() => handleSort('roomName')}
                                >
                                  <div className="flex items-center">
                                    Room
                                    {sortColumn === 'roomName' ? (
                                      sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                                    ) : (
                                      <ArrowUpDown className="ml-1 h-4 w-4" />
                                    )}
                                  </div>
                                </TableHead>
                                <TableHead
                                  className="cursor-pointer"
                                  onClick={() => handleSort('date')}
                                >
                                  <div className="flex items-center">
                                    Date
                                    {sortColumn === 'date' ? (
                                      sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                                    ) : (
                                      <ArrowUpDown className="ml-1 h-4 w-4" />
                                    )}
                                  </div>
                                </TableHead>
                                <TableHead
                                  className="cursor-pointer"
                                  onClick={() => handleSort('time')}
                                >
                                  <div className="flex items-center">
                                    Time
                                    {sortColumn === 'time' ? (
                                      sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                                    ) : (
                                      <ArrowUpDown className="ml-1 h-4 w-4" />
                                    )}
                                  </div>
                                </TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sortedUserSchedules.map((schedule) => (
                                <TableRow key={schedule.id}>
                                  <TableCell className="font-medium">
                                    {schedule.title || "Untitled"}
                                    {schedule.description && (
                                      <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                                        {schedule.description}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>{getRoomName(schedule.roomId)}</TableCell>
                                  <TableCell>{formatDate(schedule.date)}</TableCell>
                                  <TableCell>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-blue-500"
                                        onClick={() => handleViewClick(schedule)}
                                        title="View details"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleEditClick(schedule)}
                                        title="Edit booking"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500"
                                        onClick={() => handleDeleteClick(schedule.id)}
                                        title="Delete booking"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
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
                      <BookingForm
                        onSave={handleSaveSchedule}
                        user={currentUser}
                        existingSchedules={schedules}
                        initialRoomId={selectedRoomId}
                        rooms={rooms}
                      />
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

          <RoomFormModal
            isOpen={isRoomModalOpen}
            onClose={() => setIsRoomModalOpen(false)}
            onSave={handleSaveRoom}
          />

          {/* Edit Schedule Modal */}
          <EditScheduleModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setScheduleToEdit(null);
            }}
            onSave={handleUpdateSchedule}
            schedule={scheduleToEdit}
            user={currentUser}
            existingSchedules={schedules}
            rooms={rooms}
          />

          {/* View Schedule Modal */}
          <ViewScheduleModal
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setScheduleToView(null);
            }}
            schedule={scheduleToView}
            rooms={rooms}
          />

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this room booking. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setScheduleToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Rooms;
