import React, { useState } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
  isWithinInterval,
  addMinutes
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Schedule, User } from '@/lib/types';
import ScheduleDetailModal from '@/components/ScheduleDetailModal';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/dateUtils';

interface WeekViewProps {
  schedules: Schedule[];
  currentUser: User;
}

// Time slots from 7:30 AM to 11:30 PM in 30-minute increments
const TIME_SLOTS = [
  "07:30", "08:00", "08:30", "09:00", "09:30", "10:00",
  "10:30", "11:00", "11:30", "12:00", "12:30", "13:00",
  "13:30", "14:00", "14:30", "15:00", "15:30", "16:00",
  "16:30", "17:00", "17:30", "18:00", "18:30", "19:00",
  "19:30", "20:00", "20:30", "21:00", "21:30", "22:00",
  "22:30", "23:00", "23:30"
];

const WeekView: React.FC<WeekViewProps> = ({ schedules, currentUser }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Calculate week days
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // 0 = Sunday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Navigation functions
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Handle schedule click
  const handleScheduleClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsDetailModalOpen(true);
  };

  // Get schedules for a specific day
  const getDaySchedules = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return schedules.filter(schedule => schedule.date === dayStr);
  };

  // Format time display for the time column
  const formatTimeDisplay = (timeSlot: string): string => {
    const [hours, minutes] = timeSlot.split(':').map(Number);

    // Convert to 12-hour format
    const hour12 = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Only show hour for full hours, show hour:minute for half hours
    if (minutes === 0) {
      return `${hour12} ${ampm}`;
    } else {
      return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
  };

  // Calculate duration in hours between start and end time
  const calculateDuration = (startTime: string, endTime: string): number => {
    try {
      // Create date objects for today with the given times
      const today = format(new Date(), 'yyyy-MM-dd');
      const start = parseISO(`${today}T${startTime}`);
      const end = parseISO(`${today}T${endTime}`);

      // Calculate difference in hours
      const diffInMs = end.getTime() - start.getTime();
      const diffInHours = diffInMs / (1000 * 60 * 60);

      return Math.round(diffInHours);
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 1; // Default to 1 hour if there's an error
    }
  };

  // Check if a schedule should be displayed in a specific time slot
  const isScheduleInTimeSlot = (schedule: Schedule, day: Date, timeSlot: string) => {
    if (!schedule.date || !schedule.startTime || !schedule.endTime) return false;

    // Check if the schedule is for this day
    const scheduleDate = schedule.date;
    const dayStr = format(day, 'yyyy-MM-dd');
    if (scheduleDate !== dayStr) return false;

    // Parse the time slot
    const [hour, minute] = timeSlot.split(':').map(Number);
    const slotStart = new Date(day);
    slotStart.setHours(hour, minute, 0, 0);
    const slotEnd = addMinutes(slotStart, 30); // 30-minute slot

    // Parse the schedule times
    const scheduleStart = parseISO(`${scheduleDate}T${schedule.startTime}`);
    const scheduleEnd = parseISO(`${scheduleDate}T${schedule.endTime}`);

    // For the week view, we'll only show the event in the slot where it starts
    // This prevents duplicate events in multiple time slots
    return (scheduleStart >= slotStart && scheduleStart < slotEnd);
  };

  // Calculate how many slots an event should span
  const calculateEventRowSpan = (schedule: Schedule): number => {
    if (!schedule.startTime || !schedule.endTime) return 1;

    try {
      // Create date objects for today with the given times
      const today = format(new Date(), 'yyyy-MM-dd');
      const start = parseISO(`${today}T${schedule.startTime}`);
      const end = parseISO(`${today}T${schedule.endTime}`);

      // Calculate difference in minutes
      const diffInMs = end.getTime() - start.getTime();
      const diffInMinutes = diffInMs / (1000 * 60);

      // Calculate how many 30-minute slots this covers
      return Math.max(1, Math.ceil(diffInMinutes / 30));
    } catch (error) {
      console.error('Error calculating row span:', error);
      return 1; // Default to 1 slot if there's an error
    }
  };

  // Get event class based on schedule status and user role
  const getEventClass = (schedule: Schedule) => {
    const baseClass = "px-2 py-1.5 rounded text-xs font-medium cursor-pointer flex flex-col justify-start";

    // Assign colors based on room ID to ensure consistency
    // This way, the same room always gets the same color
    const colorOptions = [
      "bg-blue-500 text-white", // Blue
      "bg-cyan-500 text-white",  // Cyan
      "bg-green-500 text-white", // Green
      "bg-purple-500 text-white", // Purple
      "bg-yellow-500 text-black", // Yellow
      "bg-pink-500 text-white", // Pink
      "bg-indigo-500 text-white", // Indigo
      "bg-orange-500 text-white", // Orange
    ];

    // Use the room ID to determine the color
    const colorIndex = (schedule.roomId % colorOptions.length);

    return `${baseClass} ${colorOptions[colorIndex]}`;
  };

  return (
    <div className="week-calendar-container border rounded-lg shadow-sm">
      <div className="calendar-header bg-white p-4 flex items-center justify-between border-b">
        <h2 className="text-lg font-semibold">
          {format(weekStart, 'MMMM d')} - {format(weekEnd, 'MMMM d, yyyy')}
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={prevWeek}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextWeek}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="bg-white overflow-auto">
        <div className="min-w-[800px] w-full"> {/* Ensure minimum width but allow expansion */}
          {/* Create a grid container for the entire week view */}
          <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] relative">
            {/* Time slots column header - empty space */}
            <div className="border-r border-b">
              <div className="py-4"></div>
            </div>

            {/* Day headers */}
            {days.map(day => (
              <div
                key={format(day, 'yyyy-MM-dd')}
                className={cn(
                  "py-3 text-center font-medium border-r border-b",
                  isSameDay(day, new Date())
                    ? "bg-guardian-purple/10 text-guardian-purple"
                    : "text-gray-700"
                )}
              >
                <div className="text-sm uppercase">{format(day, 'EEE')}</div>
                <div className={cn(
                  "text-2xl",
                  isSameDay(day, new Date()) ? "text-guardian-purple" : ""
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Create a grid container for the time slots and events */}
          <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] relative">
            {/* Time slots column */}
            <div className="border-r">
              {TIME_SLOTS.map((timeSlot, index) => (
                <div
                  key={`time-${timeSlot}`}
                  className="py-2 px-2 text-xs font-medium text-gray-500 text-right h-[40px] border-b"
                >
                  {formatTimeDisplay(timeSlot)}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day, dayIndex) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const daySchedules = getDaySchedules(day);

              return (
                <div
                  key={`day-${dayStr}`}
                  className="border-r relative"
                  style={{ display: 'grid', gridTemplateRows: `repeat(${TIME_SLOTS.length}, 40px)` }}
                >

                  {/* Empty cells for the grid */}
                  {TIME_SLOTS.map((timeSlot, slotIndex) => (
                    <div
                      key={`cell-${dayStr}-${timeSlot}`}
                      className="border-b border-gray-100 relative"
                    ></div>
                  ))}

                  {/* Group events by start time slot */}
                  {(() => {
                    // Group schedules by their start time slot
                    const schedulesByStartSlot: Record<number, Schedule[]> = {};

                    daySchedules.forEach(schedule => {
                      const startSlotIndex = TIME_SLOTS.findIndex(timeSlot =>
                        isScheduleInTimeSlot(schedule, day, timeSlot)
                      );

                      if (startSlotIndex !== -1) {
                        if (!schedulesByStartSlot[startSlotIndex]) {
                          schedulesByStartSlot[startSlotIndex] = [];
                        }
                        schedulesByStartSlot[startSlotIndex].push(schedule);
                      }
                    });

                    // Render events for each start slot
                    return Object.entries(schedulesByStartSlot).map(([startSlotIndexStr, schedulesInSlot]) => {
                      const startSlotIndex = parseInt(startSlotIndexStr);

                      return schedulesInSlot.map((schedule, scheduleIndex) => {
                        const rowSpan = calculateEventRowSpan(schedule);
                        const totalSchedulesInSlot = schedulesInSlot.length;

                        // Calculate width and position for side-by-side events
                        const width = totalSchedulesInSlot > 1 ? `calc(${100 / totalSchedulesInSlot}% - 2px)` : 'calc(100% - 2px)';
                        const left = totalSchedulesInSlot > 1 ? `calc(${(scheduleIndex * 100) / totalSchedulesInSlot}% + 1px)` : '1px';

                        return (
                          <div
                            key={`event-${schedule.id}`}
                            onClick={() => handleScheduleClick(schedule)}
                            className={cn(
                              getEventClass(schedule),
                              "absolute z-10 overflow-hidden"
                            )}
                            style={{
                              top: `${startSlotIndex * 40}px`,
                              height: `${rowSpan * 40 - 2}px`, // -2 for border
                              width,
                              left
                            }}
                            title={`${schedule.title || `Room ${schedule.roomId}`} (${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)})`}
                          >
                            <div className="font-semibold truncate">{schedule.title || `(No title)`}</div>
                            <div className="text-xs opacity-90">{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</div>
                            <div className="text-xs mt-auto truncate">
                              {schedule.description ? schedule.description : `Room ${schedule.roomId}`}
                            </div>
                          </div>
                        );
                      });
                    }).flat();
                  })()}
                </div>
              );
            })}
          </div>
        </div>
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

export default WeekView;
