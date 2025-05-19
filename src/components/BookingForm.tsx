import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Room, Schedule, User } from '@/lib/types';
import { format } from 'date-fns';
import { format24To12 } from '@/lib/dateUtils';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

interface BookingFormProps {
  onSave: (schedule: Omit<Schedule, 'id'>) => void;
  user: User;
  existingSchedules: Schedule[];
  initialRoomId?: number;
  rooms: Room[];
}

// Array of time options in 30-minute increments from 7:30 AM to 11:30 PM
const TIME_OPTIONS = [
  "07:30", "08:00", "08:30",
  "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30",
  "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30", "22:00", "22:30",
  "23:00", "23:30"
];

const BookingForm: React.FC<BookingFormProps> = ({
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
  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRoomId) {
      setSelectedRoom(initialRoomId.toString());
    }
  }, [initialRoomId]);

  useEffect(() => {
    // Auto-adjust end time when start time changes to ensure it's later
    if (startTime && endTime) {
      const startIndex = TIME_OPTIONS.indexOf(startTime);
      const endIndex = TIME_OPTIONS.indexOf(endTime);

      if (startIndex >= endIndex && startIndex < TIME_OPTIONS.length - 1) {
        // Set end time to next available slot after start time
        setEndTime(TIME_OPTIONS[startIndex + 1]);
        setTimeError(null);
      } else if (startIndex < endIndex) {
        setTimeError(null);
      }
    }
  }, [startTime, endTime]);

  const validateTimes = (): boolean => {
    if (startTime >= endTime) {
      setTimeError('End time must be after start time');
      return false;
    }
    setTimeError(null);
    return true;
  };

  const handleSave = () => {
    // Reset errors
    setError(null);
    setTimeError(null);

    // Form validation
    if (!selectedRoom || !title || !date || !startTime || !endTime) {
      setError('Please fill in all required fields');
      return;
    }

    // Time validation
    if (!validateTimes()) {
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

    // Ensure user has a valid ID
    if (!user || !user.id) {
      setError('User information is missing. Please log in again.');
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
  };

  const resetForm = () => {
    setSelectedRoom(initialRoomId ? initialRoomId.toString() : '');
    setTitle('');
    setDescription('');
    setDate(today);
    setStartTime('09:00');
    setEndTime('10:00');
    setError(null);
    setTimeError(null);
  };

  return (
    <div>
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-md p-3 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="grid gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date*</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="room">Room*</Label>
            <Select
              value={selectedRoom}
              onValueChange={setSelectedRoom}
            >
              <SelectTrigger id="room">
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Subject*</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter booking title"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time*</Label>
            <Select
              value={startTime}
              onValueChange={(value) => {
                setStartTime(value);
                // Clear any previous errors
                setTimeError(null);
              }}
            >
              <SelectTrigger id="startTime" className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select start time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((time) => (
                  <SelectItem key={`start-${time}`} value={time}>{format24To12(time)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime">End Time*</Label>
            <Select
              value={endTime}
              onValueChange={(value) => {
                setEndTime(value);
                // Validate immediately when user selects an end time
                if (startTime >= value) {
                  setTimeError('End time must be after start time');
                } else {
                  setTimeError(null);
                }
              }}
            >
              <SelectTrigger
                id="endTime"
                className={cn(
                  "flex items-center",
                  timeError && "border-red-500 focus:ring-red-500"
                )}
              >
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select end time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((time) => (
                  <SelectItem key={`end-${time}`} value={time}>{format24To12(time)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {timeError && (
              <p className="text-sm font-medium text-destructive">{timeError}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details about this booking"
            rows={3}
          />
        </div>

        <Button
          className="bg-guardian-yellow hover:bg-guardian-yellow/80 text-guardian-purple font-medium w-full sm:w-auto mt-4"
          onClick={handleSave}
          disabled={!!timeError}
        >
          Book Room
        </Button>
      </div>
    </div>
  );
};

export default BookingForm;
