
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Room, Schedule, User } from '@/lib/types';
import { format } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: Omit<Schedule, 'id'>) => void;
  user: User;
  existingSchedules: Schedule[];
  initialRoomId?: number;
  rooms: Room[];
}

const AddScheduleModal: React.FC<AddScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  user,
  existingSchedules,
  initialRoomId,
  rooms
}) => {
  const today = new Date();
  const [selectedRoom, setSelectedRoom] = useState<string>(initialRoomId ? initialRoomId.toString() : '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date | undefined>(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRoomId) {
      setSelectedRoom(initialRoomId.toString());
    }
  }, [initialRoomId]);

  const handleSave = () => {
    if (!selectedRoom || !title || !date || !startTime || !endTime) {
      setError('Please fill in all required fields');
      return;
    }

    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }

    const roomId = parseInt(selectedRoom);
    const selectedDate = format(date, 'yyyy-MM-dd');
    
    // Check for scheduling conflicts
    const conflictingSchedule = existingSchedules.find(schedule => {
      return (
        schedule.roomId === roomId &&
        schedule.date === selectedDate &&
        ((startTime >= schedule.startTime && startTime < schedule.endTime) ||
          (endTime > schedule.startTime && endTime <= schedule.endTime) ||
          (startTime <= schedule.startTime && endTime >= schedule.endTime))
      );
    });

    if (conflictingSchedule) {
      setError(`Scheduling conflict with: ${conflictingSchedule.title} (${conflictingSchedule.startTime} - ${conflictingSchedule.endTime})`);
      return;
    }

    const newSchedule: Omit<Schedule, 'id'> = {
      roomId,
      title,
      description,
      userId: user.id,
      userName: user.name,
      date: selectedDate,
      startTime,
      endTime,
    };

    onSave(newSchedule);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSelectedRoom(initialRoomId ? initialRoomId.toString() : '');
    setTitle('');
    setDescription('');
    setDate(today);
    setStartTime('09:00');
    setEndTime('10:00');
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Book a Room</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-md p-3 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="room" className="text-right">
              Room*
            </Label>
            <Select 
              value={selectedRoom} 
              onValueChange={setSelectedRoom}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id.toString()}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title*
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
              placeholder="Class title or event name"
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Add details about this booking"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              Date*
            </Label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startTime" className="text-right">
              Start Time*
            </Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endTime" className="text-right">
              End Time*
            </Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            className="bg-guardian-yellow hover:bg-guardian-yellow/80 text-guardian-purple"
            onClick={handleSave}
          >
            Save Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddScheduleModal;
