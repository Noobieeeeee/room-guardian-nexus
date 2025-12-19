
import React, { useState } from 'react';
import { Room, Schedule, User } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Info } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/dateUtils';
import ScheduleDetailModal from '@/components/ScheduleDetailModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';

interface RoomSchedulesViewProps {
  rooms: Room[];
  schedules: Schedule[];
  onDelete: (scheduleId: string) => void;
  currentUser: User;
}

const RoomSchedulesView: React.FC<RoomSchedulesViewProps> = ({
  rooms,
  schedules,
  onDelete,
  currentUser
}) => {
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [filterRoom, setFilterRoom] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const handleViewDetails = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsDetailModalOpen(true);
  };

  // Filter schedules based on room and search term
  const filteredSchedules = schedules.filter(schedule => {
    const matchesRoom = filterRoom === "all" || schedule.roomId.toString() === filterRoom;
    const matchesSearch = 
      schedule.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRoom && (searchTerm === "" || matchesSearch);
  });

  const canDeleteSchedule = (schedule: Schedule) => {
    return currentUser.role === 'admin' || (currentUser.role === 'faculty' && schedule.userId === currentUser.id);
  };
  
  const getRoomName = (roomId: number) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : `Room ${roomId}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 pb-4">
        <div className="w-full sm:w-1/3">
          <Select 
            value={filterRoom} 
            onValueChange={setFilterRoom}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by room" />
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
        
        <div className="w-full sm:w-2/3">
          <Input
            placeholder="Search schedules by title, instructor, or description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableCaption>List of all booked room schedules.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Room</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSchedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No schedules found
                </TableCell>
              </TableRow>
            ) : (
              filteredSchedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium">
                    {getRoomName(schedule.roomId)}
                  </TableCell>
                  <TableCell>{schedule.title || "Untitled"}</TableCell>
                  <TableCell>{schedule.userName}</TableCell>
                  <TableCell>
                    {formatDate(schedule.date)}
                  </TableCell>
                  <TableCell>
                    {`${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDetails(schedule)}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                    {canDeleteSchedule(schedule) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(schedule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {selectedSchedule && (
        <ScheduleDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          schedule={selectedSchedule}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default RoomSchedulesView;
